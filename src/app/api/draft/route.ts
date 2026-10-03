import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { DRAFT_KINDS, draftMessage } from "@/lib/ai";
import type { Item } from "@/lib/item-schema";
import { getUser } from "@/lib/supabase/server";

export const maxDuration = 60;

const bodySchema = z.object({ itemId: z.string().uuid(), kind: z.enum(DRAFT_KINDS) });

export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // RLS limits this to the caller's own items.
  const { data } = await supabase.from("items").select("*").eq("id", parsed.data.itemId).maybeSingle();
  if (!data) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  try {
    return NextResponse.json(await draftMessage(data as Item, parsed.data.kind));
  } catch (error) {
    if (!(error instanceof Anthropic.RateLimitError)) console.error("draft failed", error);
    return NextResponse.json({ error: "We couldn't write a draft right now. Please try again." }, { status: 502 });
  }
}
