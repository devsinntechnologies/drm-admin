const A4_WIDTH_PX = 2480;
const A4_HEIGHT_PX = 3508;
const DEFAULT_PRIMARY = "#ff6a00";
const DIGINIZAM_BLUE = "#0149EC";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e5e7eb";
const DEFAULT_TAGLINE = "Delicious Food. Great Experience.";

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
  ctx.drawImage(
    image,
    x + (maxWidth - width) / 2,
    y + (maxHeight - height) / 2,
    width,
    height,
  );
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight = 800,
) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number,
) {
  const widths = [...text].map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, value) => sum + value, 0) + spacing * (text.length - 1);
  let x = centerX - total / 2;
  ctx.textAlign = "left";
  [...text].forEach((char, index) => {
    ctx.fillText(char, x, y);
    x += widths[index] + spacing;
  });
  ctx.textAlign = "center";
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  rows = 4,
  cols = 4,
  spacing = 26,
  radius = 4,
) {
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.beginPath();
      ctx.arc(x + col * spacing, y + row * spacing, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  primary: string,
) {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(1, primary);
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height - 165);
  ctx.bezierCurveTo(
    width * 0.80,
    height - 24,
    width * 0.35,
    height - 60,
    0,
    height + 50,
  );
  ctx.closePath();
  ctx.fill();

  // Large soft circles keep the same orange palette while making the header richer.
  ctx.fillStyle = "rgba(255,255,255,0.085)";
  ctx.beginPath();
  ctx.arc(90, 85, 270, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width - 60, 70, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width - 180, height - 145, 185, 0, Math.PI * 2);
  ctx.fill();

  drawDotGrid(ctx, 130, 285, "rgba(255,255,255,0.42)", 4, 3, 28, 5);
  drawDotGrid(ctx, width - 405, 175, "rgba(255,255,255,0.34)", 4, 4, 29, 5);
  ctx.restore();
}

function drawFooterBand(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  height: number,
  accent: string,
) {
  ctx.save();
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(0, y + 88);
  ctx.bezierCurveTo(width * 0.24, y - 18, width * 0.68, y + 40, width, y + 6);
  ctx.lineTo(width, y + height);
  ctx.lineTo(0, y + height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(18, y + 84);
  ctx.bezierCurveTo(width * 0.24, y - 13, width * 0.68, y + 45, width - 18, y + 11);
  ctx.stroke();
  ctx.restore();
}

function drawHeaderDivider(ctx: CanvasRenderingContext2D, cx: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(cx - 190, y);
  ctx.lineTo(cx - 54, y);
  ctx.moveTo(cx + 54, y);
  ctx.lineTo(cx + 190, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTableHeading(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  accent: string,
) {
  ctx.save();
  ctx.fillStyle = accent;
  ctx.font = "800 48px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  drawSpacedText(ctx, "TABLE", cx, y, 12);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 260, y - 15);
  ctx.lineTo(cx - 165, y - 15);
  ctx.moveTo(cx + 165, y - 15);
  ctx.lineTo(cx + 260, y - 15);
  ctx.stroke();
  ctx.restore();
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
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 15, 0, Math.PI * 2);
    ctx.clip();
    drawContainedImage(
      ctx,
      logo,
      cx - radius + 24,
      cy - radius + 24,
      (radius - 24) * 2,
      (radius - 24) * 2,
    );
    ctx.restore();
    return;
  }

  ctx.fillStyle = primary;
  ctx.font = "800 94px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((name.trim()[0] || "D").toUpperCase(), cx, cy + 2);
  ctx.textBaseline = "alphabetic";
}

function drawFoodIcons(
  ctx: CanvasRenderingContext2D,
  width: number,
  accent: string,
) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const burger = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.arc(x, y, 36 * s, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 41 * s, y + 13 * s);
    ctx.lineTo(x + 41 * s, y + 13 * s);
    ctx.moveTo(x - 36 * s, y + 31 * s);
    ctx.quadraticCurveTo(x, y + 43 * s, x + 36 * s, y + 31 * s);
    ctx.stroke();
  };

  const steamBowl = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.moveTo(x - 35 * s, y);
    ctx.quadraticCurveTo(x, y + 48 * s, x + 35 * s, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 12 * s, y - 20 * s);
    ctx.quadraticCurveTo(x - 4 * s, y - 35 * s, x - 10 * s, y - 50 * s);
    ctx.moveTo(x + 11 * s, y - 18 * s);
    ctx.quadraticCurveTo(x + 18 * s, y - 33 * s, x + 12 * s, y - 48 * s);
    ctx.stroke();
  };

  const pizza = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 43 * s);
    ctx.lineTo(x + 35 * s, y + 36 * s);
    ctx.lineTo(x - 35 * s, y + 36 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 11 * s, y + 10 * s, 5 * s, 0, Math.PI * 2);
    ctx.arc(x + 12 * s, y + 22 * s, 5 * s, 0, Math.PI * 2);
    ctx.stroke();
  };

  const cup = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.moveTo(x - 24 * s, y - 29 * s);
    ctx.lineTo(x - 17 * s, y + 34 * s);
    ctx.lineTo(x + 17 * s, y + 34 * s);
    ctx.lineTo(x + 24 * s, y - 29 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 29 * s, y, 14 * s, -0.7, 0.7);
    ctx.stroke();
  };

  burger(165, 1520, 1.12);
  steamBowl(width - 165, 1535, 1.08);
  pizza(145, 2195, 1.02);
  cup(width - 150, 2160, 1.06);
  ctx.restore();
}

function drawCornerMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.48;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  const d = 38;
  const inset = 28;

  const corners: Array<[number, number, number, number, number, number]> = [
    [x + inset + d, y + inset, x + inset, y + inset, x + inset, y + inset + d],
    [x + w - inset - d, y + inset, x + w - inset, y + inset, x + w - inset, y + inset + d],
    [x + inset + d, y + h - inset, x + inset, y + h - inset, x + inset, y + h - inset - d],
    [x + w - inset - d, y + h - inset, x + w - inset, y + h - inset, x + w - inset, y + h - inset - d],
  ];

  corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  });
  ctx.restore();
}

function drawScanGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  roundRect(ctx, cx - 22, cy - 34, 44, 68, 8);
  ctx.stroke();

  const corners: Array<[number, number, number, number, number, number]> = [
    [cx - 42, cy - 24, cx - 42, cy - 40, cx - 24, cy - 40],
    [cx + 24, cy - 40, cx + 42, cy - 40, cx + 42, cy - 24],
    [cx - 42, cy + 24, cx - 42, cy + 40, cx - 24, cy + 40],
    [cx + 24, cy + 40, cx + 42, cy + 40, cx + 42, cy + 24],
  ];

  corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  });
  ctx.restore();
}

function drawOrderCta(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  accent: string,
) {
  const title = "Scan to order from this table";
  const steps = ["View menu", "Choose items", "Place order"];
  const titleFont =
    "800 42px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const stepFont =
    "500 28px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  ctx.save();
  ctx.font = titleFont;
  const titleWidth = ctx.measureText(title).width;
  ctx.font = stepFont;
  const stepWidths = steps.map((step) => ctx.measureText(step).width);

  const bulletGap = 38;
  const stepsWidth = stepWidths.reduce((sum, value) => sum + value, 0) + bulletGap * 2;
  const iconDiameter = 104;
  const height = 140;
  const leftPadding = 25;
  const gapAfterIcon = 30;
  const rightPadding = 32;
  const contentWidth = Math.max(titleWidth, stepsWidth);
  const width = Math.ceil(leftPadding + iconDiameter + gapAfterIcon + contentWidth + rightPadding);
  const x = centerX - width / 2;

  ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, width, height, 70);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  roundRect(ctx, x, y, width, height, 70);
  ctx.stroke();

  const iconCx = x + leftPadding + iconDiameter / 2;
  const iconCy = y + height / 2;
  ctx.beginPath();
  ctx.arc(iconCx, iconCy, iconDiameter / 2, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  drawScanGlyph(ctx, iconCx, iconCy);

  const textX = x + leftPadding + iconDiameter + gapAfterIcon;
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = titleFont;
  ctx.fillText(title, textX, y + 58);

  ctx.font = stepFont;
  const baselineY = y + 106;
  let cursorX = textX;
  steps.forEach((step, index) => {
    ctx.fillStyle = MUTED;
    ctx.fillText(step, cursorX, baselineY);
    cursorX += stepWidths[index];

    if (index < steps.length - 1) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cursorX + 18, baselineY - 10, 5, 0, Math.PI * 2);
      ctx.fill();
      cursorX += bulletGap;
    }
  });
  ctx.restore();
}

export async function generateTableQrCard(options: {
  url: string;
  tableNumber: string;
  businessName: string;
  tagline?: string | null;
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

  const businessName = options.businessName || "Restaurant";
  const tagline = options.tagline?.trim() || DEFAULT_TAGLINE;
  const tableNumber = options.tableNumber || "Table";
  const compactTable = tableNumber.length <= 3;

  // Balanced A4 proportions: strong brand header, dominant QR, compact CTA, clean footer.
  const headerH = 850;
  const tableLabelY = 1060;
  const tableNumberY = compactTable ? 1280 : 1255;
  const qrSize = 1040;
  const qrX = (width - qrSize) / 2;
  const qrY = 1430;
  const qrFramePad = 54;
  const ctaY = 2585;
  const footerH = 430;
  const footerY = height - footerH;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Thin outer print-safe frame.
  ctx.save();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 4;
  roundRect(ctx, 10, 10, width - 20, height - 20, 32);
  ctx.stroke();
  ctx.restore();

  drawHeader(ctx, width, headerH, primary);

  const [businessLogo, poweredByLogo, qrDataUrl] = await Promise.all([
    options.businessLogoUrl ? loadImage(options.businessLogoUrl) : Promise.resolve(null),
    loadImage(options.poweredByLogoUrl || "/diginizam-logo.svg"),
    QRCode.toDataURL(options.url, {
      width: qrSize,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#111111", light: "#ffffff" },
    }),
  ]);

  drawBusinessMark(ctx, businessLogo, businessName, width / 2, 225, 118, primary);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  const nameSize = fitFontSize(ctx, businessName, width - 380, 108, 72, 800);
  ctx.font = `800 ${nameSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText(businessName, width / 2, 520);

  drawHeaderDivider(ctx, width / 2, 612);

  const taglineSize = fitFontSize(ctx, tagline, width - 560, 48, 34, 500);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = `500 ${taglineSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText(tagline, width / 2, 700);

  drawFoodIcons(ctx, width, primary);

  drawTableHeading(ctx, width / 2, tableLabelY, primary);
  ctx.fillStyle = INK;
  ctx.font = compactTable
    ? "800 190px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    : "800 108px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(tableNumber, width / 2, tableNumberY, width - 460);

  const qrImage = await loadImage(qrDataUrl);
  if (qrImage) {
    const frameX = qrX - qrFramePad;
    const frameY = qrY - qrFramePad;
    const frameW = qrSize + qrFramePad * 2;
    const frameH = qrSize + qrFramePad * 2;

    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.10)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, frameX, frameY, frameW, frameH, 46);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 7;
    roundRect(ctx, frameX, frameY, frameW, frameH, 46);
    ctx.stroke();
    drawCornerMarks(ctx, frameX, frameY, frameW, frameH, primary);
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  }

  drawOrderCta(ctx, width / 2, ctaY, primary);

  // Micro helper line makes the action clear without adding another large block.
  ctx.textAlign = "center";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 25px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("No app required • Open camera and scan", width / 2, ctaY + 185);

  drawFooterBand(ctx, width, footerY, footerH, primary);
  drawDotGrid(ctx, 110, height - 145, "rgba(148,163,184,0.30)", 4, 4, 26, 4);
  drawDotGrid(ctx, width - 205, height - 145, "rgba(148,163,184,0.30)", 4, 4, 26, 4);

  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  ctx.font = "600 29px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Powered by", width / 2, footerY + 142);

  if (poweredByLogo) {
    drawContainedImage(ctx, poweredByLogo, width / 2 - 300, footerY + 160, 600, 116);
  } else {
    ctx.fillStyle = DIGINIZAM_BLUE;
    ctx.font = "800 58px system-ui, sans-serif";
    ctx.fillText("DIGINIZAM", width / 2, footerY + 250);
  }

  ctx.fillStyle = MUTED;
  ctx.font = "500 22px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Simplify. Manage. Grow.", width / 2, footerY + 310);

  ctx.fillStyle = DIGINIZAM_BLUE;
  ctx.font = "800 32px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("diginizam.com", width / 2, footerY + 356);

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