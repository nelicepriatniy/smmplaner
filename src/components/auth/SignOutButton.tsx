"use client";

import { signOut } from "next-auth/react";

const btnClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function SignOutButton() {
  return (
    <button
      type="button"
      className={btnClass}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Выйти
    </button>
  );
}
