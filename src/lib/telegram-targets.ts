export type TelegramChatTarget = {
  id: string;
  name: string;
  chatId: string;
};

export function parseTelegramChatsJson(value: unknown): TelegramChatTarget[] {
  if (!Array.isArray(value)) return [];
  const out: TelegramChatTarget[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    const name = String(o.name ?? "").trim();
    const chatId = String(o.chatId ?? "").trim();
    if (!id || !chatId) continue;
    out.push({ id, name: name || chatId, chatId });
  }
  return out;
}

/** Цели из JSON колонки + запасной вариант по legacy `telegramChatId`. */
export function normalizeAccountTelegramChats(
  telegramChats: unknown,
  legacyTelegramChatId: string | null | undefined
): TelegramChatTarget[] {
  const fromJson = parseTelegramChatsJson(telegramChats);
  if (fromJson.length > 0) return fromJson;
  const leg = legacyTelegramChatId?.trim();
  if (!leg) return [];
  return [{ id: "legacy", name: "Основной", chatId: leg }];
}

export function targetsToJsonForDb(targets: TelegramChatTarget[]): unknown {
  return targets.map((t) => ({
    id: t.id,
    name: t.name.trim() || t.chatId,
    chatId: t.chatId.trim(),
  }));
}

/** Первый chat_id для колонки-наследия `telegram_chat_id`. */
export function firstTelegramChatIdForLegacyColumn(
  targets: TelegramChatTarget[]
): string | null {
  const first = targets[0]?.chatId?.trim();
  return first || null;
}

export function parsePostTelegramTargetIds(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t) as unknown;
      return parsePostTelegramTargetIds(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const x of value) {
    if (typeof x === "string") {
      const s = x.trim();
      if (s) out.push(s);
    } else if (typeof x === "number" && Number.isFinite(x)) {
      out.push(String(x));
    }
  }
  return out;
}

/** Разрешённые chat_id Bot API по сохранённым id целей (порядок сохраняется). */
export function resolveTelegramChatIdsForTargets(
  accountTargets: TelegramChatTarget[],
  selectedIds: string[]
): { ok: true; chatIds: string[] } | { ok: false; error: string } {
  if (selectedIds.length === 0) {
    return {
      ok: false,
      error: "Выберите хотя бы один чат Telegram для отправки.",
    };
  }
  const byId = new Map(accountTargets.map((t) => [t.id, t]));
  const chatIds: string[] = [];
  for (const sid of selectedIds) {
    const t = byId.get(sid);
    if (!t) {
      return {
        ok: false,
        error: "Указан неизвестный чат Telegram. Сохраните пост и обновите список чатов в карточке клиента.",
      };
    }
    chatIds.push(t.chatId.trim());
  }
  return { ok: true, chatIds };
}

export function labelsForSelectedTargets(
  accountTargets: TelegramChatTarget[],
  selectedIds: string[]
): string {
  const byId = new Map(accountTargets.map((t) => [t.id, t]));
  const parts = selectedIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((t) => t!.name.trim() || t!.chatId);
  if (!parts.length) return "";
  return parts.join(", ");
}
