import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostDiscussionThread } from "@/components/posts/PostDiscussionThread";
import { getServerRefMs } from "@/lib/serverRefMs";
import {
  getPostForUser,
  listClientsForUser,
  requireUserId,
} from "@/lib/smm-data";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId } = await params;
  const userId = await requireUserId();
  const draft = await getPostForUser(userId, postId);
  return {
    title: draft ? "Обсуждение поста — smmplaner" : "Пост не найден",
    description: "Переписка с клиентом по посту",
  };
}

export default async function PostDiscussionPage({ params }: PageProps) {
  const { postId } = await params;
  const userId = await requireUserId();
  const refMs = await getServerRefMs();
  const [post, clients] = await Promise.all([
    getPostForUser(userId, postId),
    listClientsForUser(userId, refMs),
  ]);
  if (!post) notFound();

  const client = clients.find((c) => c.id === post.clientId);

  return (
    <main className="w-full max-w-2xl py-8 sm:py-10">
      <p className="mb-6">
        <Link
          href="/posts/current"
          className="text-[14px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          ← Актуальные посты
        </Link>
      </p>

      <header className="mb-2">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Обсуждение
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          {client ? (
            <>
              С клиентом:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {client.fullName}
              </span>
            </>
          ) : (
            <>Пост {post.id}</>
          )}
        </p>
      </header>

      <PostDiscussionThread
        postId={post.id}
        initialComments={post.discussion ?? []}
        refMs={refMs}
      />
    </main>
  );
}
