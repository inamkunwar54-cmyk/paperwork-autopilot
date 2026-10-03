const MAX_EDGE = 2000;
const CLAUDE_IMAGE_LIMIT = 5 * 1024 * 1024;

/**
 * Shrinks phone photos before upload so they stay well under the model's image limit
 * and upload quickly on mobile data. PDFs and small images pass through unchanged.
 */
export async function prepareFile(file: File): Promise<{ blob: Blob; mimeType: string; ext: string }> {
  if (file.type === "application/pdf") return { blob: file, mimeType: file.type, ext: "pdf" };

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (blob) return { blob, mimeType: "image/jpeg", ext: "jpg" };
  } catch {
    // Fall through: the browser could not decode it (for example HEIC on some browsers).
  }

  const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (supported.includes(file.type) && file.size <= CLAUDE_IMAGE_LIMIT) {
    return { blob: file, mimeType: file.type, ext: file.type.split("/")[1].replace("jpeg", "jpg") };
  }
  throw new Error("We can't read this image format. Try a JPEG or PNG photo, or a PDF.");
}
