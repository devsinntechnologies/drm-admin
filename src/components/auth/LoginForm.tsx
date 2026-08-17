"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { homePathAfterLogin } from "@/lib/auth-redirect";
import { normalizeErrorMessage } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const returnTo = searchParams.get("returnTo");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    const toastId = toast.loading("Signing in…");

    try {
      const isSuccess = await login({ email: email.trim().toLowerCase(), password });

      if (isSuccess) {
        toast.success("Welcome back", { id: toastId });
        const businessId = localStorage.getItem("businessId");
        const actualRole = localStorage.getItem("roleName");
        router.push(homePathAfterLogin(actualRole, businessId, returnTo));
      } else {
        toast.error("Invalid email or password", { id: toastId });
      }
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Unable to sign in"), { id: toastId });
    }
  };

  return (
    <section className="portal-surface w-full max-w-md rounded-4xl px-6 py-10 sm:px-10">
      <div className="mx-auto grid w-full max-w-[240px] place-items-center">
        <Image
          src="/diginizam-logo.svg"
          alt="DigiNizam"
          width={240}
          height={56}
          className="h-auto w-full object-contain"
          priority
        />
      </div>

      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">Sign in</h1>
        <p className="mt-2 text-sm text-[#5b657a]">Use your work email. Your workspace opens from your account.</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#394150]">Email</span>
          <span className="flex h-12 items-center gap-3 rounded-2xl border border-[#e5e8f0] bg-[#fafbff] px-4 focus-within:border-[#001840] focus-within:bg-white">
            <Mail className="h-4 w-4 text-[#98a2b3]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@business.com"
              autoComplete="email"
              required
              className="h-full w-full bg-transparent text-sm text-[#161c2d] outline-none placeholder:text-[#98a2b3]"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#394150]">Password</span>
          <span className="flex h-12 items-center gap-3 rounded-2xl border border-[#e5e8f0] bg-[#fafbff] px-4 focus-within:border-[#001840] focus-within:bg-white">
            <Lock className="h-4 w-4 text-[#98a2b3]" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="h-full w-full bg-transparent text-sm text-[#161c2d] outline-none placeholder:text-[#98a2b3]"
            />
          </span>
        </label>

        {error ? (
          <p className="rounded-xl border border-[#fed7d7] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#c53030]">
            {normalizeErrorMessage(error, "Unable to sign in. Please try again.")}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="dn-btn dn-btn-primary mt-2 inline-flex h-12 w-full rounded-2xl text-base font-semibold"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
