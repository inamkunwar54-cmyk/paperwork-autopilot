// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectMoneyLeaks } from "../src/lib/money-leaks";

const today = new Date(2026, 9, 2); // 2 Oct 2026
let n = 0;
const item = (o: Record<string, unknown>) => ({
  id: `i${++n}`,
  sender: "Comcast",
  sender_key: "comcast",
  amount: 80,
  currency: "USD",
  due_date: null,
  billing_period: "monthly",
  auto_renews: false,
  status: "open",
  created_at: "2026-09-01T00:00:00Z",
  doc_type: "bill",
  ...o,
}) as never;

test("flags a price increase against the previous bill from the same sender", () => {
  const alerts = detectMoneyLeaks(
    [item({ due_date: "2026-09-09", status: "done" }), item({ id: "new", amount: 92, due_date: "2026-10-09" })],
    today,
  );
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, "price_increase");
  assert.equal(alerts[0].itemId, "new");
  assert.match(alerts[0].message, /went up \$12\.00\/month/);
});

test("no flag when the price went down or stayed the same", () => {
  assert.equal(detectMoneyLeaks([item({ due_date: "2026-09-09" }), item({ amount: 70, due_date: "2026-10-09" })], today).length, 0);
  assert.equal(detectMoneyLeaks([item({ due_date: "2026-09-09" }), item({ due_date: "2026-10-09" })], today).length, 0);
});

test("flags same sender, amount and month as a possible duplicate", () => {
  const alerts = detectMoneyLeaks([item({ id: "a", due_date: "2026-10-09" }), item({ id: "b", due_date: "2026-10-12" })], today);
  assert.deepEqual(alerts.map((a) => [a.kind, a.itemId]).sort(), [["duplicate", "a"], ["duplicate", "b"]]);
});

test("does not treat a monthly vs yearly change as a price increase", () => {
  const alerts = detectMoneyLeaks(
    [item({ due_date: "2026-09-09" }), item({ amount: 900, billing_period: "yearly", due_date: "2026-10-09" })],
    today,
  );
  assert.equal(alerts.length, 0);
});

test("flags auto-renewals in the next 30 days only", () => {
  const alerts = detectMoneyLeaks(
    [
      item({ id: "soon", sender_key: "a", auto_renews: true, due_date: "2026-10-20" }),
      item({ id: "later", sender_key: "b", auto_renews: true, due_date: "2026-12-20" }),
      item({ id: "past", sender_key: "c", auto_renews: true, due_date: "2026-09-20" }),
    ],
    today,
  );
  assert.deepEqual(alerts.map((a) => a.itemId), ["soon"]);
  assert.match(alerts[0].message, /in 18 days/);
});

test("ignores other senders and done items", () => {
  const alerts = detectMoneyLeaks(
    [item({ due_date: "2026-09-09" }), item({ sender_key: "other", amount: 99, due_date: "2026-10-09" }), item({ amount: 95, due_date: "2026-10-20", status: "done" })],
    today,
  );
  assert.equal(alerts.length, 0);
});
