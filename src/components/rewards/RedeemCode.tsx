"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  points: number;
  membership_level: string;
  created_at: string;
  total_spent: number;
  streak: number;
  last_activity: string;
}

export function RedeemCode() {
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/users/current");
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      console.log("Fetched user data:", data);

      if (!data.user) {
        throw new Error("No user data found");
      }

      return {
        id: data.user.id,
        points: data.user.points,
        membership_level: data.user.membership_level,
        created_at: data.user.created_at,
        total_spent: data.user.total_spent,
        streak: data.user.streak,
        last_activity: data.user.last_activity,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const userData = await fetchUserProfile();
        if (mounted) {
          setUserProfile(userData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reward code",
        variant: "destructive",
      });
      return;
    }

    if (!userProfile) {
      toast({
        title: "Error",
        description: "Unable to redeem code at this time",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRedeeming(true);

      const response = await fetch("/api/reward-codes/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          userId: userProfile.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to redeem code");
      }

      // Update local user profile data
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              points: data.currentPoints,
            }
          : null
      );

      toast({
        title: "Success",
        description: data.isPromo
          ? `Successfully redeemed ${data.pointsAwarded} points! Current balance: ${data.currentPoints} points`
          : `Reward code redeemed successfully! Current balance: ${data.currentPoints} points`,
      });
      setCode("");

      // Refresh the page to update points display
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to redeem code",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const isInputDisabled = isLoading || !userProfile || isRedeeming;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem Reward Code</CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading..."
            : !userProfile
            ? "Unable to load user data"
            : "Enter your reward code below to claim your reward"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRedeem} className="flex flex-col space-y-4">
          <Input
            type="text"
            placeholder="Enter reward code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isInputDisabled}
          />
          <Button type="submit" disabled={isInputDisabled}>
            {isRedeeming ? "Redeeming..." : "Redeem Code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
