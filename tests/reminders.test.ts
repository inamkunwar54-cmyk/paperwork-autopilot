import { test } from "node:test";
import assert from "node:assert/strict";
import { reminderKindFor } from "../src/lib/reminders";

const today = "2026-10-02";
const at = (due_date: string | null, status = "open") => reminderKindFor({ due_date, status }, today);

test("7-day reminder covers 2 to 7 days out", () => {
  assert.equal(at("2026-10-09"), "7d");
  assert.equal(at("2026-10-04"), "7d");
  assert.equal(at("2026-10-10"), null);
});

test("1-day reminder covers tomorrow and today", () => {
  assert.equal(at("2026-10-03"), "1d");
  assert.equal(at("2026-10-02"), "1d");
});

test("nothing for overdue, undated or done items", () => {
  assert.equal(at("2026-10-01"), null);
  assert.equal(at(null), null);
  assert.equal(at("2026-10-03", "done"), null);
});
