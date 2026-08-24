"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: number;
  onChange: (value: number) => void;
};

/** Number field that allows clearing/backspacing — empty displays as blank, commits 0 on blur. */
export function NumberInput({ value, onChange, className, onBlur, ...props }: NumberInputProps) {
  const [text, setText] = useState(() => formatNumberField(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(formatNumberField(value));
    }
  }, [value]);

  return (
    <input
      {...props}
      type="number"
      className={cn(className)}
      value={text}
      onFocus={(e) => {
        focusedRef.current = true;
        props.onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === "" || raw === "-") return;
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) onChange(parsed);
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        if (text === "" || text === "-") {
          onChange(0);
          setText("");
        } else {
          const parsed = Number(text);
          if (!Number.isNaN(parsed)) {
            onChange(parsed);
            setText(formatNumberField(parsed));
          }
        }
        onBlur?.(e);
      }}
    />
  );
}

export function formatNumberField(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || value === 0) return "";
  return String(value);
}

export function parseNumberField(raw: string, fallback = 0): number {
  if (raw.trim() === "" || raw === "-") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
