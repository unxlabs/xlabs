# Indexer V9 — Auto-Recovery & Monitoring

V9 extends the production indexer without changing any smart contract, financial flow, position schema, or frontend API.

## Scheduled behavior

Every existing 5-minute cron run now:

1. Runs the normal indexer once.
2. Takes a fresh health snapshot.
3. If health is healthy or degraded, it stops normally.
4. If health is unhealthy, it automatically performs one recovery retry.
5. It takes another health snapshot after recovery.
6. If recovery fails or health remains unhealthy, it emits a structured `INDEXER_ALERT` error log for Cloudflare observability.

The retry is deliberately capped at one per cron execution to avoid infinite retry loops or RPC storms.

## Manual recovery

The protected `POST /recover` endpoint remains available and continues to require `INDEXER_RECOVERY_SECRET` (with the legacy admin-token alias retained for compatibility).

## Health visibility

`GET /health` now exposes the auto-recovery policy under `recovery.autoRecovery`, including whether it is enabled, its trigger, retry cap, and cron interval.

## Safety

- Blockchain remains the source of truth.
- No contract writes are introduced.
- No deposit, withdrawal, staking, Earn, reward, or treasury logic is changed.
- Auto-recovery only reruns the existing idempotent indexer synchronization path.
- No external notification destination is configured in V9; terminal/Cloudflare observability receives structured alert logs when self-recovery fails.
