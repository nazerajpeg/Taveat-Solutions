// n8n Code node: "Build Claude request" (A-1 Opportunity Scorer)
const form = $('Scoring form').first().json;
const client = (form['Client name'] || '').trim();
const ownerPains = (form["Owner's top pains"] || '').trim();
const hourlyCost = Number(form['Loaded hourly cost (USD)']) || null;

const processes = $input
  .all()
  .map((item) => item.json)
  .filter((j) => j && j.id)
  .map((record, i) => {
    const f = record.fields || record;
    let map = null;
    try {
      map = JSON.parse(f['Map JSON'] || '');
    } catch (e) {}
    return {
      process_id: `P${i + 1}`,
      record_id: record.id,
      process: f['Process'],
      hours_per_week: typeof f['Hours per week'] === 'number' ? f['Hours per week'] : null,
      map,
    };
  })
  .filter((p) => p.map);

if (!processes.length) {
  return [{ json: { Error: `No confirmed process maps found for "${client}". In the Process Maps table, check that the client name matches exactly and that approved maps have Status set to Confirmed.` } }];
}

const system = `You are the Opportunity Scorer for an AI implementation consultancy. You rate a client's business processes so the consultancy can decide which ones to automate first. The client pays for this judgment, so be consistent, specific and honest. A process that should not be automated yet must score low.

Rate each process from 1 to 5 on four criteria, using this rubric exactly. Use 2 and 4 for cases between the anchors.

RULE CLARITY: could the rules for this process be written down?
1 = mostly judgment (decisions depend on experience or relationships)
3 = rules plus some judgment
5 = clear rules that anyone could follow

DATA ACCESS: can an automation reach the inputs and outputs?
1 = paper, phone calls or a locked system with no export
3 = exports, email or manual copy and paste
5 = the tools have an API or a native integration with n8n, Make or Zapier
Judge from the tools named in the map. If a tool is "unknown", rate no higher than 3.

RISK IF WRONG (reversed: low risk scores high)
1 = errors cause money loss, legal exposure or harm to customers
3 = errors cause internal rework
5 = errors are easily caught and undone

STRATEGIC VALUE: does the business owner care about this?
1 = nice to have
3 = useful
5 = one of the owner's top 3 pains
Use the owner's stated pains when given. Otherwise judge from the pain points in the map and say in the reason that the owner's priorities were not provided.

Also estimate automatable_percent: the share of the process's time that automation could remove, keeping a person on judgment steps and on anything customer-facing or money-related (those need human approval). Count only realistic savings.

Each reason is one sentence that cites something specific from the map. automation_idea is one or two sentences in plain English describing what would be automated and where a person stays involved. main_risks names the most important thing that could go wrong.

Do not rate volume or calculate scores. That is done separately.`;

const intRating = { type: 'integer', enum: [1, 2, 3, 4, 5] };
const rated = {
  type: 'object',
  additionalProperties: false,
  required: ['rating', 'reason'],
  properties: { rating: intRating, reason: { type: 'string' } },
};
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['scores'],
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['process_id', 'rule_clarity', 'data_access', 'risk_if_wrong', 'strategic_value', 'automatable_percent', 'automation_idea', 'main_risks'],
        properties: {
          process_id: { type: 'string', enum: processes.map((p) => p.process_id) },
          rule_clarity: rated,
          data_access: rated,
          risk_if_wrong: rated,
          strategic_value: rated,
          automatable_percent: { type: 'integer', enum: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
          automation_idea: { type: 'string' },
          main_risks: { type: 'string' },
        },
      },
    },
  },
};

const processBlocks = processes
  .map((p) => `<process id="${p.process_id}">\n${JSON.stringify(p.map, null, 2)}\n</process>`)
  .join('\n\n');

const userMessage = `<client>${client}</client>

<owner_top_pains>
${ownerPains || 'Not provided.'}
</owner_top_pains>

${processBlocks}

Score every process above. Return exactly one entry per process id: ${processes.map((p) => p.process_id).join(', ')}.`;

const request = {
  model: 'claude-opus-5-5',
  max_tokens: 32000,
  fallbacks: 'default',
  output_config: { effort: 'high', format: { type: 'json_schema', schema } },
  system,
  messages: [{ role: 'user', content: userMessage }],
};

return [{
  json: {
    request,
    meta: {
      client,
      hourlyCost,
      ownerPainsGiven: Boolean(ownerPains),
      processes: processes.map(({ map, ...rest }) => rest),
    },
  },
}];
