"use client";

import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/media-url";
import {
  RECEIPT_COLUMNS,
  type ReceiptAlign,
  type ReceiptDocument,
  type ReceiptLine,
} from "@/lib/receipt-templates";
import { cn } from "@/lib/utils";

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace';

function QrBlock({ data }: { data: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    void import("qrcode")
      .then((mod) =>
        mod.default.toDataURL(data, {
          width: 240,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#ffffff" },
        }),
      )
      .then((url) => {
        if (!cancelled) setSrc(url);
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="flex justify-center py-1">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Receipt QR code" className="h-[7.5em] w-[7.5em]" />
      ) : (
        <div className="h-[7.5em] w-[7.5em] bg-white" />
      )}
    </div>
  );
}

const alignClass: Record<ReceiptAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/** Font B on 80mm paper fits 64 columns vs 48 for font A. */
const SMALL_SCALE = 0.75;

function Line({ line, columns }: { line: ReceiptLine; columns: number }) {
  switch (line.kind) {
    case "text": {
      const size = Math.min(3, Math.max(1, line.size)) * (line.small ? SMALL_SCALE : 1);
      const body = (
        <span
          className={cn(line.reverse && "inline-block bg-[#111827] px-[0.5ch] text-white")}
          style={{ fontSize: `${size}em` }}
        >
          {line.text}
        </span>
      );
      return (
        <div className={cn("whitespace-pre-wrap break-words", alignClass[line.align], line.bold && "font-bold")}>
          {body}
        </div>
      );
    }
    case "row":
      return (
        <div
          className={cn("grid grid-cols-12", line.bold && "font-bold")}
          style={{ fontSize: `${Math.min(3, Math.max(1, line.size))}em` }}
        >
          {line.cells.map((c, i) => (
            <div
              key={i}
              className={cn("whitespace-pre-wrap [overflow-wrap:anywhere]", alignClass[c.align])}
              style={{ gridColumn: `span ${c.width} / span ${c.width}` }}
            >
              {c.text}
            </div>
          ))}
        </div>
      );
    case "divider":
      return <div className="overflow-hidden whitespace-nowrap text-[#6b7280]">{line.char.repeat(columns)}</div>;
    case "feed":
      return <div style={{ height: `${1.25 * line.lines}em` }} />;
    case "logo":
      return (
        <div className="flex justify-center py-1">
          {/* Printed line.width dots wide on 576-dot (80mm) paper; null url = the POS's bundled logo. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={line.url ? (resolveMediaUrl(line.url, "receipt-logos") ?? "/receipt-logo.png") : "/receipt-logo.png"}
            alt="Receipt logo"
            style={{ width: `calc(${RECEIPT_COLUMNS}ch * ${line.width} / 576)`, maxWidth: "100%" }}
          />
        </div>
      );
    case "qr":
      return <QrBlock data={line.data} />;
  }
}

/**
 * Thermal receipt rendering of template lines: 48 monospace columns, so
 * wrapping and double-size text land where they do on 80mm paper.
 */
export function ReceiptPreview({
  lines: plainLines,
  document,
  fontSize = 11,
  className,
}: {
  /** Pass `lines` for a built-in template or `document` (with side padding). */
  lines?: ReceiptLine[];
  document?: ReceiptDocument;
  fontSize?: number;
  className?: string;
}) {
  const lines = document?.lines ?? plainLines ?? [];
  const paddingLeft = document?.paddingLeft ?? 0;
  const paddingRight = document?.paddingRight ?? 0;
  const columns = RECEIPT_COLUMNS - paddingLeft - paddingRight;
  return (
    <div
      className={cn(
        "rounded-sm border border-[#e5e7eb] bg-white px-[14px] py-[18px] text-[#111827] shadow-[0_6px_18px_rgba(15,23,42,0.10)]",
        className,
      )}
      style={{
        fontFamily: MONO,
        fontSize,
        lineHeight: 1.25,
        width: `calc(${RECEIPT_COLUMNS}ch + 28px)`,
      }}
    >
      <div style={{ paddingLeft: `${paddingLeft}ch`, paddingRight: `${paddingRight}ch` }}>
        {lines.map((line, i) => (
          <Line key={i} line={line} columns={columns} />
        ))}
      </div>
    </div>
  );
}
