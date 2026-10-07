# Rewards Lifecycle Automated Tests V2

This layer adds non-destructive regression checks around the Rewards V3 lifecycle.

It covers two boundaries:

1. Production mutation security: unauthenticated reward mutation requests must return 401 before changing state.
2. Source/schema invariants: idempotency, one-entitlement/one-distribution-item protection, attempt numbering, append-only history, retry behavior, reconciliation requirements, and batch-completion guards.

The suite intentionally does not use an admin session and does not create rewards, XP, transfers, claims, deposits, stakes, or on-chain transactions.

Run from `backend/` with:

    npm test

These tests are regression guards. They do not replace authenticated staging tests or future contract-level tests for the real XLAP distributor.
