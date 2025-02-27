"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/delivery", label: "Delivery Management" },
  { href: "/admin/shipping", label: "Shipping Management" },
  { href: "/admin/pickup", label: "Pickup Management" },
  { href: "/admin/store-management", label: "Store Management" },
  { href: "/admin/rewards", label: "Rewards Management" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          Admin Dashboard
        </h2>
      </div>
      <nav className="px-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 