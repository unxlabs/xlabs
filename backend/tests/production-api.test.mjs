import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = (process.env.XLAP_API_BASE_URL || "https://api.unxlabs.xyz").replace(/\/$/, "");
const APP_ORIGIN = process.env.XLAP_APP_ORIGIN || "https://unxlabs.xyz";

async function request(path, init = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  let body = null;
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    const text = await response.text();
    body = text || null;
  }

  return { response, body };
}

test("API home identifies Unlimited X Labs", async () => {
  const { response, body } = await request("/");
  assert.equal(response.status, 200);
  assert.equal(body?.success, true);
  assert.equal(body?.project, "Unlimited X Labs");
  assert.equal(body?.service, "API");
});

test("health endpoint confirms API and database availability", async () => {
  const { response, body } = await request("/health");
  assert.equal(response.status, 200);
  assert.equal(body?.success, true);
  assert.equal(body?.status, "ok");
  assert.equal(body?.service, "unlimited-x-labs-api");
  assert.equal(body?.database?.connected, true);
  assert.equal(typeof body?.database?.userCount, "number");
  assert.ok(body.database.userCount >= 0);
});

test("production app origin receives credentialed CORS preflight", async () => {
  const { response } = await request("/rewards/me", {
    method: "OPTIONS",
    headers: {
      Origin: APP_ORIGIN,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), APP_ORIGIN);
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.match(response.headers.get("access-control-allow-methods") || "", /GET/);
  assert.match(response.headers.get("access-control-allow-methods") || "", /POST/);
});

test("untrusted origins are rejected by CORS preflight", async () => {
  const { response } = await request("/rewards/me", {
    method: "OPTIONS",
    headers: {
      Origin: "https://example.invalid",
      "Access-Control-Request-Method": "GET",
    },
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

const protectedGets = [
  "/auth/me",
  "/me/overview",
  "/progression/me",
  "/activity/me",
  "/next-move/me",
  "/season/me",
  "/missions/me",
  "/referrals/me",
  "/campaigns/me",
  "/eligibility/me",
  "/rewards/me",
  "/rewards/history",
  "/xp/me",
  "/genesis/me",
  "/admin/overview",
  "/admin/audit",
];

for (const path of protectedGets) {
  test(`unauthenticated GET ${path} does not expose private data`, async () => {
    const { response, body } = await request(path);
    assert.equal(response.status, 401);
    assert.equal(body?.success, false);
    assert.equal(body?.authenticated, false);
  });
}

const protectedSyncPosts = [
  "/genesis/sync",
  "/activity/sync",
  "/progression/sync",
  "/eligibility/sync",
];

for (const path of protectedSyncPosts) {
  test(`unauthenticated POST ${path} cannot trigger account sync`, async () => {
    const { response, body } = await request(path, { method: "POST" });
    assert.equal(response.status, 401);
    assert.equal(body?.success, false);
    assert.equal(body?.authenticated, false);
  });
}

test("unknown route returns the API 404 contract", async () => {
  const { response, body } = await request(`/__automated_test_not_found__`);
  assert.equal(response.status, 404);
  assert.equal(body?.success, false);
  assert.equal(body?.error, "Not Found");
});
