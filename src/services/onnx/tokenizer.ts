/**
 * Self-contained byte-level BPE tokenizer compatible with the SmolLM2
 * `tokenizer.json` (GPT-2 / Llama-style byte-level BPE). No native deps.
 *
 * Loads vocab + merges from the JSON, implements bytes<->unicode mapping,
 * the GPT-2 pre-tokenization regex (ASCII-pragmatic; non-ASCII still encodes
 * correctly via UTF-8 byte mapping), and greedy-rank BPE merging.
 */

interface TokenizerJson {
  model: {
    vocab: Record<string, number>;
    merges: Array<string | [string, string]>;
  };
  added_tokens?: Array<{id: number; content: string}>;
}

// GPT-2 pre-tokenization. Uses ASCII letter/number classes for Hermes safety;
// any other (incl. multibyte) chars fall into the symbol/whitespace groups and
// are still byte-encoded correctly downstream.
const PRETOKEN_RE =
  /'s|'t|'re|'ve|'m|'ll|'d| ?[A-Za-z]+| ?[0-9]+| ?[^\sA-Za-z0-9]+|\s+(?!\S)|\s+/g;

function bytesToUnicode(): Map<number, string> {
  const bs: number[] = [];
  for (let i = 33; i <= 126; i++) bs.push(i);
  for (let i = 161; i <= 172; i++) bs.push(i);
  for (let i = 174; i <= 255; i++) bs.push(i);
  const cs = bs.slice();
  let n = 0;
  for (let b = 0; b < 256; b++) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n++;
    }
  }
  const map = new Map<number, string>();
  for (let i = 0; i < bs.length; i++) {
    map.set(bs[i], String.fromCharCode(cs[i]));
  }
  return map;
}

function utf8Bytes(s: string): number[] {
  // Manual UTF-8 encoder (TextEncoder may be absent in some RN engines).
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < s.length) {
      const next = s.charCodeAt(i + 1);
      code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
      i++;
    }
    if (code < 0x80) out.push(code);
    else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      out.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return out;
}

export class BpeTokenizer {
  private vocab: Map<string, number>;
  private decoder: Map<number, string>;
  private ranks: Map<string, number>;
  private byteEncoder: Map<number, string>;
  private byteDecoder: Map<string, number>;
  private specials: Map<string, number>;
  private cache = new Map<string, string[]>();

  constructor(json: TokenizerJson) {
    this.vocab = new Map(Object.entries(json.model.vocab));
    this.decoder = new Map();
    for (const [tok, id] of this.vocab) this.decoder.set(id, tok);

    this.ranks = new Map();
    json.model.merges.forEach((m, i) => {
      const key = Array.isArray(m) ? `${m[0]} ${m[1]}` : m;
      this.ranks.set(key, i);
    });

    this.byteEncoder = bytesToUnicode();
    this.byteDecoder = new Map();
    for (const [b, c] of this.byteEncoder) this.byteDecoder.set(c, b);

    this.specials = new Map();
    for (const t of json.added_tokens ?? []) {
      this.specials.set(t.content, t.id);
      this.decoder.set(t.id, t.content);
    }
  }

  specialId(content: string): number | undefined {
    return this.specials.get(content) ?? this.vocab.get(content);
  }

  private bpe(token: string): string[] {
    const cached = this.cache.get(token);
    if (cached) return cached;

    let word = token.split('');
    if (word.length <= 1) {
      this.cache.set(token, word);
      return word;
    }

    // Iteratively merge the lowest-rank adjacent pair.
    for (;;) {
      let minRank = Infinity;
      let minIdx = -1;
      for (let i = 0; i < word.length - 1; i++) {
        const r = this.ranks.get(`${word[i]} ${word[i + 1]}`);
        if (r !== undefined && r < minRank) {
          minRank = r;
          minIdx = i;
        }
      }
      if (minIdx === -1) break;
      const merged = word[minIdx] + word[minIdx + 1];
      word = [...word.slice(0, minIdx), merged, ...word.slice(minIdx + 2)];
      if (word.length === 1) break;
    }
    this.cache.set(token, word);
    return word;
  }

  /** Encode plain text to token ids (no special tokens added). */
  encode(text: string): number[] {
    const ids: number[] = [];
    const matches = text.match(PRETOKEN_RE) ?? [];
    for (const piece of matches) {
      const mapped = utf8Bytes(piece)
        .map(b => this.byteEncoder.get(b)!)
        .join('');
      for (const sub of this.bpe(mapped)) {
        const id = this.vocab.get(sub);
        if (id !== undefined) ids.push(id);
      }
    }
    return ids;
  }

  /** Decode token ids back to text, skipping known special tokens. */
  decode(ids: number[], skipSpecial = true): string {
    let buf = '';
    for (const id of ids) {
      const tok = this.decoder.get(id);
      if (tok === undefined) continue;
      if (skipSpecial && this.specials.has(tok)) continue;
      buf += tok;
    }
    // Map the byte-level chars back to raw bytes, then UTF-8 decode.
    const bytes: number[] = [];
    for (const ch of buf) {
      const b = this.byteDecoder.get(ch);
      if (b !== undefined) bytes.push(b);
    }
    return utf8Decode(bytes);
  }

  decodeSingle(id: number): string {
    return this.decode([id]);
  }
}

function utf8Decode(bytes: number[]): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 0x80) {
      out += String.fromCharCode(b);
      i += 1;
    } else if (b >= 0xc0 && b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (b >= 0xe0 && b < 0xf0) {
      out += String.fromCharCode(
        ((b & 0x0f) << 12) |
          ((bytes[i + 1] & 0x3f) << 6) |
          (bytes[i + 2] & 0x3f),
      );
      i += 3;
    } else {
      let cp =
        ((b & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      i += 4;
    }
  }
  return out;
}
