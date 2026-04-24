import { randomBytes } from "node:crypto";

/** Уникальный секрет для ссылки клиентского просмотра. */
export function newClientReviewToken(): string {
  return `smmrv_${randomBytes(24).toString("hex")}`;
}
