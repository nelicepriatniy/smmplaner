/**
 * Поле «Контакт» в карточке клиента — вводят что угодно. Для Bot API `sendMessage`
 * нужен `@username`, числовой id или ссылка t.me/... .
 */
export function parseClientContactToTelegramChatId(
  raw: string | null | undefined
):
  | { ok: true; chatId: string }
  | { ok: false; error: string } {
  const s0 = raw?.trim() ?? "";
  if (!s0) {
    return {
      ok: false,
      error:
        "В карточке клиента не заполнен контакт. Укажите Telegram: @username, ссылку t.me/... или числовой id (клиент должен написать вашему боту /start).",
    };
  }

  const s = s0;

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return {
      ok: false,
      error:
        "В «Контакте» указан email. Для уведомления в Telegram укажите @username, ссылку t.me/... или числовой id чата.",
    };
  }

  const tme = s.match(
    /^(?:https?:\/\/)?(?:t|telegram)\.me\/([a-zA-Z][a-zA-Z0-9_]{4,31})/i
  );
  if (tme) {
    return { ok: true, chatId: `@${tme[1]}` };
  }

  if (s.startsWith("@")) {
    if (!/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(s)) {
      return {
        ok: false,
        error:
          "Некорректный @username. Исправьте поле «Контакт» или укажите числовой id чата в Telegram.",
      };
    }
    return { ok: true, chatId: s };
  }

  if (/^-?\d{1,20}$/.test(s)) {
    return { ok: true, chatId: s };
  }

  if (/^\+?[\d\s().-]{8,}$/.test(s)) {
    return {
      ok: false,
      error:
        "Похоже на телефон, а не на Telegram. Укажите @username, ссылку t.me/... или числовой id.",
    };
  }

  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(s)) {
    return { ok: true, chatId: `@${s}` };
  }

  return {
    ok: false,
    error:
      "Не удалось разобрать «Контакт» для Telegram. Укажите @username, t.me/… или числовой id (например из @userinfobot).",
  };
}
