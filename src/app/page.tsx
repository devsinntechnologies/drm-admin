"use client";

import { Suspense } from "react";
import Loading from "@/components/common/Loading";
import { LoginForm } from "@/components/auth/LoginForm";

function HomeLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <HomeLogin />
    </Suspense>
  );
}
