# Stack Registry

Version 1.0 · Owner: you

The only tools agents and builders may use in client work. The Stack Architect agent (A-2) picks from this list and nothing else. AI model choices are in `MODEL_ROUTING.md`.

**Status labels**
- **Approved**: use freely when the "use when" fits
- **Trial**: allowed on one client at a time, with your sign-off, while you learn it
- **Avoid**: don't use for new work (reason given)

**Cost bands** (rough monthly cost to the client): `$` under $50 · `$$` $50–$300 · `$$$` over $300. Check the vendor's current pricing before quoting.

---

## Selection rules (apply in order)

1. **Use what the client already pays for**, if it is on this list and can do the job.
2. **Pick the simplest tool that handles the whole workflow.** Don't split one workflow across two automation platforms.
3. **Regulated data** (health, finance, legal, payment cards) only goes to tools marked ✅ in the "Regulated OK" column, and only after the client confirms their own compliance needs.
4. **The client must be able to see and pause it.** Prefer tools with a visual editor the client can open.
5. **Every tool has an exit path.** You must be able to export the workflow or data if the client leaves or the vendor changes.

---

## Orchestration (runs the workflows)

| Tool | Status | Use when | Don't use when | Cost | Regulated OK |
|---|---|---|---|---|---|
| **n8n** (cloud or self-hosted) | Approved, **default** | Multi-step flows, AI steps, branching, error handling, high volume. Self-host when data must stay on the client's servers. | The client team must edit flows themselves and finds it too technical | `$`–`$$` | ✅ when self-hosted |
| **Make** | Approved | Visual flows for a non-technical client team that wants to edit flows themselves | Very high volume (operation-based pricing adds up) | `$`–`$$` | Check plan |
| **Zapier** | Approved | Simple 2–3 step triggers, and the client already uses it | Branching logic, loops, AI-heavy flows | `$$`–`$$$` | Check plan |
| **Custom code** (Python/TypeScript on a host below) | Trial | Something the platforms above genuinely can't do | Anything n8n can do. Custom code is harder to hand over. | Varies | ✅ when self-hosted |

**Decision:** default to n8n → Make if the client wants to edit flows themselves → Zapier only for simple flows a client already runs on it.

## AI models

Use the three tiers defined in `MODEL_ROUTING.md`:
- **Think tier**: analysis, specs, risk, judging quality
- **Write tier**: drafting documents, reports, customer-facing text
- **Volume tier**: high-frequency classification, extraction, routing inside client workflows

Access AI through the vendor's official API, or through a cloud provider (AWS Bedrock, Google Vertex) when the client needs their data to stay in their own cloud account.

## Speech-to-text (for I-2 process mapping)

| Tool | Status | Use when |
|---|---|---|
| Meeting recorder with transcripts (e.g. Zoom, Google Meet, Fireflies, Otter) | Approved | Walkthrough calls. Easiest option. |
| Speech-to-text API (OpenAI transcription, Deepgram, AssemblyAI) | Approved | Processing many recordings in bulk through n8n |

## Records and data

| Tool | Status | Use when | Cost |
|---|---|---|---|
| **Airtable** | Approved, **default** for your client files (Phase 1–2) | Client file, backlog, run logs. Easy to view and share. | `$`–`$$` |
| **Google Sheets** | Approved | The client lives in Google Workspace and data is small (< 10k rows) | `$` |
| **Supabase** (Postgres) | Approved for Phase 3 | Real database, client portals, audit log at scale | `$`–`$$` |

## Documents and knowledge

| Tool | Status | Use when |
|---|---|---|
| **Notion** or **Google Drive** | Approved | Playbook, runbooks, client-facing docs |
| **Git repo of Markdown** (GitHub) | Approved | Playbook and prompts that agents load. Gives you version history. |

## Communication and alerts

| Tool | Status | Use when |
|---|---|---|
| **Slack** | Approved, **default** for alerts | Monitor alerts, approval requests (approve and reject buttons) |
| **Microsoft Teams** | Approved | The client is on Microsoft 365 |
| **Gmail / Outlook** via n8n | Approved | Email-based workflows |
| **SMS** (Twilio) | Trial | Critical after-hours alerts only |

## CRM and sales

| Tool | Status | Use when |
|---|---|---|
| **HubSpot** | Approved | The client already uses it, or a B2B client needs a CRM |
| **GoHighLevel** | Approved | Local or service businesses, especially ones coming from agencies |
| **Pipedrive** | Approved | Small sales teams that want something simple |

## Forms and intake

| Tool | Status | Use when |
|---|---|---|
| **Tally** | Approved, **default** | Intake questionnaire (Template A), client requests |
| **Typeform** | Approved | The client already uses it |

## Hosting (self-hosted n8n or custom code)

| Tool | Status | Use when |
|---|---|---|
| **n8n Cloud** | Approved, **default** | You don't want to manage servers |
| **Railway / Render** | Approved | Simple self-hosting of n8n or small services |
| **AWS / Google Cloud** in the client's account | Trial | The client requires data in their own cloud account |

## Secrets (API keys and passwords)

| Tool | Status | Rule |
|---|---|---|
| **n8n / Make built-in credential store** | Approved | Keys for workflows live here only |
| **1Password** (or Bitwarden) shared vault | Approved | Store client logins. One vault per client. |
| Email, chat, docs, spreadsheets | **Avoid** | Never store secrets here |

## Monitoring

| Tool | Status | Use when |
|---|---|---|
| **n8n Error Trigger workflow → Slack** | Approved, **default** | All n8n workflows (Phase 2 M-1) |
| **Uptime monitor** (e.g. Better Stack, UptimeRobot) | Approved | Self-hosted n8n or custom code |
| **AI provider usage dashboards** | Approved | Weekly AI spend check per client (use a separate API key per client so costs are separated) |

---

## Adding a tool

1. A client need can't be met by any Approved tool. Write down why.
2. Check: Is there an export or exit path? Does it have security documentation? What does it cost at the client's expected volume?
3. Add it as **Trial**, with your name and today's date.
4. After 2 successful client uses, promote it to **Approved**, or mark it **Avoid** with a reason.
5. Bump the version number at the top of this file.

## Change log
| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-27 | First version |
