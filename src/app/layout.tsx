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

// Ранний инлайн-скрипт: только так в root layout, без next/script + children.
// `next/script` с телом {string} в React 19 даёт в консоли: «Encountered a script tag
// while rendering React component» (скрипт не в обход дерева client components).
const themeInitScript = `(function(){try{var t=localStorage.getItem("smmplaner-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <AuthSessionProvider>
          <AppNotificationsProvider>{children}</AppNotificationsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
