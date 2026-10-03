export default function PrivacyPage() {
  return (
    <article className="space-y-5 leading-relaxed">
      <h1 className="text-2xl font-semibold tracking-tight">How your documents are processed</h1>
      <ul className="list-disc space-y-3 pl-5">
        <li>
          <strong>Stored privately.</strong> Your photos, PDFs and pasted emails are stored in your own private
          folder. Database rules make sure only your account can see them.
        </li>
        <li>
          <strong>Read by AI to save you typing.</strong> When you add a photo, PDF or email, it is sent securely to
          Anthropic&apos;s Claude AI to pull out the sender, amount, due date and what you need to do. Under
          Anthropic&apos;s commercial terms, data sent through the API is not used to train their models.
        </li>
        <li>
          <strong>You check everything.</strong> Nothing is saved to your list until you confirm the details.
        </li>
        <li>
          <strong>Nothing is sent for you.</strong> We never pay bills, contact companies or send emails on your
          behalf.
        </li>
        <li>
          <strong>Delete anytime.</strong> In Settings, &ldquo;Delete all my data&rdquo; permanently removes every
          document, file and item you&apos;ve added.
        </li>
        <li>
          <strong>Reminders.</strong> We email you 7 days and 1 day before each due date, to the address you signed up
          with.
        </li>
      </ul>
    </article>
  );
}
