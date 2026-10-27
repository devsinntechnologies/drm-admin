import { cn } from "@/lib/utils";

/** Slip height: tight top/bottom margins, room between blocks for reading and writing. */
export const SLIP_HEIGHT_MM = 56;

/** Receipt printer paper width in mm for the slip: 58 or 80. */
export function slipWidthFor(paperWidth: number | null | undefined) {
  return paperWidth && paperWidth <= 58 ? 58 : 80;
}

/** One blank FREE PARKING slip, sized in mm so the screen preview matches print. */
export function ParkingSlip({ widthMm, businessName, logoUrl, showPoweredBy = true, preview = false }: { widthMm: number; businessName: string; logoUrl: string | null | undefined; showPoweredBy?: boolean; preview?: boolean }) {
  return <div className={cn("parking-slip box-border flex flex-col overflow-hidden bg-white px-[3mm] pb-[3mm] pt-[1.5mm] text-black", preview && "rounded border border-dashed border-slate-300 shadow-sm")} style={{ width: `${widthMm}mm`, height: `${SLIP_HEIGHT_MM}mm`, maxWidth: "100%" }}>
    <div className="text-center">
      {/* Decorative (name prints below), so a failed logo leaves no alt text. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- business logo from uploads, same as the parking receipt */}
      {logoUrl && <img src={logoUrl} alt="" className="mx-auto max-h-[9mm] max-w-[30mm] object-contain" onError={e => { e.currentTarget.style.display = "none"; }} />}
      {businessName && <p className="truncate text-[9pt] font-bold leading-tight">{businessName}</p>}
      <p className="mt-[2.5mm] border-y-2 border-black py-[0.5mm] text-[14pt] font-black leading-none tracking-wide">FREE PARKING</p>
    </div>
    <div className="mt-[3mm] flex flex-col gap-[7mm] text-[8pt] font-semibold">
      {["Name", "Bike/Car No."].map(label => <div key={label} className="flex items-end gap-[1.5mm]"><span className="w-[17mm] shrink-0">{label}:</span><span className="h-[4mm] flex-1 border-b border-black" /></div>)}
    </div>
    {showPoweredBy && <div className="mt-[3mm] text-center text-[6.5pt] leading-tight"><p>Powered by DigiNizam</p><p>diginizam.com</p></div>}
  </div>;
}
