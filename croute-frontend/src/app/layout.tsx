import type { Metadata } from "next";

import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { AppStoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "C.Route",
  description: "Your career. Your route. Your next move.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col font-body">
        <AppStoreProvider>
          <NavBar />
          <main className="flex flex-1 flex-col">{children}</main>
        </AppStoreProvider>
      </body>
    </html>
  );
}
