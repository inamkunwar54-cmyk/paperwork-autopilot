import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_DOCUMENTS_PER_MONTH = 5;
// Display only; the real price is STRIPE_PRO_PRICE_ID in Stripe.
export const PRO_PRICE_LABEL = "$5/month";

// past_due keeps Pro while Stripe retries the card.
const PRO_STATUSES = ["active", "trialing", "past_due"];

export type Plan = {
  pro: boolean;
  status: string;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  used: number;
  limit: number | null;
};

export async function getPlan(supabase: SupabaseClient, userId: string): Promise<Plan> {
  const month = new Date().toISOString().slice(0, 8) + "01";
  const [{ data: sub }, { data: usage }] = await Promise.all([
    supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end").eq("user_id", userId).maybeSingle(),
    supabase.from("usage_counters").select("documents").eq("user_id", userId).eq("month", month).maybeSingle(),
  ]);
  const pro = PRO_STATUSES.includes(sub?.status);
  return {
    pro,
    status: sub?.status ?? "none",
    periodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    used: usage?.documents ?? 0,
    limit: pro ? null : FREE_DOCUMENTS_PER_MONTH,
  };
}
