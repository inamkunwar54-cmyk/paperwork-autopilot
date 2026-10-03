import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Privacy Policy · Paperwork Autopilot" };

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="[Date]">
      <p>
        Paperwork Autopilot (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by [Company name], [address]. This policy
        explains what we collect, why, and the choices you have. Questions: [contact email].
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address and a securely hashed password.</li>
        <li>
          <strong>Documents you add:</strong> photos, PDFs and pasted email text, and the details extracted from them
          (sender, amount, dates, required action and your edits).
        </li>
        <li>
          <strong>Billing details:</strong> if you upgrade, our payment processor Stripe collects your card details. We
          never see or store your full card number; we keep your subscription status.
        </li>
        <li><strong>Usage counts:</strong> how many documents you&apos;ve added each month, to apply plan limits.</li>
        <li><strong>Technical data:</strong> basic logs (such as IP address and browser type) kept for security and troubleshooting.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To read your documents and show you what&apos;s due, what you owe and what to do.</li>
        <li>To flag possible price increases, duplicate charges and upcoming auto-renewals.</li>
        <li>To write message drafts when you ask for one. We never send messages on your behalf.</li>
        <li>To email you reminders before due dates, and service emails about your account.</li>
        <li>To run billing, prevent abuse and keep the service secure.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use your documents for advertising.</p>

      <h2>Who processes your data for us</h2>
      <ul>
        <li><strong>Supabase:</strong> database, file storage and sign-in.</li>
        <li>
          <strong>Anthropic:</strong> AI processing of documents and drafts. Under Anthropic&apos;s commercial terms,
          data sent through its API is not used to train its models.
        </li>
        <li><strong>Stripe:</strong> payments.</li>
        <li><strong>Resend:</strong> sending reminder and account emails.</li>
        <li><strong>Vercel:</strong> hosting.</li>
      </ul>
      <p>These providers may process data in the United States and other countries, under their own security and privacy commitments.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your documents and items until you delete them or your account. &ldquo;Delete all my data&rdquo; in
        Settings permanently removes every document, file and item at once. Monthly usage counts and billing records are
        kept as needed for plan limits, accounting and legal obligations. To delete your account entirely, email
        [contact email].
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit. Database rules ensure each account can only access its own documents, and files
        are stored in private storage. No system is perfectly secure, so please use a strong, unique password.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live (for example under the GDPR or CCPA), you may have the right to access, correct,
        export or delete your data, and to object to certain processing. Contact [contact email] and we&apos;ll respond
        within 30 days.
      </p>

      <h2>Children</h2>
      <p>The service is not intended for anyone under 16, and we don&apos;t knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>If we make material changes, we&apos;ll tell you by email or in the app before they take effect.</p>

      <p className="pt-4 text-sm text-muted">
        See also our short <Link href="/privacy" className="text-accent">note on how documents are processed</Link> and
        our <Link href="/legal/terms" className="text-accent">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
