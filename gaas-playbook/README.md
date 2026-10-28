# GaaS Delivery Playbook

The method, tool rules and agents Taveat Solutions uses to deliver AI implementation engagements.

| File | What it is |
|---|---|
| `PLAYBOOK.md` | The delivery method: stages, checklists, scoring rubric, templates |
| `STACK_REGISTRY.md` | Approved tools and when to use each |
| `MODEL_ROUTING.md` | Which AI model to use for each agent and workflow, with pricing |
| `n8n/process-mapper.json` | Agent I-2 Process Mapper: import into n8n |
| `n8n/SETUP.md` | How to set up the Process Mapper |
| `n8n/sample-transcript.txt` | Sample walkthrough transcript for testing |
| `n8n/opportunity-scorer.json` | Agent A-1 Opportunity Scorer: import into n8n |
| `n8n/OPPORTUNITY_SCORER_SETUP.md` | How to set up the Opportunity Scorer |
| `offers/sales-sheet.html` | One-page sales sheet: three packages, pricing, guarantee, audit offer |
| `plan/taveat-90-day-plan.xlsx` | 90-day launch plan: weekly tasks, scoreboard and rules (opens in Excel or Google Sheets) |
| `offers/PROFIT_LEAK_AUDIT.md` | How to deliver the $497 Profit Leak Audit: intake, call scripts, leak formulas, report template |
| `n8n/airtable-setup.json` | One-time workflow that creates the Process Maps and Backlog tables in Airtable |
| `airtable/*.csv` | Column templates, if you would rather create the tables by CSV import |
| `n8n/src/` | Source for the workflows' code steps, build scripts and tests |

Rebuild a workflow after editing one of its code steps:

```bash
cd gaas-playbook/n8n/src
node test-code-nodes.js && node build-workflow.js ../process-mapper.json   # Process Mapper
node test-scorer.js && node build-scorer.js                               # Opportunity Scorer
```
