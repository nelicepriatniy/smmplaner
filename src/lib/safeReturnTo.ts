/**
 * Разрешённые цели «Назад с редактора»: календарь и страница клиента
 * (откуда ведут ссылки с календаря). Защита от open-redirect.
 */
export function safeCalendarReturnTo(
  raw: string | string[] | undefined | null
): string | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s == null || s === "") return null;
  let pathWithQuery: string;
  try {
    pathWithQuery = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (!pathWithQuery.startsWith("/") || pathWithQuery.startsWith("//")) {
    return null;
  }
  const path = pathWithQuery.split("?")[0] ?? "";
  if (path === "/calendar") {
    return pathWithQuery;
  }
  if (path.startsWith("/clients/") && path.length > "/clients/".length) {
    const rest = path.slice("/clients/".length);
    if (!rest.includes("/") && /^[a-zA-Z0-9_-]+$/.test(rest)) {
      return pathWithQuery;
    }
  }
  return null;
}
