"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { saveItem } from "@/app/actions";
import { EMPTY_ITEM, ReviewForm } from "@/components/review-form";
import type { ItemInput } from "@/lib/item-schema";
import { prepareFile } from "@/lib/prepare-image";
import { createClient } from "@/lib/supabase/client";

type Step =
  | { name: "choose"; error?: string; limitReached?: boolean }
  | { name: "paste" }
  | { name: "reading"; label: string }
  | { name: "review"; documentId: string | null; item: ItemInput; note?: string };

export function AddFlow({ userId, remaining }: { userId: string; remaining: number | null }) {
  const [step, setStep] = useState<Step>(
    remaining === 0 ? { name: "choose", limitReached: true } : { name: "choose" },
  );
  const [pasted, setPasted] = useState("");
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function extract(body: object) {
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStep({
        name: "review",
        documentId: data.documentId,
        item: data.item,
        note: data.readable
          ? undefined
          : "This was hard to read. Please check every field carefully.",
      });
    } else if (data.documentId) {
      // Extraction failed but the document is saved: let the user fill it in by hand.
      setStep({ name: "review", documentId: data.documentId, item: EMPTY_ITEM, note: data.error });
    } else if (data.limitReached) {
      setStep({ name: "choose", limitReached: true });
    } else {
      setStep({ name: "choose", error: data.error ?? "Something went wrong. Please try again." });
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      setStep({ name: "reading", label: "Uploading…" });
      const { blob, mimeType, ext } = await prepareFile(file);
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient()
        .storage.from("documents")
        .upload(path, blob, { contentType: mimeType });
      if (error) throw new Error("Upload failed. Check your connection and try again.");

      setStep({ name: "reading", label: "Reading your document…" });
      await extract({ source: "upload", storagePath: path, mimeType, filename: file.name });
    } catch (e) {
      setStep({ name: "choose", error: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      if (cameraInput.current) cameraInput.current.value = "";
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handlePaste() {
    setStep({ name: "reading", label: "Reading the email…" });
    await extract({ source: "paste", text: pasted });
  }

  if (step.name === "reading") {
    return (
      <div className="flex flex-col items-center py-20 text-center" role="status" aria-live="polite">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
        <p className="mt-6 text-lg font-medium">{step.label}</p>
        <p className="mt-1 text-sm text-muted">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (step.name === "review") {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check the details</h1>
        <p className="mt-1 text-muted">Fix anything we got wrong, then save.</p>
        {step.note && (
          <p className="mt-4 rounded-lg bg-urgent-medium-soft px-3 py-2 text-sm text-urgent-medium">
            {step.note}
          </p>
        )}
        <div className="mt-6">
          <ReviewForm
            initial={step.item}
            submitLabel="Save to my list"
            onSave={(values) => saveItem(step.documentId, values)}
          />
        </div>
      </div>
    );
  }

  if (step.name === "paste") {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paste an email</h1>
        <p className="mt-1 text-muted">Copy the whole email, including the sender and any dates.</p>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={12}
          autoFocus
          className="mt-6 w-full rounded-xl border border-line bg-white px-4 py-3 text-base"
          placeholder="Paste email text here"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setStep({ name: "choose" })}
            className="rounded-xl border border-line bg-white px-5 py-3 font-medium"
          >
            Back
          </button>
          <button
            onClick={handlePaste}
            disabled={pasted.trim().length < 20}
            className="flex-1 rounded-xl bg-accent px-5 py-3 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Read this email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Add a document</h1>
      <p className="mt-1 text-muted">A bill, renewal notice, tax letter, school form or anything else.</p>

      {step.error && (
        <p role="alert" className="mt-4 rounded-lg bg-urgent-high-soft px-3 py-2 text-sm text-urgent-high">
          {step.error}
        </p>
      )}

      {step.limitReached ? (
        <div className="mt-6 rounded-2xl border border-accent bg-accent-soft p-5">
          <p className="font-semibold">You&apos;ve used this month&apos;s free documents.</p>
          <p className="mt-1 text-sm text-muted">
            Upgrade to Pro for unlimited documents, or enter details by hand for free.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-white hover:bg-accent-hover"
          >
            See Pro
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <BigButton
            title="Take a photo"
            subtitle="Use your phone camera"
            primary
            onClick={() => cameraInput.current?.click()}
          />
          <BigButton
            title="Upload a file"
            subtitle="Photo or PDF, up to 15 MB"
            onClick={() => fileInput.current?.click()}
          />
          <BigButton
            title="Paste an email"
            subtitle="Copy and paste the text"
            onClick={() => setStep({ name: "paste" })}
          />
          {remaining !== null && (
            <p className="pt-1 text-center text-sm text-muted">
              {remaining} free {remaining === 1 ? "document" : "documents"} left this month
            </p>
          )}
        </div>
      )}

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <p className="mt-6 text-center text-sm text-muted">
        Prefer to type it?{" "}
        <button
          onClick={() => setStep({ name: "review", documentId: null, item: EMPTY_ITEM })}
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          Enter details by hand
        </button>
        {" · "}
        <Link href="/privacy" className="underline-offset-2 hover:underline">
          How we process documents
        </Link>
      </p>
    </div>
  );
}

function BigButton({
  title,
  subtitle,
  onClick,
  primary,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-start rounded-2xl border px-5 py-5 text-left transition ${
        primary
          ? "border-accent bg-accent text-white hover:bg-accent-hover"
          : "border-line bg-white hover:border-accent"
      }`}
    >
      <span className="text-lg font-semibold">{title}</span>
      <span className={`text-sm ${primary ? "text-white/80" : "text-muted"}`}>{subtitle}</span>
    </button>
  );
}
