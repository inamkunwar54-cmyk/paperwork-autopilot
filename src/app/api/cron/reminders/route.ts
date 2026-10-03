import { NextResponse } from "next/server";
import type { Item } from "@/lib/item-schema";
import { daysLeft, reminderEmail, reminderKindFor, sendEmail } from "@/lib/reminders";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

// Daily Vercel Cron job (vercel.json). Vercel sends the CRON_SECRET as a bearer token.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10); // UTC calendar date
  const in7 = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const { data: items, error } = await admin
    .from("items")
    .select("*")
    .eq("status", "open")
    .gte("due_date", today)
    .lte("due_date", in7);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const emails = new Map<string, string | null>();
  async function emailFor(userId: string) {
    if (!emails.has(userId)) {
      const { data } = await admin.auth.admin.getUserById(userId);
      emails.set(userId, data.user?.email ?? null);
    }
    return emails.get(userId);
  }

  let sent = 0;
  let failed = 0;
  for (const item of (items ?? []) as Item[]) {
    const kind = reminderKindFor(item, today);
    if (!kind) continue;

    // Claim the reminder first so overlapping runs can't double-send.
    const { error: claimError } = await admin
      .from("reminder_log")
      .insert({ item_id: item.id, kind, due_date: item.due_date });
    if (claimError) continue; // already sent

    const to = await emailFor(item.user_id);
    try {
      if (!to) throw new Error("user has no email");
      const { subject, text, html } = reminderEmail(item, daysLeft(today, item.due_date!), siteUrl);
      await sendEmail(to, subject, text, html);
      sent++;
    } catch (e) {
      failed++;
      console.error("reminder failed", item.id, e);
      // Drop the claim so tomorrow's run retries.
      await admin.from("reminder_log").delete().match({ item_id: item.id, kind, due_date: item.due_date });
    }
  }

  return NextResponse.json({ sent, failed });
}
