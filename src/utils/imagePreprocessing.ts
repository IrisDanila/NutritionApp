import ImageResizer from 'react-native-image-resizer';
import ReactNativeBlobUtil from 'react-native-blob-util';
import jpeg from 'jpeg-js';
import {Buffer} from 'buffer';

export interface ImageTensor {
  data: Float32Array;
  dims: number[];
}

// ImageNet normalization constants
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

/**
 * Preprocess image for ResNet model
 * ResNet expects: [1, 3, 224, 224] tensor with normalized RGB values in NCHW format
 */
export const preprocessImageForResNet = async (
  imageUri: string,
): Promise<ImageTensor> => {
  try {
    console.log('Starting image preprocessing for:', imageUri);
    
    // Step 1: Resize image to 224x224.
    // Use JPEG here to avoid Node-only PNG decoders (e.g. pngjs -> zlib).
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      224,
      224,
      'JPEG',
      100,
      0,
      undefined,
      false,
      {mode: 'stretch'},
    );
    
    console.log('Image resized to 224x224:', resizedImage.uri);
    
    // Step 2: Read the resized image file as binary data
    const imagePath = resizedImage.uri.startsWith('file://')
      ? resizedImage.uri.replace('file://', '')
      : resizedImage.uri;
    const imageBase64 = await ReactNativeBlobUtil.fs.readFile(imagePath, 'base64');
    
    // Step 3: Decode JPEG to get pixel data (RGBA)
    console.log('Decoding JPEG image...');
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const decoded = jpeg.decode(imageBuffer, {useTArray: true});
    if (!decoded || !decoded.data) {
      throw new Error('Failed to decode JPEG image');
    }
    
    console.log(`Decoded image: ${decoded.width}x${decoded.height}`);
    
    // Ensure dimensions match expected size.
    // Some devices/decoders can still produce off-by-a-few results; resample as a fallback.
    let rgbaData: Uint8Array = decoded.data as unknown as Uint8Array;
    let width = decoded.width;
    let height = decoded.height;
    if (width !== 224 || height !== 224) {
      console.warn(
        `Resize mismatch (${width}x${height}); resampling to 224x224 in JS`,
      );
      rgbaData = resizeRGBA(rgbaData, width, height, 224, 224);
      width = 224;
      height = 224;
    }
    
    // Step 4: Convert RGBA to RGB and apply NCHW format with normalization
    const tensorData = convertToNCHW(rgbaData, width, height);
    
    console.log('Image preprocessing completed successfully');
    
    return {
      data: tensorData,
      dims: [1, 3, 224, 224],
    };
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw error;
  }
};

const resizeRGBA = (
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Uint8Array => {
  const dst = new Uint8Array(dstW * dstH * 4);

  for (let y = 0; y < dstH; y++) {
    const srcY = (y + 0.5) * (srcH / dstH) - 0.5;
    const y0 = Math.max(0, Math.floor(srcY));
    const y1 = Math.min(srcH - 1, y0 + 1);
    const wy = srcY - y0;

    for (let x = 0; x < dstW; x++) {
      const srcX = (x + 0.5) * (srcW / dstW) - 0.5;
      const x0 = Math.max(0, Math.floor(srcX));
      const x1 = Math.min(srcW - 1, x0 + 1);
      const wx = srcX - x0;

      const dstIdx = (y * dstW + x) * 4;
      const i00 = (y0 * srcW + x0) * 4;
      const i10 = (y0 * srcW + x1) * 4;
      const i01 = (y1 * srcW + x0) * 4;
      const i11 = (y1 * srcW + x1) * 4;

      for (let c = 0; c < 4; c++) {
        const v00 = src[i00 + c];
        const v10 = src[i10 + c];
        const v01 = src[i01 + c];
        const v11 = src[i11 + c];

        const v0 = v00 * (1 - wx) + v10 * wx;
        const v1 = v01 * (1 - wx) + v11 * wx;
        dst[dstIdx + c] = Math.round(v0 * (1 - wy) + v1 * wy);
      }
    }
  }

  return dst;
};

/**
 * Convert RGBA image data to NCHW format with ImageNet normalization
 * Input: Uint8Array of RGBA pixels [H*W*4]
 * Output: Float32Array of normalized RGB in NCHW format [1, 3, H, W]
 */
const convertToNCHW = (
  rgbaData: Uint8Array,
  width: number,
  height: number,
): Float32Array => {
  const channels = 3;
  const tensorData = new Float32Array(1 * channels * height * width);
  
  // Convert from RGBA (interleaved) to NCHW format and normalize
  let tensorIndex = 0;
  
  // Process each channel separately for NCHW format
  for (let c = 0; c < channels; c++) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        // RGBA index: (h * width + w) * 4 + channel
        const rgbaIndex = (h * width + w) * 4 + c;
        const pixelValue = rgbaData[rgbaIndex];
        
        // Normalize using ImageNet statistics
        const normalizedValue = (pixelValue / 255.0 - IMAGENET_MEAN[c]) / IMAGENET_STD[c];
        
        tensorData[tensorIndex++] = normalizedValue;
      }
    }
  }
  
  return tensorData;
};

/**
 * Normalize pixel values using ImageNet statistics
 */
export const normalizePixel = (
  pixelValue: number,
  channel: number,
): number => {
  // Normalize from [0, 255] to [0, 1] then apply ImageNet normalization
  const normalized = pixelValue / 255.0;
  return (normalized - IMAGENET_MEAN[channel]) / IMAGENET_STD[channel];
};
