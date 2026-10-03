import { daysUntil, formatFullDate, formatMoney, inDays, parseDate } from "./format";
import type { Item } from "./item-schema";

export type ReminderKind = "7d" | "1d";

export function daysLeft(today: string, due: string) {
  return daysUntil(due, parseDate(today));
}

// Windows rather than exact days, so a missed daily run still catches up.
// The cron route skips reminders already in reminder_log.
export function reminderKindFor(item: { due_date: string | null; status: string }, today: string): ReminderKind | null {
  if (item.status !== "open" || !item.due_date) return null;
  const days = daysLeft(today, item.due_date);
  if (days >= 2 && days <= 7) return "7d";
  if (days === 0 || days === 1) return "1d";
  return null;
}

export async function sendEmail(to: string, subject: string, text: string, html: string) {
  const res = await fetch(`${process.env.RESEND_API_URL ?? "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.REMINDER_FROM_EMAIL, to: [to], subject, text, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function reminderEmail(item: Item, days: number, siteUrl: string) {
  const when = inDays(days);
  const amount = item.amount !== null ? ` (${formatMoney(Number(item.amount), item.currency)})` : "";
  const date = formatFullDate(item.due_date!);
  const link = `${siteUrl}/items/${item.id}`;
  const footer = "You're getting this because you added this item to Paperwork Autopilot.";

  const text = [
    `${item.sender}${amount} is due ${when}, on ${date}.`,
    "",
    item.required_action,
    "",
    `Open it in Paperwork Autopilot: ${link}`,
    "",
    footer,
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1f2933;max-width:480px">
<p style="font-size:20px;font-weight:600;margin:0 0 4px">${escapeHtml(item.sender)}${escapeHtml(amount)}</p>
<p style="margin:0 0 16px;color:#5f6b76">Due ${escapeHtml(when)}, ${escapeHtml(date)}</p>
<p style="margin:0 0 24px">${escapeHtml(item.required_action)}</p>
<a href="${escapeHtml(link)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">Open in Paperwork Autopilot</a>
<p style="margin:32px 0 0;font-size:13px;color:#5f6b76">${footer}</p>
</div>`;

  return { subject: `Reminder: ${item.sender}${amount} is due ${when}`, text, html };
}
