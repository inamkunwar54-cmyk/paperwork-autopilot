import { getPlan } from "@/lib/plans";
import { requireUser } from "@/lib/supabase/server";
import { AddFlow } from "./add-flow";

export default async function AddPage() {
  const { supabase, user } = await requireUser();
  const plan = await getPlan(supabase, user.id);
  const remaining = plan.limit === null ? null : Math.max(0, plan.limit - plan.used);
  return <AddFlow userId={user.id} remaining={remaining} />;
}
