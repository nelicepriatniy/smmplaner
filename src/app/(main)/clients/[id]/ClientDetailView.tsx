"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { mockClients, type ClientRecord, type PostDraftRecord } from "@/data/mockDb";

const btnPrimaryClass =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

type ClientDetailViewProps = {
  client: ClientRecord;
  clientPosts: PostDraftRecord[];
};

export function ClientDetailView({ client, clientPosts }: ClientDetailViewProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);

  const openEdit = () => {
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
  }, []);

  const ig = client.instagramUsername;
  const igUrl = `https://www.instagram.com/${encodeURIComponent(ig)}/`;

  return (
    <main className="box-border -mx-5 mb-0 flex w-[calc(100%+2.5rem)] min-w-0 min-h-0 flex-1 flex-col self-stretch sm:-mx-8 sm:w-[calc(100%+4rem)] lg:-mx-10 lg:w-[calc(100%+5rem)]">
      <ClientFormDialog
        isOpen={formOpen}
        onRequestClose={closeForm}
        mode="edit"
        client={client}
        session={formSession}
      />

      <section className="flex min-h-dvh w-full min-w-0 flex-1 flex-col rounded-none border-0 border-[var(--border)] bg-[var(--surface)] sm:rounded-2xl sm:border">
        <div className="flex w-full min-w-0 min-h-0 flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
            <p className="min-w-0 pt-0.5">
              <Link
                href="/clients"
                className="text-[14px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
              >
                ← Клиенты
              </Link>
            </p>
            <button type="button" onClick={openEdit} className={btnPrimaryClass}>
              Изменить
            </button>
          </div>

          <h1 className="text-balance text-[24px] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-[28px]">
            {client.fullName}
          </h1>

          <dl className="mt-8 min-h-0 flex-1 space-y-0 divide-y divide-[var(--border)] sm:mt-10">
            <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[min(14rem,32%)_1fr] sm:gap-6 sm:py-5">
              <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                ID в системе
              </dt>
              <dd className="font-mono text-[16px] text-[var(--foreground)]">
                {client.id}
              </dd>
            </div>

            <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[min(14rem,32%)_1fr] sm:gap-6 sm:py-5">
              <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                Логин Instagram
              </dt>
              <dd>
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  @{ig}
                </a>
              </dd>
            </div>

            <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[min(14rem,32%)_1fr] sm:gap-6 sm:py-5">
              <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                Всего опубликовано / запланировано
              </dt>
              <dd className="text-[16px] font-semibold tabular-nums text-[var(--foreground)]">
                {client.postsTotal}
              </dd>
            </div>

            <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[min(14rem,32%)_1fr] sm:gap-6 sm:py-5">
              <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                Постов в текущем календарном месяце
              </dt>
              <dd className="text-[16px] font-semibold tabular-nums text-[var(--foreground)]">
                {client.postsThisMonth}
              </dd>
            </div>

            <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[min(14rem,32%)_1fr] sm:gap-6 sm:py-5">
              <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                На модерации / согласовании
              </dt>
              <dd
                className={`text-[16px] font-semibold tabular-nums ${
                  client.postsPendingReview > 0
                    ? "text-[var(--accent)]"
                    : "text-[var(--foreground)]"
                }`}
              >
                {client.postsPendingReview}
              </dd>
            </div>

            <div className="grid gap-1 py-4 first:pt-0 sm:py-5 sm:grid-cols-[min(14rem,32%)_1fr] sm:gap-6">
              <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                Сферы деятельности
              </dt>
              <dd>
                <ul
                  className="flex flex-wrap gap-2"
                  aria-label="Сферы деятельности"
                >
                  {client.activitySpheres.map((sphere) => (
                    <li
                      key={sphere}
                      className="rounded-md bg-[var(--surface-elevated)] px-2.5 py-1.5 text-[14px] text-[var(--foreground)]"
                    >
                      {sphere}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <div
            className="mt-10 w-full min-w-0 max-w-full border-t border-[var(--border)] pt-8"
          >
            <div className="flex flex-col gap-3 min-[32rem]:flex-row min-[32rem]:items-center min-[32rem]:justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
                Календарь
              </h2>
              <Link
                href={`/posts/new?client=${encodeURIComponent(client.id)}`}
                className={`${btnPrimaryClass} self-start min-[32rem]:self-center`}
              >
                Добавить пост
              </Link>
            </div>
            <p className="mt-1.5 text-[14px] text-[var(--muted)]">
              Слоты по датам: только посты этого клиента (как в разделе «Календарь»).
            </p>
            <div className="mt-6 w-full min-w-0 min-h-0">
              <ContentCalendar posts={clientPosts} clients={mockClients} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
