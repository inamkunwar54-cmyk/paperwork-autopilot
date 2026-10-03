import Link from "next/link";
import { setItemDone } from "@/app/actions";
import { DOC_TYPE_LABELS, type Item } from "@/lib/item-schema";
import type { LeakAlert } from "@/lib/money-leaks";
import { daysUntil, formatMoney, parseDate, relativeDue } from "@/lib/format";

const URGENCY_STYLES = {
  high: { bar: "bg-urgent-high", chip: "bg-urgent-high-soft text-urgent-high", label: "High" },
  medium: { bar: "bg-urgent-medium", chip: "bg-urgent-medium-soft text-urgent-medium", label: "Medium" },
  low: { bar: "bg-urgent-low", chip: "bg-urgent-low-soft text-urgent-low", label: "Low" },
} as const;

const LEAK_LABEL: Record<LeakAlert["kind"], string> = {
  price_increase: "Price went up",
  duplicate: "Possible duplicate",
  auto_renewal: "Auto-renews soon",
};

export function ItemCard({ item, alerts = [] }: { item: Item; alerts?: LeakAlert[] }) {
  const u = URGENCY_STYLES[item.urgency];
  const done = item.status === "done";
  const overdue = !done && item.due_date !== null && daysUntil(item.due_date) < 0;
  const due = item.due_date ? parseDate(item.due_date) : null;

  return (
    <li className={`relative overflow-hidden rounded-2xl border border-line bg-white ${done ? "opacity-60" : ""}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${u.bar}`} aria-hidden />
      <div className="flex gap-4 py-4 pl-5 pr-4">
        <div className="w-16 shrink-0 text-center">
          {due ? (
            <>
              <div className={`text-2xl font-semibold leading-tight ${overdue ? "text-urgent-high" : ""}`}>
                {due.getDate()}
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted">
                {due.toLocaleDateString("en-US", { month: "short" })}
              </div>
            </>
          ) : (
            <div className="pt-1 text-xs text-muted">No date</div>
          )}
        </div>

        <Link href={`/items/${item.id}`} className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate font-semibold">{item.sender}</h3>
            {item.amount !== null && (
              <span className="shrink-0 font-semibold tabular-nums">{formatMoney(item.amount, item.currency)}</span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.required_action}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${u.chip}`}>{u.label}</span>
            <span className="rounded-full bg-urgent-low-soft px-2 py-0.5 text-muted">{DOC_TYPE_LABELS[item.doc_type]}</span>
            {alerts.map((a) => (
              <span key={a.kind} className="rounded-full bg-urgent-medium-soft px-2 py-0.5 font-medium text-urgent-medium">
                {LEAK_LABEL[a.kind]}
              </span>
            ))}
            {item.due_date && !done && (
              <span className={overdue ? "font-medium text-urgent-high" : "text-muted"}>{relativeDue(item.due_date)}</span>
            )}
          </div>
        </Link>
      </div>
      <form action={setItemDone} className="border-t border-line">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="done" value={done ? "false" : "true"} />
        <button className="w-full py-2.5 text-sm font-medium text-accent hover:bg-accent-soft">
          {done ? "Move back to my list" : item.amount !== null ? "Mark as paid" : "Mark as done"}
        </button>
      </form>
    </li>
  );
}
