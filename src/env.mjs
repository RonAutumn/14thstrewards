import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        SHIPSTATION_API_KEY: z.string(),
        SHIPSTATION_API_SECRET: z.string(),
        NEXT_PUBLIC_API_URL: z.string(),
    },
    client: {
        NEXT_PUBLIC_SUPABASE_URL: z.string(),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    },
    runtimeEnv: {
        SHIPSTATION_API_KEY: process.env.SHIPSTATION_API_KEY,
        SHIPSTATION_API_SECRET: process.env.SHIPSTATION_API_SECRET,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
}); 