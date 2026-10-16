// Client-side image processing (no server-side libs): compress before upload
// and crop avatars to a square. Browser canvas strips EXIF (incl. GPS) for free.

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.8;
const AVATAR_OUTPUT_SIZE = 512;
const AVATAR_QUALITY = 0.85;

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob && blob.type === 'image/webp') return resolve(blob);
        // WebP unsupported (old Safari): JPEG fallback.
        canvas.toBlob(
          jpeg => (jpeg ? resolve(jpeg) : reject(new Error('無法產生圖片'))),
          'image/jpeg',
          quality,
        );
      },
      'image/webp',
      quality,
    );
  });

const drawScaled = (source: CanvasImageSource, srcW: number, srcH: number, maxDim: number) => {
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(srcW * scale));
  canvas.height = Math.max(1, Math.round(srcH * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('無法處理圖片');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
};

// Resize to maxDim px on the longest side and re-encode (~3-8 MB photo -> ~100-250 KB).
export const compressImage = async (
  file: Blob,
  maxDim: number = MAX_DIMENSION,
  quality: number = COMPRESS_QUALITY,
): Promise<CompressedImage> => {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = drawScaled(bitmap, bitmap.width, bitmap.height, maxDim);
    return {
      blob: await canvasToBlob(canvas, quality),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    bitmap.close();
  }
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('無法載入圖片'));
    img.src = src;
  });

// Draw a square region of the source image into a fixed-size canvas.
export const cropSquareBlob = async (
  src: string,
  area: CropArea,
  outputSize: number = AVATAR_OUTPUT_SIZE,
  quality: number = AVATAR_QUALITY,
): Promise<CompressedImage> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('無法處理圖片');
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outputSize, outputSize);
  return {
    blob: await canvasToBlob(canvas, quality),
    width: outputSize,
    height: outputSize,
  };
};
