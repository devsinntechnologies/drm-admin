const A4_WIDTH_PX = 2480;
const A4_HEIGHT_PX = 3508;
const DEFAULT_PRIMARY = "#001840";
const DIGINIZAM_BLUE = "#0149EC";
const INK = "#1a202c";
const MUTED = "#6b7280";
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
  ctx.drawImage(image, x + (maxWidth - width) / 2, y + (maxHeight - height) / 2, width, height);
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      ctx.beginPath();
      ctx.arc(x + col * 20, y + row * 20, 3.5, 0, Math.PI * 2);
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
  ctx.lineTo(x + width, y + height);
  ctx.bezierCurveTo(
    x + width * 0.74,
    y + height + 70,
    x + width * 0.34,
    y + height - 36,
    x,
    y + height + 18,
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
  ctx.fillStyle = "#f4f6f8";
  ctx.beginPath();
  ctx.moveTo(x, y + 40);
  ctx.bezierCurveTo(x + width * 0.28, y - 36, x + width * 0.7, y + 70, x + width, y + 8);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + 40, y + 40);
  ctx.bezierCurveTo(x + width * 0.28, y - 36, x + width * 0.7, y + 70, x + width - 40, y + 8);
  ctx.stroke();
}

function drawTableLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  accent: string,
) {
  ctx.fillStyle = accent;
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TABLE", cx, y);
  const labelWidth = ctx.measureText("TABLE").width;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - labelWidth / 2 - 90, y - 12);
  ctx.lineTo(cx - labelWidth / 2 - 24, y - 12);
  ctx.moveTo(cx + labelWidth / 2 + 24, y - 12);
  ctx.lineTo(cx + labelWidth / 2 + 90, y - 12);
  ctx.stroke();
  ctx.lineCap = "butt";
}

function drawFoodIcons(ctx: CanvasRenderingContext2D, cardX: number, cardW: number, top: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const burger = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 28, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 10);
    ctx.lineTo(x + 30, y + 10);
    ctx.moveTo(x - 28, y + 22);
    ctx.quadraticCurveTo(x, y + 34, x + 28, y + 22);
    ctx.stroke();
  };
  const bowl = (x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x - 28, y);
    ctx.quadraticCurveTo(x, y + 40, x + 28, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 18);
    ctx.quadraticCurveTo(x - 4, y - 30, x - 8, y - 40);
    ctx.moveTo(x + 8, y - 16);
    ctx.quadraticCurveTo(x + 12, y - 28, x + 8, y - 38);
    ctx.stroke();
  };
  const pizza = (x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x + 28, y + 28);
    ctx.lineTo(x - 28, y + 28);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + 4, 5, 0, Math.PI * 2);
    ctx.stroke();
  };
  const cup = (x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 20);
    ctx.lineTo(x - 12, y + 28);
    ctx.lineTo(x + 12, y + 28);
    ctx.lineTo(x + 18, y - 20);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 22, y, 12, -0.6, 0.6);
    ctx.stroke();
  };
  const cloche = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y + 8, 30, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 36, y + 10);
    ctx.lineTo(x + 36, y + 10);
    ctx.moveTo(x - 6, y - 28);
    ctx.lineTo(x + 6, y - 28);
    ctx.stroke();
  };

  burger(cardX + 160, top + 80);
  bowl(cardX + cardW - 180, top + 70);
  pizza(cardX + 130, top + 520);
  cup(cardX + cardW - 150, top + 480);
  cloche(cardX + 170, top + 980);
  bowl(cardX + cardW - 190, top + 1020);
  ctx.restore();
}

function drawScanGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  roundRect(ctx, cx - 14, cy - 22, 28, 44, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 16);
  ctx.lineTo(cx + 6, cy - 16);
  ctx.stroke();
  const corners: Array<[number, number, number, number, number, number]> = [
    [cx - 28, cy - 16, cx - 28, cy - 26, cx - 16, cy - 26],
    [cx + 16, cy - 26, cx + 28, cy - 26, cx + 28, cy - 16],
    [cx - 28, cy + 16, cx - 28, cy + 26, cx - 16, cy + 26],
    [cx + 16, cy + 26, cx + 28, cy + 26, cx + 28, cy + 16],
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
  ctx.shadowColor = "rgba(15, 23, 42, 0.14)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
    ctx.clip();
    drawContainedImage(ctx, logo, cx - radius + 16, cy - radius + 16, (radius - 16) * 2, (radius - 16) * 2);
    ctx.restore();
    return;
  }

  ctx.fillStyle = primary;
  ctx.font = "800 84px system-ui, sans-serif";
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

  const margin = 48;
  const cardX = margin;
  const cardY = margin;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;
  const headerH = 520;
  const pillH = 132;
  const qrSize = 1280;
  const businessName = options.businessName || "Restaurant";
  const tagline = options.tagline?.trim() || DEFAULT_TAGLINE;
  const tableNumber = options.tableNumber || "Table";
  const compactTable = tableNumber.length <= 3;
  const tableLabelY = cardY + headerH + 58;
  const tableNumberY = tableLabelY + (compactTable ? 150 : 120);
  const qrY = tableNumberY + 46;
  const pillY = qrY + qrSize + 36;
  const footerY = pillY + pillH + 20;
  const footerH = cardY + cardH - footerY;

  ctx.fillStyle = "#eef1f4";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.clip();

  drawHeaderWave(ctx, cardX, cardY, cardW, headerH, primary);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.arc(cardX + 180, cardY + 80, 210, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardX + cardW - 90, cardY + headerH - 10, 170, 0, Math.PI * 2);
  ctx.fill();
  drawDotGrid(ctx, cardX + 70, cardY + 64, "rgba(255,255,255,0.28)");
  drawDotGrid(ctx, cardX + cardW - 146, cardY + 64, "rgba(255,255,255,0.28)");

  const [businessLogo, poweredByLogo, qrDataUrl] = await Promise.all([
    options.businessLogoUrl ? loadImage(options.businessLogoUrl) : Promise.resolve(null),
    loadImage(options.poweredByLogoUrl || "/diginizam-logo.svg"),
    QRCode.toDataURL(options.url, {
      width: 1280,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#111111", light: "#ffffff" },
    }),
  ]);

  drawBusinessMark(ctx, businessLogo, businessName, width / 2, cardY + 188, 102, primary);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "800 64px system-ui, sans-serif";
  ctx.fillText(businessName, width / 2, cardY + 348, cardW - 200);
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(tagline, width / 2, cardY + 398, cardW - 260);

  drawFoodIcons(ctx, cardX, cardW, cardY + headerH);
  drawTableLabel(ctx, width / 2, tableLabelY, primary);

  ctx.fillStyle = INK;
  ctx.font = compactTable ? "800 150px system-ui, sans-serif" : "800 88px system-ui, sans-serif";
  ctx.fillText(tableNumber, width / 2, tableNumberY, cardW - 280);

  const qrX = (width - qrSize) / 2;
  const qrImage = await loadImage(qrDataUrl);
  if (qrImage) {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, 28);
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  }

  const pillW = 1320;
  const pillX = (width - pillW) / 2;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, pillX, pillY, pillW, pillH, 74);
  ctx.fill();
  ctx.strokeStyle = primary;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pillX + 86, pillY + pillH / 2, 48, 0, Math.PI * 2);
  ctx.fillStyle = primary;
  ctx.fill();
  drawScanGlyph(ctx, pillX + 86, pillY + pillH / 2);

  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = "800 38px system-ui, sans-serif";
  ctx.fillText("Scan to order from this table", pillX + 168, pillY + 62);
  ctx.fillStyle = MUTED;
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("View menu  •  Choose items  •  Place order", pillX + 168, pillY + 106);
  ctx.textAlign = "center";

  drawFooterBand(ctx, cardX, footerY, cardW, footerH, primary);
  drawDotGrid(ctx, cardX + 70, cardY + cardH - 140, "rgba(148,163,184,0.38)");
  drawDotGrid(ctx, cardX + cardW - 146, cardY + cardH - 140, "rgba(148,163,184,0.38)");

  ctx.fillStyle = MUTED;
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText("Powered by", width / 2, footerY + 78);

  if (poweredByLogo) {
    drawContainedImage(ctx, poweredByLogo, width / 2 - 240, footerY + 92, 480, 88);
  } else {
    ctx.fillStyle = DIGINIZAM_BLUE;
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.fillText("DIGINIZAM", width / 2, footerY + 160);
  }

  ctx.fillStyle = MUTED;
  ctx.font = "500 22px system-ui, sans-serif";
  ctx.fillText("Simplify. Manage. Grow —", width / 2, footerY + 206);

  ctx.fillStyle = DIGINIZAM_BLUE;
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText("diginizam.com", width / 2, footerY + 250);

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
