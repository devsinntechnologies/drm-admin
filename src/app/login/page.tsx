"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChefHat, Lock, Mail, ShieldCheck } from "lucide-react";
import { Suspense, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { normalizeErrorMessage } from "@/lib/utils";

const gallery = [
  "/business/pic1.jpeg",
  "/business/pic2.jpeg",
  "/business/pic3.jpeg",
  "/business/pic4.jpeg",
  "/business/pic5.jpeg",
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const allowedRoles = ["super_admin", "business_admin", "waiter", "kitchen"];
  const roleFromQuery = searchParams.get("role");
  const selectedRole =
    roleFromQuery && allowedRoles.includes(roleFromQuery)
      ? roleFromQuery
      : "super_admin";
  const selectedTitle = searchParams.get("title") || "Super Admin";
  const selectedSubtitle = searchParams.get("subtitle") || "Super-Admin";


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    const isSuccess = await login({ email, password, role: selectedRole });
    if (isSuccess) {
      if (selectedRole === "kitchen" || selectedRole === "waiter") {
        router.push("/dashboard/businessAdmin/orders");
      } else if (selectedRole === "business_admin") {
        router.push("/dashboard/businessAdmin");
      } else {
        router.push("/dashboard/superAdmin");
      }
    }
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-305 items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[36px] bg-white shadow-[0_28px_70px_rgba(31,41,55,0.22)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-linear-to-br from-[#0b1220] via-[#0f2d5c] to-[#1E365B] p-8 text-white sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.2),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.2),transparent_36%)]" />
            <div className="relative z-1">
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
                  <h1 className="text-4xl font-semibold tracking-[-0.03em]">{selectedTitle} Login</h1>
                </div>
              </div>

              <p className="mt-8 max-w-120 text-lg leading-8 text-white/88">
                Access the control center for businesses, subscriptions, analytics, and operational logs.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {gallery.map((src, index) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-[22px] border border-white/12 shadow-[0_12px_24px_rgba(0,0,0,0.14)] ${index === 0 ? "col-span-2 row-span-2 h-55" : "h-26"}`}
                  >
                    <Image src={src} alt={`Business preview ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                    <div className="absolute inset-0 bg-linear-to-t from-[rgba(33,12,88,0.28)] to-transparent" />
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
                  {selectedSubtitle.toUpperCase()}
                </span>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-[#161c2d]">Welcome back</h2>
                <p className="mt-3 text-lg text-[#6d7488]">Sign in to continue managing your restaurant network.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#394150]">Email address</span>
                  <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#e5e8f0] bg-[#fafbff] px-4 focus-within:border-[#7b46f4] focus-within:bg-white">
                    <Mail className="h-5 w-5 text-[#98a2b3]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="superadmin@restaurantmanager.com"
                      autoComplete="email"
                      required
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
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="h-full w-full bg-transparent text-base text-[#161c2d] outline-none placeholder:text-[#98a2b3]"
                    />
                  </span>
                </label>

                {error ? (
                  <p className="rounded-xl border border-[#fed7d7] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#c53030]">
                    {normalizeErrorMessage(error, "Unable to sign in. Please try again.")}
                  </p>
                ) : null}

                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-[#667085]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#d0d5dd]" />
                    Keep me signed in
                  </label>
                  <button type="button" className="font-semibold text-[#6a4df5]">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-14 w-full items-center justify-center rounded-[18px] bg-[linear-gradient(120deg,#0f172a_0%,#155e75_100%)] text-lg font-semibold text-white! shadow-[0_14px_26px_rgba(15,23,42,0.3)] transition hover:scale-[1.01]"
                >
                  {isLoading ? "Signing in..." : "Login to Dashboard"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-8" />}>
      <LoginContent />
    </Suspense>
  );
}
