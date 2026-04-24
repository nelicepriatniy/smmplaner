"use client";

import { useState } from "react";
import { InstagramPostPreview } from "@/components/posts/InstagramPostPreview";
import { ClientPortalDiscussion } from "@/components/posts/ClientPortalDiscussion";
import type { PostReviewComment } from "@/components/posts/postReviewTypes";
import type { ClientRecord } from "@/domain/smm";
import type { PostType } from "@/types/postType";

type ClientReviewPanelProps = {
  postType: PostType;
  client: ClientRecord | null;
  imageUrls: string[];
  caption: string;
  location: string;
  firstComment: string;
  altText: string;
  initialDiscussion: PostReviewComment[];
  refMs: number;
};

export function ClientReviewPanel({
  postType,
  client,
  imageUrls,
  caption,
  location,
  firstComment,
  altText,
  initialDiscussion,
  refMs,
}: ClientReviewPanelProps) {
  const [decision, setDecision] = useState<"idle" | "approved" | "rejected">(
    "idle"
  );

  return (
    <div className="space-y-2">
      <div
        className="flex w-full min-w-0 max-w-full justify-center rounded-2xl border border-[#efefef] p-4"
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

      <ClientPortalDiscussion initialComments={initialDiscussion} refMs={refMs} />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          disabled={decision !== "idle"}
          onClick={() => setDecision("approved")}
          className="flex-1 rounded-xl border border-emerald-700/45 bg-emerald-950/55 px-4 py-3 text-[14px] font-semibold text-emerald-50 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Одобрить
        </button>
        <button
          type="button"
          disabled={decision !== "idle"}
          onClick={() => setDecision("rejected")}
          className="flex-1 rounded-xl border border-rose-700/45 bg-rose-950/55 px-4 py-3 text-[14px] font-semibold text-rose-50 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Отклонить
        </button>
      </div>

      {decision !== "idle" ? (
        <p
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-center text-[14px] text-[var(--foreground)]"
          role="status"
        >
          {decision === "approved"
            ? "Спасибо: пост отмечен как одобренный (демо, без сохранения)."
            : "Пост отклонён и отправлен на доработку в черновики (демо, без сохранения)."}
        </p>
      ) : null}
    </div>
  );
}
