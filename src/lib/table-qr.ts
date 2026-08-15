const LETTER_WIDTH_PX = 2550; // 8.5in @ 300 DPI
const LETTER_HEIGHT_PX = 3300; // 11in @ 300 DPI

const DEFAULT_PRIMARY = "#ff6800";
const DIGINIZAM_BLUE = "#0149EC";
const INK = "#101b31";
const MUTED = "#5f708a";
const DEFAULT_TAGLINE = "Delicious Food. Great Experience.";
const FONT_FAMILY = '"Poppins", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

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

function hexToRgb(hex: string) {
  const value = normalizeHex(hex).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixWithWhite(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
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

function setFont(
  ctx: CanvasRenderingContext2D,
  weight: number,
  size: number,
  family = FONT_FAMILY,
) {
  ctx.font = `${weight} ${size}px ${family}`;
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: number,
  color: string,
) {
  let size = startSize;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;

  while (size > minSize) {
    setFont(ctx, weight, size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }

  ctx.fillText(text, cx, y);
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rows: number,
  cols: number,
  gap: number,
  radius: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.beginPath();
      ctx.arc(x + col * gap, y + row * gap, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  primary: string,
) {
  // Reference design: full orange top with a rising wave toward the right.
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, mixWithWhite(primary, 0.04));
  gradient.addColorStop(0.52, primary);
  gradient.addColorStop(1, darken(primary, 0.025));

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 625);
  ctx.bezierCurveTo(
    width * 0.80,
    820,
    width * 0.63,
    920,
    width * 0.44,
    900,
  );
  ctx.bezierCurveTo(
    width * 0.22,
    878,
    width * 0.08,
    952,
    0,
    1065,
  );
  ctx.closePath();
  ctx.fill();

  // Translucent circular accents from the reference.
  ctx.fillStyle = "rgba(255,255,255,0.085)";
  ctx.beginPath();
  ctx.arc(120, 80, 285, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(width - 90, 60, 265, 0, Math.PI * 2);
  ctx.fill();

  // Small decorative ring and grids.
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(118, 790, 50, 0, Math.PI * 2);
  ctx.stroke();

  drawDotGrid(ctx, 280, 690, 4, 2, 38, 6, "rgba(255,255,255,0.92)");
  drawDotGrid(ctx, width - 430, 220, 4, 3, 38, 6, "rgba(255,255,255,0.70)");
  ctx.restore();
}

function drawHeaderDivider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.90)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(cx - 410, y);
  ctx.lineTo(cx - 76, y);
  ctx.moveTo(cx + 76, y);
  ctx.lineTo(cx + 410, y);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBusinessMark(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  businessName: string,
  cx: number,
  cy: number,
  radius: number,
  primary: string,
) {
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.80)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 12, 0, Math.PI * 2);
    ctx.clip();
    drawContainedImage(
      ctx,
      logo,
      cx - radius + 25,
      cy - radius + 25,
      (radius - 25) * 2,
      (radius - 25) * 2,
    );
    ctx.restore();
    return;
  }

  ctx.fillStyle = primary;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 800, 115);
  ctx.fillText((businessName.trim()[0] || "R").toUpperCase(), cx, cy + 4);
  ctx.textBaseline = "alphabetic";
}

function drawTableLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  primary: string,
) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = primary;
  setFont(ctx, 700, 55);
  ctx.fillText("T A B L E", cx, y);

  ctx.strokeStyle = primary;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 395, y - 18);
  ctx.lineTo(cx - 250, y - 18);
  ctx.moveTo(cx + 250, y - 18);
  ctx.lineTo(cx + 395, y - 18);
  ctx.stroke();
  ctx.restore();
}

function drawFoodIcons(
  ctx: CanvasRenderingContext2D,
  width: number,
  primary: string,
) {
  const stroke = rgba(primary, 0.20);
  const line = 7;

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = line;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const burger = (x: number, y: number, s = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(0, -10, 66, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-70, 7);
    ctx.lineTo(70, 7);
    ctx.moveTo(-64, 28);
    ctx.quadraticCurveTo(0, 52, 64, 28);
    ctx.moveTo(-58, 44);
    ctx.lineTo(58, 44);
    ctx.stroke();
    ctx.restore();
  };

  const steamBowl = (x: number, y: number, s = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-62, 10);
    ctx.quadraticCurveTo(0, 82, 62, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22, -18);
    ctx.quadraticCurveTo(-8, -45, -24, -65);
    ctx.moveTo(12, -20);
    ctx.quadraticCurveTo(28, -48, 10, -68);
    ctx.stroke();
    ctx.restore();
  };

  const riceBowl = (x: number, y: number, s = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-60, 10);
    ctx.quadraticCurveTo(0, 80, 60, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-28, -2, 22, Math.PI, 0);
    ctx.arc(0, -9, 28, Math.PI, 0);
    ctx.arc(31, -1, 22, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(38, -15);
    ctx.lineTo(72, -78);
    ctx.stroke();
    ctx.restore();
  };

  const drink = (x: number, y: number, s = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-38, -44);
    ctx.lineTo(-26, 58);
    ctx.lineTo(28, 58);
    ctx.lineTo(40, -44);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-44, -44);
    ctx.lineTo(44, -44);
    ctx.moveTo(4, -45);
    ctx.lineTo(22, -95);
    ctx.lineTo(56, -95);
    ctx.stroke();
    ctx.restore();
  };

  const pizza = (x: number, y: number, s = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -72);
    ctx.lineTo(58, 62);
    ctx.quadraticCurveTo(0, 78, -58, 62);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-12, 8, 9, 0, Math.PI * 2);
    ctx.arc(20, 30, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const cloche = (x: number, y: number, s = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(0, 22, 68, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-82, 24);
    ctx.lineTo(82, 24);
    ctx.moveTo(-14, -48);
    ctx.quadraticCurveTo(0, -64, 14, -48);
    ctx.stroke();
    ctx.restore();
  };

  burger(245, 1270, 0.95);
  steamBowl(width - 235, 1270, 0.90);
  riceBowl(250, 1835, 0.90);
  drink(width - 245, 1835, 0.86);
  pizza(215, 2290, 0.86);
  cloche(width - 245, 2315, 0.88);

  drawDotGrid(ctx, 140, 1515, 4, 3, 34, 5.5, rgba(primary, 0.15));
  drawDotGrid(ctx, width - 160, 2150, 4, 3, 34, 5.5, rgba(primary, 0.15));

  ctx.restore();
}

function drawScanGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  roundRect(ctx, cx - 28, cy - 45, 56, 90, 11);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 15, cy - 34);
  ctx.lineTo(cx + 15, cy - 34);
  ctx.stroke();

  const corners: Array<[number, number, number, number, number, number]> = [
    [cx - 57, cy - 30, cx - 57, cy - 53, cx - 34, cy - 53],
    [cx + 34, cy - 53, cx + 57, cy - 53, cx + 57, cy - 30],
    [cx - 57, cy + 30, cx - 57, cy + 53, cx - 34, cy + 53],
    [cx + 34, cy + 53, cx + 57, cy + 53, cx + 57, cy + 30],
  ];

  corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  });

  // Tiny QR indication inside phone.
  ctx.lineWidth = 4;
  ctx.strokeRect(cx - 12, cy - 7, 9, 9);
  ctx.strokeRect(cx + 4, cy - 7, 9, 9);
  ctx.strokeRect(cx - 12, cy + 9, 9, 9);
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy + 9);
  ctx.lineTo(cx + 12, cy + 9);
  ctx.lineTo(cx + 12, cy + 18);
  ctx.stroke();
  ctx.restore();
}

function drawScanCallout(
  ctx: CanvasRenderingContext2D,
  width: number,
  primary: string,
  y: number,
) {
  // Compact capsule from the reference, sized to content rather than page width.
  const boxW = 1360;
  const boxH = 178;
  const boxX = (width - boxW) / 2 + 45;
  const radius = 60;
  const iconRadius = 83;
  const iconCx = boxX + 30;
  const iconCy = y + boxH / 2;

  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.06)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  roundRect(ctx, boxX, y, boxW, boxH, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.lineWidth = 4;
  roundRect(ctx, boxX, y, boxW, boxH, radius);
  ctx.stroke();

  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(iconCx, iconCy, iconRadius, 0, Math.PI * 2);
  ctx.fill();
  drawScanGlyph(ctx, iconCx, iconCy);

  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  setFont(ctx, 800, 60);
  ctx.fillText("Scan to order from this table", boxX + 205, y + 76);

  const subtitleY = y + 132;
  setFont(ctx, 500, 39);
  ctx.fillStyle = MUTED;
  ctx.fillText("View menu", boxX + 205, subtitleY);

  const firstW = ctx.measureText("View menu").width;
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(boxX + 205 + firstW + 30, subtitleY - 13, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = MUTED;
  const secondX = boxX + 205 + firstW + 58;
  ctx.fillText("Choose items", secondX, subtitleY);

  const secondW = ctx.measureText("Choose items").width;
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(secondX + secondW + 30, subtitleY - 13, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.fillText("Place order", secondX + secondW + 58, subtitleY);
  ctx.restore();
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  primary: string,
  poweredByLogo: HTMLImageElement | null,
) {
  const startY = 2800;

  // Gray/white footer region with the exact reference-style arched top edge.
  ctx.save();
  ctx.fillStyle = "#f7f8fa";
  ctx.beginPath();
  ctx.moveTo(0, startY + 120);
  ctx.bezierCurveTo(
    width * 0.22,
    startY - 30,
    width * 0.52,
    startY - 25,
    width * 0.72,
    startY + 18,
  );
  ctx.bezierCurveTo(
    width * 0.86,
    startY + 45,
    width * 0.95,
    startY + 78,
    width,
    startY + 110,
  );
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = primary;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(0, startY + 120);
  ctx.bezierCurveTo(
    width * 0.22,
    startY - 30,
    width * 0.52,
    startY - 25,
    width * 0.72,
    startY + 18,
  );
  ctx.bezierCurveTo(
    width * 0.86,
    startY + 45,
    width * 0.95,
    startY + 78,
    width,
    startY + 110,
  );
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  setFont(ctx, 600, 34);
  ctx.fillText("Powered by", width / 2, 2990);

  if (poweredByLogo) {
    drawContainedImage(ctx, poweredByLogo, width / 2 - 350, 3010, 700, 150);
  } else {
    ctx.fillStyle = DIGINIZAM_BLUE;
    setFont(ctx, 800, 78);
    ctx.fillText("DIGINIZAM", width / 2, 3110);
    ctx.fillStyle = MUTED;
    setFont(ctx, 500, 24);
    ctx.fillText("Simplify. Manage. Grow.", width / 2, 3146);
  }

  ctx.fillStyle = DIGINIZAM_BLUE;
  setFont(ctx, 700, 35);
  ctx.fillText("diginizam.com", width / 2, 3225);
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

  // Let Poppins/Inter finish loading if the host application already includes them.
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Font fallback is handled by FONT_FAMILY.
    }
  }

  const primary = normalizeHex(options.primaryColor, DEFAULT_PRIMARY);
  const width = LETTER_WIDTH_PX;
  const height = LETTER_HEIGHT_PX;
  const cx = width / 2;

  const businessName = options.businessName?.trim() || "Restaurant";
  const tagline = options.tagline?.trim() || DEFAULT_TAGLINE;
  const tableNumber = options.tableNumber?.trim() || "7";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create QR canvas");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const [businessLogo, poweredByLogo] = await Promise.all([
    options.businessLogoUrl ? loadImage(options.businessLogoUrl) : Promise.resolve(null),
    loadImage(options.poweredByLogoUrl || "/diginizam-logo.svg"),
  ]);

  // ---------- HEADER ----------
  drawHeader(ctx, width, primary);

  drawBusinessMark(ctx, businessLogo, businessName, cx, 305, 195, primary);

  drawFittedText(
    ctx,
    businessName,
    cx,
    665,
    width - 380,
    142,
    86,
    800,
    "#ffffff",
  );

  drawHeaderDivider(ctx, cx, 742);

  drawFittedText(
    ctx,
    tagline,
    cx,
    845,
    width - 500,
    60,
    42,
    500,
    "rgba(255,255,255,0.96)",
  );

  // ---------- BODY ----------
  drawFoodIcons(ctx, width, primary);

  drawTableLabel(ctx, cx, 1045, primary);

  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  const compactTable = tableNumber.length <= 3;
  drawFittedText(
    ctx,
    tableNumber,
    cx,
    compactTable ? 1300 : 1270,
    850,
    compactTable ? 235 : 150,
    105,
    800,
    INK,
  );

  // QR dimensions intentionally remain square on Letter paper.
  const qrOuterSize = 1200;
  const qrPadding = 56;
  const qrSize = qrOuterSize - qrPadding * 2;
  const qrX = cx - qrOuterSize / 2;
  const qrY = 1350;

  const qrDataUrl = await QRCode.toDataURL(options.url, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "H",
    color: {
      dark: "#111111",
      light: "#ffffff",
    },
  });
  const qrImage = await loadImage(qrDataUrl);

  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.08)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qrX, qrY, qrOuterSize, qrOuterSize, 45);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.lineWidth = 5;
  roundRect(ctx, qrX, qrY, qrOuterSize, qrOuterSize, 45);
  ctx.stroke();
  ctx.restore();

  if (qrImage) {
    ctx.drawImage(
      qrImage,
      qrX + qrPadding,
      qrY + qrPadding,
      qrSize,
      qrSize,
    );
  }

  // ---------- CTA ----------
  drawScanCallout(ctx, width, primary, 2600);

  // ---------- FOOTER ----------
  drawFooter(ctx, width, height, primary, poweredByLogo);

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

  // US Letter portrait: 8.5 × 11 in = 215.9 × 279.4 mm.
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  doc.addImage(dataUrl, "PNG", 0, 0, 215.9, 279.4);
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}