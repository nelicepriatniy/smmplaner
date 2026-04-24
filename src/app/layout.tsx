import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/auth/SessionProvider";
import { AppNotificationsProvider } from "@/components/notifications/AppNotifications";
import "./globals.css";

export const metadata: Metadata = {
  title: "smmplaner",
  description: "SMM planner",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("smmplaner-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Inline в head: выполняется до paint, без next/script (React 19 не ренерит inline Script в body). */}
        <script
          // eslint-disable-next-line react/no-danger -- синхронная инициализация темы из localStorage
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="antialiased">
        <AuthSessionProvider>
          <AppNotificationsProvider>{children}</AppNotificationsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
