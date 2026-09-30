# SupportFlow: Automated IT Request Triage

**Portfolio description**

Built an n8n workflow that validates and normalizes IT support requests, assigns a rule-based priority and support team, and coordinates ticket creation and notification. A small Next.js interface provides a public simulation and a protected server-side webhook connection.

Implemented persistent request tracking, bounded retries and notification recovery that reuses an existing ticket. Verified the workflow end-to-end with local mock APIs, including duplicate protection after restart. GitHub Issues is a lightweight ticketing stand-in, not an ITSM platform; live GitHub/Slack integration and hosted deployment remain untested.

**Stack:** n8n · JavaScript · Next.js · REST APIs · Webhooks · n8n Data Tables

**Links:** Add the actual GitHub repository URL after publishing. Add a demo URL only after deploying; label a simulation-only demo accordingly.

**What to show:** the workflow diagram, a completed mock request, notification failure followed by recovery with the same ticket, and the verification report.

**Short portfolio card**

An n8n IT request-triage project with validation, rule-based routing, persistent duplicate checks and notification recovery. Includes a Next.js demo. Tested end-to-end with local mock APIs, including persistence after restart.
