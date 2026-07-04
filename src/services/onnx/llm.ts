/**
 * Autoregressive text generation for SmolLM2-360M-Instruct (ONNX, q4f16).
 *
 * Handles the KV-cache plumbing: on the first pass we feed the whole prompt
 * with empty `past_key_values`; thereafter we feed one token at a time and
 * shuttle the `present.*` outputs back in as `past_key_values.*`. The cache
 * tensors are float16 — we never read them, just pass the returned Tensors
 * straight back as feeds, so no fp16 math is needed for them.
 *
 * Model dims (SmolLM2-360M): 32 layers, 5 KV heads, head_dim 64, vocab 49152.
 */
import {InferenceSession, Tensor} from 'onnxruntime-react-native';
import {getCoachSession, readTokenizerJson} from './modelManager';
import {BpeTokenizer} from './tokenizer';

const NUM_KV_HEADS = 5;
const HEAD_DIM = 64;

export interface GenerationOptions {
  maxNewTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  repetitionPenalty?: number;
  /** Called with the cumulative decoded text after each new token. */
  onToken?: (text: string) => void;
  /** Abort flag checked between steps. */
  shouldStop?: () => boolean;
}

let tokenizer: BpeTokenizer | null = null;

export async function getTokenizer(): Promise<BpeTokenizer> {
  if (tokenizer) return tokenizer;
  const json = JSON.parse(await readTokenizerJson());
  tokenizer = new BpeTokenizer(json);
  return tokenizer;
}

function emptyPast(): Tensor {
  // [batch, kv_heads, past_len=0, head_dim]. The q4 model uses float32 KV-cache
  // (the q4f16 variant used float16, which onnxruntime-react-native can't bridge).
  return new Tensor('float32', new Float32Array(0), [1, NUM_KV_HEADS, 0, HEAD_DIM]);
}

/** Convert a half-precision (uint16) value to float32. */
function f16ToF32(h: number): number {
  const sign = (h & 0x8000) >> 15;
  const exp = (h & 0x7c00) >> 10;
  const frac = h & 0x03ff;
  if (exp === 0) return (sign ? -1 : 1) * Math.pow(2, -14) * (frac / 1024);
  if (exp === 0x1f) return frac ? NaN : (sign ? -Infinity : Infinity);
  return (sign ? -1 : 1) * Math.pow(2, exp - 15) * (1 + frac / 1024);
}

/** Extract the logits for the LAST position as a Float32Array of vocab size. */
function lastLogits(tensor: Tensor): Float32Array {
  const dims = tensor.dims as number[]; // [1, seq, vocab]
  const vocab = dims[dims.length - 1];
  const seq = dims.length === 3 ? dims[1] : 1;
  const offset = (seq - 1) * vocab;
  const raw = tensor.data as Float32Array | Uint16Array;
  const out = new Float32Array(vocab);
  if (raw instanceof Uint16Array) {
    for (let i = 0; i < vocab; i++) out[i] = f16ToF32(raw[offset + i]);
  } else {
    for (let i = 0; i < vocab; i++) out[i] = raw[offset + i];
  }
  return out;
}

function sample(
  logits: Float32Array,
  opts: Required<Pick<GenerationOptions, 'temperature' | 'topK' | 'topP' | 'repetitionPenalty'>>,
  seen: Map<number, number>,
): number {
  const {temperature, topK, topP, repetitionPenalty} = opts;

  // Repetition penalty.
  if (repetitionPenalty !== 1) {
    for (const id of seen.keys()) {
      const v = logits[id];
      logits[id] = v > 0 ? v / repetitionPenalty : v * repetitionPenalty;
    }
  }

  if (temperature <= 0) {
    // Greedy.
    let best = 0;
    for (let i = 1; i < logits.length; i++) if (logits[i] > logits[best]) best = i;
    return best;
  }

  // Top-k filter.
  const idx = Array.from(logits.keys());
  idx.sort((a, b) => logits[b] - logits[a]);
  const k = Math.min(topK > 0 ? topK : idx.length, idx.length);
  let cand = idx.slice(0, k);

  // Softmax over candidates with temperature.
  const maxLogit = logits[cand[0]];
  let sum = 0;
  const probs = cand.map(i => {
    const p = Math.exp((logits[i] - maxLogit) / temperature);
    sum += p;
    return p;
  });
  for (let i = 0; i < probs.length; i++) probs[i] /= sum;

  // Top-p (nucleus) trim.
  if (topP < 1) {
    let acc = 0;
    const keep: number[] = [];
    const keepP: number[] = [];
    for (let i = 0; i < cand.length; i++) {
      acc += probs[i];
      keep.push(cand[i]);
      keepP.push(probs[i]);
      if (acc >= topP) break;
    }
    cand = keep;
    const s = keepP.reduce((a, b) => a + b, 0);
    for (let i = 0; i < keepP.length; i++) keepP[i] /= s;
    probs.length = 0;
    probs.push(...keepP);
  }

  // Sample from the categorical distribution.
  let r = Math.random();
  for (let i = 0; i < cand.length; i++) {
    r -= probs[i];
    if (r <= 0) return cand[i];
  }
  return cand[cand.length - 1];
}

/**
 * Generate a completion for an already-tokenized prompt (`promptIds`).
 * Stops on `stopIds` (e.g. <|im_end|>) or `maxNewTokens`.
 */
export async function generate(
  promptIds: number[],
  stopIds: number[],
  options: GenerationOptions = {},
): Promise<string> {
  const session = await getCoachSession();
  const tok = await getTokenizer();

  const opts = {
    maxNewTokens: options.maxNewTokens ?? 220,
    temperature: options.temperature ?? 0.7,
    topK: options.topK ?? 40,
    topP: options.topP ?? 0.9,
    repetitionPenalty: options.repetitionPenalty ?? 1.15,
  };

  const pastNames = session.inputNames.filter(n =>
    n.startsWith('past_key_values.'),
  );
  const hasPositionIds = session.inputNames.includes('position_ids');

  // Initialise empty KV cache.
  let pastFeeds: Record<string, Tensor> = {};
  for (const name of pastNames) pastFeeds[name] = emptyPast();

  const generated: number[] = [];
  const seen = new Map<number, number>();
  let curIds = promptIds.slice();
  let pastLen = 0;

  for (let step = 0; step < opts.maxNewTokens; step++) {
    if (options.shouldStop?.()) break;

    const seqLen = curIds.length;
    const totalLen = pastLen + seqLen;

    const inputIds = new Tensor(
      'int64',
      BigInt64Array.from(curIds.map(v => BigInt(v))),
      [1, seqLen],
    );
    const attentionMask = new Tensor(
      'int64',
      BigInt64Array.from(new Array(totalLen).fill(1n)),
      [1, totalLen],
    );

    const feeds: Record<string, Tensor> = {
      input_ids: inputIds,
      attention_mask: attentionMask,
      ...pastFeeds,
    };
    if (hasPositionIds) {
      const pos = new BigInt64Array(seqLen);
      for (let i = 0; i < seqLen; i++) pos[i] = BigInt(pastLen + i);
      feeds.position_ids = new Tensor('int64', pos, [1, seqLen]);
    }

    const outputs = await session.run(feeds);

    // Roll present.* -> past_key_values.* for the next step.
    const nextPast: Record<string, Tensor> = {};
    for (const name of pastNames) {
      const presentName = name.replace('past_key_values', 'present');
      nextPast[name] = outputs[presentName];
    }
    pastFeeds = nextPast;
    pastLen = totalLen;

    const logits = lastLogits(outputs.logits);
    const next = sample(logits, opts, seen);

    if (stopIds.includes(next)) break;

    generated.push(next);
    seen.set(next, (seen.get(next) ?? 0) + 1);
    curIds = [next];

    if (options.onToken) options.onToken(tok.decode(generated));
  }

  return tok.decode(generated).trim();
}
