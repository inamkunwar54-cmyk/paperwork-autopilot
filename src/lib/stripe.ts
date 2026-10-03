import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "./supabase/admin";

let stripe: Stripe | undefined;

export function getStripe() {
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe;
}

export async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const periodEnd = sub.items.data[0]?.current_period_end;
  const fields = {
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  // Match the row created at checkout by customer id; fall back to the user id in metadata.
  const { data: updated } = await admin
    .from("subscriptions")
    .update(fields)
    .eq("stripe_customer_id", customerId)
    .select("user_id");
  if (updated?.length) return;

  const userId = sub.metadata?.user_id;
  if (!userId) throw new Error(`No user for Stripe customer ${customerId}`);
  const { error } = await admin.from("subscriptions").upsert({ user_id: userId, ...fields });
  if (error) throw error;
}
