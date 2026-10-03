import type { Metadata } from "next";
import Link from "next/link";
import { FREE_DOCUMENTS_PER_MONTH } from "@/lib/plans";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Terms of Service · Paperwork Autopilot" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="[Date]">
      <p>
        These terms are an agreement between you and [Company name] (&ldquo;we&rdquo;, &ldquo;us&rdquo;) for your use of
        Paperwork Autopilot. By creating an account you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        Paperwork Autopilot helps you keep track of bills, renewals and official letters. It uses AI to read documents
        and suggest details, flags, and message drafts. <strong>AI can make mistakes.</strong> Always check the extracted
        details against the original document. You remain responsible for paying your bills, meeting deadlines and
        deciding what to send. We are not a bank, payment service, or legal, tax or financial adviser.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 16 and give a valid email address.</li>
        <li>Keep your password secure; you&apos;re responsible for activity on your account.</li>
        <li>Only upload documents you have the right to share with us.</li>
      </ul>

      <h2>Plans and payment</h2>
      <ul>
        <li>The Free plan includes up to {FREE_DOCUMENTS_PER_MONTH} AI-read documents per month.</li>
        <li>
          Pro is a monthly subscription billed in advance through Stripe and renews automatically until you cancel. You
          can cancel anytime in Settings → Manage billing; Pro stays active until the end of the paid period.
        </li>
        <li>Except where the law requires otherwise, payments are non-refundable.</li>
        <li>We may change prices with at least 30 days&apos; notice; changes apply from your next billing period.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>
        Don&apos;t misuse the service: no illegal content, no attempts to access other people&apos;s data, no automated
        scraping or overloading, and no reselling without our permission. We may suspend accounts that break these rules.
      </p>

      <h2>Your content</h2>
      <p>
        You own the documents and data you add. You give us permission to store and process them only to provide the
        service, as described in our <Link href="/legal/privacy" className="text-accent">Privacy Policy</Link>.
      </p>

      <h2>Availability and changes</h2>
      <p>
        We work to keep the service running but don&apos;t guarantee it will be uninterrupted or error-free, or that
        reminder emails will always arrive. We may change or discontinue features, and will give reasonable notice of
        major changes.
      </p>

      <h2>Disclaimers and liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;. To the extent the law allows, we are not liable for indirect or
        consequential losses, including late fees, missed deadlines or lost savings, and our total liability is limited
        to the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under
        consumer protection law.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can stop using the service and delete your data at any time. We may close accounts that break these terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of [country / state]. Contact: [contact email].</p>
    </LegalPage>
  );
}
