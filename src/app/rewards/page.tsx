"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { User } from "@supabase/supabase-js";
import Layout from "@/components/layout/Layout";
import UserProfile from "@/components/rewards/UserProfile";
import PointsHistory from "@/components/rewards/PointsHistory";
import { RedeemCode } from "@/components/rewards/RedeemCode";
import { useCart } from "@/lib/store/cart";
import { rewardsService } from "@/features/rewards/rewards.service";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";

interface Reward {
  reward_id: string;
  name: string;
  description: string;
  pointsCost: number;
  price?: number;
  isActive: boolean;
  quantity?: number;
  expiresAt?: Date;
  createdAt?: string;
  updatedAt?: string;
}

interface Transaction {
  _id: string;
  user_id: string;
  description: string;
  points: number;
  type: "EARN" | "REDEEM";
  created_at: string | { $date: string };
  reward_code?: string;
  reward_id?: string;
  status?: "completed" | "points_update_failed";
}

export default function RewardsPage() {
  const [points, setPoints] = useState<number>(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pendingPoints, setPendingPoints] = useState<number>(0);
  const { toast } = useToast();
  const { addItem } = useCart();

  const refreshUserData = async (userId: string) => {
    try {
      const [userResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/rewards/users/${userId}`),
        fetch(`/api/rewards/transactions/${userId}`),
      ]);

      if (!userResponse.ok || !transactionsResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();
      const transactionsData = await transactionsResponse.json();

      // Update points from user data
      setPoints(userData.points || 0);

      // Update transactions
      const formattedTransactions =
        transactionsData.pointsHistory?.map((history: any) => ({
          _id: history.id,
          user_id: history.user_id,
          description: history.description || history.source,
          points: history.change_amount,
          type: history.transaction_type,
          created_at: history.created_at,
          status: "completed",
        })) || [];

      setTransactions(formattedTransactions);

      // Calculate pending points
      const pendingPoints = formattedTransactions.reduce((total, t) => {
        if (t.type === "EARN" && t.status !== "points_update_failed") {
          return total + t.points;
        }
        if (t.type === "REDEEM" && t.status !== "points_update_failed") {
          return total - t.points;
        }
        return total;
      }, 0);

      setPendingPoints(pendingPoints);
      setLoading(false);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await getSupabaseBrowserClient().auth.getSession();
        if (error) throw error;

        setUser(session?.user ?? null);
        if (session?.user) {
          await refreshUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setError("Failed to initialize authentication");
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = getSupabaseBrowserClient().auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await refreshUserData(session.user.id);
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add periodic refresh
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      refreshUserData(user.id);
    }, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">Sign in to view rewards</h1>
            <UnifiedAuthForm />
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <UserProfile
          points={points}
          pendingPoints={pendingPoints}
          user={user}
        />
        <PointsHistory transactions={transactions} />
      </div>
    </Layout>
  );
}
