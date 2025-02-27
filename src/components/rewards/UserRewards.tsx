"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  rewardsService,
  type Reward,
} from "@/features/rewards/rewards.service";
import { useCart } from "@/lib/store/cart";

interface UserRewardsProps {
  userId: string;
}

export function UserRewards({ userId }: UserRewardsProps) {
  const [points, setPoints] = useState<number>(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [completedRedemptions, setCompletedRedemptions] = useState<
    Record<string, number>
  >({});
  const { toast } = useToast();
  const cart = useCart();

  const refreshData = async () => {
    try {
      const [userPoints, availableRewards, transactions] = await Promise.all([
        rewardsService.getUserPoints(userId),
        rewardsService.getAvailableRewards(),
        rewardsService.getUserTransactions(userId),
      ]);

      // Only count completed transactions
      const history: Record<string, number> = {};
      transactions.forEach((transaction) => {
        if (transaction.type === "REDEEM" && transaction.reward_id) {
          history[transaction.reward_id] =
            (history[transaction.reward_id] || 0) + 1;
        }
      });

      setPoints(userPoints);
      setRewards(availableRewards);
      setCompletedRedemptions(history);
    } catch (error) {
      console.error("Failed to load rewards:", error);
    }
  };

  useEffect(() => {
    refreshData().finally(() => setLoading(false));
  }, [userId]);

  const isRewardInCart = (rewardId: string) => {
    return cart.items.some((item) => item.id === rewardId && item.isRedeemed);
  };

  const handleAddToCart = async (reward: Reward) => {
    if (!reward._id || !reward.reward_id) return;

    // Early exit conditions
    if (points < reward.pointsCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${
          reward.pointsCost - points
        } more points to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }

    const inCart = isRewardInCart(reward.reward_id);
    const hasBeenRedeemed = completedRedemptions[reward.reward_id] || 0;

    // Check welcome reward limitations
    if (reward.reward_id === "welcome_reward") {
      if (hasBeenRedeemed >= 1 || inCart) {
        // Silently return if already redeemed or in cart
        return;
      }
    }

    try {
      setRedeeming(reward.reward_id);

      // If the item is somehow in the cart, remove it first
      if (inCart) {
        cart.removeItem(reward.reward_id);
      }

      // Add to cart with quantity 1
      cart.addItem({
        id: reward.reward_id,
        name: reward.name,
        price: 0,
        originalPrice: reward.price,
        isRedeemed: true,
        pointsCost: reward.pointsCost,
        quantity: 1,
      });

      toast({
        title: "Added to Cart",
        description: `${reward.name} has been added to your cart. Points will be deducted when you complete your order.`,
      });
    } catch (error) {
      console.error("Failed to add reward to cart:", error);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return <div>Loading rewards...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Points: {points}</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const hasBeenRedeemed = completedRedemptions[reward.reward_id] || 0;
          const inCart = isRewardInCart(reward.reward_id);
          const isLimitReached =
            reward.reward_id === "welcome_reward" &&
            (hasBeenRedeemed >= 1 || inCart);
          const isRedeeming = redeeming === reward.reward_id;
          const isDisabled =
            points < reward.pointsCost ||
            isLimitReached ||
            isRedeeming ||
            inCart;

          let buttonText = "Add to Cart";
          if (inCart) buttonText = "In Cart";
          else if (isLimitReached) buttonText = "Already Redeemed";
          else if (isRedeeming) buttonText = "Adding to Cart...";

          return (
            <Card key={reward._id}>
              <CardHeader>
                <CardTitle>{reward.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>{reward.description}</p>
                  <p className="font-semibold">{reward.pointsCost} points</p>
                  {reward.price && reward.price > 0 && (
                    <p className="text-sm text-gray-500">
                      Regular price: ${reward.price.toFixed(2)}
                    </p>
                  )}
                  {typeof reward.quantity !== "undefined" && (
                    <p className="text-sm text-gray-500">
                      {reward.quantity} remaining
                    </p>
                  )}
                  <Button
                    onClick={() => handleAddToCart(reward)}
                    disabled={isDisabled}
                    className="w-full"
                  >
                    {buttonText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
