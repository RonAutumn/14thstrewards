"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Share2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ReferralCodeProps {
  userId: string;
}

export function ReferralCode({ userId }: ReferralCodeProps) {
  const [referralCode, setReferralCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (userId) {
      fetchReferralCode();
    }
  }, [userId]);

  const fetchReferralCode = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // If no referral code exists, generate one
      if (!data?.referral_code) {
        const newCode = generateReferralCode();
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ referral_code: newCode })
          .eq("id", userId);

        if (updateError) throw updateError;
        setReferralCode(newCode);
      } else {
        setReferralCode(data.referral_code);
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
      toast({
        title: "Error",
        description: "Failed to load referral code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = () => {
    // Generate a random 8-character code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyToClipboard = async () => {
    try {
      const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy referral link",
        variant: "destructive",
      });
    }
  };

  const shareReferralCode = async () => {
    try {
      const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
      const shareData = {
        title: "Join me on 14th Street Store!",
        text: "Sign up using my referral code and get bonus points!",
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared!",
          description: "Thanks for sharing your referral code",
        });
      } else {
        await copyToClipboard();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Error",
          description: "Failed to share referral code",
          variant: "destructive",
        });
      }
    }
  };

  if (!userId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-2xl font-mono">{referralCode}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Share this code with friends and you'll both earn bonus points when
          they make their first purchase!
        </p>
        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button
            onClick={shareReferralCode}
            variant="default"
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
