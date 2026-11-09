// Vercel rejects request bodies over 4.5 MB, so leave room for the form fields.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const JPEG_QUALITIES = [0.85, 0.7, 0.55];

/** Returns the file unchanged if it can be uploaded, otherwise a smaller JPEG copy. */
export async function fitImageForUpload(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;

  // Redrawing a GIF would keep only its first frame.
  if (file.type === 'image/gif') {
    throw new Error('GIFs must be under 4MB. Please use a smaller GIF.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process this image.');

  // JPEG has no transparency, so transparent areas would otherwise turn black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of JPEG_QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    }
  }

  throw new Error('This image is too large to upload. Please use a smaller image.');
}
