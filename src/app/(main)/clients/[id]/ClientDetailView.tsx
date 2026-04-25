"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteClientAction,
  deleteClientSocialAccountAction,
} from "@/app/(main)/clients/actions";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientSocialAccountFormDialog } from "@/components/clients/ClientSocialAccountFormDialog";
import { useAppNotifications } from "@/components/notifications/AppNotifications";
import { SocialPlatformIcon } from "@/components/icons/SocialPlatformIcon";
import type {
  ClientRecord,
  ClientSocialAccountRecord,
  PostDraftRecord,
  PostDraftStatus,
} from "@/domain/smm";
import { POST_DRAFT_STATUS_LABELS, socialAccountShortLabel } from "@/domain/smm";

const POST_STATUS_ORDER: PostDraftStatus[] = [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "rejected",
];

/** Краткая сводка: числа в цветах «инвентаря» / месяца / согласования. */
const BRIEF_NUM_CLASS = {
  social: "text-[color:var(--post-status-published-border)]",
  postsTotal: "text-[color:var(--post-status-draft-border)]",
  inMonth: "text-[color:var(--post-status-scheduled-border)]",
  inReview: "text-[color:var(--post-status-in-review-border)]",
} as const;

const POST_STATUS_NUM_CLASS: Record<PostDraftStatus, string> = {
  draft: "text-[color:var(--post-status-draft-border)]",
  in_review: "text-[color:var(--post-status-in-review-border)]",
  scheduled: "text-[color:var(--post-status-scheduled-border)]",
  published: "text-[color:var(--post-status-published-border)]",
  rejected: "text-[color:var(--post-status-rejected-border)]",
};

const btnSm =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-[var(--surface-elevated)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

const btnGhostSm =
  "rounded-md border border-transparent px-1.5 py-0.5 text-[11px] font-medium text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)] disabled:opacity-40";

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
  const { confirm, toast } = useAppNotifications();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [socialDialogOpen, setSocialDialogOpen] = useState(false);
  const [socialDialogMode, setSocialDialogMode] = useState<"add" | "edit">("add");
  const [socialDialogAccount, setSocialDialogAccount] =
    useState<ClientSocialAccountRecord | null>(null);
  const [socialSession, setSocialSession] = useState(0);

  const postsBySocialId = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of clientPosts) {
      m.set(p.socialAccountId, (m.get(p.socialAccountId) ?? 0) + 1);
    }
    return m;
  }, [clientPosts]);

  const postCountsByStatus = useMemo(() => {
    const counts: Record<PostDraftStatus, number> = {
      draft: 0,
      in_review: 0,
      scheduled: 0,
      published: 0,
      rejected: 0,
    };
    for (const p of clientPosts) counts[p.status] += 1;
    return counts;
  }, [clientPosts]);

  const contactTrimmed = client.contact?.trim() ?? "";
  const contactIsEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactTrimmed);
  const contactIsTel = /^\+?[\d\s().-]{8,}$/.test(contactTrimmed);
  const contactHref = contactIsEmail
    ? `mailto:${contactTrimmed}`
    : contactIsTel
      ? `tel:${contactTrimmed.replace(/[\s().-]/g, "")}`
      : /^https?:\/\//i.test(contactTrimmed)
        ? contactTrimmed
        : null;

  const openEdit = () => {
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
  }, []);

  const openAddSocial = () => {
    setSocialDialogMode("add");
    setSocialDialogAccount(null);
    setSocialSession((s) => s + 1);
    setSocialDialogOpen(true);
  };

  const openEditSocial = (acc: ClientSocialAccountRecord) => {
    setSocialDialogMode("edit");
    setSocialDialogAccount(acc);
    setSocialSession((s) => s + 1);
    setSocialDialogOpen(true);
  };

  const closeSocialDialog = useCallback(() => {
    setSocialDialogOpen(false);
  }, []);

  const removeSocial = useCallback(
    (acc: ClientSocialAccountRecord) => {
      void (async () => {
        const n = postsBySocialId.get(acc.id) ?? 0;
        if (n > 0) {
          toast({
            message: "Нельзя удалить соцсеть с привязанными постами.",
            variant: "error",
          });
          return;
        }
        const ok = await confirm({
          title: "Удалить соцсеть",
          message: `Удалить «${socialAccountShortLabel(acc)}»?`,
          confirmLabel: "Удалить",
          danger: true,
        });
        if (!ok) return;
        const res = await deleteClientSocialAccountAction(acc.id);
        if (!res.ok) {
          toast({ message: res.error, variant: "error" });
          return;
        }
        toast({ message: "Соцсеть удалена", variant: "success" });
        router.refresh();
      })();
    },
    [confirm, postsBySocialId, router, toast]
  );

  const removeClient = useCallback(() => {
    void (async () => {
      const ok = await confirm({
        title: "Удалить клиента",
        message: `Удалить «${client.fullName}»? Все посты этого клиента будут удалены безвозвратно.`,
        confirmLabel: "Удалить",
        danger: true,
      });
      if (!ok) return;
      startDeleteTransition(async () => {
        const res = await deleteClientAction(client.id);
        if (!res.ok) {
          toast({ message: res.error, variant: "error" });
          return;
        }
        toast({ message: "Клиент удалён", variant: "success" });
        router.push("/clients");
        router.refresh();
      });
    })();
  }, [client.fullName, client.id, confirm, router, toast]);

  const newPostHref =
    client.socialAccounts[0]
      ? `/posts/new?client=${encodeURIComponent(client.id)}&social=${encodeURIComponent(client.socialAccounts[0].id)}`
      : `/posts/new?client=${encodeURIComponent(client.id)}`;

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

      <ClientSocialAccountFormDialog
        isOpen={socialDialogOpen}
        onRequestClose={closeSocialDialog}
        mode={socialDialogMode}
        clientId={client.id}
        clientFullName={client.fullName}
        account={socialDialogAccount}
        session={socialSession}
        onSaved={() => router.refresh()}
      />

      <section className="flex min-h-dvh w-full min-w-0 flex-1 flex-col rounded-none border-0 border-[var(--border)] bg-[var(--surface)] sm:rounded-2xl sm:border">
        <div className="flex w-full min-w-0 min-h-0 flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8 lg:py-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link
              href="/clients"
              className="shrink-0 text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              ← Клиенты
            </Link>
            <button type="button" onClick={openEdit} className={btnSm}>
              Изменить
            </button>
          </div>

          <h1 className="text-[21px] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-[23px]">
            {client.fullName}
          </h1>

          <div className="mt-5 grid min-w-0 gap-6 lg:mt-6 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
            <aside className="min-w-0 space-y-4 lg:max-w-[18rem]">
              <div className="flex flex-wrap gap-2">
                <Link href={newPostHref} className={btnSm}>
                  Пост
                </Link>
                <button type="button" onClick={openAddSocial} className={btnSm}>
                  + Соцсеть
                </button>
              </div>

              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Соцсети
                </h2>
                {client.socialAccounts.length === 0 ? (
                  <p className="mt-2 text-[12px] text-[var(--muted)]">Нет — «+ Соцсеть»</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {client.socialAccounts.map((acc) => {
                      const postN = postsBySocialId.get(acc.id) ?? 0;
                      const ig = acc.instagramUsername.trim();
                      const igOk =
                        acc.platform === "instagram" &&
                        ig &&
                        ig !== "telegram" &&
                        ig !== "vk";
                      return (
                        <li
                          key={acc.id}
                          className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-[12px]"
                        >
                          <SocialPlatformIcon
                            platform={acc.platform}
                            className="size-5 shrink-0"
                          />
                          <span className="min-w-0 flex-1 truncate font-medium text-[var(--foreground)]">
                            {igOk ? (
                              <a
                                href={`https://www.instagram.com/${encodeURIComponent(ig)}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--accent)] underline-offset-2 hover:underline"
                              >
                                @{ig}
                              </a>
                            ) : (
                              <span title={socialAccountShortLabel(acc)}>
                                {socialAccountShortLabel(acc)}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 tabular-nums text-[var(--muted)]">{postN}</span>
                          <span className="ml-auto flex shrink-0 gap-0.5">
                            <button
                              type="button"
                              className={btnGhostSm}
                              onClick={() => openEditSocial(acc)}
                            >
                              изм.
                            </button>
                            <button
                              type="button"
                              className={btnGhostSm}
                              disabled={postN > 0}
                              title={postN > 0 ? "Есть посты" : undefined}
                              onClick={() => removeSocial(acc)}
                            >
                              уд.
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Кратко
                </h2>
                <p className="mt-2 text-[12px] leading-snug text-[var(--muted)]">
                  Соцсетей подключено:{" "}
                  <span
                    className={`font-semibold tabular-nums ${BRIEF_NUM_CLASS.social}`}
                  >
                    {client.socialAccounts.length}
                  </span>
                </p>
                {contactTrimmed ? (
                  <p className="mt-1.5 text-[12px] leading-snug">
                    <span className="text-[var(--muted)]">Контакт: </span>
                    {contactHref ? (
                      <a
                        href={contactHref}
                        className="break-all font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                        target={contactHref.startsWith("http") ? "_blank" : undefined}
                        rel={contactHref.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {contactTrimmed}
                      </a>
                    ) : (
                      <span className="break-words font-medium text-[var(--foreground)]">
                        {contactTrimmed}
                      </span>
                    )}
                  </p>
                ) : null}
                <p className="mt-2 text-[12px] leading-snug text-[var(--foreground)]">
                  Постов{" "}
                  <span
                    className={`font-semibold tabular-nums ${BRIEF_NUM_CLASS.postsTotal}`}
                  >
                    {client.postsTotal}
                  </span>
                  {" · "}
                  в месяце{" "}
                  <span
                    className={`font-semibold tabular-nums ${BRIEF_NUM_CLASS.inMonth}`}
                  >
                    {client.postsThisMonth}
                  </span>
                  {" · "}
                  на соглас.{" "}
                  <span
                    className={`font-semibold tabular-nums ${BRIEF_NUM_CLASS.inReview}`}
                  >
                    {client.postsPendingReview}
                  </span>
                </p>
                <h3 className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Посты по статусам
                </h3>
                <ul className="mt-1.5 space-y-0.5 text-[12px]">
                  {POST_STATUS_ORDER.map((st) => (
                    <li key={st} className="flex justify-between gap-2">
                      <span className="min-w-0 shrink text-[var(--muted)]">
                        {POST_DRAFT_STATUS_LABELS[st]}
                      </span>
                      <span
                        className={`shrink-0 font-medium tabular-nums ${POST_STATUS_NUM_CLASS[st]}`}
                      >
                        {postCountsByStatus[st]}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] font-medium text-[var(--muted)]">Сферы</p>
                <ul className="mt-1 flex flex-wrap gap-1" aria-label="Сферы">
                  {client.activitySpheres.map((sphere) => (
                    <li
                      key={sphere}
                      className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[11px] text-[var(--muted)]"
                    >
                      {sphere}
                    </li>
                  ))}
                </ul>
                <p
                  className="mt-2 truncate font-mono text-[10px] text-[var(--muted)]"
                  title={client.id}
                >
                  id {client.id}
                </p>
              </div>

              <button
                type="button"
                onClick={removeClient}
                disabled={isDeleting}
                className="w-full rounded-lg border border-rose-500/40 py-2 text-[12px] font-medium text-rose-200 hover:bg-rose-950/25 disabled:opacity-50"
              >
                {isDeleting ? "…" : "Удалить клиента"}
              </button>
            </aside>

            <div className="min-w-0 lg:min-h-[min(70vh,36rem)]">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Календарь
              </h2>
              <div className="mt-2 min-h-0 min-w-0">
                <Suspense
                  fallback={
                    <div className="py-8 text-[13px] text-[var(--muted)]">Загрузка…</div>
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
          </div>
        </div>
      </section>
    </main>
  );
}
