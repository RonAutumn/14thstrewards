# Supabase Auth Setup and Debugging Guide

This document provides an overview of how Supabase authentication is configured and used in the project. It also provides helpful debugging tips and references to the latest Supabase Auth documentation.

---

## Overview

The project leverages Supabase for both client-side and server-side authentication. Key features include:

- **OAuth Callback Handling:** The `/auth/callback` route exchanges OAuth codes for sessions, creates new user profiles (if they do not exist), and redirects users.
- **Client-Side Auth Utilities:** Authentication functions (e.g., signing in with Google or email/password) use the `getSupabaseBrowserClient()` method along with Supabase's auth helpers.
- **Server-Side Auth:** Server routes (for example, fetching the current user profile) use a dedicated Supabase client and service role key.
- **Middleware:** A middleware refreshes sessions on every request by leveraging the Supabase auth-helpers, ensuring users have up-to-date sessions.

---

## Authentication Flow

### OAuth Callback Route

The `/auth/callback` route is triggered after an OAuth provider (such as Google) redirects the user back to your application. This route:

1. Extracts the `code` parameter from the URL.
2. Creates a server-side Supabase client.
3. Exchanges the code for a user session.
4. Checks for an existing user profile in the database. If one doesn't exist, a new profile is created.
5. Determines the redirection URL (`returnTo` from the query string or state) and then redirects the user.

#### Example Code Snippet (auth/callback/route.ts)

```

---

## Key Environment Variables

Make sure the following environment variables are set correctly:

- **Client-side:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Server-side:**
  - `SUPABASE_SERVICE_ROLE_KEY` (required for elevated privileges in certain routes)

These values are typically managed in the `env.mjs` configuration file.

---

## Debugging Tips

1. **Review Console Logs:**
   The authentication flow logs key actions such as session exchanges and profile lookups. Look for messages like:
   - "Auth error during code exchange"
   - "No session returned after successful code exchange"
   - "Error fetching profile"

2. **Validate Environment Variables:**
   Double-check that all environment variables are correctly set in both development and production environments.

3. **Consult the Latest Documentation:**
   Visit the following links for up-to-date guides:
   - [Supabase Auth Guides](https://supabase.com/docs/guides/auth)
   - [supabase-js Documentation](https://supabase.com/docs/reference/javascript)
   - [@supabase/auth-helpers-nextjs GitHub Repository](https://github.com/supabase/auth-helpers)

4. **Testing and Isolation:**
   When debugging, test individual steps in isolation. For example, log the complete response from `exchangeCodeForSession` before processing the session further.

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase GitHub Repository](https://github.com/supabase/supabase-js)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Conclusion

This guide documents the key components of our Supabase authentication implementation—from OAuth callbacks to client-side utility functions and session management. Use the debugging tips and resources provided to troubleshoot issues and ensure your authentication flows remain robust.

Happy coding!
```
