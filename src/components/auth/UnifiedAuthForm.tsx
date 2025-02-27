"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function UnifiedAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const referralCode = searchParams.get("ref");

  const [formState, setFormState] = useState({
    email: "",
    password: "",
    isLoading: false,
    isSignUp: false,
  });

  const handleGoogleSignIn = async () => {
    try {
      setFormState((state) => ({ ...state, isLoading: true }));
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback`;
      const returnTo = searchParams.get("returnTo") || "/rewards";

      console.log("Initiating Google sign-in", {
        origin,
        callbackUrl,
        returnTo,
        currentUrl: window.location.href,
      });

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            returnTo,
          },
          skipBrowserRedirect: false,
          state: JSON.stringify({ returnTo }),
          data: referralCode ? { referral_code: referralCode } : undefined,
        },
      });

      if (error) {
        console.error("Google sign-in error:", {
          error,
          message: error.message,
          status: error.status,
          code: error.code,
        });
        throw error;
      }

      console.log("Google sign-in successful, awaiting redirect", {
        hasData: !!data,
        provider: data?.provider,
        url: data?.url,
      });
    } catch (error) {
      console.error("Google sign-in error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setFormState((state) => ({ ...state, isLoading: false }));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState((state) => ({ ...state, isLoading: true }));

    try {
      const supabase = getSupabaseBrowserClient();
      if (formState.isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formState.email,
          password: formState.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: referralCode ? { referral_code: referralCode } : undefined,
          },
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description:
            "We've sent you a verification link. Please check your email to continue.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formState.email,
          password: formState.password,
        });

        if (error) throw error;

        const returnTo = searchParams.get("returnTo");
        if (returnTo) {
          router.push(returnTo);
        } else {
          router.push("/store");
        }
      }
    } catch (error) {
      console.error("Email auth error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Authentication failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormState((state) => ({ ...state, isLoading: false }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{formState.isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
        <CardDescription>
          {formState.isSignUp
            ? "Create a new account"
            : "Sign in to your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={formState.isLoading}
            className="w-full"
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={formState.email}
                onChange={(e) =>
                  setFormState((state) => ({
                    ...state,
                    email: e.target.value,
                  }))
                }
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={formState.password}
                onChange={(e) =>
                  setFormState((state) => ({
                    ...state,
                    password: e.target.value,
                  }))
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={formState.isLoading}
            >
              {formState.isLoading
                ? "Loading..."
                : formState.isSignUp
                ? "Sign Up"
                : "Sign In"}
            </Button>
          </form>

          <Button
            variant="link"
            onClick={() =>
              setFormState((state) => ({
                ...state,
                isSignUp: !state.isSignUp,
              }))
            }
            className="w-full"
          >
            {formState.isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
