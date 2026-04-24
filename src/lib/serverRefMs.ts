import { connection } from "next/server";

/** Время «сейчас» на сервере для подписей и агрегатов. Требует динамического рендера. */
export async function getServerRefMs(): Promise<number> {
  await connection();
  return Date.now();
}
