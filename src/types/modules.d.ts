/** Ambient declarations for JS-only modules without bundled types. */

declare module 'jpeg-js' {
  export interface DecodeOptions {
    useTArray?: boolean;
    colorTransform?: boolean;
    formatAsRGBA?: boolean;
    tolerantDecoding?: boolean;
    maxResolutionInMP?: number;
    maxMemoryUsageInMB?: number;
  }
  export interface RawImageData {
    width: number;
    height: number;
    data: Uint8Array | Buffer;
  }
  export function decode(
    data: Uint8Array | Buffer | ArrayBuffer,
    opts?: DecodeOptions,
  ): RawImageData;
  export function encode(
    imgData: {data: Uint8Array | Buffer; width: number; height: number},
    quality?: number,
  ): RawImageData;
}
