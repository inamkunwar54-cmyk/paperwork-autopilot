import type { BillingPeriod, Item } from "./item-schema";
import { daysUntil, formatFullDate, formatMoney, inDays, parseDate, todayLocal } from "./format";

export type LeakKind = "price_increase" | "duplicate" | "auto_renewal";

export type LeakAlert = {
  kind: LeakKind;
  itemId: string;
  message: string;
};

type LeakItem = Pick<
  Item,
  "id" | "sender" | "sender_key" | "amount" | "currency" | "due_date" | "billing_period" | "auto_renews" | "status" | "created_at" | "doc_type"
>;

const PERIOD_SUFFIX: Partial<Record<BillingPeriod, string>> = {
  monthly: "/month",
  quarterly: "/quarter",
  yearly: "/year",
};

const RENEWAL_WINDOW_DAYS = 30;

function sortKey(i: LeakItem) {
  return i.due_date ? parseDate(i.due_date).getTime() : new Date(i.created_at).getTime();
}

function samePeriod(a: LeakItem, b: LeakItem) {
  if (a.due_date && b.due_date) {
    const da = parseDate(a.due_date);
    const db = parseDate(b.due_date);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
  }
  if (!a.due_date && !b.due_date) {
    return Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) < 7 * 86_400_000;
  }
  return false;
}

function compatiblePeriods(a: BillingPeriod, b: BillingPeriod) {
  return a === b || a === "unknown" || b === "unknown";
}

// Looks at all items, open and done, but only flags open ones.
export function detectMoneyLeaks(items: LeakItem[], today = todayLocal()): LeakAlert[] {
  const alerts: LeakAlert[] = [];
  const bySender = new Map<string, LeakItem[]>();
  for (const item of items) {
    if (!item.sender_key) continue;
    const group = bySender.get(item.sender_key) ?? [];
    group.push(item);
    bySender.set(item.sender_key, group);
  }

  for (const group of bySender.values()) {
    const priced = group
      .filter((i) => i.amount !== null)
      .sort((a, b) => sortKey(a) - sortKey(b));

    // Price increase: newest priced item vs the previous one from a different period.
    for (let n = priced.length - 1; n > 0; n--) {
      const latest = priced[n];
      const previous = priced
        .slice(0, n)
        .reverse()
        .find((p) => !samePeriod(p, latest) && p.currency === latest.currency);
      if (!previous) continue;
      if (latest.status === "open" && compatiblePeriods(latest.billing_period, previous.billing_period)) {
        const diff = Math.round((Number(latest.amount) - Number(previous.amount)) * 100) / 100;
        if (diff > 0) {
          const period = latest.billing_period !== "unknown" ? latest.billing_period : previous.billing_period;
          const noun = latest.doc_type === "subscription" ? "subscription" : latest.doc_type === "insurance_renewal" ? "insurance" : "bill";
          alerts.push({
            kind: "price_increase",
            itemId: latest.id,
            message: `Your ${latest.sender} ${noun} went up ${formatMoney(diff, latest.currency)}${PERIOD_SUFFIX[period] ?? ""} (was ${formatMoney(Number(previous.amount), previous.currency)}).`,
          });
        }
      }
      break;
    }

    // Same sender, amount and period.
    for (let a = 0; a < priced.length; a++) {
      for (let b = a + 1; b < priced.length; b++) {
        const x = priced[a];
        const y = priced[b];
        if (x.currency !== y.currency || Number(x.amount) !== Number(y.amount) || !samePeriod(x, y)) continue;
        for (const [self, other] of [[x, y], [y, x]] as const) {
          if (self.status !== "open" || alerts.some((al) => al.kind === "duplicate" && al.itemId === self.id)) continue;
          const when = other.due_date
            ? `due ${formatFullDate(other.due_date)}`
            : "added around the same time";
          alerts.push({
            kind: "duplicate",
            itemId: self.id,
            message: `Possible duplicate: another ${self.sender} charge of ${formatMoney(Number(self.amount), self.currency)}, ${when}${other.status === "done" ? ", already marked paid" : ""}.`,
          });
        }
      }
    }
  }

  for (const item of items) {
    if (item.status !== "open" || !item.auto_renews || !item.due_date) continue;
    const days = daysUntil(item.due_date, today);
    if (days < 0 || days > RENEWAL_WINDOW_DAYS) continue;
    alerts.push({
      kind: "auto_renewal",
      itemId: item.id,
      message: `${item.sender} renews automatically ${inDays(days)}${item.amount !== null ? ` for ${formatMoney(Number(item.amount), item.currency)}` : ""}. Cancel before then if you don't want it.`,
    });
  }

  return alerts;
}
