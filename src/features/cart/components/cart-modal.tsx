"use client";

import { useCart } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, X, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { rewardsService } from "@/features/rewards/rewards.service";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

export function CartModal({ open, onClose }: CartModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    deliveryInfo,
    addRedeemedReward,
    removeRedeemedReward,
    redeemedRewards,
  } = useCart();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();
  const [user, setUser] = useState<any>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [availableRewards, setAvailableRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isClient = typeof window !== "undefined";

  const fetchUserAndRewards = async () => {
    if (!user?.id) return;
    
    try {
      const [points, rewards] = await Promise.all([
        rewardsService.getUserPoints(user.id),
        rewardsService.getAvailableRewards(user.id)
      ]);
      
      setUserPoints(points);
      setAvailableRewards(rewards);
    } catch (error) {
      console.error('Error fetching available rewards:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    checkAuth();
    
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch rewards when user changes or modal opens
  useEffect(() => {
    if (open && user?.id) {
      fetchUserAndRewards();
    }
  }, [user?.id, open]);

  const handleRewardRedeem = async (reward: any) => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Please log in to redeem rewards",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      const result = await rewardsService.redeemReward(
        user.id,
        reward.reward_id
      );

      if (!result) {
        toast({
          title: "Error",
          description: "Failed to redeem reward. Please try again.",
          variant: "destructive",
        });
        return;
      }

      addRedeemedReward(reward.reward_id);

      const rewardItem = {
        id: reward.reward_id,
        name: reward.name,
        price: 0,
        quantity: 1,
        originalPrice: reward.price,
        isRedeemed: true,
        pointsCost: reward.pointsCost,
      };

      updateQuantity(rewardItem.id, undefined, 1);

      // Refresh points after successful redemption
      const newPoints = await rewardsService.getUserPoints(user.id);
      if (typeof newPoints === "number") {
        setUserPoints(newPoints);
      }

      toast({
        title: "Success",
        description: `${reward.name} has been added to your cart!`,
      });
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      toast({
        title: "Error",
        description: "Failed to redeem reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewardRemove = async (reward: any) => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Please log in to manage rewards",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      removeRedeemedReward(reward.reward_id);
      removeItem(reward.reward_id);

      // Refresh points after removing reward
      const newPoints = await rewardsService.getUserPoints(user.id);
      if (typeof newPoints === "number") {
        setUserPoints(newPoints);
      }

      toast({
        title: "Success",
        description: `${reward.name} has been removed from your cart.`,
      });
    } catch (error) {
      console.error("Failed to remove reward:", error);
      toast({
        title: "Error",
        description: "Failed to remove reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (
    itemId: string,
    variation: string | undefined,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      removeItem(itemId, variation);
    } else {
      updateQuantity(itemId, variation, newQuantity);
    }
  };

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Add this section to render redeemed rewards in the cart
  const renderRedeemedRewards = () => {
    if (!items.some(item => item.isRedeemed)) return null;

    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Redeemed Rewards</h3>
        {items
          .filter(item => item.isRedeemed)
          .map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.pointsCost} points
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRewardRemove(item)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({itemCount} items)
            </SheetTitle>
            {itemCount > 0 && (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => clearCart()}
              >
                Clear Cart
              </Button>
            )}
          </div>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items
                  .filter(item => !item.isRedeemed)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.selectedVariation && (
                          <p className="text-sm text-muted-foreground">
                            {item.selectedVariation.name}
                          </p>
                        )}
                        <p className="text-sm font-medium">
                          {formatPrice(
                            (item.selectedVariation?.price || item.price) *
                              item.quantity
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.selectedVariation?.name,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.selectedVariation?.name,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() =>
                            removeItem(item.id, item.selectedVariation?.name)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                
                <Separator />
                {renderRedeemedRewards()}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {deliveryInfo.borough && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Delivery Fee
                      </span>
                      {subtotal >= deliveryInfo.freeThreshold ? (
                        <Badge variant="outline" className="text-green-600">
                          Free Delivery
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Free over ${deliveryInfo.freeThreshold}
                        </Badge>
                      )}
                    </div>
                    <span>
                      {deliveryFee > 0 ? formatPrice(deliveryFee) : "Free"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <SheetFooter>
                <Button className="w-full" onClick={handleCheckout}>
                  Checkout
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
