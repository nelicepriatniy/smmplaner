import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import {
  PANEL_SESSION_COOKIE,
  verifyPanelSessionValue,
} from "@/lib/panelSession";

export default async function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get(PANEL_SESSION_COOKIE)?.value;
  const session = await verifyPanelSessionValue(token);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh">
      <AppSidebar />
      <div className="box-border ml-[260px] flex min-h-dvh min-w-0 w-[calc(100%-260px)] flex-col px-5 sm:px-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
