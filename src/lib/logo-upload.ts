/** Source images can be large; the editor always exports a small PNG. */
export const MAX_LOGO_SOURCE_BYTES = 25 * 1024 * 1024;

export const MAX_LOGO_SOURCE_LABEL = "25 MB";

const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateLogoSource(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return "Please upload a PNG, JPG, or WebP image.";
  }
  if (file.size > MAX_LOGO_SOURCE_BYTES) {
    return `That file is larger than ${MAX_LOGO_SOURCE_LABEL}. Compress it or pick a smaller export.`;
  }
  return null;
}

/** @deprecated Use validateLogoSource — kept for older call sites. */
export function validateLogoFile(file: File): string | null {
  return validateLogoSource(file);
}

export function isEmbeddedLogoData(value?: string | null): boolean {
  if (!value) return false;
  return value.startsWith("data:") || value.startsWith("blob:");
}

/** Safety-net resize if a file skips the editor. */
export async function prepareLogoFile(file: File): Promise<File> {
  const error = validateLogoSource(file);
  if (error) throw new Error(error);

  const dataUrl = await readLogoAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the logo image."));
    img.src = dataUrl;
  });

  const maxEdge = 512;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png", 0.9);
  });
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
}

export function readLogoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read logo file"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read logo file"));
    reader.readAsDataURL(file);
  });
}
