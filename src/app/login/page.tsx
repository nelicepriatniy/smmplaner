import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Вход",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[var(--background)]" />}>
      <LoginForm />
    </Suspense>
  );
}
