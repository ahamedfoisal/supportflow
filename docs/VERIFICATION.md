# Verification record — 2026-09-30

## Completed checks

- **Next.js production build:** passed on Node 24.9.0, using Next.js 16.3.7 and the included lockfile.
- **Seven server-route tests:** passed. Normalization/validation, public simulation with no upstream call, wrong-code and origin rejection, payload bound, protected forwarding with partial success, timeout behavior, per-process rate limit. Fetch is stubbed for upstream cases; this does not prove n8n integration.
- **Browser public simulation:** submitted the form to a real local Next.js server and observed SIMULATED / REQ-1001 / P3, with explicit notice that no n8n execution, ticket or Slack message occurred. Visual layout inspected. An origin mismatch discovered in browser testing was corrected and covered by a test.
- **Four direct mock HTTP tests:** passed. Ticket plus notification; two 429 responses then success; permanent 422 rejection; three notification failures then success. These exercise the mock service, not n8n orchestration.
- **Workflow static checks:** JSON parsing, embedded JavaScript syntax and connection targets passed. Relevant Data Table, HTTP Request and Wait node formats were checked against pinned official source. These checks alone do not prove n8n import or execution.

Raw test/build summaries are in [evidence](evidence/).

- **Actual frontend-to-n8n HTTP integration:** passed using the Next.js development server, actual n8n 2.41.4, and local mock APIs. Public simulation created no ticket; protected forwarding created one ticket/notification; replay kept the same ticket reference and count. The local watcher limit required `WATCHPACK_POLLING=1000` with `--webpack` for this development-server test.

## Actual n8n execution

The first installation attempt exhausted disk space. After space became available, n8n 2.41.4 installed and ran on Node 24.9.0 in an isolated local directory. Both delivered workflow definitions were imported through n8n’s own REST API, tables and a local credential were created, and workflows published. Credential binding and error-workflow selection are the expected instance-specific changes.

| Required behavior | Observed result against local mocks |
|---|---|
| Valid request | Ticket and notification created, P3 returned |
| Invalid input | 422 for email, missing field, enums and length checks |
| Missing/incorrect webhook authentication | Rejected before graph execution |
| Sequential repeated ID | Same ticket URL, no additional ticket |
| Changed payload with same ID | request_id_conflict |
| Transient rate limit | Three attempts each for ticket and notification, then success |
| Permanent ticket/API authentication failure | Clear failure; one API attempt |
| Notification failure | Retained ticket URL; replay recovered notification without another ticket |
| Ambiguous creation timeout | creation_uncertain; replay made no additional ticket |
| Normalization and routing | Spaced/mixed-case enums normalized; organization/high returned P1; issue body contained Identity support |
| Restart persistence | Stopped/restarted n8n using the same data directory; replay created no ticket |
| Unexpected failure audit | A temporary test workflow threw a synthetic error; the published Error Trigger workflow persisted safe context |

The error-workflow test exposed a setup requirement: **publish the audit workflow too**. The guide now includes it. Temporary test workflows were deactivated after use. Native JS Code execution passed; the unused optional Python runner emitted an environment warning.

## Privacy check and limitation

Generated webhook secrets were absent from the n8n text logs, delivery source, and exported workflow JSON. The audit row contained only safe IDs, last-node name, timestamp and a fixed outcome.

Database inspection found that n8n stores an initial execution snapshot and soft-deletes it even when saved execution results are disabled. Such snapshots can contain the incoming credential until hard pruning. The project uses the standard Authorization header recognized by n8n as sensitive and keeps execution-result saving off, but does **not** claim that this prevents secret-bearing database snapshots. Protect database access and backups; never share raw database/execution exports. No secret values are included in this report.

## Not verified

Real GitHub/Slack calls, Docker Compose startup, Vercel deployment, n8n Cloud execution, concurrent idempotency, and exactly-once notification delivery. No external issues, Slack messages or deployments were created during verification. The reviewed source was subsequently published, with owner approval, at [https://github.com/ahamedfoisal/supportflow](https://github.com/ahamedfoisal/supportflow).

## Personally confirmed by the project owner

On 2026-09-30, the owner reported successful manual checks of sequential duplicate protection, notification failure/recovery and duplicate protection after restart. The request `REQ-CHECK-SLACKFAIL-101` was also found in the local request table with a completed outcome and one matching mock ticket. These are local mock results, not live GitHub/Slack results.

## Reproduction

```sh
cd web
npm ci
npm test
npm run build
cd ..
# With `node mocks/server.mjs` running in another terminal:
node --test scripts/mock.test.mjs
# After following README import/table/credential setup and publishing local mock workflow:
node scripts/verify-n8n.mjs
```

Restart n8n preserving its data folder/volume, then run the `--after-restart` command printed by the n8n test script. Record the installed version and actual outcomes. Never interpret successful mock tests as proof of live GitHub/Slack integration.

## Official references checked

- [n8n npm installation](https://docs.n8n.io/hosting/installation/npm/)
- [n8n releases](https://github.com/n8n-io/n8n/releases) and [official npm package](https://www.npmjs.com/package/n8n)
- [Webhook authentication and response modes](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
- [HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) and [credentials](https://docs.n8n.io/integrations/builtin/credentials/httprequest/)
- [Data Tables](https://docs.n8n.io/build/work-with-data/data-tables/) and [Data Table node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/)
- [Error workflows](https://docs.n8n.io/flow-logic/error-handling/)
- [Pinned Data Table schema source](https://github.com/n8n-io/n8n/tree/n8n%402.41.4/packages/nodes-base/nodes/DataTable)
- [Pinned HTTP Request schema](https://github.com/n8n-io/n8n/blob/n8n%402.41.4/packages/nodes-base/nodes/HttpRequest/V3/Description.ts)
- [Pinned Wait node](https://github.com/n8n-io/n8n/blob/n8n%402.41.4/packages/nodes-base/nodes/Wait/Wait.node.ts)
- [GitHub create issue API and permissions](https://docs.github.com/en/rest/issues/issues#create-an-issue)
- [Slack chat.postMessage](https://docs.slack.dev/reference/methods/chat.postMessage/)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)

The Data Table filter (`filters.conditions`, `keyName`, `condition`, `keyValue`), resource mapper (`columns.mappingMode`, `value`) and table locator format were read from pinned n8n source. The npm registry returned `stable` / `latest` = 2.41.4 during initial inspection. Cloud versions are provider-managed and need their own verification.
