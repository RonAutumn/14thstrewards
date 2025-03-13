"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { rewardsService } from "@/features/rewards/rewards.service";
import { Badge } from "@/components/ui/badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { createClient } from "@/lib/supabase/client";

interface NavigationProps {
  children?: React.ReactNode;
}

function Navigation({ children }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
    const checkAuthAndLoadPoints = async () => {
      try {
        if (!supabase) {
          console.error('Supabase client not initialized');
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth session:', error);
          return;
        }

        setIsAuthenticated(!!session);

        if (session?.user?.id) {
          try {
            const userPoints = await rewardsService.getUserPoints(session.user.id);
            setPoints(userPoints);
          } catch (error) {
            console.error('Failed to load points:', error);
          }
        }
      } catch (error) {
        console.error('Error in auth check:', error);
      }
    };

    checkAuthAndLoadPoints();

    // Subscribe to auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setIsAuthenticated(!!session);
        if (session?.user?.id) {
          try {
            const userPoints = await rewardsService.getUserPoints(session.user.id);
            setPoints(userPoints);
          } catch (error) {
            console.error('Failed to load points:', error);
          }
        } else {
          setPoints(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleRewardsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
        if (!supabase) {
          console.error('Supabase client not initialized');
          localStorage.setItem('redirectAfterAuth', '/rewards');
          router.push('/auth/signin');
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session check error:', error);
            localStorage.setItem('redirectAfterAuth', '/rewards');
            router.push('/auth/signin');
            return;
        }

        if (!session) {
            localStorage.setItem('redirectAfterAuth', '/rewards');
            router.push('/auth/signin');
            return;
        }

        // If we have a valid session, navigate to rewards
        router.push('/rewards');
    } catch (error) {
        console.error('Error checking session:', error);
        localStorage.setItem('redirectAfterAuth', '/rewards');
        router.push('/auth/signin');
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
  ];

  // Don't render anything until we're on the client
  if (!isClient) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo and Main Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Heaven High NYC</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section - Rewards and Cart */}
        <div className="flex items-center gap-4">
          {/* Rewards Button */}
          <div className="flex items-center gap-2">
            <GradientButton
              asChild
              variant={pathname === "/rewards" ? "variant" : "default"}
              onClick={handleRewardsClick}
            >
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span>Rewards</span>
                {isAuthenticated && points !== null && (
                  <Badge variant="secondary" className="ml-1 bg-white/20">
                    {points} pts
                  </Badge>
                )}
              </div>
            </GradientButton>
          </div>

          {/* Cart (if provided) */}
          {children}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-200 ease-in-out",
          isMobileMenuOpen ? "max-h-64" : "max-h-0"
        )}
      >
        <div className="py-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block px-4 py-2 text-base font-medium transition-colors",
                "hover:bg-gray-100 hover:text-gray-900",
                "dark:hover:bg-gray-800 dark:hover:text-gray-50",
                pathname === link.href
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                  : "text-gray-600 dark:text-gray-400"
              )}
              onClick={() => {
                setIsMobileMenuOpen(false);
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

export default Navigation;
