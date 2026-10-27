# GaaS Delivery Playbook

Version 1.0 · Owner: you · Review: every quarter, or after any engagement that went wrong

This is the method every engagement follows. Agents load this file as instructions. People use it as their checklist. If something isn't in here, it isn't part of the process yet. To change the process, change this file and bump the version.

---

## 0. Ground rules (apply at every stage)

1. **One client file per client.** Every output from every stage is saved there. Nothing lives only in someone's inbox or chat.
2. **Staging before live.** Nothing is ever built or tested inside the client's live tools. Build in a copy, test, then deploy.
3. **Tools come from the Stack Registry only** (`STACK_REGISTRY.md`). If a client needs something not listed, stop and add it through the registry's "Adding a tool" process first.
4. **Humans approve anything that touches customers or money.** An automation may draft an email to a customer, issue a refund, or change a price. A person approves it until the workflow has 30 days of clean results and the client agrees in writing to remove the approval step.
5. **No secrets in workflows or documents.** API keys and passwords live in the credential store only (see Registry → Secrets).
6. **Everything is logged.** Every agent run, approval, and live change is written to the audit log with date, actor, inputs, and result.
7. **Measure before you change.** No workflow is built for a process that has no baseline numbers (Stage I-3).

---

## 1. Engagement stages at a glance

| Stage | Agent | Output | Gate after |
|---|---|---|---|
| I-1 Intake | Intake Agent | `stack_inventory` | Checklist |
| I-2 Process mapping | Process Mapper | `process_map` (one per process) | Checklist |
| I-3 Baseline | Baseline Agent | `baseline` | Checklist |
| A-1 Scoring | Opportunity Scorer | `backlog` | Checklist |
| A-2 Solution design | Stack Architect | `solution_design` | Checklist |
| A-3 Risk review | Risk Reviewer | `risk_register` | **G1 Roadmap sign-off** |
| F-1 Spec | Spec Writer | `build_spec` | Checklist |
| F-2 Build | Builder | Staging workflow + exported config | Checklist |
| F-3 QA | QA Agent | `qa_report` | **G2 Go-live approval** |
| F-4 Handover | Handover Agent | Live workflow, runbook, training | Checklist |
| M-1 Monitor | Monitor | Alerts, health score | Continuous |
| M-2 Optimize | Optimizer | `change_request` → back to F-1 | **G3 Change approval** |
| M-3 Report | Value Reporter | Monthly report | Monthly |

A stage may start only when the previous stage's Definition of Done is fully checked.

---

## 2. IDENTIFY

### I-1 Intake

**Goal:** Know every tool the client uses, who owns it, and where their data lives.

Steps:
1. Send the intake questionnaire (Template A).
2. Request read-only access or exports. Never accept admin passwords by email or chat.
3. List every tool, then tag each one with a data sensitivity level:
   - `public`: published anyway
   - `internal`: business data with no personal details
   - `personal`: names, emails, phone numbers
   - `regulated`: health, financial, legal or payment card data

**Definition of Done**
- [ ] Every tool has an owner (a named person at the client)
- [ ] Every tool has a sensitivity tag
- [ ] Access method is recorded (read-only login, export, API key in credential store)
- [ ] The client's monthly software spend is recorded

### I-2 Process mapping

**Goal:** Write down how work actually gets done today, step by step.

Steps:
1. Run one 30–45 minute recorded walkthrough per process with the person who does the work. They share their screen and talk through it.
2. Transcribe the recording, then have the Process Mapper turn the transcript into a `process_map` (Template B).
3. Send the map back to that person to confirm. They correct it, not you.

**Definition of Done**
- [ ] Every step names a person and a tool
- [ ] Frequency (how often per week) and minutes per run are recorded
- [ ] Exceptions ("what happens when…") are listed
- [ ] The person who does the work has confirmed the map

### I-3 Baseline

**Goal:** Record the "before" numbers you will prove ROI against.

For each mapped process, record:
- Hours per week spent (frequency × minutes per run ÷ 60)
- Cost per week (hours × loaded hourly cost, which the client provides)
- Error or rework rate (% of runs that need fixing)
- Turnaround time (request to done)

**Definition of Done**
- [ ] Every process has all four numbers
- [ ] The source of each number is noted (measured, client estimate, or system report)
- [ ] Do the arithmetic in a spreadsheet or code. Don't let an AI model do it.

---

## 3. ANALYSE

### A-1 Opportunity scoring

Score every process from 1 to 5 on each criterion. Use the rubric exactly as written.

| Criterion | Weight | 1 | 3 | 5 |
|---|---|---|---|---|
| **Volume**: hours per week | 30% | < 1 hr | 3–5 hrs | > 10 hrs |
| **Rule clarity**: could you write the rules down? | 25% | Mostly judgment | Rules plus some judgment | Clear rules |
| **Data access**: can we reach the inputs? | 20% | Paper or locked system | Exports or manual copy | Has an API or native integration |
| **Risk if wrong** (reversed: low risk scores high) | 15% | Money, legal or customer harm | Internal rework | Easily caught and undone |
| **Strategic value**: does the owner care? | 10% | Nice to have | Useful | Owner's top-3 pain |

`score = Σ(rating × weight)` (max 5.0)

Priority bands:
- **≥ 4.0** Build now (Phase 1 scope)
- **3.0–3.9** Build next (Phase 2 scope or retainer)
- **< 3.0** Don't automate yet. Recommend a process fix or leave it alone.

**Definition of Done**
- [ ] Every process is scored, with a one-line reason for each rating
- [ ] Estimated hours saved per week is recorded for every "Build now" item
- [ ] The backlog is sorted by score

### A-2 Solution design

For each "Build now" item:
1. Pick tools using the Stack Registry decision rules. Prefer tools the client already pays for.
2. Pick the AI model tier using `MODEL_ROUTING.md`.
3. Draw the data flow: trigger → steps → outputs → where the results are stored.
4. Estimate monthly running cost (tool subscriptions + AI usage).

**Definition of Done**
- [ ] Every tool used is listed as Approved in the registry
- [ ] Every AI step names a model tier and the reason for it
- [ ] Monthly run cost is estimated
- [ ] Payback period is calculated: build fee ÷ monthly savings

### A-3 Risk review

For each solution design, answer these questions:
- What personal or regulated data passes through it, and to which vendors?
- What is the worst thing that happens if the AI step is wrong?
- Where is human approval required? (Ground rule 4)
- Can it be paused instantly? Who has the off switch?
- Does the client's industry have rules (health, finance, legal) that limit which AI vendors can see the data?

**Definition of Done**
- [ ] Every risk has an owner and a mitigation
- [ ] Regulated data only goes to vendors marked "OK for regulated data" in the registry
- [ ] Every workflow has a documented pause method

### ▶ G1 Roadmap sign-off (human gate)

Present a single document to the client containing the backlog, the solution designs, the run costs, the risk register, and the build fee. The client signs. **The signed roadmap is the build scope.** Anything that isn't on it is a change order.

---

## 4. FIX

### F-1 Build spec

Write a build spec for each workflow (Template C) **before** any building starts. It includes the acceptance tests.

**Definition of Done**
- [ ] Every step has an input, an output, and a failure path
- [ ] Every AI step has its full prompt, the model, and an accuracy target
- [ ] At least 10 test cases: 6 normal, 2 edge cases, 2 that should fail safely
- [ ] Pause and rollback steps are written

### F-2 Build

1. Build in staging only (a test workspace, a test inbox, a copy of the sheet).
2. Follow the spec step by step. If the spec is wrong, update the spec first, then the build.
3. Export the workflow config (for example, the n8n JSON) to the client file.

**Definition of Done**
- [ ] Every step in the spec exists in the build
- [ ] No API keys appear inside nodes or code. All of them come from the credential store.
- [ ] An error-handling branch exists and sends alerts to the Monitor channel
- [ ] Config is exported and saved with a version number

### F-3 QA

1. Run all the test cases from the spec.
2. Run 20–50 real historical examples from the client, with personal data removed where possible.
3. For AI steps, a second model grades the outputs against the spec's accuracy target (see `MODEL_ROUTING.md` → QA judge).
4. Record the cost per run.

Pass criteria:
- 100% of "should fail safely" tests fail safely
- 100% of normal tests pass
- AI accuracy is at or above the spec's target (default 95% for internal workflows, 98% for customer-facing ones)

### ▶ G2 Go-live approval (human gate)

You review the QA report. Then a client staff member test-drives the workflow on 5 live examples with you watching. Both of you approve in writing.

### F-4 Handover

1. Deploy to live. Keep human approval on for anything customer-facing or money-related (Ground rule 4).
2. Write the runbook (Template D).
3. Run a 30-minute training session and record it.
4. Save the rollback plan in the client file.

**Definition of Done**
- [ ] A client staff member can explain what the workflow does and how to pause it
- [ ] The runbook is in the client file and shared with the client
- [ ] Monitoring is confirmed to be receiving data from the live workflow

---

## 5. MAINTAIN

### M-1 Monitor

| Severity | Example | Response time |
|---|---|---|
| Critical | Workflow down, wrong data sent to customers | Alert within 15 min, fix or pause within 2 hrs |
| High | Error rate > 5% over 24 hrs, cost doubled | Same business day |
| Low | Occasional single failures | Weekly review (M-2) |

A daily health score per client: % of successful runs, AI spend against budget, and open alerts.

### M-2 Optimize

Weekly: review failures and a random sample of 10 AI outputs per workflow. Each proposed fix becomes a `change_request` that goes back through F-1 → F-2 → F-3.

### ▶ G3 Change approval (human gate)

You approve every change to a live workflow. The client also approves when the change alters what the workflow does, as opposed to how reliably it does it.

### M-3 Monthly value report

Contents (Template E):
- Hours saved and money saved, measured against the I-3 baseline using the same units
- Workflow reliability (% of successful runs)
- AI and tool running costs
- Incidents and how they were fixed
- The next 3 recommended opportunities from the backlog

Every number must trace back to run logs and the baseline.

---

## 6. Templates

### Template A: Intake questionnaire
1. What are the 5 tasks your team complains about most?
2. List every software tool you pay for, with the number of seats.
3. Where does customer data live? Where does financial data live?
4. Who could approve an automation going live?
5. Any industry rules on data (health, finance, legal, payment cards)?
6. Loaded hourly cost of each role (salary + overhead ÷ hours)
7. What does a "great outcome" from this engagement look like in 90 days?

### Template B: `process_map`
```yaml
process_name: ""
owner: ""                 # person who does it today
frequency_per_week: 0
minutes_per_run: 0
trigger: ""               # what starts it
steps:
  - n: 1
    action: ""
    person: ""
    tool: ""
    input: ""
    output: ""
    judgment_needed: false
exceptions:
  - when: ""
    what_happens: ""
confirmed_by: ""
confirmed_on: ""
```

### Template C: `build_spec`
```yaml
workflow_name: ""
version: 1
trigger: ""
steps:
  - n: 1
    type: action | ai | approval | branch
    tool: ""
    input: ""
    output: ""
    on_failure: ""        # retry / alert / route to human
    # AI steps only:
    model_tier: think | write | volume
    model: ""
    prompt: |
    accuracy_target: 0.95
pause_method: ""
rollback_method: ""
test_cases:
  - id: T1
    type: normal | edge | should_fail_safely
    input: ""
    expected: ""
```

### Template D: Runbook (plain English, one page)
- What it does (2 sentences)
- When it runs
- How to pause it (with screenshots)
- What alerts look like and who gets them
- Who to call: you, with response times from M-1

### Template E: Monthly value report
- Headline: "This month your automations saved X hours (≈ $Y)."
- Table: workflow | runs | success % | hours saved | $ saved | running cost
- Incidents
- Next 3 opportunities, with estimated hours saved
