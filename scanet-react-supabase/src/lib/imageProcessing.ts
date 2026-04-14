export function compressImage(imageData: string, maxSizeKB: number = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let quality = 0.9;
      let compressedImage = canvas.toDataURL('image/jpeg', quality);

      const sizeInKB = (compressedImage.length * 3) / 4 / 1024;

      if (sizeInKB > maxSizeKB) {
        quality = Math.max(0.5, (maxSizeKB / sizeInKB) * quality);
        compressedImage = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(compressedImage);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageData;
  });
}
