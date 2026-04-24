"use client";

import { useCallback, useState } from "react";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientCard } from "@/components/clients/ClientCard";
import { mockClients } from "@/data/mockDb";
import type { ClientRecord } from "@/data/mockDb";

const btnPrimaryClass =
  "inline-flex items-center justify-center rounded-xl border border-transparent bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function clientsWord(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "клиент";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "клиента";
  return "клиентов";
}

export function ClientsView() {
  const n = mockClients.length;
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  const openAdd = () => {
    setFormMode("add");
    setEditingClient(null);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openEdit = (client: ClientRecord) => {
    setFormMode("edit");
    setEditingClient(client);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingClient(null);
  }, []);

  return (
    <main className="w-full py-10 sm:py-12">
      <ClientFormDialog
        isOpen={formOpen}
        onRequestClose={closeForm}
        mode={formMode}
        client={editingClient}
        session={formSession}
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
          <button type="button" onClick={openAdd} className={btnPrimaryClass}>
            Добавить клиента
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {mockClients.map((c) => (
          <ClientCard key={c.id} client={c} onEdit={() => openEdit(c)} />
        ))}
      </div>
    </main>
  );
}
