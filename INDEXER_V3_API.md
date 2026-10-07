# Unlimited X Labs — Indexer V3 API Integration

Adds authenticated `GET /positions/me` backed by `chain_positions` and exposes the indexed position summary in Portfolio.

Files:
- backend/src/index.ts
- src/shared/api/positions.ts
- src/features/app/pages/Portfolio.tsx
- src/features/app/pages/Portfolio.module.css

No database migration is required. Migration 0023 already owns the indexed position schema.

Validation target after install:
1. `npx tsc --noEmit` in backend
2. `npm run build` at project root
3. deploy main API Worker
4. authenticated GET `/positions/me`
5. verify Portfolio position counts against D1
