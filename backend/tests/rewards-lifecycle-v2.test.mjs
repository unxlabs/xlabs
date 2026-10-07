import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(HERE, "..");
const BASE_URL = (process.env.XLAP_API_BASE_URL || "https://api.unxlabs.xyz").replace(/\/$/, "");

async function text(relativePath) {
  return readFile(resolve(BACKEND, relativePath), "utf8");
}

async function api(path, init = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { response, body };
}

// These calls intentionally omit authentication. They prove mutation endpoints
// reject the request before any reward object can be created or changed.
const unauthenticatedRewardMutations = [
  ["/admin/rewards/programs", { key: "automated-test", name: "Automated Test", rewardType: "other", distributionMode: "offchain" }],
  ["/admin/rewards/snapshots", { programId: "does-not-exist", snapshotKey: "automated-test" }],
  ["/admin/rewards/allocations", { snapshotId: "does-not-exist", userId: "does-not-exist" }],
  ["/admin/rewards/batches", { programId: "does-not-exist", batchKey: "automated-test" }],
];

for (const [path, payload] of unauthenticatedRewardMutations) {
  test(`unauthenticated POST ${path} is rejected before mutation`, async () => {
    const { response, body } = await api(path, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 401);
    assert.equal(body?.success, false);
    assert.equal(body?.authenticated, false);
  });
}

test("reward entitlements enforce idempotency and legal lifecycle states", async () => {
  const sql = await text("migrations/0016_reward_entitlements.sql");
  assert.match(sql, /idempotency_key\s+TEXT\s+NOT NULL\s+UNIQUE/i);
  assert.match(sql, /status\s+IN\s*\('pending','approved','claimable','processing','claimed','cancelled'\)/i);
  assert.match(sql, /UNIQUE\s*\(entitlement_id,\s*attempt_number\)/i);
  assert.match(sql, /attempt_number\s+INTEGER\s+NOT NULL\s+CHECK\s*\(attempt_number\s*>\s*0\)/i);
});

test("distribution schema prevents one entitlement entering multiple delivery items", async () => {
  const sql = await text("migrations/0020_reward_distribution_engine.sql");
  assert.match(sql, /UNIQUE\s*\(program_id,\s*batch_key\)/i);
  assert.match(sql, /UNIQUE\s*\(batch_id,\s*entitlement_id\)/i);
  assert.match(sql, /UNIQUE\s*\(entitlement_id\)/i);
  assert.match(sql, /idempotency_key\s+TEXT\s+NOT NULL\s+UNIQUE/i);
});

test("reward history remains an append-only event ledger", async () => {
  const sql = await text("migrations/0020_reward_distribution_engine.sql");
  assert.match(sql, /Append-only lifecycle ledger/i);
  assert.match(sql, /'delivery_started'/);
  assert.match(sql, /'delivery_submitted'/);
  assert.match(sql, /'delivery_confirmed'/);
  assert.match(sql, /'delivery_failed'/);
  assert.match(sql, /'batch_completed'/);
});

test("reconciliation is stored separately from reward events", async () => {
  const sql = await text("migrations/0021_reward_delivery_lifecycle.sql");
  assert.match(sql, /CREATE TABLE reward_reconciliations/i);
  assert.match(sql, /Operational reconciliation is intentionally separate from reward_events/i);
  assert.match(sql, /outcome\s+TEXT\s+NOT NULL/i);
});

test("delivery confirmation is idempotent after an item is already delivered", async () => {
  const source = await text("src/index.ts");
  assert.ok(
    source.includes('if(row.status==="delivered"&&row.entitlement_status==="claimed")return jsonResponse(request,{success:true,idempotent:true'),
    "delivery confirm must return idempotent success for an already delivered/claimed item",
  );
});

test("delivery confirmation requires a submitted latest attempt", async () => {
  const source = await text("src/index.ts");
  assert.ok(source.includes('a.status!=="submitted"'));
  assert.ok(source.includes('Latest delivery attempt must be submitted before confirmation.'));
});

test("failed delivery returns entitlement to a retryable claimable state", async () => {
  const source = await text("src/index.ts");
  assert.ok(source.includes("UPDATE reward_delivery_attempts SET status='failed'"));
  assert.ok(source.includes("UPDATE reward_distribution_items SET status='failed'"));
  assert.ok(source.includes("UPDATE reward_entitlements SET status='claimable'"));
  assert.ok(source.includes('retryable:true'));
});

test("matched reconciliation requires confirmed delivery", async () => {
  const source = await text("src/index.ts");
  assert.ok(source.includes('outcome==="matched"&&(row.status!=="delivered"||!a||a.status!=="confirmed")'));
  assert.ok(source.includes('Matched reconciliation requires a delivered item with a confirmed delivery attempt.'));
});

test("batch completion refuses unresolved or unreconciled delivery items", async () => {
  const source = await text("src/index.ts");
  assert.ok(source.includes('Batch has unresolved distribution items.'));
  assert.ok(source.includes('Every delivered item needs a latest matched reconciliation before batch completion.'));
  assert.ok(source.includes('if(b.status==="completed")return jsonResponse(request,{success:true,idempotent:true'));
});

test("delivery cannot start unless its batch is live", async () => {
  const source = await text("src/index.ts");
  assert.ok(source.includes('Batch must be live before delivery starts.'));
});
