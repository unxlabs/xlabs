# Unlimited X Labs — Indexer V2

V2 adds deterministic on-chain position materialization for Earn and Stake without inventing unverified event ABIs.

## What changes
- Keeps V1 raw log/event indexing and Genesis decoding.
- Adds `chain_positions` as a current-state materialized view sourced directly from each contract's `getPosition(id)`.
- Adds `chain_position_scan_state` so each Earn/Stake contract discovers sequential position IDs incrementally and resumes safely.
- Refreshes known positions every cron so withdrawal/unlock/funding/claimable/withdrawn state changes are reflected.
- `/health` now reports position counts and per-contract discovery cursors.

## Trust model
Financial position state is read from BNB Chain contracts. Raw logs remain stored independently for audit/history enrichment. V2 deliberately does not guess Earn/Stake event signatures that are not present in the project source ABI.

## Apply
From `backend/`:

```bash
npx wrangler d1 migrations apply unlimited-x-labs-db --remote --config wrangler.indexer.jsonc
npx tsc --noEmit
npx wrangler deploy --config wrangler.indexer.jsonc
```
