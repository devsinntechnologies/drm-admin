import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type InvoicePdfItem = {
  productName: string;
  quantity: number;
  price: number | string;
  total?: number | string;
  variantName?: string;
};

export type InvoicePdfPayload = {
  fileName: string;
  orderNumber: string;
  businessName: string;
  logoUrl?: string | null;
  date?: string;
  status?: string;
  items: InvoicePdfItem[];
  subtotal: number;
  deliveryCharges?: number;
  packagingPrice?: number;
  total: number;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  website?: string;
};

function money(value: number) {
  return `Rs. ${value.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function lineTotal(item: InvoicePdfItem) {
  const unit = Number(item.price) || 0;
  const qty = Number(item.quantity) || 1;
  const explicit = Number(item.total);
  return Number.isFinite(explicit) && explicit > 0 ? explicit : unit * qty;
}

async function loadImageDataUrl(src?: string | null): Promise<string | null> {
  if (!src) return null;
  try {
    const response = await fetch(src, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadInvoicePdf(payload: InvoicePdfPayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 24, 64);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("DIGINIZAM RECEIPT", 14, 12);
  doc.setFontSize(16);
  doc.text(payload.businessName, 14, 22);

  const logo = await loadImageDataUrl(payload.logoUrl);
  if (logo) {
    try {
      doc.addImage(logo, "PNG", pageWidth - 32, 8, 16, 16);
    } catch {
      try {
        doc.addImage(logo, "JPEG", pageWidth - 32, 8, 16, 16);
      } catch {
        /* skip logo if format is unsupported */
      }
    }
  }

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  let y = 42;
  doc.text(`Order / Invoice: ${payload.orderNumber}`, 14, y);
  if (payload.date) {
    doc.text(payload.date, pageWidth - 14, y, { align: "right" });
  }
  y += 7;
  if (payload.status) {
    doc.text(`Status: ${payload.status}`, 14, y);
    y += 8;
  }

  autoTable(doc, {
    startY: y,
    head: [["Item", "Qty", "Total"]],
    body: payload.items.map((item) => [
      item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
      String(item.quantity),
      money(lineTotal(item)),
    ]),
    headStyles: { fillColor: [0, 24, 64] },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const afterTable = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10;
  doc.setFontSize(11);
  doc.text(`Subtotal: ${money(payload.subtotal)}`, pageWidth - 14, afterTable, { align: "right" });
  let totalsY = afterTable + 6;
  if ((payload.deliveryCharges ?? 0) > 0) {
    doc.text(`Delivery: ${money(payload.deliveryCharges ?? 0)}`, pageWidth - 14, totalsY, { align: "right" });
    totalsY += 6;
  }
  if ((payload.packagingPrice ?? 0) > 0) {
    doc.text(`Packaging: ${money(payload.packagingPrice ?? 0)}`, pageWidth - 14, totalsY, { align: "right" });
    totalsY += 6;
  }
  doc.setFontSize(14);
  doc.setTextColor(0, 80, 248);
  doc.text(`Net Amount: ${money(payload.total)}`, pageWidth - 14, totalsY + 2, { align: "right" });

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  let contactY = totalsY + 16;
  doc.text("Contact", 14, contactY);
  contactY += 6;
  if (payload.address) {
    doc.text(payload.address, 14, contactY);
    contactY += 5;
  }
  if (payload.contactPhone) {
    doc.text(payload.contactPhone, 14, contactY);
    contactY += 5;
  }
  if (payload.contactEmail) {
    doc.text(payload.contactEmail, 14, contactY);
    contactY += 5;
  }

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Powered by DigiNizam", pageWidth / 2, 285, { align: "center" });
  doc.text(payload.website || "diginizam.com", pageWidth / 2, 290, { align: "center" });

  doc.save(payload.fileName);
}
