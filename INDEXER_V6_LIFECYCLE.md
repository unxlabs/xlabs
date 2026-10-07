# Indexer V6 — Unified Position Lifecycle
V6 centralizes the indexed Earn/Stake lifecycle vocabulary used across Earn, Stake, and History.

- Financial actions still use direct contract reads/writes.
- Indexed timestamps enrich lifecycle context; they never authorize transactions.
- Shared lifecycle: Active → Withdrawal/Unlock requested → Claimable/Ready to claim → Completed/Withdrawn.
- Indexed lifecycle dates are consistently English.
- History uses the same lifecycle vocabulary as Earn and Stake.

No D1 migration or backend deployment is required.
