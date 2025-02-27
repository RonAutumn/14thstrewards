"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/auth/auth-utils";
import { useCallback } from "react";

export function AuthListener() {
  // Only render for admin routes
  if (!window.location.pathname.startsWith("/admin")) {
    return null;
  }

  const initialized = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const router = useRouter();
  const lastRefreshTime = useRef<number>(0);
  const REFRESH_THROTTLE = 1000; // 1 second throttle

  const handleAuthChange = useCallback(
    (session: any) => {
      const now = Date.now();
      if (now - lastRefreshTime.current >= REFRESH_THROTTLE) {
        router.refresh();
        lastRefreshTime.current = now;
      }
    },
    [router]
  );

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    // Setup auth listener
    const setupListener = async () => {
      try {
        const { data } = await clientAuth.setupAuthListener(handleAuthChange);

        if (data?.subscription) {
          subscriptionRef.current = data.subscription;
        }
      } catch (error) {
        console.error("Error setting up auth listener:", error);
      }
    };

    setupListener();

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        console.log("Cleaning up auth subscription on unmount");
        subscriptionRef.current.unsubscribe();
        initialized.current = false;
      }
    };
  }, [handleAuthChange]);

  return null;
}
