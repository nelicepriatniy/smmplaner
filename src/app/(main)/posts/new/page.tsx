import type { Metadata } from "next";
import { NewPostEditor } from "@/components/posts/NewPostEditor";

export const metadata: Metadata = {
  title: "Новый пост — smmplaner",
  description: "Создание поста для Instagram",
};

export default function NewPostPage() {
  return (
    <main className="w-full py-8 sm:py-10">
      <header className="mb-2">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
          Новый пост
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">
          Заполните данные и смотрите предпросмотр, как в ленте Instagram.
        </p>
      </header>

      <NewPostEditor />
    </main>
  );
}
