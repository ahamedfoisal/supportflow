# n8n Cloud and Vercel are separate deployments

## n8n Cloud

1. Create/sign in to your Cloud instance yourself. Keep the editor behind your account login; do not publish editor credentials or expose it through the frontend.
2. Record its installed n8n version. Local reference is 2.41.4; Cloud upgrades are managed by n8n. Recheck node configuration and rerun tests when the version changes.
3. Follow the README's Data Table creation and workflow import steps. Configure Header Auth and select and publish the error workflow. Keep execution-data saving disabled, including manual runs. Do not pin the incoming webhook item.
4. For real APIs, choose a private test repository and a test Slack channel, configure the minimum credentials, generate/import the real configuration, and get explicit approval before any real issue/message test.
5. Publish the main workflow and copy its **Production URL**, e.g. `https://YOUR-SUBDOMAIN.app.n8n.cloud/webhook/supportflow`.
6. Never use Cloud's localhost for the mocks: it refers to the Cloud runtime. For today's account-free end-to-end mock demo use local n8n. The public Vercel simulation needs no n8n connection at all. No public mock hosting infrastructure is required.
7. Cloud Data Tables persist between executions and provider restarts, but concurrency is not an atomic claim. Run the portfolio demonstration sequentially and disclose this limitation. The local concurrency environment variable does not configure Cloud.

## Vercel

1. Upload the project to a repository you own after checking `.gitignore` and reviewing the export. Do not upload `.env*`, `.runtime`, node_modules, saved execution data or mock state. No repository was created by this build.
2. Import that repository in Vercel. Set Root Directory to `web`, framework Next.js, Node.js 24.x. Install with `npm ci`, build with `npm run build`; keep the default Next.js output handling.
3. For public simulation only, no n8n secret is necessary. The source link defaults to `https://github.com/ahamedfoisal/supportflow`. Set `SOURCE_REPOSITORY_URL` only if you want to override it, such as for a fork.
4. For protected execution, set these **server-only** environment variables in Vercel project settings:

| Variable | Value |
|---|---|
| `N8N_WEBHOOK_URL` | Cloud production HTTPS webhook URL |
| `N8N_WEBHOOK_SECRET` | Raw random secret (without `Bearer `); n8n Header Auth uses `Authorization` with value `Bearer YOUR_SECRET` |
| `DEMO_ACCESS_CODE` | Random value at least 16 characters; share privately with the reviewer |
| `APP_ORIGIN` | Your exact deployed origin, e.g. `https://supportflow-demo.vercel.app` |
| `SOURCE_REPOSITORY_URL` | Optional source repository override |

5. Do not use `NEXT_PUBLIC_` for any credential or webhook setting. Do not hardcode secrets in components, commit them, print them to logs or send them to chat. The access code is entered by the reviewer and checked on the server; the n8n secret never goes to the browser.
6. Configure preview and production environments deliberately. Keep real credentials out of untrusted preview deployments. Changing server environment settings requires redeployment.
7. Verify public simulation first. With approval, enter the code and submit one synthetic real request. Inspect both services, then resubmit exactly the same ID to check deduplication.

## Abuse protection and trust boundaries

The API enforces an 8 KiB body limit, input validation, same-origin check when an Origin is supplied, a per-process 10-requests/minute/IP limit, a fixed server-controlled webhook destination, and constant-time comparison of hashed access-code values. It strips the access code and all unrelated fields before forwarding. It returns an allowlist of fields and safe ticket links. It does not run ticketing, persistence or notification orchestration.

Per-process throttling resets on cold starts and can be bypassed across Vercel instances; IP headers only have meaning behind a trusted proxy. Before sharing broadly, add a Vercel Firewall rate-limit rule for `/api/requests` if available on your plan. The unguessable access code is the primary barrier against public visitors causing real actions. Rotate it after the demonstration. This is basic demo protection, not an enterprise authentication system.

Public simulation uses a small deterministic priority illustration. It calls no workflow and keeps no persistent records. Real and n8n-backed mock orchestration stay entirely inside n8n.

The route requests up to 60 seconds of function duration, with a 50-second upstream timeout. Confirm your Vercel plan's supported duration. A hosting timeout is not evidence of ticket failure. Retain request IDs during all retries.
