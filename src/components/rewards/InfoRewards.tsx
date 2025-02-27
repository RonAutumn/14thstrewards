"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Check,
  X,
  Phone,
  Mail,
  Home,
  Gift,
  Image,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoRewardsProps {
  userId: string;
  userEmail: string;
  className?: string;
}

interface InfoSection {
  id: string;
  title: string;
  points: number;
  icon: React.ComponentType<any>;
  isCompleted: boolean;
  isVerified: boolean;
  description: string;
}

export function InfoRewards({
  userId,
  userEmail,
  className,
}: InfoRewardsProps) {
  const [infoSections, setInfoSections] = useState<InfoSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingPoints, setClaimingPoints] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const response = await fetch(`/api/profile/${userId}/info-status`);
        if (!response.ok) throw new Error("Failed to fetch profile status");
        const data = await response.json();

        setInfoSections([
          {
            id: "phone",
            title: "Phone Verification",
            points: 500,
            icon: Phone,
            isCompleted: data.phone_verified || false,
            isVerified: data.phone_verified || false,
            description: "Verify your phone number for secure account access",
          },
          {
            id: "birthday",
            title: "Birthday",
            points: 500,
            icon: Gift,
            isCompleted: data.birth_date !== null,
            isVerified: data.birth_date !== null,
            description:
              "Add your birthday to receive special birthday rewards",
          },
          {
            id: "address",
            title: "Address Information",
            points: 750,
            icon: Home,
            isCompleted: data.has_address || false,
            isVerified: data.address_verified || false,
            description: "Add your address for delivery and shipping options",
          },
          {
            id: "preferences",
            title: "Shopping Preferences",
            points: 250,
            icon: Settings,
            isCompleted: data.has_preferences || false,
            isVerified: true, // Always verified as it's user preference
            description:
              "Tell us your shopping preferences for personalized recommendations",
          },
          {
            id: "newsletter",
            title: "Newsletter Signup",
            points: 250,
            icon: Mail,
            isCompleted: data.newsletter_subscribed || false,
            isVerified: data.newsletter_subscribed || false,
            description: "Subscribe to our newsletter for exclusive offers",
          },
          {
            id: "profile_picture",
            title: "Profile Picture",
            points: 250,
            icon: Image,
            isCompleted: data.has_profile_picture || false,
            isVerified: data.has_profile_picture || false,
            description: "Add a profile picture to personalize your account",
          },
        ]);
      } catch (error) {
        console.error("Error fetching profile status:", error);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStatus();
  }, [userId, toast]);

  const calculateProgress = () => {
    if (!infoSections.length) return 0;
    const completed = infoSections.filter(
      (section) => section.isCompleted
    ).length;
    return (completed / infoSections.length) * 100;
  };

  const getTotalAvailablePoints = () => {
    return infoSections
      .filter((section) => !section.isCompleted)
      .reduce((total, section) => total + section.points, 0);
  };

  const handleClaimPoints = async (sectionId: string) => {
    try {
      setClaimingPoints(sectionId);
      const response = await fetch("/api/profile/claim-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          infoType: sectionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to claim points");

      const data = await response.json();

      setInfoSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, isCompleted: true } : section
        )
      );

      toast({
        title: "Success!",
        description: `You earned ${data.pointsAwarded} points!`,
      });
    } catch (error) {
      console.error("Error claiming points:", error);
      toast({
        title: "Error",
        description: "Failed to claim points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClaimingPoints(null);
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const progress = calculateProgress();
  const availablePoints = getTotalAvailablePoints();

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Profile Completion</h3>
          <div className="flex justify-between text-sm mb-2">
            <span>{Math.round(progress)}% Complete</span>
            <span>{availablePoints} points available</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid gap-4">
          {infoSections.map((section) => (
            <Card
              key={section.id}
              className={cn(
                "p-4 transition-colors",
                section.isCompleted ? "bg-green-50" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      section.isCompleted ? "bg-green-100" : "bg-gray-100"
                    )}
                  >
                    <section.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{section.title}</h4>
                    <p className="text-sm text-gray-500">
                      {section.description}
                    </p>
                    {section.isCompleted ? (
                      <span className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <Check className="h-4 w-4" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-sm text-blue-600">
                        {section.points} points available
                      </span>
                    )}
                  </div>
                </div>
                {!section.isCompleted && section.isVerified && (
                  <Button
                    size="sm"
                    onClick={() => handleClaimPoints(section.id)}
                    disabled={claimingPoints === section.id}
                  >
                    {claimingPoints === section.id
                      ? "Claiming..."
                      : "Claim Points"}
                  </Button>
                )}
                {section.isVerified ? (
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}
