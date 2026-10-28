# A-1 Opportunity Scorer: setup

**What it does:** You enter a client's name. The workflow pulls every **Confirmed** process map for that client from Airtable. Claude Opus 5.5 rates each process against the playbook rubric. The workflow then calculates the scores, ranks the processes, and saves a ranked backlog to Airtable.

```
Form → Get confirmed maps → Build Claude request → Maps found? → Claude: score processes → Score and rank → Scored OK? → Save to backlog → Show result
                                                        └──────────── any failure ─────────────────────────────┴──→ Show error
```

**Who decides what** (PLAYBOOK.md A-1):

| Criterion | Weight | Decided by |
|---|---|---|
| Volume | 30% | **Code**, from Hours per week in the process map: under 1 hr = 1, 1–3 = 2, 3–5 = 3, 5–10 = 4, over 10 = 5 |
| Rule clarity | 25% | Claude, with a one-sentence reason |
| Data access | 20% | Claude, with a one-sentence reason |
| Risk if wrong (low risk scores high) | 15% | Claude, with a one-sentence reason |
| Strategic value | 10% | Claude, using the owner's top pains you enter |

Claude also estimates **how much of each process can be automated** (as a %). Code does all the arithmetic: the weighted score, the priority band, hours saved per week, and dollars saved per week.

**Priority bands:**
- **4.0 or higher:** Build now
- **3.0–3.9:** Build next
- **Under 3.0:** Don't automate yet
- **Needs data:** hours per week is missing, so it can't be scored

Cost per run: about $0.30–$1.50, depending on how many processes are scored.

---

## 1. Before you start

- The Process Mapper is set up (`SETUP.md`) and you have the **Anthropic API key** credential in n8n.
- At least one process map for the client has **Status = Confirmed** and has **Hours per week** filled in.

## 2. Create the Backlog table in Airtable (10 min)

In the **GaaS Client Files** base, add a table called **Backlog** with these fields. The names must match exactly:

| Field name | Airtable field type |
|---|---|
| Process | Single line text (primary field) |
| Client | Single line text |
| Rank | Number (integer) |
| Priority | Single select: `Build now`, `Build next`, `Don't automate yet`, `Needs data` |
| Score | Number (2 decimals) |
| Volume | Number (integer) |
| Rule clarity | Number (integer) |
| Data access | Number (integer) |
| Risk if wrong | Number (integer) |
| Strategic value | Number (integer) |
| Reasons | Long text |
| Hours per week | Number (1 decimal) |
| Automatable % | Number (integer) |
| Hours saved per week | Number (1 decimal) |
| Saving per week (USD) | Currency |
| Automation idea | Long text |
| Main risks | Long text |
| Status | Single select: `Proposed`, `Approved`, `Rejected`, `Built` |
| Scored on | Date |
| Model | Single line text |
| Run AI cost (USD) | Number (4 decimals) |

## 3. Import into n8n (5 min)

1. **Workflows → Add workflow → ⋯ → Import from File** → `opportunity-scorer.json`.
2. **Claude: score processes** node → choose your existing **Anthropic API key** credential.
3. **Get confirmed maps** node → choose your **Airtable** credential, set **Base** to *GaaS Client Files*, and check that **Table** is *Process Maps*.
4. **Save to backlog** node → same Airtable credential and base, with **Table** set to *Backlog*.
5. **Publish**, then copy the **Production URL** from the **Scoring form** node.

## 4. Using it on an engagement

1. When every process map for the client is Confirmed, open the form.
2. Enter:
   - **Client name**, exactly as it appears in Process Maps
   - **Owner's top pains**: question 1 of the intake questionnaire. Without this, Strategic value is a guess.
   - **Loaded hourly cost**: question 6. Without this, dollar savings are left blank.
3. Review the Backlog in Airtable. Read every **Reasons** entry. You're accountable for these scores, so if you disagree with a rating, change it and note why.
4. Mark rows **Approved** or **Rejected**. The approved "Build now" items go into the G1 roadmap for the client to sign.

Running it again for the same client adds a new set of rows (each row has its own **Scored on** date). Delete or filter out the old rows.

## Changing things

- **Weights or bands:** edit `WEIGHTS` and `band()` in the **Score and rank** node, and update PLAYBOOK.md section A-1 to match.
- **Rubric wording:** edit the `system` text in **Build Claude request**. Keep it identical in meaning to PLAYBOOK.md.
- **Model:** change `model` in **Build Claude request**, and update `PRICE_PER_MTOK` in **Score and rank** to match.

## Troubleshooting

| What you see | Fix |
|---|---|
| "No confirmed process maps found" | The client name doesn't match exactly, or no maps have Status = Confirmed |
| "Claude did not score: …" | Submit again. If it repeats, score fewer processes at once. |
| "Unknown field name" from Airtable | A Backlog field name doesn't match the table above |
| A process shows "Needs data" | Fill in Hours per week on its process map, then run the scorer again |
| Form spins for a long time | Scoring 10+ processes at high effort can take a few minutes. The workflow waits up to 10 minutes. |
