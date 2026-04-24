import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata: Metadata = {
  title: "Личный кабинет — smmplaner",
  description: "Профиль и выход из аккаунта",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const email = user.email ?? "—";
  const displayName =
    user.name?.trim() ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Пользователь";
  const avatarUrl = user.image ?? null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="w-full py-10 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Личный кабинет
        </h1>
        <p className="mt-1 text-[14px] text-[var(--muted)]">
          Данные аккаунта и выход из системы
        </p>
      </header>

      <section
        className="max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
        aria-labelledby="account-heading"
      >
        <h2 id="account-heading" className="sr-only">
          Профиль
        </h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                width={80}
                height={80}
                className="size-20 rounded-full object-cover ring-1 ring-[var(--border)]"
              />
            ) : (
              <span
                className="flex size-20 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[22px] font-semibold text-[var(--accent)] ring-1 ring-[var(--accent-soft)]"
                aria-hidden
              >
                {initial}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Имя
              </p>
              <p className="mt-1 truncate text-[16px] font-medium text-[var(--foreground)]">
                {displayName}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Email
              </p>
              <p className="mt-1 truncate text-[15px] text-[var(--foreground)]">
                {email}
              </p>
            </div>
            <div className="pt-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
