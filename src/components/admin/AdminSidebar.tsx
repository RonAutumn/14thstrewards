"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/delivery", label: "Delivery Management" },
  { href: "/admin/shipping", label: "Shipping Management" },
  { href: "/admin/pickup", label: "Pickup Management" },
  { href: "/admin/store-management", label: "Store Management" },
  { href: "/admin/rewards", label: "Rewards Management" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800">
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
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 