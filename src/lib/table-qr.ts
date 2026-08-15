const A4_WIDTH_PX = 2480;
const A4_HEIGHT_PX = 3508;
const DEFAULT_PRIMARY = "#001840";
const DIGINIZAM_BLUE = "#0149EC";
const INK = "#0f172a";
const MUTED = "#64748b";

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

function drawBusinessMark(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  name: string,
  cx: number,
  cy: number,
  radius: number,
  primary: string,
) {
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 10;
  ctx.stroke();

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 16, 0, Math.PI * 2);
    ctx.clip();
    drawContainedImage(ctx, logo, cx - radius + 22, cy - radius + 22, (radius - 22) * 2, (radius - 22) * 2);
    ctx.restore();
    return;
  }

  ctx.fillStyle = primary;
  ctx.font = "800 92px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((name.trim()[0] || "D").toUpperCase(), cx, cy + 4);
  ctx.textBaseline = "alphabetic";
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
  const width = A4_WIDTH_PX;
  const height = A4_HEIGHT_PX;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create QR canvas");

  const pad = 96;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const headerH = 720;
  const footerH = 360;
  const businessName = options.businessName || "Restaurant";

  ctx.fillStyle = mixWithWhite(primary, 0.93);
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.16)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.clip();

  ctx.fillStyle = primary;
  ctx.fillRect(cardX, cardY, cardW, headerH);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(cardX + 180, cardY + 80, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardX + cardW - 80, cardY + headerH - 40, 200, 0, Math.PI * 2);
  ctx.fill();

  const [businessLogo, poweredByLogo, qrDataUrl] = await Promise.all([
    options.businessLogoUrl ? loadImage(options.businessLogoUrl) : Promise.resolve(null),
    loadImage(options.poweredByLogoUrl || "/diginizam-logo.svg"),
    QRCode.toDataURL(options.url, {
      width: 1120,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#111111", light: "#ffffff" },
    }),
  ]);

  const markY = cardY + 250;
  drawBusinessMark(ctx, businessLogo, businessName, width / 2, markY, 128, primary);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 78px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(businessName, width / 2, cardY + 470, cardW - 200);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, cardY + 520);
  ctx.lineTo(width / 2 + 120, cardY + 520);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.fillText("T A B L E", width / 2, cardY + headerH + 130);

  ctx.fillStyle = INK;
  ctx.font = "800 132px system-ui, sans-serif";
  ctx.fillText(options.tableNumber || "Table", width / 2, cardY + headerH + 280, cardW - 220);

  const qrSize = 1080;
  const qrX = (width - qrSize) / 2;
  const qrY = cardY + headerH + 360;
  const qrImage = await loadImage(qrDataUrl);
  if (qrImage) {
    ctx.fillStyle = "#f8fafc";
    roundRect(ctx, qrX - 56, qrY - 56, qrSize + 112, qrSize + 112, 40);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
    ctx.fill();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  }

  ctx.fillStyle = MUTED;
  ctx.font = "600 44px system-ui, sans-serif";
  ctx.fillText("Scan to order from this table", width / 2, qrY + qrSize + 110);

  const footerY = cardY + cardH - footerH;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(cardX, footerY, cardW, footerH);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 160, footerY);
  ctx.lineTo(cardX + cardW - 160, footerY);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.fillText("Powered by", width / 2, footerY + 78);

  if (poweredByLogo) {
    drawContainedImage(ctx, poweredByLogo, width / 2 - 280, footerY + 100, 560, 128);
  } else {
    ctx.fillStyle = INK;
    ctx.font = "800 56px system-ui, sans-serif";
    ctx.fillText("DigiNizam", width / 2, footerY + 180);
  }

  ctx.fillStyle = DIGINIZAM_BLUE;
  ctx.font = "700 38px system-ui, sans-serif";
  ctx.fillText("diginizam.com", width / 2, footerY + 280);

  ctx.restore();

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
