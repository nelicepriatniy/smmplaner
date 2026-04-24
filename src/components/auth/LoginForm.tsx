"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]";

export function LoginForm() {
  const router = useRouter();
  const loginId = useId();
  const passwordId = useId();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Не удалось войти");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Сеть недоступна, попробуйте ещё раз");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[22rem]">
        <h1 className="mb-8 text-center text-[20px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[22px]">
          Вход в панель
        </h1>
        <form
          onSubmit={onSubmit}
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
              htmlFor={loginId}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Логин
            </label>
            <input
              id={loginId}
              name="login"
              type="text"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={pending}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              className={`mt-2 ${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-8 w-full rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Вход…" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
