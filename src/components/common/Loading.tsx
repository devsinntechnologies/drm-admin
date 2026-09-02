"use client";

import { cn } from "@/lib/utils";

const SIZE_CONFIG = {
  sm: { logoW: 34, logoH: 28, pad: 12, dot: 6, gap: 4, stackGap: 4 },
  md: { logoW: 44, logoH: 36, pad: 16, dot: 8, gap: 5, stackGap: 5 },
  lg: { logoW: 56, logoH: 46, pad: 20, dot: 8, gap: 5, stackGap: 5 },
} as const;

type LoadingProps = {
  className?: string;
  fullScreen?: boolean;
  label?: string;
  size?: keyof typeof SIZE_CONFIG;
};

export default function Loading({
  className,
  fullScreen = false,
  label,
  size = "md",
}: LoadingProps) {
  const config = SIZE_CONFIG[size];
  const showDots = !label;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        fullScreen && "min-h-screen w-full bg-white",
        !fullScreen && size === "sm" && "py-6",
        !fullScreen && size !== "sm" && "py-10",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: config.stackGap * 4 }}
      >
        <div
          className="flex items-center justify-center rounded-2xl border border-[#e8eef7] bg-white shadow-[0_8px_24px_rgba(0,24,64,0.08)]"
          style={{ padding: config.pad }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.svg"
            alt=""
            width={config.logoW}
            height={config.logoH}
            className="h-auto w-auto object-contain"
          />
        </div>

        {label ? (
          <p className="max-w-xs text-center text-sm font-medium text-[#64748b]">
            {label}
          </p>
        ) : showDots ? (
          <div className="flex items-end gap-2" aria-hidden>
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="dn-loader-dot rounded-full bg-[#0050F8]"
                style={{
                  width: config.dot,
                  height: config.dot,
                  animationDelay: `${index * 120}ms`,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
