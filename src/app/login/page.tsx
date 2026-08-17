"use client";

import { Suspense } from "react";
import Loading from "@/components/common/Loading";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginContent() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <LoginContent />
    </Suspense>
  );
}
