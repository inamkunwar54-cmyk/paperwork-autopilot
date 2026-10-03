import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paperwork Autopilot",
  description: "Stay on top of bills, renewals and official letters.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf8",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { user } = await getUser();

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href={user ? "/dashboard" : "/"} className="whitespace-nowrap text-base font-semibold tracking-tight">
              Paperwork <span className="text-accent">Autopilot</span>
            </Link>
            {user && (
              <nav className="flex items-center gap-0.5 whitespace-nowrap text-sm">
                <Link href="/dashboard" className="rounded-lg px-2 py-2 text-muted hover:text-ink sm:px-3">
                  Home
                </Link>
                <Link href="/settings" className="rounded-lg px-2 py-2 text-muted hover:text-ink sm:px-3">
                  Settings
                </Link>
                <Link
                  href="/add"
                  className="ml-1 rounded-lg bg-accent px-3 py-2 font-medium text-white hover:bg-accent-hover"
                >
                  + Add
                </Link>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-4 pb-8 text-center text-xs text-muted">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              How your documents are processed
            </Link>
            <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </Link>
            <Link href="/legal/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
