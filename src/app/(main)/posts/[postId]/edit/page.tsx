import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewPostEditor } from "@/components/posts/NewPostEditor";
import { getMockPostDraftById, postDraftToEditorInitial } from "@/data/mockDb";
import { safeCalendarReturnTo } from "@/lib/safeReturnTo";

type PageProps = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId } = await params;
  const draft = getMockPostDraftById(postId);
  return {
    title: draft ? "Редактирование поста — smmplaner" : "Пост не найден",
    description: "Редактирование черновика или запланированного поста",
  };
}

export default async function EditPostPage({ params, searchParams }: PageProps) {
  const { postId } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const backHref = safeCalendarReturnTo(returnToParam);
  const draft = getMockPostDraftById(postId);
  if (!draft) notFound();

  const initialValues = postDraftToEditorInitial(draft);

  return (
    <main className="w-full py-8 sm:py-10">
      {backHref ? (
        <p className="mb-4 -mt-1 min-w-0 sm:-mt-2">
          <Link
            href={backHref}
            className="text-[14px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            ← Назад
          </Link>
        </p>
      ) : null}
      <header className="mb-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
            Редактирование
          </h1>
          <Link
            href={`/posts/new?duplicateFrom=${encodeURIComponent(postId)}`}
            className="shrink-0 text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Дублировать пост
          </Link>
        </div>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          Те же поля и предпросмотр, что в «Новом посте» — данные подставлены из
          черновика.
        </p>
      </header>

      <NewPostEditor key={postId} initialValues={initialValues} />
    </main>
  );
}
