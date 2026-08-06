"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LOADER_VARIANTS } from "@/components/common/LoadingVariants";

export default function LoaderPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <header className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/90 px-4 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#001840] transition hover:bg-[#eef3ff]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0050F8]">Temporary</p>
            <h1 className="text-xl font-semibold text-[#0f172a]">Loader Preview</h1>
            <p className="text-sm text-[#64748b]">Compare 6 options — tell me which ID you prefer.</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {LOADER_VARIANTS.map(({ id, name, description, Component }, index) => (
          <article
            key={id}
            className="overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <div className="flex h-[260px] items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6">
              <Component />
            </div>
            <div className="border-t border-[#eef2f7] px-5 py-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="font-semibold text-[#0f172a]">
                  {index + 1}. {name}
                </h2>
                <code className="rounded-lg bg-[#eef3ff] px-2 py-1 text-xs font-semibold text-[#0050F8]">
                  {id}
                </code>
              </div>
              <p className="text-sm leading-relaxed text-[#64748b]">{description}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-8">
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-5 py-4 text-sm text-[#64748b]">
          Open{" "}
          <code className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[#001840]">/loader-preview</code> anytime.
          Reply with the variant ID (e.g. <strong className="text-[#001840]">glass</strong> or{" "}
          <strong className="text-[#001840]">full-logo</strong>) and I&apos;ll apply it app-wide.
        </div>
      </section>
    </main>
  );
}
