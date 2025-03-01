import React from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <main className={cn("min-h-screen flex flex-col", className)}>
      <div className="flex-grow">{children}</div>
    </main>
  );
};

export default Layout;
