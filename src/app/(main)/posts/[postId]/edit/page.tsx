import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewPostEditor } from "@/components/posts/NewPostEditor";
import { getMockPostDraftById, postDraftToEditorInitial } from "@/data/mockDb";

type PageProps = {
  params: Promise<{ postId: string }>;
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

export default async function EditPostPage({ params }: PageProps) {
  const { postId } = await params;
  const draft = getMockPostDraftById(postId);
  if (!draft) notFound();

  const initialValues = postDraftToEditorInitial(draft);

  return (
    <main className="w-full py-8 sm:py-10">
      <header className="mb-2">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Редактирование
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          Те же поля и предпросмотр, что в «Новом посте» — данные подставлены из
          черновика.
        </p>
      </header>

      <NewPostEditor key={postId} initialValues={initialValues} />
    </main>
  );
}
