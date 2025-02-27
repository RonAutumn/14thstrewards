"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
        <h2 className="text-lg font-semibold text-primary">Admin Dashboard</h2>
        <Separator className="my-4" />
      </div>
      <nav className="px-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={item.href} prefetch={false}>
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
