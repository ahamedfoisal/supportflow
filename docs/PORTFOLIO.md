# Three-minute demo

**0:00–0:30 — Scope and honesty.** “SupportFlow is a portfolio learning project. GitHub stands in for ticketing, not a full ITSM platform. This public screen is a simulation; I will label any n8n-backed mock or real execution separately.” Submit the frontend sample and show its simulated label and no ticket link.

**0:30–1:00 — Follow the graph.** Open the private n8n editor locally. Point to Header Auth, validation and the rules. Explain P1 for organization/high, P2 for either, P3 otherwise. Mention that access requests only suggest a team and grant nothing.

**1:00–1:40 — Execute the verified mode.** Only after completing the n8n verification yourself, submit a new synthetic ID to the local mock workflow. Show the ticket and notification counts, response priority and URL. Explain that `mock.invalid` is a reference, not an actual GitHub ticket. Replay the same ID and show unchanged ticket count.

**1:40–2:20 — Partial success and recovery.** Use a fresh ID containing `SLACKFAIL`. Show notification failure with the retained ticket URL. Retry unchanged; the mock recovers and the ticket count stays unchanged. Show the saved state. If this has not been tested yet, describe it as implemented but unverified rather than staging a fake result.

**2:20–3:00 — Tradeoffs.** Explain why a creation timeout is reserved for reconciliation, why Slack may duplicate after an ambiguous send, and why concurrent requests can race in Cloud. Show the verification report and name exactly which tests you personally ran. Real integration evidence requires inspecting the actual approved repository and channel.

# Five interview questions

1. **Why n8n instead of a separate Python service?** The visible graph owns branching, HTTP calls, waits and persistent state. Code nodes only normalize/classify/interpret responses. Next.js validates and forwards protected requests; it does not create issues or send Slack messages.
2. **How do you prevent duplicate tickets?** A mode-prefixed request ID maps to a persistent row; a canonical normalized payload detects conflicts. I reserve before creation and save the ticket before notifying. Sequential retries reuse it. This is not an atomic uniqueness guarantee under concurrency.
3. **Which errors are safe to retry?** Explicit ticket rate limits get bounded retries. Ticket timeouts/5xx may conceal a successful creation, so they are held for reconciliation. Notification 429/5xx/transport errors retry up to three attempts. Validation and ordinary auth errors do not.
4. **What happens if Slack fails?** The stored ticket URL remains, outcome is partial success, and resubmission enters notification only. Slack `ok:false` is a failure even with HTTP 200. An ambiguous successful Slack send can still duplicate on retry.
5. **How are credentials and private data handled?** Tokens stay in n8n credentials; webhook URL/secret and demo code are server-only Vercel values. Slack gets only ID, priority and ticket URL. Saved execution results are disabled. n8n can still retain initial snapshots pending pruning, so its database and backups must be protected. Sanitized state/audit records support recovery.

# Two CV bullets accurate for the delivered verification level

- Implemented a portfolio n8n workflow for validated IT request triage, with GitHub/Slack API configuration, persistent request state, bounded retries and notification recovery; verified end-to-end using local mock APIs, including duplicate detection after restart.
- Built a Next.js demo with server-side validation, protected webhook forwarding and clearly labeled public simulation; verified the production build, browser simulation, seven server-route tests and actual forwarding to local n8n/mock APIs; live GitHub/Slack integration and hosted deployment remain untested.

After you run the missing tests, revise these with the specific evidence you obtained. Do not add reliability percentages, time savings, enterprise deployments or production experience without measurements.

# Personal checklist before using this project on your CV

- [ ] Import and publish the workflow in n8n; record the actual version.
- [ ] Run valid, invalid, missing-auth and wrong-auth requests.
- [ ] Demonstrate no second ticket for a repeated ID and a 409 for a changed payload.
- [ ] Show three bounded rate-limit attempts and one permanent rejection attempt.
- [ ] Recover notification failure without creating another ticket.
- [ ] Explain and demonstrate the uncertain-creation stop path.
- [ ] Restart n8n and verify the same ID still deduplicates.
- [ ] Explain every expression, credential reference and branch in the learning guide.
- [ ] Explain Data Table race conditions and the limits of per-instance frontend throttling.
- [ ] Deploy Vercel and configure Cloud separately if claiming a hosted demo.
- [ ] Set the real source repository link.
- [ ] Obtain approval and inspect actual GitHub/Slack artifacts before claiming real integration testing.
- [ ] Update the verification report and CV bullets to match only what you personally observed.
