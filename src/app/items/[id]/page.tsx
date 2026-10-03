import Link from "next/link";
import { notFound } from "next/navigation";
import { setItemDone, updateItem } from "@/app/actions";
import { ReviewForm } from "@/components/review-form";
import type { Item } from "@/lib/item-schema";
import { detectMoneyLeaks } from "@/lib/money-leaks";
import { requireUser } from "@/lib/supabase/server";
import { DraftPanel } from "./draft-panel";

export default async function ItemPage({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = data as Item;

  // The leak checks need this sender's other items.
  const { data: sameSender } = await supabase.from("items").select("*").eq("sender_key", item.sender_key);
  const alerts = detectMoneyLeaks((sameSender ?? []) as Item[]).filter((a) => a.itemId === item.id);

  const initial = {
    doc_type: item.doc_type,
    sender: item.sender,
    amount: item.amount === null ? null : Number(item.amount),
    currency: item.currency,
    due_date: item.due_date,
    required_action: item.required_action,
    urgency: item.urgency,
    billing_period: item.billing_period,
    auto_renews: item.auto_renews,
  };

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-muted hover:text-ink">← Back</Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{item.sender}</h1>
        <form action={setItemDone}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="done" value={item.status === "done" ? "false" : "true"} />
          <button className="shrink-0 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium hover:border-accent">
            {item.status === "done" ? "Reopen" : "Mark done"}
          </button>
        </form>
      </div>
      {alerts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {alerts.map((a) => (
            <li key={a.kind} className="rounded-lg bg-urgent-medium-soft px-3 py-2 text-sm text-urgent-medium">{a.message}</li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <DraftPanel itemId={item.id} />
      </div>
      <h2 className="mt-8 text-lg font-semibold">Details</h2>
      <div className="mt-3">
        <ReviewForm initial={initial} submitLabel="Save changes" onSave={updateItem.bind(null, item.id)} />
      </div>
    </div>
  );
}
