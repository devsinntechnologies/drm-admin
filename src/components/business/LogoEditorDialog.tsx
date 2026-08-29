"use client";

import { useCallback, useState, type ReactNode } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cropImageToPngFile } from "@/lib/logo-crop";

type AspectId = "wide" | "square" | "original";

const ASPECTS: { id: AspectId; label: string; value?: number }[] = [
  { id: "wide", label: "Wide", value: 3 },
  { id: "square", label: "Square", value: 1 },
  { id: "original", label: "Original" },
];

type LogoEditorDialogProps = {
  open: boolean;
  imageSrc: string | null;
  sourceName?: string;
  onOpenChange: (open: boolean) => void;
  onApply: (file: File) => void | Promise<void>;
};

export function LogoEditorDialog({
  open,
  imageSrc,
  sourceName = "logo.png",
  onOpenChange,
  onApply,
}: LogoEditorDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectId, setAspectId] = useState<AspectId>("wide");
  const [naturalAspect, setNaturalAspect] = useState(3);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = aspectId === "original"
    ? naturalAspect
    : ASPECTS.find((item) => item.id === aspectId)?.value ?? 3;

  const resetView = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setArea(null);
    setError(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) resetView();
    onOpenChange(next);
  };

  const apply = async () => {
    if (!imageSrc || !area) return;
    setBusy(true);
    setError(null);
    try {
      const file = await cropImageToPngFile(imageSrc, area, rotation, sourceName);
      await onApply(file);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the cropped logo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <div className="px-5 pt-5">
          <DialogHeader className="mb-3">
            <DialogTitle>Edit logo</DialogTitle>
            <DialogDescription>
              Crop and zoom any size image. The result is saved small enough for login, splash, nav, and invoices.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="relative h-[320px] bg-[#0b1220]">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              minZoom={1}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onMediaLoaded={(size) => {
                if (size.naturalWidth && size.naturalHeight) {
                  setNaturalAspect(size.naturalWidth / size.naturalHeight);
                }
              }}
              onCropComplete={(_cropped, pixels) => setArea(pixels)}
              objectFit="contain"
              showGrid
            />
          ) : null}
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {ASPECTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAspectId(item.id)}
                className={
                  aspectId === item.id
                    ? "h-8 rounded-lg bg-[#0f172a] px-3 text-xs font-semibold text-white"
                    : "h-8 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#475569]"
                }
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRotation((value) => (value + 90) % 360)}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#475569]"
            >
              <RotateCw className="h-3.5 w-3.5" /> Rotate
            </button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#64748b]">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-[#0f172a]"
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">Preview</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <PreviewTile label="Nav bar">
                <div className="flex h-10 items-center rounded-lg bg-gradient-to-r from-[#001840] to-[#0050F8] px-2">
                  <div className="grid h-7 max-w-[88px] place-items-center rounded-md bg-white px-1.5">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc} alt="" className="max-h-5 max-w-[72px] object-contain" />
                    ) : null}
                  </div>
                </div>
              </PreviewTile>
              <PreviewTile label="Login">
                <div className="grid h-10 place-items-center rounded-lg bg-[#0f172a]">
                  <div className="grid h-8 max-w-[110px] place-items-center rounded-md bg-white px-2">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc} alt="" className="max-h-6 max-w-[96px] object-contain" />
                    ) : null}
                  </div>
                </div>
              </PreviewTile>
              <PreviewTile label="Invoice">
                <div className="flex h-10 items-center justify-end rounded-lg border border-[#e2e8f0] bg-white px-2">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageSrc} alt="" className="max-h-7 max-w-[88px] object-contain" />
                  ) : null}
                </div>
              </PreviewTile>
            </div>
            <p className="mt-1.5 text-[11px] text-[#94a3b8]">
              Previews use the original photo. The cropped result is what gets saved.
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm font-medium text-[#dc2626]">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="h-9 rounded-lg border border-[#e2e8f0] px-4 text-sm font-semibold text-[#475569]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !area}
              onClick={() => void apply()}
              className="dn-btn dn-btn-primary inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Use this logo
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-[#64748b]">{label}</p>
      {children}
    </div>
  );
}
