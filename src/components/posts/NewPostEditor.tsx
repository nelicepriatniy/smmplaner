"use client";

import { useCallback, useEffect, useId, useMemo, useState, useTransition } from "react";
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
  clientSocialSelectLabel,
  socialAccountShortLabel,
  toPostPublisherPreview,
  type ClientPlatform,
  type ClientRecord,
  type PostDraftStatus,
  type PostEditorInitialValues,
} from "@/domain/smm";
import {
  isFeedLikePostType,
  POST_TYPE_OPTIONS,
  type PostType,
} from "@/types/postType";
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

export function NewPostEditor({
  clients,
  existingPostId,
  existingPostStatus,
  initialValues = null,
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

  const publisher = useMemo(
    () => toPostPublisherPreview(selectedClient, selectedAccount),
    [selectedClient, selectedAccount]
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
    if (!existingPostId || ro) return;
    void (async () => {
      const ok = await confirm({
        message: "Удалить этот пост? Действие необратимо.",
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
        router.push("/posts/current");
        router.refresh();
      });
    })();
  }, [confirm, existingPostId, ro, router, startDeleteTransition, toast]);

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
    imageUploadState === "idle" &&
    !ro;

  const publishBusy = isSaving || isDeleting || isPublishing;

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
                Платформа и предпросмотр определяются выбранной соцсетью.
                {isEditMode ? " Клиент и соцсеть поста не меняются." : null}
              </p>

              <div>
                <label
                  htmlFor="post-client"
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Клиент
                </label>
                <select
                  id="post-client"
                  className="mt-2 w-full"
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

              <div>
                <label
                  htmlFor="post-social"
                  className="text-[14px] font-medium text-[var(--foreground)]"
                >
                  Соцсеть
                </label>
                <select
                  id="post-social"
                  className="mt-2 w-full"
                  value={socialAccountId}
                  disabled={ro || !socialOptions.length || isEditMode}
                  onChange={(e) => setSocialAccountId(e.target.value)}
                >
                  {socialOptions.length === 0 ? (
                    <option value="">Нет подключённых сетей</option>
                  ) : (
                    socialOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {selectedClient
                          ? clientSocialSelectLabel(selectedClient, s)
                          : socialAccountShortLabel(s)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </>
          )}

          {publishPlatform === "instagram" ? (
            <div>
              <label
                htmlFor="post-type"
                className="text-[14px] font-medium text-[var(--foreground)]"
              >
                Тип публикации
              </label>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {typeHint?.description}
              </p>
              <select
                id="post-type"
                className="mt-2 w-full"
                value={postType}
                disabled={ro}
                onChange={(e) => setPostType(e.target.value as PostType)}
              >
                {POST_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                aria-labelledby="post-images-label"
                type="file"
                accept="image/*"
                multiple
                disabled={ro || imageUploadState === "uploading"}
                className="w-full min-w-0 text-[14px] text-[var(--muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--surface-elevated)] file:px-3.5 file:py-2 file:text-[14px] file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                onChange={async (e) => {
                  await setImagesFromFiles(e.target.files);
                  e.target.value = "";
                }}
              />
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

          {publishPlatform === "instagram" ? (
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
                  В ленте не отображается, но важно для Instagram.
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
              : postType === "feed" && "Лента, светлая тема, карточка 4:5."}
          {publishPlatform === "instagram" && postType === "photo" &&
            "Тот же вид ленты, квадратный кадр 1:1."}
          {publishPlatform === "instagram" && postType === "reels" &&
            "Полотно 9:16, панель действий справа, подпись внизу."}
          {publishPlatform === "instagram" && postType === "stories" &&
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
            Дата и время
          </h3>
          <p className="text-[13px] text-[var(--muted)]">
            {publishPlatform === "telegram"
              ? "Когда отправить материалы в Telegram или поставить напоминание"
              : publishPlatform === "vk"
                ? "Когда опубликовать во ВКонтакте или поставить напоминание"
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
