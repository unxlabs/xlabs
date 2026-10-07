# Rewards Lifecycle V3

Production-safe backend correction after the first V2 delivery-start validation.

- Keeps applied migration `0021_reward_delivery_lifecycle.sql` byte-for-byte unchanged.
- Fixes the `reward_delivery_attempts` start INSERT (13 columns / 13 values).
- Makes delivery start idempotent when an active attempt already exists and detects inconsistent state.
- Supports failure -> claimable -> retry with incrementing attempt numbers.
- Requires submitted delivery before confirmation; confirmation marks attempt confirmed, item delivered, entitlement claimed.
- Tightens matched reconciliation to confirmed deliveries only.
- Batch completion requires every item resolved and every delivered item to have latest reconciliation outcome `matched`.
- Adds reward-program status transitions.
- Adds pre-activation batch configuration for future claim/push distributions.
- Validates snapshot/program ownership and frozen snapshot when creating a batch.
- Activation validates distribution totals and claim/push prerequisites.
- Preserves the internal production-validation batch path through `metadata.internalTest=true` without treating XP as financial entitlement.
- Numeric allocation score/weight inputs are normalized to strings instead of silently becoming null.

No new migration is required for these backend corrections.
