"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId } from "react";
import { registerAction } from "@/app/register/actions";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]";

export function RegisterForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const passwordConfirmId = useId();
  const [state, formAction, isPending] = useActionState(registerAction, null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.replace("/login?registered=1");
    }
  }, [state, router]);

  const error = state && "error" in state ? state.error : "";

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[22rem]">
        <h1 className="mb-8 text-center text-[20px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[22px]">
          Регистрация
        </h1>
        <form
          action={formAction}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7"
        >
          {error ? (
            <p
              className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[13px] text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div>
            <label
              htmlFor={emailId}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              className={`mt-2 ${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
            />
          </div>
          <div className="mt-5">
            <label
              htmlFor={passwordId}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Пароль
            </label>
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isPending}
              className={`mt-2 ${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
            />
            <p className="mt-1.5 text-[12px] text-[var(--muted)]">
              Не короче 8 символов
            </p>
          </div>
          <div className="mt-5">
            <label
              htmlFor={passwordConfirmId}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Повторите пароль
            </label>
            <input
              id={passwordConfirmId}
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isPending}
              className={`mt-2 ${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="mt-8 w-full rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Создание…" : "Создать аккаунт"}
          </button>
          <p className="mt-6 text-center text-[13px] text-[var(--muted)]">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
