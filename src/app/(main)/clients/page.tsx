import type { Metadata } from "next";
import { ClientsView } from "./ClientsView";
import { getServerRefMs } from "@/lib/serverRefMs";
import { listClientsForUser, requireUserId } from "@/lib/smm-data";

export const metadata: Metadata = {
  title: "Клиенты — smmplaner",
  description: "Список клиентов",
};

export default async function ClientsPage() {
  const userId = await requireUserId();
  const refMs = await getServerRefMs();
  const clients = await listClientsForUser(userId, refMs);
  return <ClientsView clients={clients} />;
}
