import { ClientLayout } from "@/components/layout/client-layout";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}