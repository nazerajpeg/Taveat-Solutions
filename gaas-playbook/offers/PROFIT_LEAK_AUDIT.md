# Profit Leak Audit

Version 1.0 · Owner: you

**The offer:** $497. In one week we show an owner-led business where it loses time, customers and margin, with a dollar value on each leak and a 90-day plan. The fee is credited in full to the setup fee if they start a package within 30 days.

**Why it exists:** it's a low-risk way to start working together, it pays for your time, and the report is the sales pitch. It runs on the agents you've already built: the Process Mapper (I-2) and the Opportunity Scorer (A-1).

**Who it's for:** businesses doing $500K–$5M a year with 5–50 staff that already spend on ads (see the ideal customer profile). Turn away businesses under about $300K a year. They usually can't afford a package, so the audit won't convert.

**Your time:** about 6–8 hours in total. At $497 that's roughly $60–$80 an hour. That's acceptable for an entry offer, because the target is that more than half of audits lead to a package.

---

## Timeline (5 working days)

| Day | What happens | Who | Tool |
|---|---|---|---|
| 0 | Payment, then the intake form is sent | Client | Tally form (questions below) |
| 1 | Call 1: owner interview (45 min) | You + owner | Zoom/Meet, recorded |
| 1–2 | Call 2: team walkthroughs (45 min, 2–3 processes on screen) | You + staff | Recorded |
| 2 | Run each transcript through the **Process Mapper** | You | n8n |
| 2–3 | Owner confirms the maps (a quick reply by email) | Owner | Airtable → email |
| 3 | Run the **Opportunity Scorer** on the confirmed maps | You | n8n |
| 3–4 | Value the leaks (formulas below) and write the report | You | Spreadsheet + report template |
| 5 | Call 3: walk through the findings (30 min) and recommend a package | You + owner | Zoom/Meet |

---

## Step 1. Intake form (sent after payment)

Keep it under 10 minutes for the owner to fill in. Every answer feeds a leak calculation, as marked.

1. Business name, website, industry
2. Roughly how much revenue a year? (bands: under $500K / $500K–$1M / $1M–$2.5M / $2.5M–$5M / $5M+)
3. Number of staff, and the loaded hourly cost of each role (pay plus overhead, divided by hours worked) → *admin leak*
4. Which tools do you use? (tick boxes: Shopify, Square, QuickBooks, Xero, HubSpot, GoHighLevel, booking software, Gmail/Outlook, other)
5. The 3 tasks your team complains about most → *which processes to map*
6. How do new leads or enquiries reach you, and roughly how many come in a month? → *lead leak*
7. How fast do you usually reply to a new lead? (under 5 min / under 1 hr / same day / next day or later) → *lead leak*
8. What share of leads become customers? (a rough % is fine) → *lead leak*
9. Average sale value, and how often a typical customer buys a year → *win-back leak*
10. When did you last raise prices? → *pricing leak*
11. Monthly ad spend, and on which platforms. How many new ads do you launch a month? → *ad leak*
12. What would make this audit worth 10x its price to you?

**Data request, sent with the form** (read-only exports are fine, and nothing needs passwords):
- The last 12 months of orders or sales, exported from Shopify, Square or the CRM (date, customer, product, amount)
- Their product or service list with prices and, if known, costs
- The ads manager summary for the last 90 days (spend, results and the date each ad started)

Store everything in the client's folder. Delete the data exports 30 days after the audit unless they become a client.

---

## Step 2. Call scripts

### Call 1: Owner interview (45 min)
Goal: understand the business and the owner's priorities, and choose the 2–3 processes to map.

1. "Walk me through a normal week for you. Where does your time go?" (10 min)
2. "If you could stop doing one thing tomorrow, what would it be?"
3. "Tell me about your best customer. Who are they, what do they buy, and how often?"
4. "What happens from the moment someone enquires to the moment they pay?" (Listen for slow replies and gaps.)
5. "When a customer stops buying, does anyone notice? What happens?"
6. "How did you set your prices?"
7. "What have you tried with ads? What worked?"
8. Agree on the 2–3 processes to map in Call 2, and on who does each one.

### Call 2: Team walkthroughs (45 min)
For each process (about 15 min each): "Share your screen and do it exactly as you would on a normal day. Talk me through what you're doing and why." Then ask:
- "How often do you do this, and how long does it take each time?"
- "What goes wrong? What do you do then?"
- "Where do you have to make a judgment call?"

Paste each transcript into the **Process Mapper** form, one process per submission.

### Call 3: Findings (30 min)
1. The headline: "You're leaking roughly $X a year across these 5 areas."
2. Walk through the top 3 leaks: the evidence, the dollar value, and the fix.
3. Show the 90-day plan.
4. Recommend one package (see Step 5), and remind them the $497 is credited to the setup fee for 30 days.
5. Ask: "Which of these would you want fixed first?" Then stay quiet and let them answer.

---

## Step 3. Value the leaks

Do this arithmetic in a spreadsheet, never with an AI model. Show **every assumption** in the report, and present a **low–high range**, not a single number. Owners trust a range they can check more than a big number they can't.

| Leak | Formula (per year) | Default assumptions to state |
|---|---|---|
| **Admin time** | Σ for each process: hours saved per week (from the Backlog) × loaded hourly cost × 48 weeks | Hours saved come from the Opportunity Scorer's automatable %. Low = 70% of that figure. |
| **Slow lead replies** | leads a month × 12 × share replied to after 1 hour × close rate × average sale × recovery rate | Recovery rate: low 10%, high 25% (the share of those slow-reply leads you'd win back by replying in under 5 minutes) |
| **Lapsed customers** | lapsed customers × win-back rate × average sale | Lapsed = no purchase in over 2× their usual gap between purchases, found from the order export. Win-back rate: low 3%, high 8%. |
| **Pricing** | revenue from the 10 best sellers × price rise × (1 − volume lost) | Price rise 3–5%; volume lost low 10%, high 0%. Only if prices haven't risen in 12+ months. |
| **Stale ads** | monthly ad spend on ads older than 6 weeks × 12 × waste rate | Waste rate: low 10%, high 20%. Mark this one as "to confirm by testing". |
| **Missed reviews** | Don't put a dollar value on this. Report it as: "X customers a month are never asked for a review." | Shown as a count, not dollars |

**Example (for training only, not real data):** 120 leads a month, 60% replied to after 1 hour, 20% close rate, $400 average sale.
→ 120 × 12 × 0.6 × 0.2 × $400 = $69,120 of sales at risk a year, and × 10–25% recovery = **$6,900–$17,300 a year recoverable**.

---

## Step 4. The report (deliver as a PDF or Google Doc, 4–6 pages)

1. **Cover:** "Profit Leak Audit: [Business name]", the date, prepared by Taveat Solutions
2. **Summary (1 page):**
   - "We found an estimated **$X–$Y a year** leaking across N areas."
   - A table: leak | evidence | estimated value per year | fix | package that fixes it
   - Their top 3 quick wins
3. **How your business runs today:** the confirmed process maps, shortened, with hours per week
4. **What to automate first:** the Backlog from the Opportunity Scorer (rank, process, score, hours saved, reason)
5. **The leaks in detail:** one section per leak, showing the evidence, the calculation with its assumptions, and the fix
6. **90-day plan:** weeks 1–2 quick win; weeks 3–6 build; weeks 7–12 run and measure
7. **Recommendation:** one package, and why it fits. Remind them the audit fee is credited for 30 days.
8. **Assumptions and data used:** everything needed to check the numbers

Rules: plain English with no jargon; every number traces back to their data or a stated assumption; no promises beyond the guarantee on the sales sheet.

---

## Step 5. Which package to recommend

| If the audit shows… | Recommend |
|---|---|
| The biggest leaks are admin time and slow lead replies; fewer than about 500 customers, or no usable sales data | **Foundation** |
| Over 500 customers with a repeat-purchase pattern, prices not raised in 12+ months, or clear lapsed-customer value | **Insight** (the default for most audits) |
| Spends $3K+ a month on ads and launches fewer than 6 new ads a month, *and* the Insight leaks are present | **Growth Partner** |
| Spends under $3K a month on ads but wants ads | Insight now; review Growth Partner after 90 days |

Recommend **one** package. Offering a choice of three at this point slows the decision down.

---

## Step 6. Track results

For each audit, add a row in Airtable (a future "Audits" table): client, date, total leak value (low and high), package recommended, whether they converted, and the date they started.

Target: **50%+ of audits convert to a package within 30 days.** If you fall below 30% after 10 audits, check whether the audits are reaching the right customers before changing the report.
