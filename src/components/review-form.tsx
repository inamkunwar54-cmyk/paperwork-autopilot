"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/app/actions";
import {
  BILLING_PERIODS,
  BILLING_PERIOD_LABELS,
  DOC_TYPES,
  DOC_TYPE_LABELS,
  URGENCIES,
  type ItemInput,
} from "@/lib/item-schema";

const field = "mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-base";
const labelText = "text-sm font-medium";

export const EMPTY_ITEM: ItemInput = {
  doc_type: "bill",
  sender: "",
  amount: null,
  currency: "USD",
  due_date: null,
  required_action: "",
  urgency: "medium",
  billing_period: "unknown",
  auto_renews: false,
};

export function ReviewForm({
  initial,
  submitLabel,
  onSave,
}: {
  initial: ItemInput;
  submitLabel: string;
  onSave: (values: ItemInput) => Promise<ActionResult>;
}) {
  const [values, setValues] = useState(initial);
  const [amountText, setAmountText] = useState(initial.amount === null ? "" : initial.amount.toFixed(2));
  const [result, setResult] = useState<ActionResult>();
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const err = (key: string) => result?.fieldErrors?.[key];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = amountText.replace(/[^0-9.]/g, "");
    const amount = cleaned === "" ? null : Number(cleaned);
    if (amount !== null && Number.isNaN(amount)) {
      setResult({ error: "Please check the highlighted fields.", fieldErrors: { amount: "Enter a number" } });
      return;
    }
    startTransition(async () => {
      setResult(await onSave({ ...values, amount }));
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <label className="block">
        <span className={labelText}>From</span>
        <input
          value={values.sender}
          onChange={(e) => set("sender", e.target.value)}
          className={field}
          placeholder="Company or sender"
          required
        />
        {err("sender") && <FieldError text={err("sender")!} />}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelText}>Amount due</span>
          <div className="relative">
            <input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              inputMode="decimal"
              placeholder="None"
              className={`${field} pr-14`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-muted">
              {values.currency}
            </span>
          </div>
          {err("amount") && <FieldError text={err("amount")!} />}
        </label>
        <label className="block">
          <span className={labelText}>Due / renewal date</span>
          <input
            type="date"
            value={values.due_date ?? ""}
            onChange={(e) => set("due_date", e.target.value || null)}
            className={field}
          />
          {err("due_date") && <FieldError text={err("due_date")!} />}
        </label>
      </div>

      <label className="block">
        <span className={labelText}>What you need to do</span>
        <textarea
          value={values.required_action}
          onChange={(e) => set("required_action", e.target.value)}
          rows={2}
          className={field}
        />
        {err("required_action") && <FieldError text={err("required_action")!} />}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelText}>Type</span>
          <select
            value={values.doc_type}
            onChange={(e) => set("doc_type", e.target.value as ItemInput["doc_type"])}
            className={field}
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelText}>Repeats</span>
          <select
            value={values.billing_period}
            onChange={(e) => set("billing_period", e.target.value as ItemInput["billing_period"])}
            className={field}
          >
            {BILLING_PERIODS.map((p) => (
              <option key={p} value={p}>
                {BILLING_PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className={labelText}>Urgency</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {URGENCIES.map((u) => (
            <label
              key={u}
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-medium capitalize ${
                values.urgency === u ? "border-accent bg-accent-soft text-accent" : "border-line bg-white"
              }`}
            >
              <input
                type="radio"
                name="urgency"
                value={u}
                checked={values.urgency === u}
                onChange={() => set("urgency", u)}
                className="sr-only"
              />
              {u}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={values.auto_renews}
          onChange={(e) => set("auto_renews", e.target.checked)}
          className="h-5 w-5 accent-accent"
        />
        <span className="text-sm">Renews or charges again automatically</span>
      </label>

      {result?.error && (
        <p role="alert" className="rounded-lg bg-urgent-high-soft px-3 py-2 text-sm text-urgent-high">
          {result.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-accent px-5 py-3.5 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function FieldError({ text }: { text: string }) {
  return <span className="mt-1 block text-sm text-urgent-high">{text}</span>;
}
