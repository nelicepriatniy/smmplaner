"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";

const btnAccentClass =
  "inline-flex items-center justify-center rounded-xl border border-transparent bg-[var(--accent)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-4 sm:py-2.5 sm:text-[14px] sm:font-medium dark:text-[#12141a]";

export function DashboardHeaderActions() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);

  const openAddClient = () => {
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
  }, []);

  return (
    <>
      <ClientFormDialog
        isOpen={formOpen}
        onRequestClose={closeForm}
        mode="add"
        client={null}
        session={formSession}
        onSaved={() => router.refresh()}
      />
      <div className="flex w-full flex-shrink-0 flex-row flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
        <Link href="/posts/new" className={btnAccentClass}>
          Создать пост
        </Link>
        <button type="button" onClick={openAddClient} className={btnAccentClass}>
          Добавить клиента
        </button>
      </div>
    </>
  );
}
