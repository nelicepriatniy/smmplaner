import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientReviewPanel } from "@/components/posts/ClientReviewPanel";
import {
  getMockPostDraftByClientReviewToken,
  mockClients,
} from "@/data/mockDb";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const post = getMockPostDraftByClientReviewToken(token);
  return {
    title: post ? "Согласование поста" : "Ссылка недействительна",
    description: "Просмотр поста и обсуждение с командой",
  };
}

export default async function ClientReviewPage({ params }: PageProps) {
  const { token } = await params;
  const post = getMockPostDraftByClientReviewToken(token);
  if (!post) notFound();

  const client = mockClients.find((c) => c.id === post.clientId) ?? null;

  return (
    <main className="min-h-dvh w-full bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Согласование
        </p>
        <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[22px]">
          Просмотр поста
        </h1>
        {client ? (
          <p className="mt-1.5 text-[14px] text-[var(--muted)]">
            Для:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {client.fullName}
            </span>
          </p>
        ) : null}

        <ClientReviewPanel
          postType={post.postType}
          client={client}
          imageUrls={post.imageUrls}
          caption={post.caption}
          location={post.location}
          firstComment={post.firstComment}
          altText={post.altText}
          initialDiscussion={post.discussion ?? []}
        />
      </div>
    </main>
  );
}
