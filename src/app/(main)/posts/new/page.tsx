import type { Metadata } from "next";
import { NewPostEditor } from "@/components/posts/NewPostEditor";
import {
  getDefaultPublishSchedule,
  normalizePublishSchedule,
} from "@/components/posts/postReviewUtils";
import {
  postDraftToEditorInitial,
  type PostEditorInitialValues,
} from "@/domain/smm";
import { getServerRefMs } from "@/lib/serverRefMs";
import {
  getPostForUser,
  listClientsForUser,
  requireUserId,
} from "@/lib/smm-data";

export const metadata: Metadata = {
  title: "Новый пост — smmplaner",
  description: "Создание поста для Instagram",
};

type PageProps = {
  searchParams: Promise<{ client?: string; duplicateFrom?: string }>;
};

function validClientId(
  clients: { id: string }[],
  param: string | undefined
): string | undefined {
  if (typeof param !== "string" || !clients.some((c) => c.id === param)) {
    return undefined;
  }
  return param;
}

function toDuplicateFormValues(
  sourcePostId: string,
  userId: string
): Promise<PostEditorInitialValues | null> {
  return getPostForUser(userId, sourcePostId).then((draft) => {
    if (!draft) return null;
    const base = postDraftToEditorInitial(draft);
    const s = normalizePublishSchedule(getDefaultPublishSchedule());
    return { ...base, publishDate: s.date, publishTime: s.time };
  });
}

export default async function NewPostPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const refMs = await getServerRefMs();
  const clients = await listClientsForUser(userId, refMs);
  const { client: clientParam, duplicateFrom: duplicateFromId } =
    await searchParams;

  const duplicateFrom: PostEditorInitialValues | null =
    typeof duplicateFromId === "string"
      ? await toDuplicateFormValues(duplicateFromId, userId)
      : null;

  const initialClientId =
    duplicateFrom != null ? undefined : validClientId(clients, clientParam);

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
        clients={clients}
        initialClientId={initialClientId}
        duplicateFrom={duplicateFrom}
      />
    </main>
  );
}
