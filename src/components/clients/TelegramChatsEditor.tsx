"use client";

import type { TelegramChatTarget } from "@/lib/telegram-targets";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]";

function newTargetRow(): TelegramChatTarget {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : `tg${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return { id, name: "", chatId: "" };
}

type TelegramChatsEditorProps = {
  value: TelegramChatTarget[];
  onChange: (next: TelegramChatTarget[]) => void;
  disabled?: boolean;
};

export function TelegramChatsEditor({
  value,
  onChange,
  disabled = false,
}: TelegramChatsEditorProps) {
  const updateRow = (id: string, patch: Partial<TelegramChatTarget>) => {
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] leading-snug text-[var(--muted)]">
        Укажите один или несколько чатов или каналов. Название видно только вам — в списке при
        создании поста. ID — как в Bot API (число или @username).
      </p>
      {value.map((row, index) => (
        <div
          key={row.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 sm:p-4"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Чат {index + 1}
            </span>
            <button
              type="button"
              disabled={disabled || value.length <= 1}
              onClick={() => onChange(value.filter((x) => x.id !== row.id))}
              className="rounded-lg px-2 py-1 text-[12px] text-rose-300 transition-colors hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Удалить
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                className="text-[13px] font-medium text-[var(--foreground)]"
                htmlFor={`tg-name-${row.id}`}
              >
                Название
              </label>
              <input
                id={`tg-name-${row.id}`}
                type="text"
                autoComplete="off"
                disabled={disabled}
                placeholder="Например: Новости, Закрытый чат"
                className={`mt-1.5 ${inputClass}`}
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label
                className="text-[13px] font-medium text-[var(--foreground)]"
                htmlFor={`tg-chat-${row.id}`}
              >
                ID чата
              </label>
              <input
                id={`tg-chat-${row.id}`}
                type="text"
                autoComplete="off"
                disabled={disabled}
                placeholder="-100… или @channel"
                className={`mt-1.5 font-mono text-[13px] ${inputClass}`}
                value={row.chatId}
                onChange={(e) => updateRow(row.id, { chatId: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...value, newTargetRow()])}
        className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:bg-[var(--surface-elevated)] disabled:opacity-50"
      >
        + Добавить чат
      </button>
      <input
        type="hidden"
        name="telegramChatsJson"
        value={JSON.stringify(
          value.map((t) => ({
            id: t.id,
            name: t.name.trim() || t.chatId.trim(),
            chatId: t.chatId.trim(),
          }))
        )}
      />
    </div>
  );
}

export { newTargetRow };
