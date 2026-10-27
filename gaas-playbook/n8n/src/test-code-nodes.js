const fs = require('fs');
const path = require('path');
const assert = require('assert');

const run = (file, input, refs = {}) => {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const fn = new Function('$input', '$', src);
  return fn({ first: () => ({ json: input }) }, (name) => ({ first: () => ({ json: refs[name] }) }));
};

const form = {
  'Client name': 'Acme Plumbing',
  'Process name': 'Invoice follow-up',
  'Person interviewed': 'Dana',
  'Their role': 'Office manager',
  'Interview date': '2026-10-20',
  'Transcript': 'Dana: So every morning I open QuickBooks and pull the overdue invoices report. '.repeat(5),
};

// 1. Build request
const built = run('build-request.js', form)[0].json;
assert.equal(built.request.model, 'claude-sonnet-5-5');
assert.equal(built.request.output_config.format.type, 'json_schema');
assert.ok(built.request.messages[0].content.includes('Acme Plumbing'));
JSON.stringify(built.request);
console.log('build: ok, request bytes', JSON.stringify(built.request).length);

// 2. Short transcript is rejected
const short = run('build-request.js', { ...form, Transcript: 'too short' })[0].json;
assert.ok(short.Error);
console.log('short transcript: ok');

// 3. Parse a good response
const map = {
  process_name: 'Invoice follow-up', summary: 'Chasing overdue invoices.', owner: 'Dana', trigger: 'Every weekday morning',
  frequency_per_week: 5, minutes_per_run: 45, tools_used: ['QuickBooks', 'Gmail'],
  steps: [
    { n: 1, action: 'Pull overdue report', person: 'Dana', tool: 'QuickBooks', input: 'Invoices', output: 'Overdue list', judgment_needed: false, judgment_notes: '', evidence: 'I pull the overdue invoices report' },
    { n: 2, action: 'Email customers', person: 'Dana', tool: 'unknown', input: 'Overdue list', output: 'Reminder emails', judgment_needed: true, judgment_notes: 'Tone depends on customer', evidence: 'depends who it is' },
  ],
  exceptions: [], pain_points: ['Takes forever'], open_questions: ['Which tool do you send reminders from?'],
};
const response = {
  model: 'claude-sonnet-5-5', stop_reason: 'end_turn',
  content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(map) }],
  usage: { input_tokens: 20000, output_tokens: 4000 },
};
const row = run('parse-and-check.js', response, { 'Build Claude request': built })[0].json;
assert.equal(row['Hours per week'], 3.8);
assert.equal(row['Checklist passed'], false);
assert.ok(row['Checklist issues'].includes('Steps 2 have no tool'));
assert.ok(row['Checklist issues'].includes('No exceptions'));
assert.equal(row['AI cost (USD)'], 0.08);
assert.equal(row['Judgment steps'], 1);
console.log('parse: ok');
console.log(row['Map']);

// 4. Refusal and bad JSON
assert.ok(run('parse-and-check.js', { stop_reason: 'refusal', content: [] }, { 'Build Claude request': built })[0].json.Error);
assert.ok(run('parse-and-check.js', { stop_reason: 'end_turn', content: [{ type: 'text', text: '{oops' }] }, { 'Build Claude request': built })[0].json.Error);
console.log('error paths: ok');
