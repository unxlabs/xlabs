# Indexer V5 — Position Management UX

Earn and Stake now expose indexed position lifecycle context while keeping financial actions verified directly against the BNB Chain contracts.

## Production validation patch

- Stake always renders the indexer connection state, including wallets with zero positions.
- Empty Stake pools explicitly show `0 indexed` instead of hiding the on-chain positions section.
- Earn distinguishes the live contract aggregate from indexed position principal to avoid presenting two differently-scoped values as if they were the same metric.
- Refresh updates both direct contract reads and indexer context.
