// n8n Code node: "Plan changes" (Airtable setup)
// Compares the base's real tables with what the agents write, and plans only the missing pieces.
const base = $('Find base').first().json;
const raw = $input.first().json;
const body = raw && raw.body !== undefined ? raw.body : raw;
if (!body || !Array.isArray(body.tables)) {
  const detail = body && body.error ? JSON.stringify(body.error) : JSON.stringify(raw).slice(0, 300);
  throw new Error(`Airtable did not return the tables in "${base.baseName}". Airtable said: ${detail}`);
}

const text = (name) => ({ name, type: 'singleLineText' });
const long = (name) => ({ name, type: 'multilineText' });
const num = (name, precision) => ({ name, type: 'number', options: { precision } });
const date = (name) => ({ name, type: 'date', options: { dateFormat: { name: 'iso' } } });
const select = (name, choices) => ({ name, type: 'singleSelect', options: { choices: choices.map((c) => ({ name: c })) } });
const checkbox = (name) => ({ name, type: 'checkbox', options: { icon: 'check', color: 'greenBright' } });
const currency = (name) => ({ name, type: 'currency', options: { precision: 0, symbol: '$' } });

const WANTED = [
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

const TYPE_LABEL = {
  singleLineText: 'Single line text', multilineText: 'Long text', number: 'Number', date: 'Date',
  singleSelect: 'Single select', checkbox: 'Checkbox', currency: 'Currency',
};
const label = (t) => TYPE_LABEL[t] || t;
// Types that still accept what the agents write, so a mismatch is cosmetic.
const COMPATIBLE = { singleLineText: ['multilineText', 'singleSelect'], multilineText: ['singleLineText'], singleSelect: ['singleLineText'], number: ['currency'], currency: ['number'] };

const prefix = `/v0/meta/bases/${base.baseId}/tables`;
const actions = [];
const warnings = [];

for (const want of WANTED) {
  const have = body.tables.find((t) => t.name.trim().toLowerCase() === want.name.toLowerCase());
  if (!have) {
    actions.push({ action: 'create table', table: want.name, url: prefix, body: want });
    continue;
  }
  for (const f of want.fields) {
    const exact = have.fields.find((x) => x.name === f.name);
    if (exact) {
      if (exact.type !== f.type) {
        const fine = (COMPATIBLE[f.type] || []).includes(exact.type);
        const msg = `${want.name}: column "${f.name}" is ${label(exact.type)} but should be ${label(f.type)}. In Airtable: click the column name → Edit field → change the type.`;
        if (!fine) warnings.push(msg);
      }
      continue;
    }
    const near = have.fields.find((x) => x.name.trim().toLowerCase() === f.name.toLowerCase());
    if (near) {
      warnings.push(`${want.name}: column "${near.name}" must be named exactly "${f.name}". Rename it in Airtable.`);
      continue;
    }
    actions.push({ action: 'add column', table: want.name, field: f.name, url: `${prefix}/${have.id}/fields`, body: f });
  }
}

if (!actions.length) return [{ json: { action: 'none', baseName: base.baseName, warnings } }];
return actions.map((a) => ({ json: { ...a, baseName: base.baseName, warnings } }));
