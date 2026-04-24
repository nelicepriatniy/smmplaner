import type { Metadata } from "next";
import { NewPostEditor } from "@/components/posts/NewPostEditor";
import {
  getDefaultPublishSchedule,
  normalizePublishSchedule,
} from "@/components/posts/postReviewUtils";
import {
  getMockPostDraftById,
  mockClients,
  postDraftToEditorInitial,
  type PostEditorInitialValues,
} from "@/data/mockDb";

export const metadata: Metadata = {
  title: "Новый пост — smmplaner",
  description: "Создание поста для Instagram",
};

type PageProps = {
  searchParams: Promise<{ client?: string; duplicateFrom?: string }>;
};

function validClientId(param: string | undefined): string | undefined {
  if (typeof param !== "string" || !mockClients.some((c) => c.id === param)) {
    return undefined;
  }
  return param;
}

/** Копия поста для новой записи: тот же контент, публикация с дефолтного слота. */
function toDuplicateFormValues(
  sourcePostId: string
): PostEditorInitialValues | null {
  const draft = getMockPostDraftById(sourcePostId);
  if (!draft) return null;
  const base = postDraftToEditorInitial(draft);
  const s = normalizePublishSchedule(getDefaultPublishSchedule());
  return { ...base, publishDate: s.date, publishTime: s.time };
}

export default async function NewPostPage({ searchParams }: PageProps) {
  const { client: clientParam, duplicateFrom: duplicateFromId } =
    await searchParams;

  const duplicateFrom: PostEditorInitialValues | null =
    typeof duplicateFromId === "string"
      ? toDuplicateFormValues(duplicateFromId)
      : null;

  const initialClientId =
    duplicateFrom != null ? undefined : validClientId(clientParam);

  const editorKey = duplicateFrom
    ? `dup-${duplicateFromId}`
    : initialClientId
      ? `new-c-${initialClientId}`
      : "new";

  return (
    <main className="w-full py-8 sm:py-10">
      <header className="mb-2">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Новый пост
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          {duplicateFrom
            ? "Скопировано из существующего поста. Дата и время публикации сброшены на ближайший допустимый слот. Смотрите предпросмотр ниже."
            : "Заполните данные и смотрите предпросмотр, как в ленте Instagram."}
        </p>
      </header>

      <NewPostEditor
        key={editorKey}
        initialClientId={initialClientId}
        duplicateFrom={duplicateFrom}
      />
    </main>
  );
}
