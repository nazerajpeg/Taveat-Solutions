# Model Routing Guide

Version 1.0 · 2026-10-27 · Owner: you

Which AI model to use for each agent and each kind of client workflow. Part 1 is the decision. Part 2 is pricing. Re-check prices every quarter, because they change often.

---

## The three tiers

| Tier | Job | Default (Claude) | Alternative provider | Budget option |
|---|---|---|---|---|
| **Think** | Judgment, analysis, specs, risk, grading quality | Claude Opus 5.5 | GPT-6.1 Sol (OpenAI) | Claude Sonnet 5.5 |
| **Write** | Documents, reports, structured extraction from messy text, customer-facing drafts | Claude Sonnet 5.5 | Gemini 3.1 Pro (Google), GPT-6.1 Sol | Claude Haiku 5.5 |
| **Volume** | High-frequency classify, route, extract inside client workflows | Claude Haiku 5.5 | GPT-6 Luna (OpenAI), Mistral Small 4 | DeepSeek V4.1 Flash (see data warning below) |
| **Top tier** (rare) | The hardest, highest-stakes analysis only | Claude Fable 5.1 | GPT-6 Astra | n/a |

**Rules of thumb**
1. **For your own delivery agents, pay for quality.** They run a few times per client, so the model cost is tiny compared with your fee (see Part 2).
2. **For client workflows that run thousands of times, start at the Volume tier.** Move up a tier only when QA shows the cheaper model misses the accuracy target.
3. **Use a judge from a different provider than the model being tested.** Two models from different providers are less likely to share the same blind spots.
4. **Never let a model do arithmetic for ROI or billing numbers.** Use code or a spreadsheet.
5. **Use one API key per client per provider.** That separates costs and lets you cut off one client without affecting the others.

**Data warning:** DeepSeek's own API is operated from China. Don't send any client's `personal` or `regulated` data to it. If you want DeepSeek or Llama models for cost reasons, use them through a US/EU host (Together AI, Fireworks, AWS Bedrock), and only after the client agrees.

**Data residency:** If a client needs data kept in their own cloud, run Claude through AWS Bedrock or Google Vertex AI in their account, or self-host an open model (Llama, Mistral) alongside self-hosted n8n.

---

## Part 1: Model choice by agent and phase

### Phase 1 (clients 1–3): playbook + four agents

| Agent | What the model does | Recommended | Alternatives | Why |
|---|---|---|---|---|
| **I-2 Process Mapper** | Turns a 45-minute walkthrough transcript into a `process_map` | **Sonnet 5.5** | Gemini 3.1 Pro (can take the recording's audio directly, so you can skip the transcription step), GPT-6.1 Sol | Long, messy input → structured output. Write tier is enough. |
| *(transcription before I-2)* | Audio → text | Your meeting tool's built-in transcript | OpenAI transcription API, Deepgram, AssemblyAI | Not an LLM job. Use the cheapest accurate option. |
| **A-1 Opportunity Scorer** | Applies the rubric to every process consistently | **Opus 5.5** (effort: high) | GPT-6.1 Sol; Fable 5.1 for a very large client | This is the judgment call your fee rests on. Use the Think tier. |
| **F-1 Spec Writer** | Writes the build spec, prompts, and test cases | **Opus 5.5** | GPT-6.1 Sol | Good specs prevent rebuilds. Think tier. |
| **F-2 Builder** *(you + Claude Code)* | Builds the n8n workflow from the spec | Claude Code subscription | n/a | Billed as a subscription, not per token. |
| **F-3 QA Agent**: generating extra test cases | Invents edge cases | **Haiku 5.5** | GPT-6 Luna | Cheap volume work |
| **F-3 QA Agent**: judge | Grades outputs against the spec | **GPT-6.1 Sol** when the workflow runs on Claude; **Sonnet 5.5** when it runs on another provider | Gemini 3.1 Pro | Different provider from the model being graded (Rule 3) |

### Phase 2 (clients 4–10): retainer engine

| Agent | Recommended | Alternatives | Why |
|---|---|---|---|
| **M-1 Monitor**: alert rules | **No model.** Use n8n rules (error count, cost thresholds). | n/a | Rules are free and predictable |
| **M-1 Monitor**: summarizing error logs into a readable alert | **Haiku 5.5** | GPT-6 Luna | Runs often; simple job |
| **M-3 Value Reporter** | **Sonnet 5.5** | Gemini 3.1 Pro (good fit if the client is on Google Workspace) | Client-facing writing. Numbers come from code, not the model. |
| **I-3 Baseline Agent** | **Sonnet 5.5** to pull numbers out of process maps; a spreadsheet does the math | GPT-6.1 Sol | Extraction is Write tier |

### Phase 3 (10+ clients): full system

| Agent | Recommended | Alternatives | Why |
|---|---|---|---|
| **Conductor** (orchestrator) | **No model** for routing. An n8n state machine moves clients between stages. **Haiku 5.5** checks each output against its checklist. | GPT-6 Luna | Routing must be predictable; checklist checks are simple |
| **A-2 Stack Architect** | **Opus 5.5** | Fable 5.1 for complex or regulated clients, GPT-6 Astra | Cross-references the registry, the client's stack and costs. Think tier. |
| **A-3 Risk Reviewer** | **Opus 5.5** | Fable 5.1 for regulated industries | Mistakes here are expensive |
| **F-4 Handover Agent** | **Sonnet 5.5** | Gemini 3.1 Pro | Runbooks and training scripts |
| **M-2 Optimizer** | **Opus 5.5** | GPT-6.1 Sol | Diagnoses failures and writes fixes |
| **I-1 Intake Agent** | **Sonnet 5.5** | GPT-6.1 Sol | Structuring questionnaire answers |

### Inside client workflows (what you build for them)

| Workflow type | Example | Start with | Move up to, if QA fails |
|---|---|---|---|
| Classify / route | Tag incoming emails, route support tickets | Haiku 5.5 or GPT-6 Luna | Sonnet 5.5 |
| Extract | Pull fields from invoices, forms, PDFs | Haiku 5.5 | Sonnet 5.5 |
| Draft internal text | Meeting summaries, internal updates | Sonnet 5.5 | n/a |
| Draft customer-facing text | Replies, proposals (with human approval) | Sonnet 5.5 | Opus 5.5 |
| Decide or recommend | Lead scoring, pricing suggestions | Sonnet 5.5 | Opus 5.5 |

---

## Part 2: Pricing

Prices are in US dollars **per 1 million tokens**. A token is roughly ¾ of a word, so 1 million tokens is about 750,000 words.

### Claude (official Anthropic API prices, as of October 2026)

| Model | Tier | Input | Output |
|---|---|---|---|
| Claude Fable 5.1 | Top | $10.00 | $50.00 |
| Claude Opus 5.5 | Think | $4.00 | $20.00 |
| Claude Sonnet 5.5 | Write | $2.00 | $10.00 |
| Claude Haiku 5.5 | Volume | $0.10 | $0.50 (rises to $0.50 / $2.50 for prompts over 100K tokens) |

Ways to pay less: **Batch API** runs at 50% of the price for work that doesn't need an instant answer (good for reports and bulk QA). **Prompt caching** makes repeated instructions much cheaper (cache reads on Opus 5.5 and Sonnet 5.5 cost $0.20 per million).

### Other providers (approximate; from third-party comparison sites, October 2026; confirm on the vendor's own pricing page before quoting)

| Provider | Model | Tier | Input | Output |
|---|---|---|---|---|
| OpenAI | GPT-6 Astra | Top | $10.00 | $50.00 |
| OpenAI | GPT-6.1 Sol | Think / Write | $2.00 | $10.00 |
| OpenAI | GPT-6 Luna | Volume | $0.10 | $0.50 |
| Google | Gemini 3.1 Pro | Write | $2.00 | $12.00 (higher above 200K tokens) |
| Google | Gemini Flash / Flash-Lite | Volume | $0.25–$1.50 | $1.50–$9.00 (sources disagree by version) |
| DeepSeek | V4.1 Flash | Volume | $0.30 ($0.15 off-peak) | $1.20 ($0.60 off-peak) |
| Mistral | Mistral Small 4 | Volume | $0.15 | $0.60 |
| Meta (via Together/Fireworks) | Llama 4 Maverick | Volume | $0.15 | $0.60 |

### What this costs you in practice

**A. Your delivery agents, one Phase 1 engagement (5 workflows, routed as in Part 1):**

| Agent | Assumed usage | Cost |
|---|---|---|
| I-2 Process Mapper (Sonnet 5.5) | 10 transcripts × 20K tokens in, 4K out | $0.80 |
| A-1 Scorer (Opus 5.5) | 100K in, 30K out | $1.00 |
| F-1 Spec Writer (Opus 5.5) | 5 specs × 30K in, 15K out | $2.10 |
| F-3 QA judge (Sonnet 5.5 or GPT-6.1 Sol) | 250 test runs × 5K in, 1K out | $5.00 |
| **Total** | | **≈ $9 per engagement** (budget $25 to allow for reruns) |

Against a $15K–$50K assessment fee, model cost is effectively zero. **Don't save money on the Think tier for your own agents.**

**B. One client workflow running every month.** Example: triage 3,000 emails a month at about 2,000 tokens in and 300 out each, which comes to 6M input tokens and 0.9M output tokens.

| Model | Monthly cost |
|---|---|
| Claude Haiku 5.5 | $1.05 |
| GPT-6 Luna | $1.05 |
| Mistral Small 4 | $1.44 |
| DeepSeek V4.1 Flash (peak) | $2.88 |
| Claude Sonnet 5.5 / GPT-6.1 Sol | $21.00 |
| Gemini 3.1 Pro | $22.80 |
| Claude Opus 5.5 | $42.00 |
| Claude Fable 5.1 / GPT-6 Astra | $105.00 |

The gap between the cheapest and most expensive model is 100×. **This is where model choice matters, so start at the Volume tier.**

Note: Think-tier models also bill their internal reasoning as output tokens, so real costs for Opus, Fable, Astra and Sol can run 1.5–3× higher than these estimates on hard tasks. Lower the effort setting for routine work.

### Pricing your retainer

A simple rule: charge for **outcomes**, not tokens. Pass AI usage through at cost plus 20–30%, or include it up to a cap (for example "includes up to $200/month of AI usage"). Report actual usage in the monthly value report (M-3) so the client can see it.
