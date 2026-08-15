const A4_WIDTH_PX = 2480;
const A4_HEIGHT_PX = 3508;
const DEFAULT_PRIMARY = "#ff6a00";
const DIGINIZAM_BLUE = "#0149EC";
const INK = "#111827";
const MUTED = "#64748b";
const SOFT_BG = "#f8fafc";
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

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  rows = 4,
  cols = 4,
  spacing = 22,
  radius = 4,
) {
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.beginPath();
      ctx.arc(x + col * spacing, y + row * spacing, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHeaderWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height - 60);
  ctx.bezierCurveTo(
    x + width * 0.83,
    y + height + 50,
    x + width * 0.40,
    y + height - 18,
    x,
    y + height + 82,
  );
  ctx.closePath();
  ctx.fill();
}

function drawFooterBand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
) {
  ctx.fillStyle = "#f6f7f9";
  ctx.beginPath();
  ctx.moveTo(x, y + 56);
  ctx.bezierCurveTo(
    x + width * 0.26,
    y - 48,
    x + width * 0.72,
    y + 46,
    x + width,
    y + 8,
  );
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 52);
  ctx.bezierCurveTo(
    x + width * 0.26,
    y - 44,
    x + width * 0.72,
    y + 42,
    x + width - 24,
    y + 12,
  );
  ctx.stroke();
  ctx.restore();
}

function drawHeaderDivider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(cx - 210, y);
  ctx.lineTo(cx - 64, y);
  ctx.moveTo(cx + 64, y);
  ctx.lineTo(cx + 210, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTableLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  accent: string,
) {
  ctx.save();
  ctx.fillStyle = accent;
  ctx.font = "800 52px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "12px";
  ctx.fillText("TABLE", cx, y);

  const labelWidth = 220;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - labelWidth / 2 - 118, y - 18);
  ctx.lineTo(cx - labelWidth / 2 - 40, y - 18);
  ctx.moveTo(cx + labelWidth / 2 + 40, y - 18);
  ctx.lineTo(cx + labelWidth / 2 + 118, y - 18);
  ctx.stroke();
  ctx.restore();
}

function drawFoodIcons(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardW: number,
  top: number,
  accent: string,
) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const burger = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.arc(x, y, 34 * s, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 38 * s, y + 12 * s);
    ctx.lineTo(x + 38 * s, y + 12 * s);
    ctx.moveTo(x - 34 * s, y + 28 * s);
    ctx.quadraticCurveTo(x, y + 42 * s, x + 34 * s, y + 28 * s);
    ctx.stroke();
  };

  const bowl = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.moveTo(x - 34 * s, y);
    ctx.quadraticCurveTo(x, y + 48 * s, x + 34 * s, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y - 22 * s);
    ctx.quadraticCurveTo(x - 4 * s, y - 36 * s, x - 10 * s, y - 48 * s);
    ctx.moveTo(x + 10 * s, y - 20 * s);
    ctx.quadraticCurveTo(x + 16 * s, y - 34 * s, x + 10 * s, y - 46 * s);
    ctx.stroke();
  };

  const pizza = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 42 * s);
    ctx.lineTo(x + 34 * s, y + 34 * s);
    ctx.lineTo(x - 34 * s, y + 34 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + 2 * s, 6 * s, 0, Math.PI * 2);
    ctx.arc(x - 12 * s, y + 18 * s, 5 * s, 0, Math.PI * 2);
    ctx.stroke();
  };

  const cup = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.moveTo(x - 24 * s, y - 28 * s);
    ctx.lineTo(x - 16 * s, y + 34 * s);
    ctx.lineTo(x + 16 * s, y + 34 * s);
    ctx.lineTo(x + 24 * s, y - 28 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 28 * s, y, 14 * s, -0.7, 0.7);
    ctx.stroke();
  };

  const cloche = (x: number, y: number, s = 1) => {
    ctx.beginPath();
    ctx.arc(x, y + 10 * s, 38 * s, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 44 * s, y + 12 * s);
    ctx.lineTo(x + 44 * s, y + 12 * s);
    ctx.moveTo(x - 8 * s, y - 36 * s);
    ctx.lineTo(x + 8 * s, y - 36 * s);
    ctx.stroke();
  };

  burger(cardX + 185, top + 150, 1.2);
  bowl(cardX + cardW - 210, top + 150, 1.1);
  pizza(cardX + 165, top + 720, 1.15);
  cup(cardX + cardW - 180, top + 650, 1.15);
  bowl(cardX + 170, top + 1240, 1.15);
  cloche(cardX + cardW - 190, top + 1210, 1.2);
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

  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 24);
  ctx.lineTo(cx + 8, cy - 24);
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
  ctx.shadowColor = "rgba(15, 23, 42, 0.16)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 14, 0, Math.PI * 2);
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
  ctx.font = "800 96px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((name.trim()[0] || "D").toUpperCase(), cx, cy + 4);
  ctx.textBaseline = "alphabetic";
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

  const cardX = 0;
  const cardY = 0;
  const cardW = width;
  const cardH = height;

  const headerH = 930;
  const footerH = 430;
  const footerY = cardH - footerH;

  const businessName = options.businessName || "Restaurant";
  const tagline = options.tagline?.trim() || DEFAULT_TAGLINE;
  const tableNumber = options.tableNumber || "Table";
  const compactTable = tableNumber.length <= 3;

  const tableLabelY = 1110;
  const tableNumberY = compactTable ? 1325 : 1290;
  const qrSize = 1040;
  const qrX = (width - qrSize) / 2;
  const qrY = 1455;

  const pillW = 1460;
  const pillH = 188;
  const pillX = (width - pillW) / 2;
  const pillY = 2655;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX + 8, cardY + 8, cardW - 16, cardH - 16, 28);
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.clip();

  drawHeaderWave(ctx, cardX, cardY, cardW, headerH, primary);

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.arc(cardX + 105, cardY + 130, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardX + cardW - 90, cardY + 65, 240, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawDotGrid(ctx, cardX + 110, cardY + 305, "rgba(255,255,255,0.55)", 4, 3, 28, 5);
  drawDotGrid(
    ctx,
    cardX + cardW - 430,
    cardY + 190,
    "rgba(255,255,255,0.38)",
    4,
    4,
    30,
    5,
  );

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

  drawBusinessMark(ctx, businessLogo, businessName, width / 2, 265, 132, primary);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 112px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(businessName, width / 2, 600, cardW - 340);

  drawHeaderDivider(ctx, width / 2, 690);

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "500 50px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(tagline, width / 2, 790, cardW - 450);

  drawFoodIcons(ctx, cardX, cardW, 1060, primary);
  drawTableLabel(ctx, width / 2, tableLabelY, primary);

  ctx.fillStyle = INK;
  ctx.font = compactTable
    ? "800 190px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    : "800 108px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(tableNumber, width / 2, tableNumberY, cardW - 440);

  const qrImage = await loadImage(qrDataUrl);
  if (qrImage) {
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.10)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, qrX - 42, qrY - 42, qrSize + 84, qrSize + 84, 42);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 7;
    roundRect(ctx, qrX - 42, qrY - 42, qrSize + 84, qrSize + 84, 42);
    ctx.stroke();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, pillX, pillY, pillW, pillH, 90);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.lineWidth = 5;
  roundRect(ctx, pillX, pillY, pillW, pillH, 90);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pillX + 108, pillY + pillH / 2, 70, 0, Math.PI * 2);
  ctx.fillStyle = primary;
  ctx.fill();
  drawScanGlyph(ctx, pillX + 108, pillY + pillH / 2);

  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = "800 48px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Scan to order from this table", pillX + 220, pillY + 78);

  ctx.fillStyle = MUTED;
  ctx.font = "500 34px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("View menu", pillX + 220, pillY + 132);

  const viewWidth = ctx.measureText("View menu").width;
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(pillX + 220 + viewWidth + 24, pillY + 121, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.fillText("Choose items", pillX + 220 + viewWidth + 44, pillY + 132);
  const chooseWidth = ctx.measureText("Choose items").width;

  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(pillX + 220 + viewWidth + 44 + chooseWidth + 24, pillY + 121, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.fillText(
    "Place order",
    pillX + 220 + viewWidth + 44 + chooseWidth + 44,
    pillY + 132,
  );
  ctx.restore();

  drawFooterBand(ctx, cardX, footerY, cardW, footerH, primary);

  drawDotGrid(
    ctx,
    cardX + 105,
    cardH - 155,
    "rgba(148,163,184,0.28)",
    4,
    4,
    26,
    4,
  );
  drawDotGrid(
    ctx,
    cardX + cardW - 205,
    cardH - 155,
    "rgba(148,163,184,0.28)",
    4,
    4,
    26,
    4,
  );

  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  ctx.font = "600 30px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Powered by", width / 2, footerY + 138);

  if (poweredByLogo) {
    drawContainedImage(ctx, poweredByLogo, width / 2 - 310, footerY + 156, 620, 132);
  } else {
    ctx.fillStyle = DIGINIZAM_BLUE;
    ctx.font = "800 58px system-ui, sans-serif";
    ctx.fillText("DIGINIZAM", width / 2, footerY + 255);
  }

  ctx.fillStyle = DIGINIZAM_BLUE;
  ctx.font = "800 34px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("diginizam.com", width / 2, footerY + 350);

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