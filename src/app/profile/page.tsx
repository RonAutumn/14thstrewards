"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import UserProfile from "@/components/rewards/UserProfile";
import { InfoRewards } from "@/components/rewards/InfoRewards";
import { AddressManager } from "@/components/rewards/AddressManager";
import { useToast } from "@/components/ui/use-toast";

interface UserData {
  id: string;
  points: number;
  membership_level: string;
  created_at: string;
  birth_date: string | null;
  email: string;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const refreshUserData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setError("User not found");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) {
        setError("Profile not found");
        return;
      }

      setUserData({
        ...profile,
        email: user.email || "",
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data");
      toast({
        title: "Error",
        description: "Failed to load your profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [supabase, toast]);

  const handleAddressVerified = () => {
    refreshUserData(); // Refresh user data to update points and completion status
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <UserProfile
        points={userData?.points || 0}
        tier={userData?.membership_level}
        joinDate={userData?.created_at || new Date().toISOString()}
        birthDate={userData?.birth_date || undefined}
        userId={userData?.id || ""}
        isLoading={isLoading}
        error={error || undefined}
      />

      {userData && (
        <>
          <InfoRewards userId={userData.id} userEmail={userData.email} />
          <AddressManager
            userId={userData.id}
            onAddressVerified={handleAddressVerified}
          />
        </>
      )}
    </div>
  );
}
