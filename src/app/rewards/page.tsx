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
  const [pendingPoints, setPendingPoints] = useState<number>(0);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const refreshUserData = async (userId: string) => {
    try {
      setLoading(true);
      
      const [userResponse, transactionsResponse, rewardsResponse] =
        await Promise.all([
          fetch(`/api/rewards/users/${userId}`),
          fetch(`/api/rewards/transactions/${userId}`),
          fetch(`/api/rewards/available?userId=${userId}`),
        ]);

      // Handle each response individually to avoid failing everything if one fails
      let userData = { points: 0 };
      let transactionsData = { pointsHistory: [] };
      let rewardsData = { rewards: [] };

      try {
        if (userResponse.ok) {
          userData = await userResponse.json();
        } else {
          console.error('Failed to fetch user data:', await userResponse.text());
        }
      } catch (error) {
        console.error('Error parsing user response:', error);
      }

      try {
        if (transactionsResponse.ok) {
          transactionsData = await transactionsResponse.json();
        } else {
          console.error('Failed to fetch transactions:', await transactionsResponse.text());
        }
      } catch (error) {
        console.error('Error parsing transactions response:', error);
      }

      try {
        if (rewardsResponse.ok) {
          rewardsData = await rewardsResponse.json();
        } else {
          console.error('Failed to fetch rewards:', await rewardsResponse.text());
        }
      } catch (error) {
        console.error('Error parsing rewards response:', error);
      }

      // Update state with whatever data we successfully retrieved
      setPoints(userData.points || 0);
      setRewards(rewardsData.rewards || []);

      // Format transactions
      const formattedTransactions = (transactionsData.pointsHistory?.map((history: any) => ({
        _id: history.id,
        user_id: history.user_id,
        description: history.description || history.source,
        points: history.change_amount,
        type: history.transaction_type,
        created_at: history.created_at,
        status: "completed" as const,
      })) || []) as Transaction[];

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
      setError(null);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load rewards data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load user data when authenticated
  useEffect(() => {
    if (user) {
      refreshUserData(user.id);
    }
  }, [user]);

  // Add periodic refresh
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      refreshUserData(user.id);
    }, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, [user]);

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          joinDate={user.created_at ? user.created_at : new Date().toISOString()}
        />

        {/* Available Rewards Section */}
        <Card className="p-6">
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
                    <span className="text-lg font-bold">
                      {reward.pointsCost} points
                    </span>
                    <Button
                      onClick={() => {
                        if (points >= reward.pointsCost) {
                          // Handle redemption
                          fetch(`/api/rewards/${reward.reward_id}/redeem`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              userId: user.id,
                            }),
                          })
                            .then((response) => response.json())
                            .then((data) => {
                              if (data.success) {
                                toast({
                                  title: "Success",
                                  description: `Successfully redeemed ${reward.name}`,
                                });
                                refreshUserData(user.id);
                              } else {
                                throw new Error(
                                  data.error || "Failed to redeem reward"
                                );
                              }
                            })
                            .catch((error) => {
                              toast({
                                title: "Error",
                                description: error.message,
                                variant: "destructive",
                              });
                            });
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

        <PointsHistory transactions={transactions as any} />
      </div>
    </Layout>
  );
}
