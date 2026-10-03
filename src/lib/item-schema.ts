import { z } from "zod";

export const DOC_TYPES = [
  "bill",
  "insurance_renewal",
  "tax_letter",
  "school_form",
  "warranty",
  "subscription",
  "other",
] as const;

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  bill: "Bill",
  insurance_renewal: "Insurance renewal",
  tax_letter: "Tax letter",
  school_form: "School form",
  warranty: "Warranty",
  subscription: "Subscription",
  other: "Other",
};

export const URGENCIES = ["high", "medium", "low"] as const;
export const BILLING_PERIODS = ["one_time", "monthly", "quarterly", "yearly", "unknown"] as const;

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  unknown: "Not sure",
};

export type DocType = (typeof DOC_TYPES)[number];
export type Urgency = (typeof URGENCIES)[number];
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/** What the user confirms in the review form. Used on the client and re-checked on the server. */
export const itemInputSchema = z.object({
  doc_type: z.enum(DOC_TYPES),
  sender: z.string().trim().min(1, "Who is it from?").max(200),
  amount: z.number().nonnegative().max(10_000_000).nullable(),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code")
    .default("USD"),
  due_date: z
    .string()
    .regex(isoDate, "Use a valid date")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Use a valid date")
    .nullable(),
  required_action: z.string().trim().min(1, "Say what needs doing").max(300),
  urgency: z.enum(URGENCIES),
  billing_period: z.enum(BILLING_PERIODS),
  auto_renews: z.boolean(),
});

export type ItemInput = z.infer<typeof itemInputSchema>;

export type Item = ItemInput & {
  id: string;
  user_id: string;
  document_id: string | null;
  sender_key: string;
  status: "open" | "done";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
