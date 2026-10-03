import { FREE_DOCUMENTS_PER_MONTH, PRO_PRICE_LABEL, type Plan } from "@/lib/plans";
import { openBillingPortal, startCheckout } from "./billing-actions";

export function PlanSection({ plan, justUpgraded }: { plan: Plan; justUpgraded: boolean }) {
  const renews = plan.periodEnd
    ? new Date(plan.periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Your plan</h2>
      {justUpgraded && !plan.pro && (
        <p className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          Thanks! Your payment is being confirmed. Refresh in a moment to see Pro.
        </p>
      )}

      {plan.pro ? (
        <div className="mt-3 rounded-2xl border border-accent bg-white p-5">
          <p className="font-semibold">Pro <span className="font-normal text-muted">· unlimited documents</span></p>
          {renews && (
            <p className="mt-1 text-sm text-muted">
              {plan.cancelAtPeriodEnd ? `Ends on ${renews}` : `Renews on ${renews}`}
              {plan.status === "past_due" && " · Your last payment failed. Please update your card."}
            </p>
          )}
          <form action={openBillingPortal} className="mt-4">
            <button className="rounded-xl border border-line bg-white px-5 py-3 font-medium hover:border-accent">
              Manage billing
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-line bg-white p-5">
          <p className="font-semibold">Free</p>
          <p className="mt-1 text-sm text-muted">
            {plan.used} of {FREE_DOCUMENTS_PER_MONTH} documents read this month
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-soft">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, (plan.used / FREE_DOCUMENTS_PER_MONTH) * 100)}%` }}
            />
          </div>
          <form action={startCheckout} className="mt-5">
            <button className="w-full rounded-xl bg-accent px-5 py-3 font-medium text-white hover:bg-accent-hover">
              Upgrade to Pro · {PRO_PRICE_LABEL}
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-muted">Unlimited documents. Cancel anytime.</p>
        </div>
      )}
    </section>
  );
}
