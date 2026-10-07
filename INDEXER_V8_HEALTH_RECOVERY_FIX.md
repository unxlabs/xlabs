# Indexer V8.1 — Health & Recovery Fix

Fixes two production findings from V8 validation:

1. The deployed secret is named `INDEXER_RECOVERY_SECRET`, while the first V8 implementation only read `INDEXER_ADMIN_TOKEN`. The worker now reads `INDEXER_RECOVERY_SECRET` and retains the older name only as a backward-compatible alias.
2. The original lag thresholds (30 degraded / 300 unhealthy) were tighter than the existing 5-minute cron cadence on BNB Chain, so a normally operating worker could report unhealthy between scheduled runs. V8.1 uses 800 blocks for degraded and 1600 for unhealthy, while also enforcing last-success age (10 minutes degraded / 20 minutes unhealthy) and contract scan health.

No contract, position accounting, deposit, withdrawal, or reward logic is changed.
