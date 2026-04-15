"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChefHat, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

const gallery = [
  "/business/pic1.jpeg",
  "/business/pic2.jpeg",
  "/business/pic3.jpeg",
  "/business/pic4.jpeg",
  "/business/pic5.jpeg",
];

export default function BusinessLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login delay
    setTimeout(() => {
      router.push("/business-admin");
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0f4ff_0%,_#f8faff_50%,_#fdfdff_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-305 items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[40px] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.14)] lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left Side: Brand Visuals */}
          <div className="relative overflow-hidden bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#0f766e] p-8 text-white sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_40%)]" />
            <div className="relative z-1">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:bg-white/20">
                <ArrowLeft className="h-4 w-4" />
                Back to roles
              </Link>

              <div className="mt-12 flex items-center gap-5">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-sm">
                  <ChefHat className="h-9 w-9 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-emerald-400">Secure Merchant Portal</p>
                  <h1 className="text-4xl font-bold tracking-tight text-white">Business Admin</h1>
                </div>
              </div>

              <p className="mt-8 max-w-120 text-lg leading-relaxed text-slate-300">
                Manage your restaurant orders, inventory, staff, and customer invoices from one powerful dashboard.
              </p>

              <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {gallery.map((src, index) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl ${index === 0 ? "col-span-2 row-span-2 h-56" : "h-26"}`}
                  >
                    <Image src={src} alt="Kitchen preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="flex items-center p-6 sm:p-12 lg:p-16">
            <div className="w-full">
              <div className="mb-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-100 uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Business Verified
                </span>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                <p className="mt-3 text-slate-500 text-lg font-medium">Continue managing your business operations.</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <span className="text-sm font-bold text-slate-700 ml-1">Email address</span>
                  <div className="flex h-15 items-center gap-3 rounded-[20px] border-2 border-slate-100 bg-slate-50 px-5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@yourrestaurant.com"
                      className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-bold text-slate-700 ml-1">Password</span>
                  <div className="flex h-15 items-center gap-3 rounded-[20px] border-2 border-slate-100 bg-slate-50 px-5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300">
                    <Lock className="h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" className="h-4.5 w-4.5 rounded-lg border-2 border-slate-200 text-emerald-600 focus:ring-emerald-500/20 transition-all" />
                    <span className="text-sm font-bold text-slate-500">Remember device</span>
                  </label>
                  <button type="button" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative group w-full h-15 rounded-[22px] bg-slate-900 overflow-hidden shadow-[0_12px_24px_rgba(15,23,42,0.25)] transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-1 text-lg font-bold text-white uppercase tracking-wider">
                    {loading ? "Verifying..." : "Login to Portal"}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
