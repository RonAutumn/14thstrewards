"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import UserProfile from "@/components/rewards/UserProfile";
import PointsHistory from "@/components/rewards/PointsHistory";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { useRouter } from "next/navigation";

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

// Define the Transaction interface to match what's used in the component
interface Transaction {
  id: string;
  user_id: string;
  points_before: number;
  points_after: number;
  change_amount: number;
  transaction_type: "EARN" | "REDEEM";
  source: string;
  metadata?: any;
  created_at: string;
  expires_at?: string | null;
  order_id?: string | null;
}

export default function RewardsPage() {
  const [points, setPoints] = useState<number>(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPoints, setPendingPoints] = useState<number>(0);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('Auth State:', {
      user: user ? 'exists' : 'null',
      userId: user?.id,
      authLoading,
      loading,
      error,
      timestamp: new Date().toISOString()
    });
  }, [user, authLoading, loading, error]);

  const refreshUserData = async (userId: string) => {
    try {
      console.log('Refreshing user data for:', userId);
      setLoading(true);
      
      const [userResponse, transactionsResponse, rewardsResponse] =
        await Promise.all([
          fetch(`/api/rewards/users/${userId}`),
          fetch(`/api/rewards/transactions/${userId}`),
          fetch(`/api/rewards/available?userId=${userId}`),
        ]);

      // Log responses for debugging
      console.log('API Responses:', {
        user: { status: userResponse.status, ok: userResponse.ok },
        transactions: { status: transactionsResponse.status, ok: transactionsResponse.ok },
        rewards: { status: rewardsResponse.status, ok: rewardsResponse.ok }
      });

      // Handle each response individually to avoid failing everything if one fails
      let userData = { profile: { points: 0, membership_level: 'Bronze' } };
      let transactionsData = { pointsHistory: [] };
      let rewardsData = { rewards: [] };

      try {
        if (userResponse.ok) {
          const data = await userResponse.json();
          userData = { profile: data };
          console.log('User data:', userData);
        } else {
          throw new Error(await userResponse.text());
        }

        if (transactionsResponse.ok) {
          transactionsData = await transactionsResponse.json();
          console.log('Transactions data:', transactionsData);
        } else {
          throw new Error(await transactionsResponse.text());
        }

        if (rewardsResponse.ok) {
          rewardsData = await rewardsResponse.json();
          console.log('Rewards data:', rewardsData);
        } else {
          throw new Error(await rewardsResponse.text());
        }

        // Update state with data
        setPoints(userData.profile?.points || 0);
        setUserData(userData);
        setRewards(rewardsData.rewards || []);

        // Format transactions
        const formattedTransactions = (transactionsData?.pointsHistory?.map((history: any) => ({
          id: history.id || `temp-${Date.now()}`,
          user_id: history.user_id,
          points_before: Number(history.points_before) || 0,
          points_after: Number(history.points_after) || 0,
          change_amount: Number(history.change_amount) || 0,
          transaction_type: history.transaction_type || "EARN",
          source: history.source || 'Unknown',
          metadata: history.metadata,
          created_at: history.created_at || new Date().toISOString(),
          expires_at: history.expires_at,
          order_id: history.order_id
        })).filter(Boolean) || []) as Transaction[];

        console.log('Formatted transactions:', formattedTransactions);
        setTransactions(formattedTransactions);

        // Calculate pending points
        const pendingPoints = formattedTransactions.reduce((total, t) => {
          if (!t.change_amount) return total;
          return t.transaction_type === "EARN" 
            ? total + t.change_amount 
            : total - t.change_amount;
        }, 0);

        setPendingPoints(pendingPoints);
        setError(null);
      } catch (error) {
        console.error("Error processing responses:", error);
        setError(error instanceof Error ? error.message : "Failed to process data");
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      setError(error instanceof Error ? error.message : "Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  };

  // Load user data when authenticated
  useEffect(() => {
    if (!authLoading && user) {
      refreshUserData(user.id);
    }
  }, [user, authLoading]);

  // Add periodic refresh
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      refreshUserData(user.id);
    }, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, [user]);

  // Combined loading state
  if (authLoading || (!user && authLoading)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Checking authentication...</span>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show login form if not authenticated
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

  // Show loading state while fetching rewards data
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading rewards data...</span>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p>{error}</p>
            <Button onClick={() => refreshUserData(user.id)} className="mt-4">
              Retry
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show rewards page
  return (
    <Layout className="bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <UserProfile
          points={points}
          pendingPoints={pendingPoints}
          user={user}
          tier={userData?.profile?.membership_level}
          joinDate={user.created_at ? user.created_at : new Date().toISOString()}
        />

        {/* Available Rewards Section */}
        <Card>
          <h2 className="text-2xl font-bold mb-6">Available Rewards</h2>
          <div className="space-y-4">
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rewards available at the moment.
              </div>
            ) : (
              rewards.map((reward) => (
                <Card key={reward.reward_id} className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{reward.name}</h3>
                  <p className="text-muted-foreground mb-4">{reward.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{reward.pointsCost} points</span>
                    <Button
                      onClick={() => {
                        if (points >= reward.pointsCost) {
                          // Handle reward redemption
                        } else {
                          toast({
                            title: "Insufficient Points",
                            description: `You need ${
                              reward.pointsCost - points
                            } more points to redeem this reward`,
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={points < reward.pointsCost}
                    >
                      Redeem
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        <PointsHistory transactions={transactions} />
      </div>
    </Layout>
  );
}
