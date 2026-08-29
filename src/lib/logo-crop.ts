import type { Area } from "react-easy-crop";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function rotatedSize(width: number, height: number, rotation: number) {
  const rad = toRad(rotation);
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image for editing."));
    image.src = src;
  });
}

/** Crop + rotate the source image and export a compact PNG for upload. */
export async function cropImageToPngFile(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  fileName = "logo.png",
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create an editor canvas.");

  const { width: bBoxWidth, height: bBoxHeight } = rotatedSize(
    image.naturalWidth,
    image.naturalHeight,
    rotation,
  );
  canvas.width = Math.max(1, Math.round(bBoxWidth));
  canvas.height = Math.max(1, Math.round(bBoxHeight));

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(toRad(rotation));
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const cropCanvas = document.createElement("canvas");
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("Could not crop the logo.");

  const maxEdge = 512;
  const scale = Math.min(1, maxEdge / Math.max(pixelCrop.width, pixelCrop.height));
  cropCanvas.width = Math.max(1, Math.round(pixelCrop.width * scale));
  cropCanvas.height = Math.max(1, Math.round(pixelCrop.height * scale));

  cropCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    cropCanvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not export the logo."))),
      "image/png",
      0.92,
    );
  });

  return new File([blob], fileName.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
}
