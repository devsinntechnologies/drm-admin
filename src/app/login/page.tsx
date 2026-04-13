"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChefHat, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

const gallery = [
  "/business/pic1.jpeg",
  "/business/pic2.jpeg",
  "/business/pic3.jpeg",
  "/business/pic4.jpeg",
  "/business/pic5.jpeg",
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ebeefe_0%,_#f7f8ff_50%,_#f2f4ff_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1220px] items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[36px] bg-white shadow-[0_28px_70px_rgba(76,84,131,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#594ff4] via-[#7b34f2] to-[#b910f2] p-8 text-white sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_32%)]" />
            <div className="relative z-[1]">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white/95 transition hover:bg-white/18">
                <ArrowLeft className="h-4 w-4" />
                Back to roles
              </Link>

              <div className="mt-10 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
                  <ChefHat className="h-9 w-9" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/70">Secure Access</p>
                  <h1 className="text-4xl font-semibold tracking-[-0.03em]">Super Admin Login</h1>
                </div>
              </div>

              <p className="mt-8 max-w-[480px] text-lg leading-8 text-white/88">
                Access the control center for businesses, subscriptions, analytics, and operational logs.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {gallery.map((src, index) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-[22px] border border-white/12 shadow-[0_12px_24px_rgba(0,0,0,0.14)] ${index === 0 ? "col-span-2 row-span-2 h-[220px]" : "h-[104px]"}`}
                  >
                    <Image src={src} alt={`Business preview ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(33,12,88,0.28)] to-transparent" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center p-6 sm:p-10">
            <div className="w-full">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f1f2ff] px-4 py-2 text-sm font-semibold text-[#5e4ff2]">
                  <ShieldCheck className="h-4 w-4" />
                  SUPER-ADMIN
                </span>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-[#161c2d]">Welcome back</h2>
                <p className="mt-3 text-lg text-[#6d7488]">Sign in to continue managing your restaurant network.</p>
              </div>

              <form className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#394150]">Email address</span>
                  <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#e5e8f0] bg-[#fafbff] px-4 focus-within:border-[#7b46f4] focus-within:bg-white">
                    <Mail className="h-5 w-5 text-[#98a2b3]" />
                    <input
                      type="email"
                      placeholder="superadmin@restaurantmanager.com"
                      className="h-full w-full bg-transparent text-base text-[#161c2d] outline-none placeholder:text-[#98a2b3]"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#394150]">Password</span>
                  <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#e5e8f0] bg-[#fafbff] px-4 focus-within:border-[#7b46f4] focus-within:bg-white">
                    <Lock className="h-5 w-5 text-[#98a2b3]" />
                    <input
                      type="password"
                      placeholder="Enter your password"
                      className="h-full w-full bg-transparent text-base text-[#161c2d] outline-none placeholder:text-[#98a2b3]"
                    />
                  </span>
                </label>

                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-[#667085]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#d0d5dd]" />
                    Keep me signed in
                  </label>
                  <button type="button" className="font-semibold text-[#6a4df5]">
                    Forgot password?
                  </button>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setLoading(true)}
                  className="inline-flex h-14 w-full items-center justify-center rounded-[18px] bg-[#9146ff] text-lg font-semibold !text-white shadow-[0_12px_24px_rgba(145,70,255,0.25)] transition hover:scale-[1.01]"
                >
                  {loading ? "Signing in..." : "Login to Dashboard"}
                </Link>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
