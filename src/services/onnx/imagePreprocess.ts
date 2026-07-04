/**
 * Turns a JPEG (base64) into the float32 NCHW tensor data MobileNetV2 expects.
 *
 * Pipeline (mirrors the HF MobileNetV2 image processor):
 *   decode -> center-crop to square -> bilinear resize to 224x224
 *   -> scale to [0,1] -> normalize with mean/std 0.5  (=> range [-1, 1])
 *
 * Pure-JS so it works in bare React Native without a native image module.
 */
import * as jpeg from 'jpeg-js';

export const INPUT_SIZE = 224;

/**
 * Per-channel ImageNet normalization (RGB). This model was exported from a
 * torchvision/OpenVINO MobileNetV2 (generic `input`/`output1` node names), which
 * expects ImageNet stats — NOT the [-1,1] (mean/std 0.5) used by HF/TF exports.
 */
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

const B64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decode a base64 string to bytes without relying on global atob/Buffer. */
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const outLen = (len * 3) / 4 - pad;
  const bytes = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < len; i += 4) {
    const c0 = B64.indexOf(clean[i]);
    const c1 = B64.indexOf(clean[i + 1]);
    const c2 = B64.indexOf(clean[i + 2]);
    const c3 = B64.indexOf(clean[i + 3]);
    const n = (c0 << 18) | (c1 << 12) | ((c2 & 63) << 6) | (c3 & 63);
    if (o < outLen) bytes[o++] = (n >> 16) & 0xff;
    if (o < outLen) bytes[o++] = (n >> 8) & 0xff;
    if (o < outLen) bytes[o++] = n & 0xff;
  }
  return bytes;
}

interface RGBA {
  width: number;
  height: number;
  data: Uint8Array; // RGBA
}

function decodeJpeg(b64: string): RGBA {
  const bytes = base64ToBytes(b64);
  const raw = jpeg.decode(bytes, {useTArray: true, maxMemoryUsageInMB: 256});
  return {width: raw.width, height: raw.height, data: raw.data as Uint8Array};
}

/** Bilinear sample of channel `c` (0..2) at floating (x,y) in source space. */
function sample(img: RGBA, x: number, y: number, c: number): number {
  const {width, height, data} = img;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const dx = x - x0;
  const dy = y - y0;
  const idx = (yy: number, xx: number) => (yy * width + xx) * 4 + c;
  const p00 = data[idx(y0, x0)];
  const p10 = data[idx(y0, x1)];
  const p01 = data[idx(y1, x0)];
  const p11 = data[idx(y1, x1)];
  const top = p00 + (p10 - p00) * dx;
  const bot = p01 + (p11 - p01) * dx;
  return top + (bot - top) * dy;
}

/**
 * Returns Float32Array of length 3*224*224 in NCHW (R plane, G plane, B plane).
 */
export function preprocessBase64Jpeg(b64: string): Float32Array {
  const img = decodeJpeg(b64);

  // Center crop to square.
  const side = Math.min(img.width, img.height);
  const offX = (img.width - side) / 2;
  const offY = (img.height - side) / 2;
  const scale = side / INPUT_SIZE;

  const out = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  const plane = INPUT_SIZE * INPUT_SIZE;

  for (let y = 0; y < INPUT_SIZE; y++) {
    const sy = offY + (y + 0.5) * scale - 0.5;
    for (let x = 0; x < INPUT_SIZE; x++) {
      const sx = offX + (x + 0.5) * scale - 0.5;
      const di = y * INPUT_SIZE + x;
      for (let c = 0; c < 3; c++) {
        const v = sample(img, sx, sy, c) / 255;
        out[c * plane + di] = (v - MEAN[c]) / STD[c];
      }
    }
  }
  return out;
}
