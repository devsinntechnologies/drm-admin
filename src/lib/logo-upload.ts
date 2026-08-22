/** Logos are embedded as data URLs in template config — 2 MB fits typical logos without bloating saves. */
export const MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024;

export const MAX_LOGO_FILE_LABEL = "2 MB";

export function validateLogoFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please upload an image file (PNG, JPG, or SVG).";
  }
  if (file.size > MAX_LOGO_FILE_BYTES) {
    return `Logo must be ${MAX_LOGO_FILE_LABEL} or smaller. Try exporting as PNG or compressing the image.`;
  }
  return null;
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
