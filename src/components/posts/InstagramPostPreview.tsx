"use client";
/* eslint-disable react-hooks/set-state-in-effect -- сброс слайда/раскрытия при смене медиа и подписи */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { PostType } from "@/types/postType";
import type { ClientRecord } from "@/domain/smm";

type InstagramPostPreviewProps = {
  postType: PostType;
  client: ClientRecord | null;
  imageUrls: string[];
  caption: string;
  location: string;
  firstComment: string;
  altText?: string;
};

const igFont =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function IcHeart() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function IcComment() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M20.2 2.5H3.8C2.8 2.5 2 3.2 2 4.1v10.1c0 .9.8 1.6 1.8 1.6H6v3.2l3.3-1.5h11.2c.9 0 1.6-.7 1.6-1.6V4.1c0-.9-.7-1.6-1.6-1.6H3.8z" />
    </svg>
  );
}

function IcShare() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M22 3 9.2 10.2" />
      <path d="M22 3l-4.1 19-4-9.1-4.1-4.1L22 3" />
    </svg>
  );
}

function IcSave() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 2h12a2 2 0 0 1 2 2v20l-8-5-8 5V4a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IcMore() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function IcMusic() {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z" />
    </svg>
  );
}

function buildCaptionText(text: string, username: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return `${username} ${trimmed}`;
}

type FeedProps = {
  client: ClientRecord | null;
  imageUrls: string[];
  caption: string;
  location: string;
  firstComment: string;
  altText: string;
  aspect: "feed" | "photo";
};

function InstagramFeedPostPreview({
  client,
  imageUrls,
  caption,
  location,
  firstComment,
  altText,
  aspect,
}: FeedProps) {
  const [slide, setSlide] = useState(0);
  const n = imageUrls.length;
  const username = client?.instagramUsername ?? "client";

  const fullCaption = useMemo(
    () => buildCaptionText(caption, username),
    [caption, username]
  );
  const isLong = fullCaption.length > 120;
  const [expanded, setExpanded] = useState(false);
  const previewCaption = expanded
    ? fullCaption
    : fullCaption.slice(0, 120) + (isLong ? "…" : "");

  const imageUrlsKey = useMemo(
    () => imageUrls.map((u) => u).join("\0"),
    [imageUrls]
  );
  useEffect(() => {
    setSlide(0);
  }, [imageUrlsKey]);

  useEffect(() => {
    if (!isLong) setExpanded(false);
  }, [isLong, fullCaption]);

  const hasImages = n > 0;
  const activeUrl = n > 0 ? imageUrls[Math.min(slide, n - 1)]! : null;
  const aspectClass = aspect === "photo" ? "aspect-square" : "aspect-[4/5]";

  return (
    <div
      className="box-border w-full min-w-0 max-w-[390px] shrink-0 overflow-x-hidden rounded-xl border border-[#dbdbdb] bg-white shadow-sm [contain:inline-size]"
      style={{ fontFamily: igFont }}
    >
      <div className="flex h-[52px] min-h-[52px] items-center justify-between border-b border-[#efefef] px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px]">
            <div
              className="flex size-full items-center justify-center rounded-full bg-white"
              aria-hidden
            >
              <div className="size-[28px] rounded-full bg-[#c7c7c7]" />
            </div>
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-baseline gap-1">
              <p className="truncate text-[14px] font-semibold text-[#262626]">
                {username}
              </p>
            </div>
            {location.trim() && (
              <p className="truncate text-[12px] text-[#262626]">
                {location.trim()}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          className="p-1 text-[#262626] opacity-90"
          aria-label="Меню"
        >
          <IcMore />
        </button>
      </div>

      <div
        className={`relative flex w-full items-center justify-center overflow-hidden bg-black ${aspectClass}`}
        style={{ minHeight: hasImages ? undefined : 280 }}
      >
        {activeUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeUrl}
            alt={altText.trim() || "Предпросмотр поста"}
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}
        {!hasImages && (
          <div
            className="flex h-full w-full min-h-[280px] select-none items-center justify-center text-[15px] text-white/50"
          >
            Добавьте фото
          </div>
        )}
        {n > 1 && (
          <>
            <div className="absolute top-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-[12px] font-medium text-white">
              {slide + 1} / {n}
            </div>
            <button
              type="button"
              className="absolute top-1/2 left-1.5 -translate-y-1/2 rounded-full bg-white/25 p-1.5 text-white shadow backdrop-blur"
              onClick={() => setSlide((s) => (s - 1 + n) % n)}
              aria-label="Предыдущее фото"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-white/25 p-1.5 text-white shadow backdrop-blur"
              onClick={() => setSlide((s) => (s + 1) % n)}
              aria-label="Следующее фото"
            >
              ›
            </button>
            <div
              className="absolute bottom-2 left-0 flex w-full justify-center gap-1"
              role="tablist"
            >
              {imageUrls.map((_, i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-white"
                  style={{ opacity: i === slide ? 1 : 0.45 }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-1 pt-2.5">
        <div className="flex items-center justify-between px-1.5 pb-1.5">
          <div className="flex items-center gap-3.5 text-[#262626]">
            <button type="button" aria-label="Нравится" className="p-0.5">
              <IcHeart />
            </button>
            <button type="button" aria-label="Комментарий" className="p-0.5">
              <IcComment />
            </button>
            <button type="button" aria-label="Поделиться" className="p-0.5">
              <IcShare />
            </button>
          </div>
          <button
            type="button"
            aria-label="Сохранить"
            className="p-0.5 text-[#262626]"
          >
            <IcSave />
          </button>
        </div>

        <div className="px-1.5 pb-1.5 text-[14px] font-semibold text-[#262626]">
          127 нравится
        </div>

        <div className="min-w-0 max-w-full px-1.5 pb-2.5 text-[14px] leading-[18px] text-[#262626]">
          {fullCaption ? (
            <>
              <span className="min-w-0 max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {previewCaption}
              </span>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="ml-1 text-[#8e8e8e]"
                >
                  {expanded ? "свернуть" : "ещё"}
                </button>
              )}
            </>
          ) : (
            <span className="text-[#8e8e8e]">Подпись…</span>
          )}
        </div>

        {firstComment.trim() && (
          <div className="min-w-0 max-w-full px-1.5 pb-2.5 text-[14px] leading-[18px] text-[#262626]">
            <span className="font-normal text-[#8e8e8e]">1 комментарий</span>
            <div className="mt-1.5 min-w-0">
              <span className="font-semibold text-[#262626]">viewer</span>{" "}
              <span className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[#262626]">
                {firstComment.trim()}
              </span>
            </div>
          </div>
        )}

        <p className="px-1.5 pb-3 text-[10px] uppercase tracking-[0.06em] text-[#8e8e8e]">
          Только что
        </p>
      </div>
    </div>
  );
}

/* --- Вертикальные 9:16 (Reels, Stories) — важны градиенты 40–60 %, иначе текст «растворяется». --- */

type VertProps = {
  kind: "reels" | "stories";
  client: ClientRecord | null;
  imageUrls: string[];
  caption: string;
  firstComment: string;
  altText: string;
};

function ReelsOrStoriesFrame({
  kind,
  client,
  imageUrls,
  caption,
  firstComment,
  altText,
}: VertProps) {
  const [slide, setSlide] = useState(0);
  const n = imageUrls.length;
  const user = client?.instagramUsername ?? "client";
  const hasImg = n > 0;
  const url = hasImg ? imageUrls[Math.min(slide, n - 1)]! : null;
  const cap = caption.trim();
  const storyText = (cap || firstComment.trim() || "Текст…").slice(0, 220);
  const seg = Math.max(1, n);
  const key = useMemo(() => imageUrls.join("\0"), [imageUrls]);
  useEffect(() => setSlide(0), [key, kind]);

  const frameBox: CSSProperties = {
    fontFamily: igFont,
    position: "relative",
    width: "100%",
    maxWidth: 300,
    aspectRatio: "9/16",
    minHeight: 400,
    minWidth: 240,
  };

  return (
    <div
      className="shrink-0 overflow-hidden rounded-sm bg-zinc-950"
      style={frameBox}
    >
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={altText.trim() || "Превью"}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}
      {!url && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900 p-3 text-center text-sm text-zinc-400">
          {kind === "reels" ? "Добавьте изображение или кадр" : "Добавьте изображение"}
        </div>
      )}

      {kind === "stories" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-black/60 to-transparent" />
          <div
            className="absolute z-20 flex w-full items-stretch gap-0.5 px-2.5 pt-2.5"
            role="tablist"
            aria-label="Сторис"
          >
            {Array.from({ length: seg }, (_, i) => (
              <div
                key={i}
                className="h-0.5 min-w-0 flex-1 rounded-sm bg-white/30"
                style={{ opacity: i === (n ? slide : 0) ? 1 : 0.45 }}
              />
            ))}
          </div>
          <div className="absolute z-20 flex w-full items-center justify-between px-2.5 pt-8 pr-2 text-white">
            <p className="text-[12px] font-semibold [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
              @{user}
            </p>
            <span className="scale-90 text-white [filter:drop-shadow(0_1px_1px_#000)]">
              <IcMore />
            </span>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[60%] bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
          <div className="absolute right-0 bottom-14 left-0 z-20 max-h-[45%] overflow-hidden px-2.5 text-sm leading-relaxed text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
            {storyText}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-30 p-2">
            <div className="h-8 rounded-full border border-white/20 bg-white/20 px-3 text-xs leading-8 text-white/80 [backdrop-filter:blur(8px)] [background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(0,0,0,0.1))]">
              Сообщение…
            </div>
          </div>
          {n > 1 && hasImg && (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-1.5 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-sm text-white shadow [backdrop-filter:blur(3px)]"
                onClick={() => setSlide((s) => (s - 1 + n) % n)}
                aria-label="Предыдущий"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-1.5 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-sm text-white shadow [backdrop-filter:blur(3px)]"
                onClick={() => setSlide((s) => (s + 1) % n)}
                aria-label="Следующий"
              >
                ›
              </button>
            </>
          )}
        </>
      )}

      {kind === "reels" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-black/55 to-transparent" />
          <p
            className="absolute top-2.5 left-1/2 z-20 -translate-x-1/2 text-center text-xs font-extrabold text-white [text-shadow:0_1px_2px_#000]"
            style={{ textShadow: "0 0 1px #000" }}
          >
            Reels
          </p>
          <div className="absolute top-1/2 right-1.5 z-20 flex -translate-y-1/2 flex-col gap-3 text-white [filter:drop-shadow(0_0_1px_#000)]">
            <button type="button" className="p-0.5" aria-label="Нравится">
              <IcHeart />
            </button>
            <button type="button" className="p-0.5" aria-label="Комментарий">
              <IcComment />
            </button>
            <button type="button" className="p-0.5" aria-label="Шэр">
              <IcShare />
            </button>
          </div>
          {n > 1 && (
            <div
              className="absolute top-1/2 left-2.5 z-20 flex w-6 -translate-y-1/2 items-center"
              aria-label="Слайд"
            >
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/20 text-sm text-white [backdrop-filter:blur(2px)]"
                onClick={() => setSlide((s) => (s - 1 + n) % n)}
                aria-label="Предыдущее"
              >
                ‹
              </button>
            </div>
          )}
          {n > 1 && (
            <div className="absolute top-1/2 right-9 z-20 flex w-6 -translate-y-1/2 items-center justify-end">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/20 text-sm text-white [backdrop-filter:blur(2px)]"
                onClick={() => setSlide((s) => (s + 1) % n)}
                aria-label="Следующее"
              >
                ›
              </button>
            </div>
          )}
          {n > 1 && (
            <div
              className="absolute bottom-32 left-1/2 z-20 flex -translate-x-1/2 gap-1.5"
              role="tablist"
            >
              {imageUrls.map((_, i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-white"
                  style={{ opacity: i === slide ? 1 : 0.35 }}
                />
              ))}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div
            className="absolute right-0 bottom-0 z-20 max-w-[calc(100%-2.75rem)] p-2.5 text-left"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.75)" }}
          >
            <p className="line-clamp-1 text-sm font-bold text-white">@{user}</p>
            {cap && (
              <p className="mt-0.5 line-clamp-2 text-xs text-white/90">{cap}</p>
            )}
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/80">
              <IcMusic />
              <span className="line-clamp-1 min-w-0 text-white/90">
                {user} · оригинальный звук
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function InstagramPostPreview({
  postType,
  client,
  imageUrls,
  caption,
  location,
  firstComment,
  altText = "",
}: InstagramPostPreviewProps) {
  if (postType === "reels") {
    return (
      <ReelsOrStoriesFrame
        kind="reels"
        client={client}
        imageUrls={imageUrls}
        caption={caption}
        firstComment={firstComment}
        altText={altText}
      />
    );
  }
  if (postType === "stories") {
    return (
      <div
        className="w-full min-w-[260px] max-w-[308px] overflow-hidden rounded-2xl border border-zinc-200 shadow-md ring-1 ring-black/10 [box-shadow:0_8px_32px_rgba(0,0,0,0.25)]"
        role="img"
        aria-label="Предпросмотр сторис"
      >
        <ReelsOrStoriesFrame
          kind="stories"
          client={client}
          imageUrls={imageUrls}
          caption={caption}
          firstComment={firstComment}
          altText={altText}
        />
      </div>
    );
  }
  return (
    <InstagramFeedPostPreview
      aspect={postType === "photo" ? "photo" : "feed"}
      client={client}
      imageUrls={imageUrls}
      caption={caption}
      location={location}
      firstComment={firstComment}
      altText={altText}
    />
  );
}
