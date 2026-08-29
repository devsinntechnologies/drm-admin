import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type SalesReportPdfPayload = {
  businessName: string;
  fromDate: string;
  toDate: string;
  sales: string;
  unpaid: string;
  invoices: string | number;
  paidInvoices?: string | number;
  topItems: Array<{ name: string; qty: string; revenue: string }>;
};

export function downloadSalesReportPdf(payload: SalesReportPdfPayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("SALES REPORT", 14, 12);
  doc.setFontSize(16);
  doc.text(payload.businessName || "DigiNizam", 14, 21);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.text(`Period: ${payload.fromDate}  to  ${payload.toDate}`, 14, 38);

  autoTable(doc, {
    startY: 44,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 116, 139] },
      1: { fontStyle: "bold", textColor: [15, 23, 42] },
    },
    body: [
      ["Sales", String(payload.sales)],
      ["Unpaid", String(payload.unpaid)],
      ["Invoices", String(payload.invoices)],
      ...(payload.paidInvoices != null ? [["Paid invoices", String(payload.paidInvoices)]] : []),
    ],
  });

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? ((doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10)
      : 80,
    head: [["#", "Item", "Qty", "Amount"]],
    body: payload.topItems.map((row, index) => [String(index + 1), row.name, row.qty, row.revenue]),
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "right", cellWidth: 36 },
    },
  });

  doc.save(`sales-report-${payload.fromDate}-to-${payload.toDate}.pdf`);
}
