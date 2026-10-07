# Indexer V4 — Unified On-Chain History

## Scope
- Replaces the History placeholder with production data.
- Uses `/positions/me` for the indexed position snapshot.
- Uses `/activity/me` for trusted on-chain lifecycle events.
- Shows Earn and Stake positions in one view.
- Shows deposit / withdrawal-request / unlock-request / withdrawn lifecycle activity.
- Keeps transactional Earn/Stake actions reading contracts directly; the indexer is not used to authorize a financial action because it can lag the chain.

## No backend migration
V4 uses the existing V3 positions endpoint and existing trusted activity endpoint. No D1 migration or backend deploy is required for this package.
