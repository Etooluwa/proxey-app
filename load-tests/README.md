# Kliques Load Tests

## Install k6
```bash
brew install k6
```

## Quick run (public endpoints only, no tokens needed)
```bash
k6 run load-tests/kliques.load.js
```

## Full run (includes authenticated client + provider flows)

1. Log into app.mykliques.com in Chrome
2. Open DevTools → Application → Local Storage → `https://app.mykliques.com`
3. Find the key that contains `access_token` (inside the supabase auth JSON)
4. Copy the `access_token` value — that's your JWT

```bash
k6 run \
  --env CLIENT_TOKEN=<client_access_token> \
  --env PROVIDER_TOKEN=<provider_access_token> \
  --env PROVIDER_ID=<provider_auth_uuid> \
  --env CLIENT_PROVIDER_ID=<a_provider_uuid_the_client_has_booked> \
  load-tests/kliques.load.js
```

## What to watch during the test

### Render dashboard
- Go to your backend service → Metrics tab
- Watch: CPU (keep under 80%), Memory, Response time

### Supabase dashboard
- Reports → Database → watch active connections (free tier cap: 60)
- Reports → API → watch request volume and error rate

## Stages
| Stage | Duration | Virtual Users |
|-------|----------|---------------|
| Warm up | 30s | 10 |
| Steady | 1m | 10 |
| Ramp up | 30s | 30 |
| Steady | 1m | 30 |
| Peak | 30s → 1m | 50 |
| Ramp down | 30s | 0 |

Total test duration: ~5 minutes

## Thresholds (pass/fail criteria)
- 95% of requests under 2s
- Under 2% error rate
- Public endpoints: 95% under 1s

## Results
Saved to `load-tests/results/summary.json` after each run.
