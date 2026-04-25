"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientCard } from "@/components/clients/ClientCard";
import type { ClientRecord } from "@/domain/smm";

const btnAddClientClass =
  "inline-flex items-center justify-center rounded-xl border border-transparent bg-[var(--accent)] px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] dark:text-[#12141a]";

function clientsWord(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "клиент";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "клиента";
  return "клиентов";
}

export function ClientsView({ clients }: { clients: ClientRecord[] }) {
  const router = useRouter();
  const n = clients.length;
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);

  const openAdd = () => {
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
  }, []);

  return (
    <main className="w-full py-10 sm:py-12">
      <ClientFormDialog
        isOpen={formOpen}
        onRequestClose={closeForm}
        mode="add"
        client={null}
        session={formSession}
        onSaved={() => router.refresh()}
      />

      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[24px]">
              Клиенты
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--muted)]">
              {n} {clientsWord(n)}
            </p>
          </div>
          <button type="button" onClick={openAdd} className={btnAddClientClass}>
            Добавить клиента
          </button>
        </div>
      </header>

      {n === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-[14px] text-[var(--muted)]">
          Клиентов пока нет. Добавьте клиента кнопкой выше или выполните сид с демо-данными.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </main>
  );
}
