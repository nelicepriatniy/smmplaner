"use client";

import Link from "next/link";
import { useState } from "react";

type PostClientReviewLinkProps = {
  /** Полный URL для копирования (с origin). */
  copyUrl: string;
  /** Относительный путь для открытия в этой же вкладке/сайте. */
  openPath: string;
  className?: string;
};

export function PostClientReviewLink({
  copyUrl,
  openPath,
  className = "",
}: PostClientReviewLinkProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-elevated)_70%,transparent)] px-3.5 py-3 ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        Ссылка для клиента
      </p>
      <p className="mt-2 break-all font-mono text-[11px] leading-snug text-[var(--muted)]">
        {copyUrl}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copyUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-elevated)]"
        >
          {copied ? "Скопировано" : "Копировать"}
        </button>
        <Link
          href={openPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-elevated)]"
        >
          Открыть
        </Link>
      </div>
    </div>
  );
}
