# Load Tests

This folder contains a minimal `k6` setup for backend load testing.

## Prerequisite

Install `k6` locally first.

## Environment Variables

- `BASE_URL`
  - Example: `http://localhost:5000`
  - Example: `https://proxeybooking-app.onrender.com`
- `AUTH_TOKEN`
  - Bearer token for authenticated endpoints
- `PROVIDER_ID`
  - Required for booking creation tests
- `SERVICE_ID`
  - Required for booking creation tests
- `PAYMENT_METHOD_ID`
  - Optional, only if you want to exercise the paid booking path
- `LOADTEST_BYPASS_KEY`
  - Optional client-side key for bypassing rate limits during staging/local load tests
  - Only works if the server also has `ENABLE_LOADTEST_RATE_LIMIT_BYPASS=true`
  - Ignored in production

## Server-side bypass setup

Use this only for staging or local load tests.

- `ENABLE_LOADTEST_RATE_LIMIT_BYPASS=true`
- `LOADTEST_BYPASS_KEY=your_shared_secret`
- `NODE_ENV` must not be `production`

When those are set on the server, any request carrying header
`x-loadtest-bypass: your_shared_secret` will skip the Express rate limiters.

## Commands

Health check:

```bash
BASE_URL=http://localhost:5000 \
LOADTEST_BYPASS_KEY=your_shared_secret \
npm run loadtest:health
```

Authenticated dashboard:

```bash
BASE_URL=https://your-api.example.com \
AUTH_TOKEN=your_token \
LOADTEST_BYPASS_KEY=your_shared_secret \
npm run loadtest:auth
```

Booking creation:

```bash
BASE_URL=https://your-api.example.com \
AUTH_TOKEN=your_token \
PROVIDER_ID=provider_uuid \
SERVICE_ID=service_uuid \
LOADTEST_BYPASS_KEY=your_shared_secret \
npm run loadtest:booking
```

## Notes

- Start with staging if possible.
- Do not enable the bypass in production.
- Do not hammer live Stripe payment creation unnecessarily.
- Use test accounts and test data.
- For first-pass capacity checks, start with `loadtest:health`, then move to authenticated and booking flows.
