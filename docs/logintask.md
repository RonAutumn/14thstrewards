# Login Task List

## Objective

Implement a secure login page that restricts access until a user is authenticated via Supabase. Support both email/password and Google authentication. Integrate this authentication with the existing rewards system, points APIs, and admin flows.

## Tasks

### 1. Login Page Implementation ✅

- [x] Create a new `/login` or `/auth` page
- [x] Implement a login form with email and password fields
- [x] Add Google authentication button with Supabase OAuth
- [x] Integrate Supabase authentication using:
  - `signInWithPassword` for email/password
  - `signInWithOAuth` for Google authentication
- [x] Style the Google authentication button according to Google's branding guidelines
- [x] On successful login, redirect to a protected route (e.g., `/rewards`)

### 2. Route Protection ✅

- [x] Implement session validation for protected pages (rewards, points, admin)
- [x] Redirect unauthenticated users to the login page
- [x] Use Next.js middleware or client-side checks for session validation

### 3. Rewards System Integration ✅

- [x] Secure rewards and points API endpoints by checking for a valid Supabase session
- [x] Use the session token to fetch data from the rewards system
- [x] Handle user profile data from both email and Google authentication sources
- [x] Implement points calculation based on tier multipliers
- [x] Add rewards redemption functionality in checkout
- [x] Display current points balance and available rewards
- [x] Show estimated points to be earned from purchase

### 4. Admin Authentication and Dashboard ✅

- [x] Verify admin status using Supabase profiles or a similar mechanism
- [x] Redirect non-admin users or display an "Unauthorized" message
- [x] Implement role-based access control (RBAC) for different authentication methods
- [x] Create admin dashboard with the following features:
  - Tier Management:
    - [x] Configure tier thresholds (Bronze, Silver, Gold, Platinum)
    - [x] Set point multipliers (1x, 1.2x, 1.5x, 2x)
    - [x] Define tier benefits (discounts, free shipping, etc.)
    - [x] Adjust tier progression requirements
    - [x] Add analytics dashboard for tier distribution
    - [x] Track tier progression rates
    - [x] Monitor average points per tier
  - User Management:
    - [x] View user tiers and point balances
    - [x] Manually adjust user tiers
    - [x] Reset or modify point balances
  - Rewards Management:
    - [x] Create and edit reward items
    - [x] Set point costs and availability
    - [x] Configure reward limits and expiration

### 5. Testing and Validation 🔴

- [ ] Test login functionality in local and production environments
- [ ] Verify that protected routes require authentication
- [ ] Test both email/password and Google authentication flows
- [ ] Handle error cases (incorrect credentials, expired sessions, non-admin access)
- [ ] Test rewards calculation and redemption flows
- [ ] Validate points system across different user tiers
- [ ] Test tier management and admin controls
- [ ] Add unit tests for:
  - Authentication flows
  - Points calculation
  - Tier progression logic
  - Reward redemption
  - Admin controls
- [ ] Add integration tests for:
  - User registration and login
  - Points earning and redemption
  - Tier upgrades and downgrades
  - Admin dashboard operations

### 6. Rewards System Enhancements ✅

- [x] Implement referral system:
  - [x] Generate unique referral codes
  - [x] Track referral relationships
  - [x] Award points for successful referrals
  - [x] Handle referral validation and processing
- [ ] Add points history and transaction tracking
- [ ] Create email notifications for points earned
- [ ] Set up points expiration system
- [ ] Add tier progression notifications
- [ ] Implement reward code generation and validation
- [ ] Add seasonal promotions and special events
- [ ] Progressive profile completion rewards:
  - [ ] Phone number verification
  - [ ] Birthday information
  - [ ] Address details
  - [ ] Shopping preferences

### Color Legend

- ✅ Completed
- 🔴 High Priority
- 🟡 Medium Priority
- ⚪ Testing/QA

## Example Code Snippet

```typescript
// /app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      router.push("/rewards");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/rewards`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md p-6 border rounded shadow"
      >
        <h1 className="text-xl font-bold mb-4">Login</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded mb-4"
        >
          Log In
        </button>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 rounded text-gray-700 hover:bg-gray-50"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
      </form>
    </div>
  );
}
```
