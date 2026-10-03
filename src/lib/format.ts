const DAY = 86_400_000;

export function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// YYYY-MM-DD as a local calendar date, so it doesn't shift with the timezone.
export function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntil(iso: string, today = todayLocal()) {
  return Math.round((parseDate(iso).getTime() - today.getTime()) / DAY);
}

export function inDays(days: number) {
  return days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

export function formatFullDate(iso: string) {
  return parseDate(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

export function relativeDue(iso: string, today = todayLocal()) {
  const days = daysUntil(iso, today);
  if (days < 0) return days === -1 ? "1 day overdue" : `${-days} days overdue`;
  return days < 2 ? `Due ${inDays(days)}` : `In ${days} days`;
}
