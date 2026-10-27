// n8n Code node: "Find base and define tables" (Airtable setup)
const BASE_NAME = 'GaaS Client Files';

const res = $input.first().json;
if (res.statusCode !== 200) {
  const msg = res.body && res.body.error ? JSON.stringify(res.body.error) : `HTTP ${res.statusCode}`;
  throw new Error(`Airtable refused the request (${msg}). Check that the Airtable credential's token has the schema.bases:read and schema.bases:write scopes and access to the "${BASE_NAME}" base.`);
}
const bases = (res.body && res.body.bases) || [];
const base = bases.find((b) => b.name.trim().toLowerCase() === BASE_NAME.toLowerCase());
if (!base) {
  const seen = bases.map((b) => `"${b.name}"`).join(', ') || 'none';
  throw new Error(`No base called "${BASE_NAME}" was found. Bases this token can see: ${seen}. Create the base (or rename it) and give the token access to it.`);
}

const text = (name) => ({ name, type: 'singleLineText' });
const long = (name) => ({ name, type: 'multilineText' });
const num = (name, precision) => ({ name, type: 'number', options: { precision } });
const date = (name) => ({ name, type: 'date', options: { dateFormat: { name: 'iso' } } });
const select = (name, choices) => ({ name, type: 'singleSelect', options: { choices: choices.map((c) => ({ name: c })) } });
const checkbox = (name) => ({ name, type: 'checkbox', options: { icon: 'check', color: 'greenBright' } });
const currency = (name) => ({ name, type: 'currency', options: { precision: 0, symbol: '$' } });

const tables = [
  {
    name: 'Process Maps',
    description: 'I-2 Process Mapper output. One row per mapped process.',
    fields: [
      text('Client'),
      text('Process'),
      text('Interviewee'),
      date('Interview date'),
      text('Owner'),
      num('Runs per week', 1),
      num('Minutes per run', 1),
      num('Hours per week', 1),
      num('Step count', 0),
      num('Judgment steps', 0),
      num('Exception count', 0),
      checkbox('Checklist passed'),
      long('Checklist issues'),
      long('Open questions'),
      long('Map'),
      long('Map JSON'),
      select('Status', ['Awaiting confirmation', 'Confirmed', 'Needs rework']),
      text('Model'),
      num('AI cost (USD)', 4),
    ],
  },
  {
    name: 'Backlog',
    description: 'A-1 Opportunity Scorer output. One row per scored process.',
    fields: [
      text('Process'),
      text('Client'),
      num('Rank', 0),
      select('Priority', ['Build now', 'Build next', "Don't automate yet", 'Needs data']),
      num('Score', 2),
      num('Volume', 0),
      num('Rule clarity', 0),
      num('Data access', 0),
      num('Risk if wrong', 0),
      num('Strategic value', 0),
      long('Reasons'),
      num('Hours per week', 1),
      num('Automatable %', 0),
      num('Hours saved per week', 1),
      currency('Saving per week (USD)'),
      long('Automation idea'),
      long('Main risks'),
      select('Status', ['Proposed', 'Approved', 'Rejected', 'Built']),
      date('Scored on'),
      text('Model'),
      num('Run AI cost (USD)', 4),
    ],
  },
];

return tables.map((table) => ({ json: { baseId: base.id, baseName: base.name, table } }));
