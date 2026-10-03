import { NextResponse } from "next/server";
import { z } from "zod";
import { ExtractionError, extractDocument, toItemInput, type ExtractInput } from "@/lib/ai";
import { FREE_DOCUMENTS_PER_MONTH, getPlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const maxDuration = 120;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_PASTE_CHARS = 50_000;

const bodySchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("upload"),
    storagePath: z.string().min(1).max(300),
    mimeType: z.enum([...IMAGE_TYPES, "application/pdf"]),
    filename: z.string().max(255).optional(),
  }),
  z.object({
    source: z.literal("paste"),
    text: z.string().trim().min(20, "Paste a bit more of the email.").max(MAX_PASTE_CHARS),
  }),
]);

export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const body = parsed.data;

  let input: ExtractInput;
  if (body.source === "upload") {
    // Storage RLS enforces this too.
    const ownFile = body.storagePath.startsWith(`${user.id}/`) && !body.storagePath.includes("..");
    const { data: file } = ownFile ? await supabase.storage.from("documents").download(body.storagePath) : { data: null };
    if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "That file is too large (15 MB max)." }, { status: 413 });
    }
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    input =
      body.mimeType === "application/pdf"
        ? { kind: "pdf", base64 }
        : { kind: "image", mediaType: body.mimeType, base64 };
  } else {
    input = { kind: "text", text: body.text };
  }

  // Count the document before calling the model; released again if anything fails.
  const plan = await getPlan(supabase, user.id);
  const admin = createAdminClient();
  const { data: reserved, error: reserveError } = await admin.rpc("reserve_document", {
    p_user: user.id,
    p_limit: plan.pro ? null : FREE_DOCUMENTS_PER_MONTH,
  });
  if (reserveError) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!reserved) {
    return NextResponse.json(
      {
        error: `You've used all ${FREE_DOCUMENTS_PER_MONTH} free documents this month. Upgrade to Pro for unlimited documents.`,
        limitReached: true,
      },
      { status: 402 },
    );
  }
  const release = () => admin.rpc("release_document", { p_user: user.id });

  const upload = body.source === "upload" ? body : null;
  const { data: doc } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      source: body.source,
      storage_path: upload?.storagePath ?? null,
      mime_type: upload?.mimeType ?? "text/plain",
      original_filename: upload?.filename ?? null,
      pasted_text: body.source === "paste" ? body.text : null,
      status: "extracted",
    })
    .select("id")
    .single();
  if (!doc) {
    await release();
    return NextResponse.json({ error: "Could not save the document." }, { status: 500 });
  }

  try {
    const extraction = await extractDocument(input, new Date().toISOString().slice(0, 10));
    await supabase.from("documents").update({ extraction }).eq("id", doc.id);
    return NextResponse.json({
      documentId: doc.id,
      readable: extraction.readable,
      item: toItemInput(extraction),
    });
  } catch (error) {
    await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
    await release();
    if (!(error instanceof ExtractionError)) console.error("extract failed", error);
    const message =
      error instanceof ExtractionError
        ? error.message
        : "Something went wrong reading this document. You can enter the details by hand.";
    return NextResponse.json({ error: message, documentId: doc.id }, { status: 502 });
  }
}
