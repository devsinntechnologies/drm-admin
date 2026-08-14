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
}): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  const width = 720;
  const height = 1020;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create QR canvas");

  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 36, 36, width - 72, height - 72, 36);
  ctx.fill();

  ctx.fillStyle = "#001840";
  roundRect(ctx, 36, 36, width - 72, 210, 36);
  ctx.fill();
  ctx.fillRect(36, 150, width - 72, 96);

  const [businessLogo, poweredByLogo, qrDataUrl] = await Promise.all([
    options.businessLogoUrl ? loadImage(options.businessLogoUrl) : Promise.resolve(null),
    options.poweredByLogoUrl ? loadImage(options.poweredByLogoUrl) : Promise.resolve(null),
    QRCode.toDataURL(options.url, {
      width: 420,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#001840", light: "#ffffff" },
    }),
  ]);

  if (businessLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, 118, 44, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(width / 2 - 44, 74, 88, 88);
    drawContainedImage(ctx, businessLogo, width / 2 - 40, 78, 80, 80);
    ctx.restore();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(options.businessName || "Restaurant", width / 2, businessLogo ? 186 : 128, 560);

  ctx.fillStyle = "#64748b";
  ctx.font = "700 16px system-ui, sans-serif";
  ctx.fillText("TABLE", width / 2, 280);

  ctx.fillStyle = "#001840";
  ctx.font = "900 56px system-ui, sans-serif";
  ctx.fillText(options.tableNumber || "Table", width / 2, 344, 580);

  const qrImage = await loadImage(qrDataUrl);
  if (qrImage) {
    ctx.fillStyle = "#eef3ff";
    roundRect(ctx, 130, 380, 460, 460, 28);
    ctx.fill();
    ctx.drawImage(qrImage, 150, 400, 420, 420);
  }

  ctx.fillStyle = "#0050F8";
  ctx.font = "700 20px system-ui, sans-serif";
  ctx.fillText("Scan to order from this table", width / 2, 880);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 910);
  ctx.lineTo(width - 120, 910);
  ctx.stroke();

  if (poweredByLogo) {
    drawContainedImage(ctx, poweredByLogo, width / 2 - 28, 918, 56, 36);
  }
  ctx.fillStyle = "#64748b";
  ctx.font = "600 16px system-ui, sans-serif";
  ctx.fillText("Powered by DigiNizam", width / 2, 972);

  return canvas.toDataURL("image/png");
}
