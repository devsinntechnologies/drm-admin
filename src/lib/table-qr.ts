const A4_WIDTH_PX = 2480;
const A4_HEIGHT_PX = 3508;
const DEFAULT_PRIMARY = "#001840";
const DEFAULT_SECONDARY = "#0050F8";

export function storefrontSelfOrderUrl(
  origins: string[] | undefined,
  tableId: string,
): string | null {
  const origin = (origins ?? []).find((value) => {
    const trimmed = value?.trim();
    return Boolean(trimmed) && trimmed !== "*";
  });
  if (!origin) return null;

  const trimmed = origin.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return `${parsed.origin}/self/${tableId}`;
  } catch {
    return `${trimmed}/self/${tableId}`;
  }
}

function normalizeHex(value?: string | null, fallback = DEFAULT_PRIMARY) {
  const hex = (value || "").trim();
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? hex : fallback;
}

function mixWithWhite(hex: string, amount = 0.88) {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, x + (maxWidth - width) / 2, y + (maxHeight - height) / 2, width, height);
}

export async function generateTableQrCard(options: {
  url: string;
  tableNumber: string;
  businessName: string;
  businessLogoUrl?: string | null;
  poweredByLogoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  const primary = normalizeHex(options.primaryColor, DEFAULT_PRIMARY);
  const secondary = normalizeHex(options.secondaryColor, DEFAULT_SECONDARY);
  const width = A4_WIDTH_PX;
  const height = A4_HEIGHT_PX;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create QR canvas");

  const pad = 124;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const headerH = 620;

  ctx.fillStyle = mixWithWhite(primary, 0.94);
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 72);
  ctx.fill();

  ctx.fillStyle = primary;
  roundRect(ctx, cardX, cardY, cardW, headerH, 72);
  ctx.fill();
  ctx.fillRect(cardX, cardY + headerH - 120, cardW, 120);

  const [businessLogo, poweredByLogo, qrDataUrl] = await Promise.all([
    options.businessLogoUrl ? loadImage(options.businessLogoUrl) : Promise.resolve(null),
    options.poweredByLogoUrl ? loadImage(options.poweredByLogoUrl) : Promise.resolve(null),
    QRCode.toDataURL(options.url, {
      width: 1180,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: primary, light: "#ffffff" },
    }),
  ]);

  if (businessLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, cardY + 210, 118, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(width / 2 - 118, cardY + 92, 236, 236);
    drawContainedImage(ctx, businessLogo, width / 2 - 108, cardY + 102, 216, 216);
    ctx.restore();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 86px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    options.businessName || "Restaurant",
    width / 2,
    businessLogo ? cardY + 430 : cardY + 340,
    cardW - 160,
  );

  ctx.fillStyle = "#64748b";
  ctx.font = "700 42px system-ui, sans-serif";
  ctx.fillText("TABLE", width / 2, cardY + headerH + 150);

  ctx.fillStyle = primary;
  ctx.font = "900 160px system-ui, sans-serif";
  ctx.fillText(options.tableNumber || "Table", width / 2, cardY + headerH + 320, cardW - 200);

  const qrSize = 1180;
  const qrX = (width - qrSize) / 2;
  const qrY = cardY + headerH + 400;
  const qrImage = await loadImage(qrDataUrl);
  if (qrImage) {
    ctx.fillStyle = mixWithWhite(secondary, 0.86);
    roundRect(ctx, qrX - 48, qrY - 48, qrSize + 96, qrSize + 96, 56);
    ctx.fill();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  }

  ctx.fillStyle = secondary;
  ctx.font = "700 54px system-ui, sans-serif";
  ctx.fillText("Scan to order from this table", width / 2, qrY + qrSize + 140);

  const footerY = height - 430;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cardX + 180, footerY);
  ctx.lineTo(width - cardX - 180, footerY);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "600 40px system-ui, sans-serif";
  ctx.fillText("Powered by", width / 2, footerY + 80);

  if (poweredByLogo) {
    drawContainedImage(ctx, poweredByLogo, width / 2 - 70, footerY + 100, 140, 90);
  }

  ctx.fillStyle = secondary;
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText("diginizam.com", width / 2, footerY + 230);

  return canvas.toDataURL("image/png");
}

export async function downloadQrPng(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
  link.click();
}

export async function downloadQrPdf(dataUrl: string, fileName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.addImage(dataUrl, "PNG", 0, 0, 210, 297);
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
