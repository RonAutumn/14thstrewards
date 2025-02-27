import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootLayoutClient } from "@/components/layout/RootLayoutClient";
import { SupabaseProvider } from "@/lib/providers/supabase-provider";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Heaven High NYC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <SupabaseProvider>
            <RootLayoutClient>{children}</RootLayoutClient>
          </SupabaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
