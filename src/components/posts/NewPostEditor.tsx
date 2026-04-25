"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  createDraftPostAction,
  createScheduledPostAction,
  deletePostAction,
  publishPostNowAction,
  setPostDraftOrScheduledAction,
  updatePostAction,
} from "@/app/(main)/posts/actions";
import {
  clientPlatformName,
  toPostPublisherPreview,
  type ClientPlatform,
  type ClientRecord,
  type PostDraftStatus,
  type PostEditorInitialValues,
} from "@/domain/smm";
import { normalizeAccountTelegramChats } from "@/lib/telegram-targets";
import {
  isFeedLikePostType,
  POST_TYPE_OPTIONS,
  type PostType,
} from "@/types/postType";
import { SocialPlatformIcon } from "@/components/icons/SocialPlatformIcon";
import { InstagramPostPreview } from "./InstagramPostPreview";
import { TelegramPostPreview } from "./TelegramPostPreview";
import { useAppNotifications } from "@/components/notifications/AppNotifications";
import {
  getDefaultPublishSchedule,
  getMinTimeForDateField,
  getTodayYmdString,
  normalizePublishSchedule,
} from "./postReviewUtils";

type NewPostEditorProps = {
  clients: ClientRecord[];
  existingPostId?: string;
  existingPostStatus?: PostDraftStatus;
  initialValues?: PostEditorInitialValues | null;
  /** Снимок `telegram_chat_target_ids` из БД (редактирование) — надёжнее, чем только `initialValues`. */
  savedTelegramChatTargetIds?: string[] | null;
  initialClientId?: string;
  /** Предвыбор аккаунта соцсети (например из URL `?social=`). */
  initialSocialAccountId?: string;
  duplicateFrom?: PostEditorInitialValues | null;
};

function clientsWithSocials(clients: ClientRecord[]) {
  return clients.filter((c) => c.socialAccounts.length > 0);
}

function initClientAndSocial(
  clients: ClientRecord[],
  isEditMode: boolean,
  initialValues: PostEditorInitialValues | null,
  duplicateFrom: PostEditorInitialValues | null,
  initialClientId: string | undefined,
  initialSocialAccountId: string | undefined
): { clientId: string; socialAccountId: string } {
  const pickFirst = (): { clientId: string; socialAccountId: string } => {
    const pool = clientsWithSocials(clients);
    if (!pool.length) return { clientId: "", socialAccountId: "" };
    const c = pool[0]!;
    return { clientId: c.id, socialAccountId: c.socialAccounts[0]!.id };
  };

  if (isEditMode && initialValues) {
    return {
      clientId: initialValues.clientId,
      socialAccountId: initialValues.socialAccountId,
    };
  }
  const seed = duplicateFrom ?? initialValues;
  if (seed?.clientId && seed.socialAccountId) {
    const c = clients.find((x) => x.id === seed.clientId);
    if (c?.socialAccounts.some((s) => s.id === seed.socialAccountId)) {
      return { clientId: seed.clientId, socialAccountId: seed.socialAccountId };
    }
  }
  if (initialSocialAccountId) {
    for (const c of clients) {
      const sa = c.socialAccounts.find((s) => s.id === initialSocialAccountId);
      if (sa) return { clientId: c.id, socialAccountId: sa.id };
    }
  }
  if (
    initialClientId &&
    clients.some((c) => c.id === initialClientId && c.socialAccounts.length > 0)
  ) {
    const c = clients.find((x) => x.id === initialClientId)!;
    return { clientId: c.id, socialAccountId: c.socialAccounts[0]!.id };
  }
  return pickFirst();
}

function seedForNew(
  initialValues: PostEditorInitialValues | null,
  duplicateFrom: PostEditorInitialValues | null
): PostEditorInitialValues | null {
  if (initialValues) return initialValues;
  if (duplicateFrom) return duplicateFrom;
  return null;
}

function pickPersistedTelegramIds(
  savedTelegramChatTargetIds: string[] | null | undefined,
  isEditMode: boolean,
  initialValues: PostEditorInitialValues | null,
  duplicateFrom: PostEditorInitialValues | null
): string[] {
  const raw =
    savedTelegramChatTargetIds ??
    (isEditMode ? initialValues?.telegramChatTargetIds : undefined) ??
    duplicateFrom?.telegramChatTargetIds ??
    initialValues?.telegramChatTargetIds ??
    [];
  return [...raw].map((x) => String(x).trim()).filter(Boolean);
}

function initialTelegramTargetIds(
  clients: ClientRecord[],
  socialAccountId: string,
  persistedIds: string[],
  isEditMode: boolean
): string[] {
  for (const c of clients) {
    const acc = c.socialAccounts.find((s) => s.id === socialAccountId);
    if (!acc || acc.platform !== "telegram") return [];
    const targets = normalizeAccountTelegramChats(acc.telegramChats, acc.telegramChatId);
    if (!targets.length) return [];
    const fromSeed = persistedIds.filter((id) => targets.some((t) => t.id === id));
    if (fromSeed.length > 0) return fromSeed;
    if (isEditMode && targets.length > 0) {
      return [targets[0]!.id];
    }
    return targets.map((t) => t.id);
  }
  return [];
}

export function NewPostEditor({
  clients,
  existingPostId,
  existingPostStatus,
  initialValues = null,
  savedTelegramChatTargetIds = null,
  initialClientId,
  initialSocialAccountId,
  duplicateFrom = null,
}: NewPostEditorProps) {
  const router = useRouter();
  const { toast, confirm } = useAppNotifications();
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [saveError, setSaveError] = useState("");
  const isEditMode = initialValues != null && Boolean(existingPostId);
  const seed = seedForNew(initialValues, duplicateFrom);
  const publishedReadOnly = existingPostStatus === "published";

  const init = initClientAndSocial(
    clients,
    isEditMode,
    initialValues,
    duplicateFrom,
    initialClientId,
    initialSocialAccountId
  );

  const [clientId, setClientId] = useState(init.clientId);
  const [socialAccountId, setSocialAccountId] = useState(init.socialAccountId);
  const persistedTelegramIdsRef = useRef(
    pickPersistedTelegramIds(
      savedTelegramChatTargetIds,
      isEditMode,
      initialValues,
      duplicateFrom
    )
  );
  const [telegramTargetIds, setTelegramTargetIds] = useState<string[]>(() =>
    initialTelegramTargetIds(
      clients,
      init.socialAccountId,
      persistedTelegramIdsRef.current,
      isEditMode
    )
  );

  useEffect(() => {
    persistedTelegramIdsRef.current = pickPersistedTelegramIds(
      savedTelegramChatTargetIds,
      isEditMode,
      initialValues,
      duplicateFrom
    );
  }, [savedTelegramChatTargetIds, isEditMode, initialValues, duplicateFrom]);

  const [postType, setPostType] = useState<PostType>(
    () => seed?.postType ?? "feed"
  );
  const [caption, setCaption] = useState(() => seed?.caption ?? "");
  const [location, setLocation] = useState(() => seed?.location ?? "");
  const [firstComment, setFirstComment] = useState(
    () => seed?.firstComment ?? ""
  );
  const [altText, setAltText] = useState(() => seed?.altText ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    () => (seed?.imageUrls ? [...seed.imageUrls] : [])
  );
  const [imageUploadState, setImageUploadState] = useState<"idle" | "uploading">("idle");
  const [publishSchedule, setPublishSchedule] = useState(() =>
    seed
      ? { date: seed.publishDate, time: seed.publishTime }
      : normalizePublishSchedule(getDefaultPublishSchedule())
  );
  const [scheduleTick, setScheduleTick] = useState(0);
  const scheduleId = useId();
  const mediaInputId = useId();
  const minDateYmd = useMemo(
    () => getTodayYmdString(new Date()),
    [scheduleTick]
  );
  const dateInputMin =
    initialValues?.publishDate && initialValues.publishDate < minDateYmd
      ? initialValues.publishDate
      : minDateYmd;
  const minTime = useMemo(
    () => getMinTimeForDateField(publishSchedule.date),
    [publishSchedule.date, scheduleTick]
  );

  useEffect(() => {
    const id = setInterval(() => {
      setScheduleTick((n) => n + 1);
      if (!isEditMode) {
        setPublishSchedule((s) => normalizePublishSchedule(s));
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [isEditMode]);

  const pool = useMemo(() => clientsWithSocials(clients), [clients]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId]
  );

  const socialOptions = selectedClient?.socialAccounts ?? [];

  const selectedAccount = useMemo(
    () => socialOptions.find((s) => s.id === socialAccountId) ?? null,
    [socialOptions, socialAccountId]
  );

  const publishPlatform: ClientPlatform = selectedAccount?.platform ?? "instagram";
  const graphFeedEditor =
    publishPlatform === "instagram" || publishPlatform === "facebook";

  const publisher = useMemo(
    () =>
      toPostPublisherPreview(
        selectedClient,
        selectedAccount,
        publishPlatform === "telegram" ? telegramTargetIds : null
      ),
    [selectedClient, selectedAccount, publishPlatform, telegramTargetIds]
  );

  useEffect(() => {
    if (socialOptions.some((s) => s.id === socialAccountId)) return;
    const next = socialOptions[0]?.id ?? "";
    if (next !== socialAccountId) setSocialAccountId(next);
  }, [socialOptions, socialAccountId]);

  useEffect(() => {
    if (pool.some((c) => c.id === clientId)) return;
    const next = pool[0]?.id ?? "";
    if (next !== clientId) {
      setClientId(next);
      const c = clients.find((x) => x.id === next);
      setSocialAccountId(c?.socialAccounts[0]?.id ?? "");
    }
  }, [pool, clientId, clients]);

  useEffect(() => {
    if (publishPlatform === "telegram" || publishPlatform === "vk") {
      setPostType("feed");
      setLocation("");
      setFirstComment("");
      setAltText("");
    }
  }, [publishPlatform]);

  const toggleTelegramTarget = useCallback((id: string) => {
    setTelegramTargetIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  const typeHint = useMemo(
    () => POST_TYPE_OPTIONS.find((o) => o.value === postType),
    [postType]
  );

  const setImagesFromFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setSaveError("");
    setImageUploadState("uploading");
    try {
      const fd = new FormData();
      for (const f of list) {
        fd.append("files", f);
      }
      const res = await fetch("/api/uploads/post-media", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось загрузить изображения.");
      }
      const urls = data.urls ?? [];
      if (!urls.length) {
        throw new Error("Сервер не вернул ссылки на файлы.");
      }
      setImageUrls(urls);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Ошибка загрузки файлов.");
    } finally {
      setImageUploadState("idle");
    }
  }, []);

  const clearImages = useCallback(() => {
    setImageUrls([]);
  }, []);

  useEffect(() => {
    return () => {
      imageUrls.forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, [imageUrls]);

  const buildPayload = useCallback(() => {
    const isTgOrVk =
      publishPlatform === "telegram" || publishPlatform === "vk";
    return {
      socialAccountId,
      postType: isTgOrVk ? ("feed" as PostType) : postType,
      caption,
      location: isTgOrVk ? "" : location,
      firstComment: isTgOrVk ? "" : firstComment,
      altText: isTgOrVk ? "" : altText,
      imageUrls,
      publishDate: publishSchedule.date,
      publishTime: publishSchedule.time,
      telegramChatTargetIds:
        publishPlatform === "telegram" ? telegramTargetIds : [],
    };
  }, [
    socialAccountId,
    postType,
    caption,
    location,
    firstComment,
    altText,
    imageUrls,
    publishSchedule.date,
    publishSchedule.time,
    publishPlatform,
    telegramTargetIds,
  ]);

  const ro = publishedReadOnly;

  const savePost = useCallback(() => {
    if (ro) return;
    setSaveError("");
    if (!clientId || !socialAccountId || !selectedAccount) {
      setSaveError("Выберите клиента и соцсеть.");
      return;
    }
    startSaveTransition(async () => {
      const payload = buildPayload();
      if (isEditMode && existingPostId) {
        const res = await updatePostAction(existingPostId, payload);
        if (!res.ok) {
          setSaveError(res.error);
          return;
        }
        router.refresh();
        return;
      }
      const res = await createDraftPostAction(payload);
      if (!res.ok) {
        setSaveError(res.error);
        return;
      }
      if (res.postId) {
        router.push(`/posts/${res.postId}/edit`);
      }
    });
  }, [
    buildPayload,
    clientId,
    existingPostId,
    isEditMode,
    ro,
    router,
    selectedAccount,
    socialAccountId,
    startSaveTransition,
  ]);

  const saveNewPostAsScheduled = useCallback(() => {
    if (ro) return;
    setSaveError("");
    if (!clientId || !socialAccountId || !selectedAccount) {
      setSaveError("Выберите клиента и соцсеть.");
      return;
    }
    startSaveTransition(async () => {
      const res = await createScheduledPostAction(buildPayload());
      if (!res.ok) {
        setSaveError(res.error);
        return;
      }
      if (res.postId) {
        router.push(`/posts/${res.postId}/edit`);
      }
    });
  }, [buildPayload, clientId, ro, router, selectedAccount, socialAccountId, startSaveTransition]);

  const setPostLifecycle = useCallback(
    (target: "draft" | "scheduled") => {
      if (!existingPostId || ro) return;
      setSaveError("");
      startSaveTransition(async () => {
        const res = await setPostDraftOrScheduledAction(existingPostId, target);
        if (!res.ok) {
          setSaveError(res.error);
          return;
        }
        router.refresh();
      });
    },
    [existingPostId, ro, router, startSaveTransition]
  );

  const removePost = useCallback(() => {
    if (!existingPostId) return;
    void (async () => {
      const ok = await confirm({
        message:
          existingPostStatus === "published"
            ? "Удалить этот пост из приложения? Публикация в соцсети при этом не удаляется. Действие необратимо."
            : "Удалить этот пост? Действие необратимо.",
        confirmLabel: "Удалить",
        danger: true,
      });
      if (!ok) return;
      setSaveError("");
      startDeleteTransition(async () => {
        const res = await deletePostAction(existingPostId);
        if (!res.ok) {
          setSaveError(res.error);
          return;
        }
        toast({ message: "Пост удалён", variant: "success" });
        router.push(
          existingPostStatus === "published"
            ? "/posts/archive"
            : "/posts/current",
        );
        router.refresh();
      });
    })();
  }, [
    confirm,
    existingPostId,
    existingPostStatus,
    router,
    startDeleteTransition,
    toast,
  ]);

  const publishNow = useCallback(() => {
    if (!existingPostId || ro) return;
    void (async () => {
      const isTg = selectedAccount?.platform === "telegram";
      const isVk = selectedAccount?.platform === "vk";
      const ok = await confirm({
        message: isVk
          ? "Опубликовать запись на стене ВКонтакте сейчас? В базе пост будет отмечен как опубликованный."
          : isTg
            ? "Отправить пост в Telegram сейчас? В базе он будет отмечен как опубликованный."
            : "Опубликовать сейчас? В базе пост будет отмечен как опубликованный.",
        confirmLabel: "Опубликовать",
      });
      if (!ok) return;
      setSaveError("");
      startPublishTransition(async () => {
        const res = await publishPostNowAction(existingPostId, buildPayload());
        if (!res.ok) {
          setSaveError(res.error);
          return;
        }
        toast({
          message: isVk
            ? "Запись опубликована во ВКонтакте"
            : isTg
              ? "Пост отправлен в Telegram"
              : "Готово",
          variant: "success",
        });
        router.refresh();
      });
    })();
  }, [
    buildPayload,
    confirm,
    existingPostId,
    ro,
    router,
    selectedAccount?.platform,
    startPublishTransition,
    toast,
  ]);

  const canPublishNowInstant =
    isEditMode &&
    !ro &&
    (selectedAccount?.platform === "telegram" ||
      selectedAccount?.platform === "vk") &&
    existingPostStatus !== "rejected";

  const canSave =
    pool.length > 0 &&
    Boolean(clientId) &&
    Boolean(socialAccountId) &&
    Boolean(selectedAccount) &&
    (publishPlatform !== "telegram" || telegramTargetIds.length > 0) &&
    imageUploadState === "idle" &&
    !ro;

  const telegramTargets = useMemo(() => {
    if (selectedAccount?.platform !== "telegram") return [];
    return normalizeAccountTelegramChats(
      selectedAccount.telegramChats,
      selectedAccount.telegramChatId
    );
  }, [selectedAccount]);

  /** Стабильная подпись списка чатов — чтобы эффект не сбрасывал выбор при том же аккаунте. */
  const telegramTargetsFingerprint = useMemo(() => {
    if (!selectedAccount || selectedAccount.platform !== "telegram") return "";
    return normalizeAccountTelegramChats(
      selectedAccount.telegramChats,
      selectedAccount.telegramChatId
    )
      .map((t) => t.id)
      .sort()
      .join("|");
  }, [selectedAccount]);

  const lastTelegramSyncKey = useRef<string | null>(null);

  useEffect(() => {
    if (publishPlatform !== "telegram") {
      setTelegramTargetIds([]);
      lastTelegramSyncKey.current = null;
      return;
    }
    if (!selectedAccount || selectedAccount.platform !== "telegram") {
      return;
    }
    const syncKey = `${clientId}:${socialAccountId}:${telegramTargetsFingerprint}`;
    if (lastTelegramSyncKey.current === syncKey) {
      return;
    }
    lastTelegramSyncKey.current = syncKey;
    const targets = normalizeAccountTelegramChats(
      selectedAccount.telegramChats,
      selectedAccount.telegramChatId
    );
    setTelegramTargetIds((prev) => {
      const next = prev.filter((id) => targets.some((t) => t.id === id));
      if (next.length > 0) return next;
      const fromServer = persistedTelegramIdsRef.current.filter((id) =>
        targets.some((t) => t.id === id)
      );
      if (fromServer.length > 0) return fromServer;
      if (isEditMode && targets.length > 0) {
        return [targets[0]!.id];
      }
      return targets.map((t) => t.id);
    });
  }, [
    publishPlatform,
    clientId,
    socialAccountId,
    telegramTargetsFingerprint,
    selectedAccount,
    isEditMode,
  ]);

  const publishBusy = isSaving || isDeleting || isPublishing;

  const tabInactive =
    "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--foreground)_12%,var(--border))] hover:text-[var(--foreground)]";
  const tabActive =
    "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]";
  const tabFocus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

  return (
    <div className="grid w-full gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26.25rem)] lg:items-start">
      <section
        className="min-w-0 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
        aria-label="Параметры поста"
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Материалы
        </h2>

        {publishedReadOnly ? (
          <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[14px] text-[var(--foreground)]">
            Пост уже опубликован — поля и действия недоступны для изменения.
          </p>
        ) : null}

        <div className="mt-5 space-y-5">
          {!pool.length ? (
            <p className="text-[14px] text-[var(--muted)]">
              Нет клиентов с подключёнными соцсетями. Добавьте клиента и хотя бы одну соцсеть в
              разделе «Клиенты».
            </p>
          ) : (
            <>
              <p className="text-[13px] text-[var(--muted)]">
                Платформа и предпросмотр — по выбранной соцсети.
                {isEditMode ? " Клиент и соцсеть не меняются." : null}
              </p>

              <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                <div className="w-[min(100%,14rem)] shrink-0">
                  <label
                    htmlFor="post-client"
                    className="text-[14px] font-medium text-[var(--foreground)]"
                  >
                    Клиент
                  </label>
                  <select
                    id="post-client"
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[14px] text-[var(--foreground)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
                    value={clientId}
                    disabled={ro || pool.length === 0 || isEditMode}
                    onChange={(e) => {
                      const id = e.target.value;
                      setClientId(id);
                      const c = clients.find((x) => x.id === id);
                      setSocialAccountId(c?.socialAccounts[0]?.id ?? "");
                    }}
                  >
                    {pool.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Как тип публикации: при нехватке места уходит на следующую строку; табы — в одну линию + scroll. */}
                <div className="min-w-0 max-w-full flex-[1_1_17.5rem]">
                  <span
                    id="post-social-tabs-label"
                    className="text-[14px] font-medium text-[var(--foreground)]"
                  >
                    Соцсеть
                  </span>
                  <div
                    role="tablist"
                    aria-labelledby="post-social-tabs-label"
                    className="mt-1.5 flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
                  >
                    {socialOptions.map((s) => {
                      const selected = s.id === socialAccountId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          disabled={ro || !socialOptions.length || isEditMode}
                          onClick={() => setSocialAccountId(s.id)}
                          className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tabFocus} ${
                            selected ? tabActive : tabInactive
                          }`}
                        >
                          <SocialPlatformIcon
                            platform={s.platform}
                            className="size-4 shrink-0"
                          />
                          <span className="max-w-[11rem] truncate sm:max-w-[14rem]">
                            {clientPlatformName(s.platform)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {graphFeedEditor ? (
                  <div className="min-w-0 flex-[1_1_17.5rem]">
                    <span className="text-[14px] font-medium text-[var(--foreground)]">
                      Тип публикации
                    </span>
                    <div
                      role="tablist"
                      aria-label="Тип публикации"
                      className="mt-1.5 flex flex-wrap gap-2"
                    >
                      {POST_TYPE_OPTIONS.map((o) => {
                        const selected = postType === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            disabled={ro}
                            onClick={() => setPostType(o.value)}
                            className={`rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 ${tabFocus} ${
                              selected ? tabActive : tabInactive
                            }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {publishPlatform === "telegram" && telegramTargets.length > 0 ? (
                <div className="mt-1">
                  <span className="text-[13px] font-medium text-[var(--foreground)]">
                    Чаты Telegram
                  </span>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted)]">
                    Куда отправлять (несколько можно). Сохранённые в посте чаты подставляются при
                    открытии редактора.
                  </p>
                  <div
                    className="mt-2 flex flex-wrap gap-2"
                    role="group"
                    aria-label="Чаты Telegram для отправки"
                  >
                    {telegramTargets.map((t) => {
                      const checked = telegramTargetIds.includes(t.id);
                      const label = t.name.trim() || "Чат";
                      return (
                        <label
                          key={t.id}
                          className={`inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px] font-medium transition-colors ${
                            checked
                              ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                              : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 shrink-0 rounded border-[var(--border)]"
                            checked={checked}
                            disabled={ro}
                            onChange={() => {
                              toggleTelegramTarget(t.id);
                            }}
                          />
                          <span className="max-w-[11rem] truncate">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : publishPlatform === "telegram" && telegramTargets.length === 0 ? (
                <p className="rounded-lg border border-amber-500/35 bg-amber-950/25 px-3 py-2 text-[13px] text-amber-100">
                  В карточке клиента не настроены чаты Telegram. Откройте клиента и добавьте хотя бы
                  один чат с названием и ID.
                </p>
              ) : null}

              {graphFeedEditor ? (
                <p className="mt-2 text-[13px] leading-snug text-[var(--muted)]">
                  {typeHint?.description}
                </p>
              ) : null}
            </>
          )}

          <div>
            <span
              className="text-[14px] font-medium text-[var(--foreground)]"
              id="post-images-label"
            >
              Медиа
            </span>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {publishPlatform === "telegram" || publishPlatform === "vk"
                ? publishPlatform === "vk"
                  ? "Одно или несколько изображений (как вложения к записи на стене). Подпись — текст записи."
                  : "Одно или несколько изображений (альбом в канале). Подпись — отдельным блоком под медиа."
                : postType === "reels" || postType === "stories"
                  ? "Обложка или кадр (9:16). Можно несколько кадров подряд в сторис/коллаж."
                  : "Одно или несколько изображений (карусель). Для «Фото» превью 1:1."}
            </p>
            {ro ? (
              <div className="mt-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-10 text-center text-[13px] text-[var(--muted)]">
                Загрузка недоступна для опубликованного поста.
              </div>
            ) : (
              <label
                htmlFor={mediaInputId}
                aria-labelledby="post-images-label"
                className={`mt-2 flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center transition-colors ${
                  imageUploadState === "uploading"
                    ? "pointer-events-none border-[var(--border)] bg-[var(--surface-elevated)] opacity-70"
                    : "border-[color-mix(in_srgb,var(--foreground)_14%,var(--border))] bg-[var(--background)] hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:bg-[var(--surface-elevated)]"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void setImagesFromFiles(e.dataTransfer.files);
                }}
              >
                <input
                  id={mediaInputId}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={imageUploadState === "uploading"}
                  className="sr-only"
                  onChange={async (e) => {
                    await setImagesFromFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <span className="text-[var(--muted)]" aria-hidden>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mx-auto opacity-80"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </span>
                <span className="text-[14px] font-medium text-[var(--foreground)]">
                  Переместите или загрузите медиа
                </span>
                <span className="text-[12px] text-[var(--muted)]">
                  Нажмите, чтобы выбрать файлы с устройства
                </span>
              </label>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {imageUploadState === "uploading" ? (
                <span className="text-[13px] text-[var(--muted)]">Загрузка на сервер…</span>
              ) : null}
              {imageUrls.length > 0 && imageUploadState === "idle" && !ro ? (
                <button
                  type="button"
                  onClick={clearImages}
                  className="rounded-lg px-3 py-2 text-[13px] text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
                >
                  Сбросить
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="post-caption"
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Подпись
            </label>
            <textarea
              id="post-caption"
              rows={5}
              placeholder="Текст, #хэштеги, @упоминания"
              readOnly={ro}
              className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)] read-only:cursor-default read-only:opacity-80"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {graphFeedEditor ? (
            <>
              <div>
                <label
                  htmlFor="post-location"
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Место
                </label>
                <input
                  id="post-location"
                  type="text"
                  autoComplete="off"
                  readOnly={ro}
                  disabled={!isFeedLikePostType(postType)}
                  placeholder={
                    isFeedLikePostType(postType)
                      ? "Показано под ником в шапке поста"
                      : "Для рилс/сторис не в шапке (в рилс — подпись снизу, в сторис — текст в кадре)"
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-45 read-only:cursor-default read-only:opacity-80"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="post-first-comment"
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Первый комментарий
                </label>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  План: опубликовать сразу под постом (как в планировщиках).
                </p>
                <textarea
                  id="post-first-comment"
                  rows={3}
                  readOnly={ro}
                  className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)] read-only:cursor-default read-only:opacity-80"
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="post-alt"
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Описание для людей с ограничениями (alt)
                </label>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  В ленте не отображается, но важно для доступности (
                  {publishPlatform === "facebook" ? "Facebook" : "Instagram"}).
                </p>
                <input
                  id="post-alt"
                  type="text"
                  readOnly={ro}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)] read-only:cursor-default read-only:opacity-80"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>

        {saveError ? (
          <p
            className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-[13px] text-rose-100"
            role="alert"
          >
            {saveError}
          </p>
        ) : null}
        <p className="mt-2 text-[12px] text-[var(--muted)]">
          Файлы с устройства загружаются на сервер в каталог{" "}
          <code className="rounded bg-[var(--surface-elevated)] px-1">public/uploads/posts</code> и в
          базе сохраняются пути вида <code className="rounded bg-[var(--surface-elevated)] px-1">/uploads/…</code>.
          Можно также вставить внешние URL (https://) — они сохраняются как есть.
        </p>

        <div className="mt-8 flex flex-row flex-wrap items-center gap-3">
          {isEditMode && !publishedReadOnly ? (
            <>
              <button
                type="button"
                onClick={savePost}
                disabled={!canSave || publishBusy}
                className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Сохранение…" : "Сохранить"}
              </button>
              {canPublishNowInstant ? (
                <button
                  type="button"
                  onClick={publishNow}
                  disabled={!canSave || publishBusy}
                  className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_55%,var(--border))] bg-[var(--surface-elevated)] px-5 py-2.5 text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPublishing ? "Публикация…" : "Опубликовать сейчас"}
                </button>
              ) : null}
              {existingPostStatus === "draft" ? (
                <button
                  type="button"
                  onClick={() => setPostLifecycle("scheduled")}
                  disabled={publishBusy}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-2.5 text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Обновление…" : "В чистовик"}
                </button>
              ) : existingPostStatus !== undefined ? (
                <button
                  type="button"
                  onClick={() => setPostLifecycle("draft")}
                  disabled={publishBusy}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-2.5 text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Обновление…" : "Перенести в черновик"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={removePost}
                disabled={publishBusy}
                className="rounded-xl border border-rose-500/45 bg-transparent px-5 py-2.5 text-[14px] font-semibold text-rose-200 transition-colors hover:bg-rose-950/35 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Удаление…" : "Удалить"}
              </button>
            </>
          ) : isEditMode && publishedReadOnly ? (
            <button
              type="button"
              onClick={removePost}
              disabled={isDeleting}
              className="rounded-xl border border-rose-500/45 bg-transparent px-5 py-2.5 text-[14px] font-semibold text-rose-200 transition-colors hover:bg-rose-950/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Удаление…" : "Удалить"}
            </button>
          ) : !isEditMode ? (
            <>
              <button
                type="button"
                onClick={saveNewPostAsScheduled}
                disabled={!canSave || isSaving || isDeleting}
                className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Сохранение…" : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={savePost}
                disabled={!canSave || isSaving || isDeleting}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-2.5 text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Сохранение…" : "Сохранить в черновики"}
              </button>
            </>
          ) : null}
        </div>
      </section>

      <section
        className="w-full min-w-0 max-w-full overflow-x-hidden lg:sticky lg:top-8"
        aria-label={
          publishPlatform === "telegram"
            ? "Предпросмотр в стиле Telegram"
            : publishPlatform === "vk"
              ? "Предпросмотр записи на стене (упрощённо)"
              : publishPlatform === "facebook"
                ? "Предпросмотр публикации на странице Facebook"
                : "Предпросмотр в стиле Instagram"
        }
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Предпросмотр
        </h2>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          {publishPlatform === "telegram"
            ? "Канал / чат: шапка, медиа и подпись, как в типичном посте Telegram."
            : publishPlatform === "vk"
              ? "Упрощённый вид: шапка с названием клиента и owner_id, медиа и текст (как у записи на стене)."
              : postType === "feed"
                ? publishPlatform === "facebook"
                  ? "Лента страницы Facebook (упрощённый вид, карточка 4:5)."
                  : "Лента, светлая тема, карточка 4:5."
                : null}
          {graphFeedEditor && postType === "photo" &&
            "Тот же вид ленты, квадратный кадр 1:1."}
          {graphFeedEditor && postType === "reels" &&
            "Полотно 9:16, панель действий справа, подпись внизу."}
          {graphFeedEditor && postType === "stories" &&
            "9:16, прогресс, ник, текст и поле «Сообщение» внизу."}
        </p>
        <div
          className="mt-5 flex w-full min-w-0 max-w-full justify-center rounded-2xl border border-[#efefef] p-4"
          style={{ background: "#fafafa" }}
        >
          {publishPlatform === "telegram" || publishPlatform === "vk" ? (
            <TelegramPostPreview
              publisher={publisher}
              imageUrls={imageUrls}
              caption={caption}
            />
          ) : (
            <InstagramPostPreview
              postType={postType}
              publisher={publisher}
              imageUrls={imageUrls}
              caption={caption}
              location={location}
              firstComment={firstComment}
              altText={altText}
            />
          )}
        </div>

        <div
          className="mt-8 w-full min-w-0 max-w-md space-y-2"
          aria-label="План публикации"
        >
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Дата и время (МСК)
          </h3>
          <p className="text-[13px] text-[var(--muted)]">
            {publishPlatform === "telegram"
              ? "Когда отправить материалы в Telegram или поставить напоминание"
              : publishPlatform === "vk"
                ? "Когда опубликовать во ВКонтакте или поставить напоминание"
                : publishPlatform === "facebook"
                  ? "Когда опубликовать на странице Facebook или поставить напоминание"
                  : "Когда выкладывать в ленту или поставить напоминание"}
          </p>
          <div className="mt-3 flex flex-row items-stretch gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`${scheduleId}-date`}
                className="block text-[14px] font-medium text-[var(--foreground)]"
              >
                Дата
              </label>
              <input
                id={`${scheduleId}-date`}
                type="date"
                readOnly={ro}
                min={dateInputMin}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] [color-scheme:light] dark:[color-scheme:dark] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)] read-only:cursor-default read-only:opacity-80"
                value={publishSchedule.date}
                onChange={(e) => {
                  const d = e.target.value;
                  setPublishSchedule((p) =>
                    normalizePublishSchedule({ ...p, date: d })
                  );
                }}
              />
            </div>
            <div className="w-32 shrink-0 sm:w-36">
              <label
                htmlFor={`${scheduleId}-time`}
                className="block text-[14px] font-medium text-[var(--foreground)]"
              >
                Время
              </label>
              <input
                id={`${scheduleId}-time`}
                type="time"
                readOnly={ro}
                min={minTime}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] [color-scheme:light] dark:[color-scheme:dark] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)] read-only:cursor-default read-only:opacity-80"
                value={publishSchedule.time}
                onChange={(e) => {
                  const t = e.target.value;
                  setPublishSchedule((p) =>
                    normalizePublishSchedule({ ...p, time: t })
                  );
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
