"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClientRecord } from "@/domain/smm";

type TelegramPostPreviewProps = {
  client: ClientRecord | null;
  imageUrls: string[];
  caption: string;
};

const tgFont =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function TelegramPostPreview({
  client,
  imageUrls,
  caption,
}: TelegramPostPreviewProps) {
  const [slide, setSlide] = useState(0);
  const n = imageUrls.length;
  const title = client?.fullName?.trim() || "Канал";
  const subtitle = client?.telegramChatId?.trim()
    ? `чат ${client.telegramChatId.trim()}`
    : "Telegram";

  const key = useMemo(() => imageUrls.join("\0"), [imageUrls]);
  useEffect(() => {
    setSlide(0);
  }, [key]);

  const cap = caption.trim();
  const active = n > 0 ? imageUrls[Math.min(slide, n - 1)]! : null;

  return (
    <div
      className="box-border w-full min-w-0 max-w-[420px] shrink-0 overflow-hidden rounded-xl border border-[#c5c9d0] bg-[#ffffff] shadow-sm"
      style={{ fontFamily: tgFont }}
    >
      <header className="flex items-center gap-3 border-b border-[#e4e6eb] bg-[#ffffff] px-3 py-2.5">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3390ec] text-[15px] font-semibold text-white"
          aria-hidden
        >
          {title.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#000000]">{title}</p>
          <p className="truncate text-[13px] text-[#707579]">{subtitle}</p>
        </div>
      </header>

      <div className="bg-[#ffffff]">
        {active ? (
          <div className="relative bg-[#000000]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active}
              alt=""
              className="mx-auto block max-h-[min(22rem,55vh)] w-full object-contain"
              draggable={false}
            />
            {n > 1 ? (
              <div className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums">
                {slide + 1} / {n}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[140px] items-center justify-center border-b border-[#e4e6eb] bg-[#f4f4f5] px-4 text-center text-[14px] text-[#707579]">
            Нет изображения — в канале может уйти только текст
          </div>
        )}

        {n > 1 ? (
          <div className="flex gap-1 overflow-x-auto border-b border-[#e4e6eb] px-2 py-2">
            {imageUrls.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setSlide(i)}
                className={`relative size-14 shrink-0 overflow-hidden rounded-md ring-2 ring-offset-1 ring-offset-white ${
                  i === slide ? "ring-[#3390ec]" : "ring-transparent opacity-80"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        ) : null}

        {cap ? (
          <div className="px-3 py-3">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug text-[#000000]">
              {cap}
            </p>
          </div>
        ) : (
          <div className="px-3 py-3 text-[14px] text-[#707579]">Без подписи</div>
        )}
      </div>

      <p className="border-t border-[#e4e6eb] px-3 py-2 text-center text-[11px] text-[#8d9399]">
        Предпросмотр: так пост может выглядеть в канале / чате
      </p>
    </div>
  );
}
