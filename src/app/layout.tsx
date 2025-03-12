import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootLayoutClient } from "@/components/layout/RootLayoutClient";
import { AuthProvider } from "@/contexts/AuthContext";
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <RootLayoutClient>{children}</RootLayoutClient>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
