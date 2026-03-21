import { Buffer } from 'buffer';

type VocabMap = Record<string, number>;

type HfTokenRef = string | { content?: string };

interface HfTokenizerJson {
  model?: {
    vocab?: VocabMap;
  };
  added_tokens?: Array<{
    id?: number;
    content?: string;
    special?: boolean;
  }>;
  pre_tokenizer?: {
    type?: string;
    pretokenizers?: Array<{
      type?: string;
      individual_digits?: boolean;
      add_prefix_space?: boolean;
    }>;
  };
}

interface HfTokenizerConfig {
  add_prefix_space?: boolean;
  bos_token?: HfTokenRef;
  eos_token?: HfTokenRef;
  pad_token?: HfTokenRef;
  unk_token?: HfTokenRef;
  additional_special_tokens?: string[];
}

interface HfSpecialTokensMap {
  bos_token?: HfTokenRef;
  eos_token?: HfTokenRef;
  pad_token?: HfTokenRef;
  unk_token?: HfTokenRef;
  additional_special_tokens?: string[];
}

const GPT2_PATTERN =
  /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

const GPT2_PATTERN_DIGITS =
  /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

function bytesToUnicode(): Map<number, string> {
  const bs: number[] = [];
  for (let i = 33; i <= 126; i += 1) bs.push(i);
  for (let i = 161; i <= 172; i += 1) bs.push(i);
  for (let i = 174; i <= 255; i += 1) bs.push(i);

  const cs = [...bs];
  let n = 0;
  for (let b = 0; b < 256; b += 1) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n += 1;
    }
  }

  const map = new Map<number, string>();
  for (let i = 0; i < bs.length; i += 1) {
    map.set(bs[i], String.fromCharCode(cs[i]));
  }
  return map;
}

function getPairs(word: string[]): Set<string> {
  const pairs = new Set<string>();
  for (let i = 0; i < word.length - 1; i += 1) {
    pairs.add(`${word[i]} ${word[i + 1]}`);
  }
  return pairs;
}

export class Gpt2BpeTokenizer {
  private readonly encoder: VocabMap;
  private readonly decoder: Map<number, string>;
  private readonly bpeRanks: Map<string, number>;
  private readonly cache = new Map<string, string>();
  private readonly byteEncoder: Map<number, string>;
  private readonly byteDecoder: Map<string, number>;
  private readonly specialTokenToId: Map<string, number>;
  private readonly specialTokenIds: Set<number>;
  private readonly sortedSpecialTokens: string[];
  private readonly splitDigitsIndividually: boolean;
  private readonly eosTokenIdValue: number | null;

  constructor(
    vocab: VocabMap,
    mergesTxt: string,
    options?: {
      specialTokens?: string[];
      splitDigitsIndividually?: boolean;
      eosToken?: string | null;
    },
  ) {
    this.encoder = vocab;
    this.decoder = new Map<number, string>(
      Object.entries(vocab).map(([token, id]) => [id, token]),
    );

    const mergeLines = mergesTxt
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    this.bpeRanks = new Map<string, number>();
    for (let i = 0; i < mergeLines.length; i += 1) {
      this.bpeRanks.set(mergeLines[i], i);
    }

    this.byteEncoder = bytesToUnicode();
    this.byteDecoder = new Map<string, number>();
    for (const [key, value] of this.byteEncoder.entries()) {
      this.byteDecoder.set(value, key);
    }

    const specialTokens = (options?.specialTokens ?? []).filter(Boolean);
    this.specialTokenToId = new Map<string, number>();
    this.specialTokenIds = new Set<number>();

    for (const token of specialTokens) {
      const id = this.encoder[token];
      if (id !== undefined) {
        this.specialTokenToId.set(token, id);
        this.specialTokenIds.add(id);
      }
    }

    this.sortedSpecialTokens = [...this.specialTokenToId.keys()].sort((a, b) => b.length - a.length);
    this.splitDigitsIndividually = options?.splitDigitsIndividually ?? false;

    const eosToken = options?.eosToken ?? null;
    this.eosTokenIdValue = eosToken && this.encoder[eosToken] !== undefined ? this.encoder[eosToken] : null;
  }

  static fromHuggingFaceAssets(args: {
    tokenizerJson: HfTokenizerJson;
    tokenizerConfig?: HfTokenizerConfig;
    specialTokensMap?: HfSpecialTokensMap;
    mergesTxt: string;
  }): Gpt2BpeTokenizer {
    const vocab = args.tokenizerJson?.model?.vocab;
    if (!vocab) {
      throw new Error('tokenizer.json is missing model.vocab');
    }

    const specialTokens = new Set<string>();

    for (const item of args.tokenizerJson.added_tokens ?? []) {
      if (item?.special && item.content) {
        specialTokens.add(item.content);
      }
    }

    const collectToken = (token?: HfTokenRef) => {
      if (!token) {
        return;
      }
      if (typeof token === 'string') {
        specialTokens.add(token);
        return;
      }
      if (token.content) {
        specialTokens.add(token.content);
      }
    };

    collectToken(args.tokenizerConfig?.bos_token);
    collectToken(args.tokenizerConfig?.eos_token);
    collectToken(args.tokenizerConfig?.pad_token);
    collectToken(args.tokenizerConfig?.unk_token);
    collectToken(args.specialTokensMap?.bos_token);
    collectToken(args.specialTokensMap?.eos_token);
    collectToken(args.specialTokensMap?.pad_token);
    collectToken(args.specialTokensMap?.unk_token);

    for (const t of args.tokenizerConfig?.additional_special_tokens ?? []) {
      specialTokens.add(t);
    }
    for (const t of args.specialTokensMap?.additional_special_tokens ?? []) {
      specialTokens.add(t);
    }

    const pretokenizers = args.tokenizerJson?.pre_tokenizer?.pretokenizers ?? [];
    const splitDigitsIndividually = pretokenizers.some(
      p => p?.type === 'Digits' && p?.individual_digits === true,
    );

    const eosTokenRef = args.specialTokensMap?.eos_token ?? args.tokenizerConfig?.eos_token;
    const eosToken = typeof eosTokenRef === 'string' ? eosTokenRef : eosTokenRef?.content ?? null;

    return new Gpt2BpeTokenizer(vocab, args.mergesTxt, {
      specialTokens: [...specialTokens],
      splitDigitsIndividually,
      eosToken,
    });
  }

  getEosTokenId(): number | null {
    return this.eosTokenIdValue;
  }

  private splitBySpecialTokens(text: string): Array<{ kind: 'special' | 'text'; value: string }> {
    if (this.sortedSpecialTokens.length === 0 || !text) {
      return [{ kind: 'text', value: text }];
    }

    const parts: Array<{ kind: 'special' | 'text'; value: string }> = [];
    let i = 0;
    let chunkStart = 0;

    while (i < text.length) {
      let matched: string | null = null;
      for (const token of this.sortedSpecialTokens) {
        if (text.startsWith(token, i)) {
          matched = token;
          break;
        }
      }

      if (!matched) {
        i += 1;
        continue;
      }

      if (chunkStart < i) {
        parts.push({ kind: 'text', value: text.slice(chunkStart, i) });
      }
      parts.push({ kind: 'special', value: matched });
      i += matched.length;
      chunkStart = i;
    }

    if (chunkStart < text.length) {
      parts.push({ kind: 'text', value: text.slice(chunkStart) });
    }

    return parts;
  }

  private encodePlainText(text: string): number[] {
    const pattern = this.splitDigitsIndividually ? GPT2_PATTERN_DIGITS : GPT2_PATTERN;
    const tokens = text.match(pattern) ?? [];
    const ids: number[] = [];

    for (const token of tokens) {
      const bytes = Uint8Array.from(Buffer.from(token, 'utf8'));
      let transformed = '';
      for (const b of bytes) {
        transformed += this.byteEncoder.get(b) ?? '';
      }

      const bpeTokens = this.bpe(transformed).split(' ');
      for (const bpeToken of bpeTokens) {
        const id = this.encoder[bpeToken];
        if (id !== undefined) {
          ids.push(id);
        }
      }
    }

    return ids;
  }

  private bpe(token: string): string {
    const cached = this.cache.get(token);
    if (cached) {
      return cached;
    }

    let word = token.split('');
    let pairs = getPairs(word);

    if (pairs.size === 0) {
      return token;
    }

    while (true) {
      let minPair: string | null = null;
      let minRank = Number.POSITIVE_INFINITY;

      for (const pair of pairs) {
        const rank = this.bpeRanks.get(pair);
        if (rank !== undefined && rank < minRank) {
          minRank = rank;
          minPair = pair;
        }
      }

      if (!minPair) {
        break;
      }

      const [first, second] = minPair.split(' ');
      const newWord: string[] = [];

      let i = 0;
      while (i < word.length) {
        const j = word.indexOf(first, i);
        if (j === -1) {
          newWord.push(...word.slice(i));
          break;
        }

        newWord.push(...word.slice(i, j));
        i = j;

        if (word[i] === first && i < word.length - 1 && word[i + 1] === second) {
          newWord.push(first + second);
          i += 2;
        } else {
          newWord.push(word[i]);
          i += 1;
        }
      }

      word = newWord;
      if (word.length === 1) {
        break;
      }
      pairs = getPairs(word);
    }

    const out = word.join(' ');
    this.cache.set(token, out);
    return out;
  }

  encode(text: string): number[] {
    const ids: number[] = [];

    const parts = this.splitBySpecialTokens(text);
    for (const part of parts) {
      if (!part.value) {
        continue;
      }
      if (part.kind === 'special') {
        const specialId = this.specialTokenToId.get(part.value);
        if (specialId !== undefined) {
          ids.push(specialId);
        }
        continue;
      }

      ids.push(...this.encodePlainText(part.value));
    }

    return ids;
  }

  decode(ids: number[]): string {
    let text = '';
    let byteText = '';

    const flushByteText = () => {
      if (!byteText) {
        return;
      }

      const bytes: number[] = [];
      for (const ch of byteText) {
        const b = this.byteDecoder.get(ch);
        if (b !== undefined) {
          bytes.push(b);
        }
      }

      text += Buffer.from(bytes).toString('utf8');
      byteText = '';
    };

    for (const id of ids) {
      const token = this.decoder.get(id) ?? '';
      if (this.specialTokenIds.has(id)) {
        flushByteText();
        text += token;
      } else {
        byteText += token;
      }
    }

    flushByteText();
    return text;
  }
}
