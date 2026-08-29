"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { LogoEditorDialog } from "@/components/business/LogoEditorDialog";
import { validateLogoSource } from "@/lib/logo-upload";

type LogoPickerFieldProps = {
  src: string | null;
  title?: string;
  hint?: string;
  busy?: boolean;
  onFile: (file: File) => void | Promise<void>;
  onRemove?: () => void;
};

export function LogoPickerField({
  src,
  title = "Business logo",
  hint = "Any size PNG, JPG, or WebP. Crop it in the editor before save.",
  busy = false,
  onFile,
  onRemove,
}: LogoPickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("logo.png");
  const [applying, setApplying] = useState(false);

  const openEditor = (imageSrc: string, name: string) => {
    setEditorSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return imageSrc;
    });
    setSourceName(name);
    setEditorOpen(true);
  };

  const onPick = (file: File | undefined) => {
    if (!file) return;
    const message = validateLogoSource(file);
    if (message) {
      toast.error(message);
      return;
    }
    openEditor(URL.createObjectURL(file), file.name);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-[10px] font-bold text-[#94a3b8]">Logo</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
          <p className="text-xs text-[#64748b]">{hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || applying}
            onClick={() => inputRef.current?.click()}
            className="dn-btn dn-btn-outline inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs"
          >
            {busy || applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {src ? "Replace" : "Upload"}
          </button>
          {src ? (
            <button
              type="button"
              disabled={busy || applying}
              onClick={() => openEditor(src, sourceName)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#475569]"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          ) : null}
          {src && onRemove ? (
            <button
              type="button"
              disabled={busy || applying}
              onClick={onRemove}
              className="inline-flex h-8 items-center rounded-lg border border-[#fecaca] px-3 text-xs font-semibold text-[#dc2626]"
            >
              <X className="mr-1 h-3.5 w-3.5" /> Remove
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              onPick(file);
            }}
          />
        </div>
      </div>

      <LogoEditorDialog
        open={editorOpen}
        imageSrc={editorSrc}
        sourceName={sourceName}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open && editorSrc?.startsWith("blob:")) {
            URL.revokeObjectURL(editorSrc);
            setEditorSrc(null);
          }
        }}
        onApply={async (file) => {
          setApplying(true);
          try {
            await onFile(file);
          } finally {
            setApplying(false);
          }
        }}
      />
    </>
  );
}
