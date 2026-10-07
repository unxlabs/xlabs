# Unlimited X Labs Indexer V1

Cloudflare Worker indexer for BNB Chain.

## V1 scope
- Tracks Genesis, both Earn vaults, and all three Stake contracts.
- Stores canonical raw logs with `(chain_id, transaction_hash, log_index)` deduplication.
- Uses 15-block confirmation depth before live ingestion.
- Keeps a live cursor and an independent backwards backfill cursor.
- Backfills history gradually without delaying current activity.
- Decodes `GenesisPassMinted` into a dedicated projection table.
- Keeps unknown Earn/Stake logs raw until their verified event ABIs are added.
- `/health` exposes operational cursor/count state only.

## Deployment order
1. Apply backend migration `0022_chain_indexer.sql` remotely.
2. Install dependencies in `indexer/`.
3. Set `BNB_RPC_URL` as a Worker secret.
4. Deploy the indexer Worker.
5. Verify `/health`, then allow scheduled runs to advance live/backfill cursors.

Do not delete or rewrite raw `chain_events`; projections can always be rebuilt from them.
