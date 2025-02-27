import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ShoppingBag, LogOut } from "lucide-react";
import { ReferralCode } from "@/components/rewards/ReferralCode";
import { User } from "@supabase/supabase-js";

const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 10000,
} as const;

const TIER_BENEFITS = {
  BRONZE: {
    pointMultiplier: 1,
    discountPercentage: 0,
    freeShipping: false,
  },
  SILVER: {
    pointMultiplier: 1.2,
    discountPercentage: 5,
    freeShipping: false,
  },
  GOLD: {
    pointMultiplier: 1.5,
    discountPercentage: 10,
    freeShipping: true,
  },
  PLATINUM: {
    pointMultiplier: 2,
    discountPercentage: 15,
    freeShipping: true,
    customBenefits: ["Priority Support", "Early Access to New Products"],
  },
} as const;

const TIER_COLORS = {
  BRONZE: "bg-orange-200 text-orange-700",
  SILVER: "bg-gray-200 text-gray-700",
  GOLD: "bg-yellow-200 text-yellow-700",
  PLATINUM: "bg-purple-200 text-purple-700",
} as const;

interface UserProfileProps {
  points: number;
  pendingPoints: number;
  user: User;
  tier?: string;
  joinDate: string;
  birthDate?: string;
  isLoading?: boolean;
  error?: string;
}

function calculateTierProgress(points: number): {
  currentTier: keyof typeof TIER_THRESHOLDS;
  nextTier: keyof typeof TIER_THRESHOLDS | null;
  progress: number;
  pointsToNext: number;
} {
  const tiers = Object.entries(TIER_THRESHOLDS);
  for (let i = tiers.length - 1; i >= 0; i--) {
    const [tier, threshold] = tiers[i];
    if (points >= threshold) {
      const nextTier = tiers[i + 1];
      const currentTierThreshold = threshold;
      const nextTierThreshold = nextTier ? nextTier[1] : threshold;
      const progress = nextTier
        ? ((points - currentTierThreshold) /
            (nextTierThreshold - currentTierThreshold)) *
          100
        : 100;

      return {
        currentTier: tier as keyof typeof TIER_THRESHOLDS,
        nextTier: nextTier
          ? (nextTier[0] as keyof typeof TIER_THRESHOLDS)
          : null,
        progress: Math.min(progress, 100),
        pointsToNext: nextTier ? nextTierThreshold - points : 0,
      };
    }
  }
  return {
    currentTier: "BRONZE",
    nextTier: "SILVER",
    progress: 0,
    pointsToNext: TIER_THRESHOLDS.SILVER,
  };
}

export default function UserProfile({
  points,
  pendingPoints,
  user,
  joinDate,
  birthDate,
  isLoading = false,
  error,
}: UserProfileProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const validPoints = typeof points === "number" && !isNaN(points) ? points : 0;
  const { currentTier, nextTier, progress, pointsToNext } =
    calculateTierProgress(validPoints);

  const currentBenefits = TIER_BENEFITS[currentTier];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <p>Error loading profile: {error}</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{points.toLocaleString()}</div>
          {pendingPoints > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              + {pendingPoints.toLocaleString()} pending points
            </p>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            Email: {user.email}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={TIER_COLORS[currentTier]}>{currentTier}</Badge>
              {nextTier && (
                <span className="text-sm text-muted-foreground">
                  {pointsToNext.toLocaleString()} points to {nextTier}
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            <div className="space-y-2">
              <h4 className="font-semibold">Current Benefits:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {currentBenefits.pointMultiplier}x Points Multiplier</li>
                {currentBenefits.discountPercentage > 0 && (
                  <li>• {currentBenefits.discountPercentage}% Order Discount</li>
                )}
                {currentBenefits.freeShipping && <li>• Free Shipping</li>}
                {currentBenefits.customBenefits?.map((benefit, index) => (
                  <li key={index}>• {benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.id && <ReferralCode userId={user.id} />}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push('/store')}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Shop Now
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
