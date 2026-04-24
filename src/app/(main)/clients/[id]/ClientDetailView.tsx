"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import type { ClientRecord, PostDraftRecord } from "@/domain/smm";

const btnPrimaryClass =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

type ClientDetailViewProps = {
  client: ClientRecord;
  clientPosts: PostDraftRecord[];
  clients: ClientRecord[];
  calendarDefaultYear: number;
  calendarDefaultMonthIndex: number;
};

export function ClientDetailView({
  client,
  clientPosts,
  clients,
  calendarDefaultYear,
  calendarDefaultMonthIndex,
}: ClientDetailViewProps) {
  const router = useRouter();
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
        onSaved={() => router.refresh()}
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

          <div className="mt-5 w-full min-w-0 max-w-full sm:mt-6">
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
              <Suspense
                fallback={
                  <div className="min-h-48 text-[14px] text-[var(--muted)]">
                    Загрузка календаря…
                  </div>
                }
              >
                <ContentCalendar
                  posts={clientPosts}
                  clients={clients}
                  defaultYear={calendarDefaultYear}
                  defaultMonthIndex={calendarDefaultMonthIndex}
                />
              </Suspense>
            </div>
          </div>

          <div className="mt-6 w-full min-w-0 border-t border-[var(--border)] pt-5 sm:mt-7 sm:pt-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Сведения о клиенте
            </h2>
            <dl className="mt-3 grid min-h-0 max-w-4xl grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 sm:gap-y-2.5">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                  ID
                </dt>
                <dd className="mt-0.5 break-all font-mono text-[14px] text-[var(--foreground)]">
                  {client.id}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                  {client.platform === "telegram" ? "Telegram" : "Instagram"}
                </dt>
                <dd className="mt-0.5">
                  {client.platform === "telegram" ? (
                    <div className="space-y-3 text-[14px] text-[var(--foreground)]">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                          Токен бота
                        </p>
                        <p className="mt-0.5 text-[13px] text-[var(--foreground)]">
                          {client.hasTelegramBotToken
                            ? "Сохранён (не показывается)"
                            : "Не задан"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                          ID чата
                        </p>
                        <p className="mt-0.5 break-all font-mono text-[13px]">
                          {client.telegramChatId ?? "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={igUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      @{ig}
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                  Опубликовано / запланировано
                </dt>
                <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-[var(--foreground)]">
                  {client.postsTotal}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                  Посты в текущем месяце
                </dt>
                <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-[var(--foreground)]">
                  {client.postsThisMonth}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                  Модерация
                </dt>
                <dd
                  className={`mt-0.5 text-[14px] font-semibold tabular-nums ${
                    client.postsPendingReview > 0
                      ? "text-[var(--accent)]"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {client.postsPendingReview}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                  Сферы
                </dt>
                <dd className="mt-1.5">
                  <ul
                    className="flex flex-wrap gap-1.5"
                    aria-label="Сферы деятельности"
                  >
                    {client.activitySpheres.map((sphere) => (
                      <li
                        key={sphere}
                        className="rounded bg-[var(--surface-elevated)] px-2 py-0.5 text-[12px] text-[var(--foreground)]"
                      >
                        {sphere}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
