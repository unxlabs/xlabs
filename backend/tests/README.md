# XLAP automated production smoke tests

These tests are intentionally read-only / unauthenticated. They validate the public API contract, database health, production CORS policy, authentication boundaries, Integration Bridge endpoint protection, Rewards/History privacy, Admin privacy, and the 404 contract without creating XP, rewards, transactions, sessions, or on-chain actions.

Run from `backend/`:

```bash
npm test
```

Or explicitly against production:

```bash
npm run test:production
```

Optional environment overrides:

- `XLAP_API_BASE_URL`
- `XLAP_APP_ORIGIN`
