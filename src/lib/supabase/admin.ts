import "server-only";
import { createClient } from "@supabase/supabase-js";

// Bypasses RLS. Only for server-owned tables (subscriptions, usage counters, reminders).
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
