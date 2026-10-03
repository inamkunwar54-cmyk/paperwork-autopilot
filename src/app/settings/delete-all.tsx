"use client";

import { useState, useTransition } from "react";
import { deleteAllData } from "@/app/actions";

export function DeleteAll() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-urgent-high px-5 py-3 font-medium text-urgent-high hover:bg-urgent-high-soft"
      >
        Delete all my data
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-urgent-high bg-urgent-high-soft p-4">
      <p className="font-medium text-urgent-high">This permanently deletes every document, file and item. It can&apos;t be undone.</p>
      {error && <p className="mt-2 text-sm text-urgent-high">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button onClick={() => setConfirming(false)} className="rounded-xl border border-line bg-white px-4 py-2.5 font-medium">
          Cancel
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(async () => setError((await deleteAllData())?.error))}
          className="flex-1 rounded-xl bg-urgent-high px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Yes, delete everything"}
        </button>
      </div>
    </div>
  );
}
