"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useId } from "react";
import { Vortex } from "@/components/ui/vortex";

const supabase = getSupabaseBrowserClient();

export default function LoginPage() {
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              remember_me: rememberMe,
            },
          },
        });
        if (error) {
          setError(error.message);
        } else {
          setError("Please check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
        } else {
          router.push("/store");
          router.refresh();
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/store`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data?.url) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          const a = document.createElement("a");
          a.href = data.url;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      setError("An unexpected error occurred with Google login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Vortex
      backgroundColor="#000000"
      baseHue={200}
      baseSpeed={0.3}
      rangeSpeed={0.5}
      particleCount={800}
      baseRadius={0.5}
      rangeRadius={1.5}
      className="fixed inset-0 flex items-center justify-center"
      containerClassName="h-screen w-screen"
    >
      <div className="w-full max-w-md mx-auto px-4 space-y-4">
        <Dialog>
          <div className="space-y-4">
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-black/50 hover:bg-black/70 text-white border-white/20 h-12 text-base"
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </Button>
            </DialogTrigger>

            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-black/50 hover:bg-black/70 text-white border-white/20 h-12 text-base"
                onClick={() => setIsSignUp(true)}
              >
                Create Account
              </Button>
            </DialogTrigger>
          </div>

          <DialogContent className="bg-black/95 border-white/10 text-white max-h-[95vh] overflow-hidden">
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20"
                aria-hidden="true"
              >
                <svg
                  className="stroke-white/80"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                >
                  <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
                </svg>
              </div>
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-center text-white text-xl">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </DialogTitle>
                <DialogDescription className="text-center text-gray-400 text-sm">
                  {isSignUp
                    ? "Enter your details to create your account"
                    : "Sign in to your account to continue"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor={`${id}-email`} className="text-gray-300">
                  Email
                </Label>
                <Input
                  id={`${id}-email`}
                  type="email"
                  placeholder="hi@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/50 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-password`} className="text-gray-300">
                  Password
                </Label>
                <Input
                  id={`${id}-password`}
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/50 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-950/50 border border-red-500/20 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-400">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${id}-remember`}
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    className="border-white/20 data-[state=checked]:bg-white/20 data-[state=checked]:text-white"
                  />
                  <Label
                    htmlFor={`${id}-remember`}
                    className="font-normal text-gray-400"
                  >
                    Remember me
                  </Label>
                </div>
                <Button
                  variant="link"
                  className="px-0 text-blue-400 hover:text-blue-300"
                  asChild
                >
                  <a href="#" onClick={() => alert("Coming soon!")}>
                    Forgot password?
                  </a>
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            <div className="flex items-center gap-2 my-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
              <span className="text-xs text-gray-500">Or</span>
            </div>

            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Login with Google
            </Button>

            <div className="mt-3 text-center">
              <Button
                variant="link"
                className="text-sm text-blue-400 hover:text-blue-300"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Vortex>
  );
}
