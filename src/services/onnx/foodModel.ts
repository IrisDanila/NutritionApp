/** Food recognition: MobileNetV2 fine-tuned on Food-101. */
import {Tensor} from 'onnxruntime-react-native';
import {getFoodSession} from './modelManager';
import {preprocessBase64Jpeg, INPUT_SIZE} from './imagePreprocess';
import {
  FOOD101_LABELS,
  prettyLabel,
  defaultPortionGrams,
  usdaQueryFor,
} from './food101Labels';

export interface Prediction {
  index: number;
  label: string; // raw, e.g. "french_fries"
  name: string; // pretty, e.g. "French Fries"
  probability: number; // 0..1
  query: string; // USDA search string
  portionGrams: number;
}

function softmax(logits: Float32Array): Float32Array {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  const out = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i] - max);
    out[i] = e;
    sum += e;
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

function topK(probs: Float32Array, k: number): Prediction[] {
  const idx = Array.from(probs.keys());
  idx.sort((a, b) => probs[b] - probs[a]);
  return idx.slice(0, k).map(i => {
    const label = FOOD101_LABELS[i] ?? `class_${i}`;
    return {
      index: i,
      label,
      name: prettyLabel(label),
      probability: probs[i],
      query: usdaQueryFor(label),
      portionGrams: defaultPortionGrams(label),
    };
  });
}

/**
 * Classify a base64 JPEG. Returns the top-`k` Food-101 predictions.
 */
export async function classifyFood(
  base64Jpeg: string,
  k = 5,
): Promise<Prediction[]> {
  const session = await getFoodSession();
  const data = preprocessBase64Jpeg(base64Jpeg);
  const tensor = new Tensor('float32', data, [1, 3, INPUT_SIZE, INPUT_SIZE]);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  const result = await session.run({[inputName]: tensor});
  const logits = result[outputName].data as Float32Array;

  return topK(softmax(logits), k);
}
