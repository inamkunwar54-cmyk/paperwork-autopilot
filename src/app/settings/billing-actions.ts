"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/server";

async function siteOrigin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? h.get("origin") ?? `https://${h.get("host")}`;
}

async function ensureCustomer(userId: string, email: string | undefined) {
  const admin = createAdminClient();
  const { data } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (data?.stripe_customer_id) return data.stripe_customer_id as string;

  const customer = await getStripe().customers.create({ email, metadata: { user_id: userId } });
  const { error } = await admin
    .from("subscriptions")
    .upsert({ user_id: userId, stripe_customer_id: customer.id, updated_at: new Date().toISOString() });
  if (error) throw error;
  return customer.id;
}

export async function startCheckout() {
  const { user } = await requireUser();

  const origin = await siteOrigin();
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: await ensureCustomer(user.id, user.email),
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${origin}/settings?upgraded=1`,
    cancel_url: `${origin}/settings`,
  });
  redirect(session.url!);
}

export async function openBillingPortal() {
  const { user } = await requireUser();

  const session = await getStripe().billingPortal.sessions.create({
    customer: await ensureCustomer(user.id, user.email),
    return_url: `${await siteOrigin()}/settings`,
  });
  redirect(session.url);
}
