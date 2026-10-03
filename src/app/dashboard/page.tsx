import Link from "next/link";
import { ItemCard } from "@/components/item-card";
import { DOC_TYPES, DOC_TYPE_LABELS, type Item } from "@/lib/item-schema";
import { formatMoney, parseDate, todayLocal } from "@/lib/format";
import { detectMoneyLeaks, type LeakAlert } from "@/lib/money-leaks";
import { requireUser } from "@/lib/supabase/server";

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const { supabase } = await requireUser();

  const sp = await searchParams;
  const type = typeof sp.type === "string" && (DOC_TYPES as readonly string[]).includes(sp.type) ? sp.type : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const showDone = sp.show === "done";

  let query = supabase
    .from("items")
    .select("*")
    .eq("status", showDone ? "done" : "open")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (type) query = query.eq("doc_type", type);
  // Escape LIKE wildcards so this is a plain "contains".
  if (q) query = query.ilike("sender", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);

  const { data, error } = await query;
  const items = (data ?? []) as Item[];

  // Every item, open and done, for the monthly total and the money-leak checks.
  const today = todayLocal();
  const { data: allRows } = await supabase
    .from("items")
    .select("id, sender, sender_key, amount, currency, due_date, billing_period, auto_renews, status, created_at, doc_type");
  const all = (allRows ?? []) as Item[];

  const totals = new Map<string, number>();
  for (const r of all) {
    if (r.status !== "open" || r.amount === null || !r.due_date) continue;
    const d = parseDate(r.due_date);
    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) {
      totals.set(r.currency, (totals.get(r.currency) ?? 0) + Number(r.amount));
    }
  }

  const alerts = detectMoneyLeaks(all, today);
  const alertsByItem = new Map<string, LeakAlert[]>();
  for (const a of alerts) alertsByItem.set(a.itemId, [...(alertsByItem.get(a.itemId) ?? []), a]);
  const senderById = new Map(all.map((i) => [i.id, i.sender]));
  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const totalEntries = [...totals.entries()];

  const filterHref = (next: Record<string, string>) => {
    const params = new URLSearchParams({ ...(type && { type }), ...(q && { q }), ...(showDone && { show: "done" }), ...next });
    for (const [k, v] of [...params.entries()]) if (!v) params.delete(k);
    const s = params.toString();
    return s ? `/dashboard?${s}` : "/dashboard";
  };

  return (
    <div>
      {sp.saved && <Banner text="Saved to your list." />}
      {sp.deleted && <Banner text="All your documents and data have been deleted." />}

      <section className="rounded-2xl bg-accent px-5 py-5 text-white">
        <p className="text-sm text-white/80">Due in {monthName}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {totalEntries.length === 0
            ? formatMoney(0)
            : totalEntries.map(([cur, amt]) => formatMoney(amt, cur)).join(" + ")}
        </p>
        <p className="mt-1 text-sm text-white/80">Unpaid items with a due date this month</p>
      </section>

      {alerts.length > 0 && !showDone && (
        <section className="mt-6 rounded-2xl border border-urgent-medium/30 bg-urgent-medium-soft px-5 py-4">
          <h2 className="font-semibold text-urgent-medium">Possible money leaks</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {alerts.map((a, i) => (
              <li key={i}>
                <Link href={`/items/${a.itemId}`} className="block hover:underline" title={senderById.get(a.itemId)}>
                  <span aria-hidden className="mr-1.5">{LEAK_ICON[a.kind]}</span>
                  {a.message}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{showDone ? "Done" : "Needs attention"}</h1>
        <Link href={filterHref({ show: showDone ? "" : "done" })} className="text-sm font-medium text-accent">
          {showDone ? "Show open items" : "Show done"}
        </Link>
      </div>

      <form className="mt-4 flex gap-2" action="/dashboard">
        {showDone && <input type="hidden" name="show" value="done" />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search sender"
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-base"
        />
        <select name="type" defaultValue={type} className="w-28 rounded-xl border border-line bg-white px-2 py-2.5 text-sm sm:w-36">
          <option value="">All types</option>
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <button className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium hover:border-accent">Go</button>
      </form>

      {error && <p className="mt-6 text-urgent-high">Could not load your items. Please refresh.</p>}

      {items.length === 0 && !error ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
          <p className="font-medium">
            {q || type ? "Nothing matches that search." : showDone ? "Nothing marked done yet." : "You're all caught up."}
          </p>
          {!q && !type && !showDone && (
            <Link href="/add" className="mt-4 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-white hover:bg-accent-hover">
              Add your first document
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} alerts={alertsByItem.get(item.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

const LEAK_ICON: Record<LeakAlert["kind"], string> = {
  price_increase: "↑",
  duplicate: "⧉",
  auto_renewal: "↻",
};

function Banner({ text }: { text: string }) {
  return <p role="status" className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">{text}</p>;
}
