"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { itemInputSchema, type ItemInput } from "@/lib/item-schema";
import { getUser, requireUser } from "@/lib/supabase/server";

export type ActionResult = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const uuid = z.string().uuid();

function validationResult(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { error: "Please check the highlighted fields.", fieldErrors };
}

// documentId is null when the details were typed in by hand.
export async function saveItem(documentId: string | null, values: ItemInput): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const parsed = itemInputSchema.safeParse(values);
  if (!parsed.success) return validationResult(parsed.error);
  if (documentId !== null && !uuid.safeParse(documentId).success) return { error: "Unknown document." };

  const { error } = await supabase.from("items").insert({ ...parsed.data, user_id: user.id, document_id: documentId });
  if (error) return { error: "Could not save. Please try again." };

  if (documentId) {
    await supabase.from("documents").update({ status: "confirmed" }).eq("id", documentId);
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function updateItem(id: string, values: ItemInput): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!uuid.safeParse(id).success) return { error: "Unknown item." };

  const parsed = itemInputSchema.safeParse(values);
  if (!parsed.success) return validationResult(parsed.error);

  const { error } = await supabase.from("items").update(parsed.data).eq("id", id);
  if (error) return { error: "Could not save. Please try again." };

  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function setItemDone(formData: FormData) {
  const { supabase } = await requireUser();

  const id = uuid.parse(formData.get("id"));
  const done = formData.get("done") === "true";
  await supabase
    .from("items")
    .update({ status: done ? "done" : "open", completed_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath(`/items/${id}`);
}

// Deletes files, documents and items. The account itself stays.
export async function deleteAllData(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const bucket = supabase.storage.from("documents");
  const fileError = { error: "Could not delete your files. Nothing else was removed." };

  for (;;) {
    const { data: files, error } = await bucket.list(user.id, { limit: 100 });
    if (error) return fileError;
    if (!files?.length) break;
    const { error: removeError } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
    if (removeError) return fileError;
  }

  const { error: itemsError } = await supabase.from("items").delete().eq("user_id", user.id);
  const { error: docsError } = await supabase.from("documents").delete().eq("user_id", user.id);
  if (itemsError || docsError) return { error: "Some data could not be deleted. Please try again." };

  revalidatePath("/", "layout");
  redirect("/dashboard?deleted=1");
}

export async function signOut() {
  const { supabase } = await getUser();
  await supabase.auth.signOut();
  redirect("/login");
}
