const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

async function postSync(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok && response.status !== 401) {
    throw new Error(`Sync request failed with status ${response.status}.`);
  }
}

/**
 * Best-effort application sync after a confirmed financial transaction.
 * Contract reads remain authoritative. The chain indexer continues to finalize
 * independently and the UI revalidates indexed positions after this call.
 */
export async function syncAfterOnchainTransaction(): Promise<void> {
  await Promise.allSettled([
    postSync("/activity/sync"),
    postSync("/progression/sync"),
  ]);
}
