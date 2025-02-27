import { createClient } from '@supabase/supabase-js';
import { env } from '@/env.mjs';

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function logOrderError(error: Error, context: any) {
  try {
    await supabase.from('error_logs').insert([
      {
        error_type: error.name,
        message: error.message,
        stack_trace: error.stack,
        context: context
      }
    ]);
  } catch (loggingError) {
    console.error('Failed to log error to database:', loggingError);
    console.error('Original error:', error);
    console.error('Error context:', context);
  }
} 