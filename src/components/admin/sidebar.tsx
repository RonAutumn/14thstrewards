'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/delivery', label: 'Delivery Management' },
  { href: '/admin/shipping', label: 'Shipping Management' },
  { href: '/admin/pickup', label: 'Pickup Management' },
  { href: '/admin/store-management', label: 'Store Management' },
  { href: '/admin/rewards', label: 'Rewards Management' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="w-64 border-r border-border bg-card p-4">
      <h2 className="mb-4 text-xl font-semibold text-primary">Admin Dashboard</h2>
      
      <div className="space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              'w-full justify-start',
              pathname === item.href && 'bg-accent text-accent-foreground'
            )}
            asChild
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>
      
      <div className="mt-auto pt-6">
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive" 
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
} 