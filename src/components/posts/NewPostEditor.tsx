"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { PostEditorInitialValues } from "@/data/mockDb";
import { mockClients } from "@/data/mockDb";
import {
  isFeedLikePostType,
  POST_TYPE_OPTIONS,
  type PostType,
} from "@/types/postType";
import { InstagramPostPreview } from "./InstagramPostPreview";
import {
  getDefaultPublishSchedule,
  getMinTimeForDateField,
  getTodayYmdString,
  normalizePublishSchedule,
} from "./postReviewUtils";

type NewPostEditorProps = {
  /** Если задано — форма открывается с данными черновика (страница редактирования). */
  initialValues?: PostEditorInitialValues | null;
};

export function NewPostEditor({ initialValues = null }: NewPostEditorProps) {
  const isEditMode = initialValues != null;

  const [clientId, setClientId] = useState(
    () => initialValues?.clientId ?? mockClients[0]?.id ?? ""
  );
  const [postType, setPostType] = useState<PostType>(
    () => initialValues?.postType ?? "feed"
  );
  const [caption, setCaption] = useState(() => initialValues?.caption ?? "");
  const [location, setLocation] = useState(() => initialValues?.location ?? "");
  const [firstComment, setFirstComment] = useState(
    () => initialValues?.firstComment ?? ""
  );
  const [altText, setAltText] = useState(() => initialValues?.altText ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    () => (initialValues?.imageUrls ? [...initialValues.imageUrls] : [])
  );
  const [publishSchedule, setPublishSchedule] = useState(() =>
    initialValues
      ? { date: initialValues.publishDate, time: initialValues.publishTime }
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
    () => mockClients.find((c) => c.id === clientId) ?? null,
    [clientId]
  );

  const typeHint = useMemo(
    () => POST_TYPE_OPTIONS.find((o) => o.value === postType),
    [postType]
  );

  const setImagesFromFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    if (!next.length) return;
    setImageUrls(next);
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
              onChange={(e) => setClientId(e.target.value)}
            >
              {mockClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} (@{c.instagramUsername})
                </option>
              ))}
            </select>
          </div>

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

          <div>
            <span
              className="text-[14px] font-medium text-[var(--foreground)]"
              id="post-images-label"
            >
              Медиа
            </span>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {postType === "reels" || postType === "stories"
                ? "Обложка или кадр (9:16). Можно несколько кадров подряд в сторис/коллаж."
                : "Одно или несколько изображений (карусель). Для «Фото» превью 1:1."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                aria-labelledby="post-images-label"
                type="file"
                accept="image/*"
                multiple
                className="w-full min-w-0 text-[14px] text-[var(--muted)] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--surface-elevated)] file:px-3.5 file:py-2 file:text-[14px] file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--border)]"
                onChange={(e) => {
                  setImagesFromFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {imageUrls.length > 0 && (
                <button
                  type="button"
                  onClick={clearImages}
                  className="rounded-lg px-3 py-2 text-[13px] text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
                >
                  Сбросить
                </button>
              )}
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
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90"
          >
            Сохранить в черновики
          </button>
        </div>
      </section>

      <section
        className="w-full min-w-0 max-w-full overflow-x-hidden lg:sticky lg:top-8"
        aria-label="Предпросмотр в стиле Instagram"
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Предпросмотр
        </h2>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          {postType === "feed" &&
            "Лента, светлая тема, карточка 4:5."}
          {postType === "photo" &&
            "Тот же вид ленты, квадратный кадр 1:1."}
          {postType === "reels" && "Полотно 9:16, панель действий справа, подпись внизу."}
          {postType === "stories" &&
            "9:16, прогресс, ник, текст и поле «Сообщение» внизу."}
        </p>
        <div
          className="mt-5 flex w-full min-w-0 max-w-full justify-center rounded-2xl border border-[#efefef] p-4"
          style={{ background: "#fafafa" }}
        >
          <InstagramPostPreview
            postType={postType}
            client={client}
            imageUrls={imageUrls}
            caption={caption}
            location={location}
            firstComment={firstComment}
            altText={altText}
          />
        </div>

        <div
          className="mt-8 w-full min-w-0 max-w-md space-y-2"
          aria-label="План публикации"
        >
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Дата и время
          </h3>
          <p className="text-[13px] text-[var(--muted)]">
            Когда выкладывать в ленту или поставить напоминание
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
