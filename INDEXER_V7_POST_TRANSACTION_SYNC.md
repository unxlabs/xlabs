# Indexer V7 — Post-Transaction Sync

After a confirmed Earn or Stake financial transaction, the UI now:

1. Immediately refreshes authoritative contract reads.
2. Best-effort syncs backend activity and progression.
3. Revalidates indexed positions immediately, then again after short delays.
4. Keeps contract state authoritative for financial actions while the indexer finalizes independently.

Approval transactions are excluded from the financial post-transaction sync path.
