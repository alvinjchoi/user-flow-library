/**
 * Generate a compressed data URL for the provided image file.
 * Reduces dimension and quality so payloads stay within API limits.
 */
export async function generateCompressedDataUrl(
  file: File,
  maxDimension = 1600,
  maxBytes = 2.5 * 1024 * 1024 // ~2.5MB actual payload (~3.3MB base64)
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Image compression is only available in the browser");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);

    let { width, height } = calculateDimensions(
      image.width,
      image.height,
      maxDimension
    );

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to obtain canvas context");
    }

    let quality = 0.85;
    let dataUrl = "";
    let dataBytes = Infinity;
    const minDimension = 600;

    while (true) {
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      dataUrl = canvas.toDataURL("image/jpeg", quality);
      dataBytes = estimateBase64Bytes(dataUrl);

      if (dataBytes <= maxBytes) {
        return dataUrl;
      }

      if (quality > 0.45) {
        quality -= 0.1;
        continue;
      }

      if (width <= minDimension && height <= minDimension) {
        return dataUrl;
      }

      width = Math.max(minDimension, Math.round(width * 0.85));
      height = Math.max(minDimension, Math.round(height * 0.85));
      quality = 0.75;
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
) {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  }

  return {
    width: Math.round(maxDimension * aspectRatio),
    height: maxDimension,
  };
}

function estimateBase64Bytes(dataUrl: string) {
  const base64String = dataUrl.split(",")[1] || "";
  return Math.ceil((base64String.length * 3) / 4);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Unable to load image for compression"));
    img.src = src;
  });
}
