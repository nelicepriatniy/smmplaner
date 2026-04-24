import type { Metadata } from "next";
import { ClientsView } from "./ClientsView";

export const metadata: Metadata = {
  title: "Клиенты — smmplaner",
  description: "Список клиентов",
};

export default function ClientsPage() {
  return <ClientsView />;
}
