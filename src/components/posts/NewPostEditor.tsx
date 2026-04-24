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
  clientSelectLabel,
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
import {
  getDefaultPublishSchedule,
  getMinTimeForDateField,
  getTodayYmdString,
  normalizePublishSchedule,
} from "./postReviewUtils";

type NewPostEditorProps = {
  clients: ClientRecord[];
  /** Редактирование существующего поста (вместе с initialValues). */
  existingPostId?: string;
  /** Статус поста при редактировании (кнопки «черновик» / «чистовик»). */
  existingPostStatus?: PostDraftStatus;
  /** Если задано — форма открывается с данными черновика (страница редактирования). */
  initialValues?: PostEditorInitialValues | null;
  /**
   * Для новой записи: предвыбрать клиента (например `?client=` в URL).
   * Не влияет, если задано `initialValues` (редактирование).
   */
  initialClientId?: string;
  /**
   * Копия существующего поста: те же поля, но сценарий «новый» (расписание в URL уже нормализовано).
   * Не задаёт `isEditMode`.
   */
  duplicateFrom?: PostEditorInitialValues | null;
};

function clientsForPlatform(clients: ClientRecord[], platform: ClientPlatform) {
  return clients.filter((c) => c.platform === platform);
}

function initChannelAndClient(
  clients: ClientRecord[],
  isEditMode: boolean,
  initialValues: PostEditorInitialValues | null,
  duplicateFrom: PostEditorInitialValues | null,
  initialClientId: string | undefined
): { publishPlatform: ClientPlatform; clientId: string } {
  if (isEditMode && initialValues) {
    const platform =
      clients.find((c) => c.id === initialValues.clientId)?.platform ?? "instagram";
    return { publishPlatform: platform, clientId: initialValues.clientId };
  }
  if (!clients.length) {
    return { publishPlatform: "instagram", clientId: "" };
  }
  const fromSeed =
    duplicateFrom?.clientId ??
    initialValues?.clientId ??
    (initialClientId && clients.some((c) => c.id === initialClientId)
      ? initialClientId
      : undefined);
  if (fromSeed) {
    const c = clients.find((x) => x.id === fromSeed);
    if (c) {
      return { publishPlatform: c.platform, clientId: c.id };
    }
  }
  const ig = clientsForPlatform(clients, "instagram");
  const tg = clientsForPlatform(clients, "telegram");
  if (ig.length) return { publishPlatform: "instagram", clientId: ig[0]!.id };
  if (tg.length) return { publishPlatform: "telegram", clientId: tg[0]!.id };
  return { publishPlatform: clients[0]!.platform, clientId: clients[0]!.id };
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
  duplicateFrom = null,
}: NewPostEditorProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [saveError, setSaveError] = useState("");
  const isEditMode = initialValues != null && Boolean(existingPostId);
  const seed = seedForNew(initialValues, duplicateFrom);

  const [publishPlatform, setPublishPlatform] = useState<ClientPlatform>(() =>
    initChannelAndClient(
      clients,
      isEditMode,
      initialValues,
      duplicateFrom,
      initialClientId
    ).publishPlatform
  );
  const [clientId, setClientId] = useState(
    () =>
      initChannelAndClient(
        clients,
        isEditMode,
        initialValues,
        duplicateFrom,
        initialClientId
      ).clientId
  );
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
  /** сбрасываем раз в минуту, чтобы `min` у даты/времени оставались валидны */
  const [scheduleTick, setScheduleTick] = useState(0);
  const scheduleId = useId();
  const minDateYmd = useMemo(
    () => getTodayYmdString(new Date()),
    [scheduleTick]
  );
  /** При редактировании сохраняем прошлую дату публикации в допустимом диапазоне `min`. */
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

  const client = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId]
  );

  const filteredClients = useMemo(
    () => clientsForPlatform(clients, publishPlatform),
    [clients, publishPlatform]
  );

  const hasIgClients = useMemo(
    () => clients.some((c) => c.platform === "instagram"),
    [clients]
  );
  const hasTgClients = useMemo(
    () => clients.some((c) => c.platform === "telegram"),
    [clients]
  );

  const onPublishPlatform = useCallback(
    (p: ClientPlatform) => {
      if (isEditMode) return;
      setPublishPlatform(p);
      const pool = clientsForPlatform(clients, p);
      setClientId((prev) => (pool.some((c) => c.id === prev) ? prev : pool[0]?.id ?? ""));
      if (p === "telegram") {
        setPostType("feed");
        setLocation("");
        setFirstComment("");
        setAltText("");
      }
    },
    [clients, isEditMode]
  );

  useEffect(() => {
    if (filteredClients.some((c) => c.id === clientId)) return;
    const next = filteredClients[0]?.id ?? "";
    if (next !== clientId) setClientId(next);
  }, [filteredClients, clientId]);

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
    const isTg = publishPlatform === "telegram";
    return {
      clientId,
      postType: isTg ? ("feed" as PostType) : postType,
      caption,
      location: isTg ? "" : location,
      firstComment: isTg ? "" : firstComment,
      altText: isTg ? "" : altText,
      imageUrls,
      publishDate: publishSchedule.date,
      publishTime: publishSchedule.time,
    };
  }, [
    clientId,
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

  const savePost = useCallback(() => {
    setSaveError("");
    if (!clientId || !filteredClients.some((c) => c.id === clientId)) {
      setSaveError("Выберите клиента для выбранной платформы.");
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
    filteredClients,
    isEditMode,
    router,
    startSaveTransition,
  ]);

  const saveNewPostAsScheduled = useCallback(() => {
    setSaveError("");
    if (!clientId || !filteredClients.some((c) => c.id === clientId)) {
      setSaveError("Выберите клиента для выбранной платформы.");
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
  }, [buildPayload, clientId, filteredClients, router, startSaveTransition]);

  const setPostLifecycle = useCallback(
    (target: "draft" | "scheduled") => {
      if (!existingPostId) return;
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
    [existingPostId, router, startSaveTransition]
  );

  const removePost = useCallback(() => {
    if (!existingPostId) return;
    if (!window.confirm("Удалить этот пост? Действие необратимо.")) return;
    setSaveError("");
    startDeleteTransition(async () => {
      const res = await deletePostAction(existingPostId);
      if (!res.ok) {
        setSaveError(res.error);
        return;
      }
      router.push("/posts/current");
      router.refresh();
    });
  }, [existingPostId, router, startDeleteTransition]);

  const publishNow = useCallback(() => {
    if (!existingPostId) return;
    if (
      !window.confirm(
        "Отправить пост в Telegram сейчас? В базе он будет отмечен как опубликованный."
      )
    ) {
      return;
    }
    setSaveError("");
    startPublishTransition(async () => {
      const res = await publishPostNowAction(existingPostId, buildPayload());
      if (!res.ok) {
        setSaveError(res.error);
        return;
      }
      router.refresh();
    });
  }, [buildPayload, existingPostId, router, startPublishTransition]);

  const canPublishNowTg =
    isEditMode &&
    client?.platform === "telegram" &&
    existingPostStatus !== "published" &&
    existingPostStatus !== "rejected";

  const canSave =
    filteredClients.length > 0 &&
    Boolean(clientId) &&
    filteredClients.some((c) => c.id === clientId) &&
    imageUploadState === "idle";

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

        <div className="mt-5 space-y-5">
          <div role="radiogroup" aria-label="Платформа публикации">
            <span className="text-[14px] font-medium text-[var(--foreground)]">
              Платформа
            </span>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={isEditMode || !hasIgClients}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 ${
                  publishPlatform === "instagram"
                    ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                aria-checked={publishPlatform === "instagram"}
                role="radio"
                onClick={() => onPublishPlatform("instagram")}
              >
                Instagram
              </button>
              <button
                type="button"
                disabled={isEditMode || !hasTgClients}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 ${
                  publishPlatform === "telegram"
                    ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                aria-checked={publishPlatform === "telegram"}
                role="radio"
                onClick={() => onPublishPlatform("telegram")}
              >
                Telegram
              </button>
            </div>
            {!hasIgClients || !hasTgClients ? (
              <p className="mt-2 text-[12px] text-[var(--muted)]">
                {!hasIgClients && !hasTgClients
                  ? "Добавьте клиента в разделе «Клиенты»."
                  : !hasIgClients
                    ? "Клиентов Instagram нет — доступен только Telegram."
                    : "Клиентов Telegram нет — доступен только Instagram."}
              </p>
            ) : null}
            {isEditMode ? (
              <p className="mt-2 text-[12px] text-[var(--muted)]">
                Платформа совпадает с клиентом поста и не меняется при редактировании.
              </p>
            ) : null}
          </div>

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
              disabled={filteredClients.length === 0}
              onChange={(e) => setClientId(e.target.value)}
            >
              {filteredClients.length === 0 ? (
                <option value="">Нет клиентов для этой платформы</option>
              ) : (
                filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {clientSelectLabel(c)}
                  </option>
                ))
              )}
            </select>
          </div>

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
              {publishPlatform === "telegram"
                ? "Одно или несколько изображений (альбом в канале). Подпись — отдельным блоком под медиа."
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
                disabled={imageUploadState === "uploading"}
                className="w-full min-w-0 text-[14px] text-[var(--muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--surface-elevated)] file:px-3.5 file:py-2 file:text-[14px] file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                onChange={async (e) => {
                  await setImagesFromFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {imageUploadState === "uploading" ? (
                <span className="text-[13px] text-[var(--muted)]">Загрузка на сервер…</span>
              ) : null}
              {imageUrls.length > 0 && imageUploadState === "idle" ? (
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
              className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
                  disabled={!isFeedLikePostType(postType)}
                  placeholder={
                    isFeedLikePostType(postType)
                      ? "Показано под ником в шапке поста"
                      : "Для рилс/сторис не в шапке (в рилс — подпись снизу, в сторис — текст в кадре)"
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-45"
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
                  className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
          {isEditMode ? (
            <>
              <button
                type="button"
                onClick={savePost}
                disabled={!canSave || publishBusy}
                className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Сохранение…" : "Сохранить"}
              </button>
              {canPublishNowTg ? (
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
          ) : (
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
          )}
        </div>
      </section>

      <section
        className="w-full min-w-0 max-w-full overflow-x-hidden lg:sticky lg:top-8"
        aria-label={
          publishPlatform === "telegram"
            ? "Предпросмотр в стиле Telegram"
            : "Предпросмотр в стиле Instagram"
        }
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Предпросмотр
        </h2>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          {publishPlatform === "telegram"
            ? "Канал / чат: шапка, медиа и подпись, как в типичном посте Telegram."
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
          {publishPlatform === "telegram" ? (
            <TelegramPostPreview
              client={client}
              imageUrls={imageUrls}
              caption={caption}
            />
          ) : (
            <InstagramPostPreview
              postType={postType}
              client={client}
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
                min={dateInputMin}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] [color-scheme:light] dark:[color-scheme:dark] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
                min={minTime}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] [color-scheme:light] dark:[color-scheme:dark] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
