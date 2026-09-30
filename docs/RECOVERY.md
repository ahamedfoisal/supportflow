# Failure and recovery procedure

| Result | Meaning | Action |
|---|---|---|
| 200 completed | Ticket and notification accepted | Repeated identical ID returns stored result. |
| 422 validation_failed | Invalid input, no ticket API call | Correct fields and resubmit. |
| 401/403 webhook rejection | Incoming credential failed, graph did not run | Correct credential locally; never retry in a loop. |
| 409 request_id_conflict | ID belongs to different normalized request | Restore original payload; use a new ID only for a genuinely new request. |
| 502 ticket_failed | Explicit rejection, including exhausted rate-limit attempts | Fix permission/payload or wait. Operator can reconcile and remove the record only after confirming no ticket exists. |
| 409 creation_uncertain | Creation may have happened; no safe response received | Reconcile manually; no automatic create on resubmission. |
| 207 notification_failed | Ticket reference saved, notification unsuccessful | Fix Slack/channel/auth issue, then resubmit same ID and payload. |
| Frontend timeout_unknown / upstream_unavailable | Proxy could not confirm workflow result | Reuse same request ID/body. The workflow may still be running. |

## Retry policy

Three total attempts maximum per API stage per execution. No blanket n8n “Retry on Fail” switch is enabled. Native If and Wait nodes choose retries:

- Ticket: explicit HTTP 429, or 403 with rate-limit headers. Backoff at least 1 then 2 seconds; honor numeric/date Retry-After and GitHub reset timing up to 5 seconds. A larger delay is returned as failure for later operator action, never shortened to fit the request.
- Ticket HTTP 5xx, timeout, broken JSON or malformed 201: creation is **uncertain**. Do not retry POST blindly; a server may have created the issue before failing to return it.
- Ticket 400/401/ordinary 403/404/422: no retry. A known failed ID remains reserved until reviewed.
- Notification: 429, 5xx or transport error retry, maximum three attempts. A normal Slack HTTP 200 with `ok:false` is treated as a failure, not success; no blind retry for application errors such as `invalid_auth` or `channel_not_found`.
- Incoming validation and authentication failures never enter API retry paths.
- Each HTTP attempt has an 8-second timeout; waits cap at 5 seconds. The workflow has a 90-second timeout. Vercel forwarding times out after 50 seconds; the browser after 55. This may produce unknown completion while n8n continues; retain the ID.

## Ambiguous ticket creation

1. Stop retrying with new IDs. Note the request ID and execution ID from the response/state.
2. Inspect the configured test repository for an issue whose title begins `[REQUEST-ID]`. Check issue history and API/service status; a negative search immediately after a timeout is not definitive.
3. If exactly one matching issue exists, edit that request's `state` JSON in the Data Table: set `ticket_url` to the verified issue URL, `outcome` to `notification_pending`, `http_status` to 202. Preserve `fingerprint`, `request`, `mode`, and other fields. Resubmit the original payload to run notification only.
4. If none exists, wait until the provider outcome is settled and confirm no in-flight execution remains. Only then delete that specific request row and resubmit. Deleting the row removes duplicate protection for that ID.
5. If multiple issues exist, reconcile manually; do not claim exactly-once behavior.

The reservation also covers a process crash between ticket creation and saving its URL. A crash after Slack accepts a message but before completion is saved can still duplicate a Slack message on recovery. This project prioritizes avoiding duplicate tickets; it does not guarantee exactly-once notification delivery.

## Unexpected failures and privacy

Handled API failures keep a safe `stage`, `last_status`, `attempt`, `execution_id` and outcome in the request row. Unexpected failures use the separate error workflow, with only IDs, last node, timestamp and a fixed outcome. Provider error objects are never copied into the audit table.

Saved execution results are disabled because incoming webhook headers include the secret. **This is not a no-storage guarantee:** n8n writes an initial execution snapshot and soft-deletes it on completion; the database may retain it until pruning. Protect the database and its backups as credential-bearing storage. The standard Authorization header is used so n8n recognizes it as a sensitive output field; never assume redaction makes raw database exports safe. Do not enable debug logging, pin Request output, export execution data, or post screenshots containing headers. Credentials live in n8n's credential store. Use synthetic email/descriptions; request state and GitHub issue bodies contain them intentionally. The error workflow itself cannot reliably report a database outage into that same database; consult local service health logs without enabling request-body logging. Resolve storage/service issues before replay.

Do not automatically retry from a failed HTTP node in the editor. Re-enter through the webhook so the persistent state is checked first. Unexpected errors before a response may yield n8n's generic 500; frontend reports an unknown upstream outcome. Sanitized audit records supply context without putting raw execution payloads into the audit table.
