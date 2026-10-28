# I-2 Process Mapper: setup

**What it does:** You paste the transcript of one process walkthrough into a form. Claude Sonnet 5.5 turns it into a step-by-step process map (playbook Template B). The workflow then checks it against the I-2 Definition of Done, works out hours per week, and saves everything to your Airtable client file as "Awaiting confirmation". The form's last page tells you whether the map passed the checklist, or which questions you still need answered.

```
Form → Build Claude request → Transcript OK? → Claude: map the process → Parse and check → Map OK? → Save to client file → Show result
                                    └──────────── any failure ────────────────────────────────────┴──→ Show error
```

Cost per run: about $0.05–$0.15 in Claude usage. Each run records its actual cost in Airtable.

---

## 1. Get an Anthropic API key (5 min)

1. Go to console.anthropic.com → API Keys → Create key. Name it `gaas-internal`.
2. Add billing credit. $20 covers hundreds of runs.
3. Copy the key. You'll paste it into n8n in step 3. Don't save it anywhere else.

## 2. Create the Airtable tables (5 min)

**Quickest way: let n8n create them.**
1. In Airtable, create an empty base called exactly **GaaS Client Files**.
2. Create a token at airtable.com/create/tokens with these four scopes: `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`. Under Access, add the GaaS Client Files base. Copy the token.
3. In n8n, import `airtable-setup.json` (Import from URL or Import from File).
4. Open **List my bases** → Credential → create a new **Airtable Personal Access Token** credential, paste the token and save it as "Airtable". Select the same credential on **Create table**.
5. Click **Execute workflow**. Then open **Summary**: both tables should say "Created with … fields". Running it again is safe: it only adds tables or columns that are missing, and lists any column that is misnamed or the wrong type.
6. In Airtable, delete the empty default table ("Table 1") if there is one.

This creates both the **Process Maps** table below and the **Backlog** table used by the Opportunity Scorer.

**Or create the table by hand.** Create a base called **GaaS Client Files** with a table called **Process Maps**. The field names must match exactly, including capitals and brackets:

| Field name | Airtable field type |
|---|---|
| Client | Single line text (make this the primary field) |
| Process | Single line text |
| Interviewee | Single line text |
| Interview date | Date |
| Owner | Single line text |
| Runs per week | Number (1 decimal) |
| Minutes per run | Number (1 decimal) |
| Hours per week | Number (1 decimal) |
| Step count | Number (integer) |
| Judgment steps | Number (integer) |
| Exception count | Number (integer) |
| Checklist passed | Checkbox |
| Checklist issues | Long text |
| Open questions | Long text |
| Map | Long text |
| Map JSON | Long text |
| Status | Single select: `Awaiting confirmation`, `Confirmed`, `Needs rework` |
| Model | Single line text |
| AI cost (USD) | Number (4 decimals) |

Then create an Airtable token as in step 2 above. The same token works for every workflow.

## 3. Import into n8n (10 min)

1. In n8n: **Workflows → Add workflow → ⋯ menu → Import from File** → choose `process-mapper.json`.
2. Open the **Claude: map the process** node → Credential → **Create new credential** → type **Header Auth**:
   - Name: `x-api-key`
   - Value: your Anthropic API key
   - Save it as "Anthropic API key".
3. Open the **Save to client file** node → Credential → create an **Airtable Personal Access Token** credential with your token. Then set **Base** to *GaaS Client Files* (pick it from the list) and check that **Table** is *Process Maps*.
4. Click **Publish** (or toggle Active) at the top right.
5. Open the **Walkthrough form** node and copy the **Production URL**. Bookmark it. That's your Process Mapper.

## 4. Test it

Open the form URL and fill it in with:
- Client name: `Test Co`
- Process name: `Invoice follow-up`
- Person interviewed: `Dana`
- Transcript: paste the contents of `sample-transcript.txt`

You should see "Process map ready" (or "needs answers") within about 30–60 seconds, and a new row in Airtable.

---

## Using it on a real engagement (playbook I-2)

1. Record a 30–45 minute screen-share walkthrough with the person who does the process.
2. Copy the transcript from Zoom, Meet, Fireflies or Otter into the form. **Use one form submission per process.**
3. Open the new Airtable row:
   - **Checklist passed** unticked → ask the person the items under **Open questions** and **Checklist issues**, add their answers to the transcript, and submit again.
   - Ticked → send the **Map** text to the person to confirm.
4. When they confirm, set **Status** to `Confirmed`. Only confirmed maps move on to I-3 Baseline.

## Changing things

- **Model:** in the **Build Claude request** node, change `model: 'claude-sonnet-5-5'`. If you do, update `PRICE_PER_MTOK` in **Parse and check** so cost tracking stays correct.
- **Instructions to Claude:** edit the `system` text in **Build Claude request**. Keep the rules in line with PLAYBOOK.md section I-2.
- **Refusal fallback** is switched on (`fallbacks: 'default'`). If Claude's safety filter declines a transcript, Anthropic automatically retries it on another Claude model. You don't need to do anything.

## Troubleshooting

| What you see | Fix |
|---|---|
| "401" or "authentication_error" | The API key in the Header Auth credential is wrong. The header name must be exactly `x-api-key`. |
| "Unknown field name" from Airtable | A field name in Airtable doesn't match the table above exactly |
| "The transcript is too short" | The transcript has fewer than 200 characters. Paste the full transcript. |
| The map is cut off | The transcript covers several processes. Split it and submit each one separately. |
| Form spins for a long time | Long transcripts can take up to 2 minutes. The workflow waits up to 5 minutes and retries twice. |
