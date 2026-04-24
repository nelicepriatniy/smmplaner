export type PanelUserRecord = {
  id: string;
  login: string;
  /** Пока в открытом виде, как мок — позже заменить на хэш. */
  password: string;
};

/** Учётные записи панели (отдельно от контентной mockDb). */
export const panelUsers: PanelUserRecord[] = [
  { id: "user-1", login: "anyasmm", password: "admin" },
];

export function verifyPanelUser(
  login: string,
  password: string
): PanelUserRecord | null {
  const trimmed = login.trim();
  const user = panelUsers.find((u) => u.login === trimmed);
  if (!user || user.password !== password) return null;
  return user;
}
