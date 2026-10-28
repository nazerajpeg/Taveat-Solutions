const fs = require('fs');
const path = require('path');
const assert = require('assert');

const run = (file, inputs, refs = {}) => {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const fn = new Function('$input', '$', src);
  const $input = { first: () => ({ json: inputs[0] }), all: () => inputs.map((json) => ({ json })) };
  return fn($input, (name) => ({ first: () => ({ json: refs[name] }) }));
};

const form = { 'Client name': 'Acme Plumbing', "Owner's top pains": 'Chasing invoices', 'Loaded hourly cost (USD)': 40 };
const mapA = { process_name: 'Invoice follow-up', steps: [], pain_points: ['eats my morning'] };
const mapB = { process_name: 'Job scheduling', steps: [], pain_points: [] };
const mapC = { process_name: 'Supplier ordering', steps: [], pain_points: [] };
const records = [
  { id: 'rec1', createdTime: 'x', fields: { Process: 'Invoice follow-up', 'Hours per week': 12, 'Map JSON': JSON.stringify(mapA) } },
  { id: 'rec2', Process: 'Job scheduling', 'Hours per week': 0.5, 'Map JSON': JSON.stringify(mapB) },
  { id: 'rec3', fields: { Process: 'Supplier ordering', 'Map JSON': JSON.stringify(mapC) } },
];

// 1. Build request: handles both Airtable output shapes, ids P1..P3
const built = run('scorer-build-request.js', records, { 'Scoring form': form })[0].json;
assert.equal(built.request.model, 'claude-opus-5-5');
assert.deepEqual(built.meta.processes.map((p) => p.process_id), ['P1', 'P2', 'P3']);
assert.deepEqual(built.request.output_config.format.schema.properties.scores.items.properties.process_id.enum, ['P1', 'P2', 'P3']);
assert.equal(built.meta.processes[2].hours_per_week, null);
console.log('build: ok');

// 2. No confirmed maps (alwaysOutputData gives one empty item)
assert.ok(run('scorer-build-request.js', [{}], { 'Scoring form': form })[0].json.Error);
console.log('no maps: ok');

// 3. Score and rank
const r = (rating) => ({ rating, reason: 'because' });
const scores = [
  { process_id: 'P1', rule_clarity: r(4), data_access: r(5), risk_if_wrong: r(3), strategic_value: r(5), automatable_percent: 70, automation_idea: 'Auto reminders', main_risks: 'Wrong tone' },
  { process_id: 'P2', rule_clarity: r(2), data_access: r(2), risk_if_wrong: r(2), strategic_value: r(1), automatable_percent: 20, automation_idea: 'x', main_risks: 'y' },
  { process_id: 'P3', rule_clarity: r(5), data_access: r(5), risk_if_wrong: r(5), strategic_value: r(3), automatable_percent: 80, automation_idea: 'x', main_risks: 'y' },
];
const response = { model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ scores }) }], usage: { input_tokens: 50000, output_tokens: 10000 } };
const rows = run('scorer-score.js', [response], { 'Build Claude request': built }).map((x) => x.json);
const by = Object.fromEntries(rows.map((x) => [x.Process, x]));

// P1: 5*.3 + 4*.25 + 5*.2 + 3*.15 + 5*.1 = 1.5+1+1+.45+.5 = 4.45
assert.equal(by['Invoice follow-up'].Score, 4.45);
assert.equal(by['Invoice follow-up'].Priority, 'Build now');
assert.equal(by['Invoice follow-up']['Hours saved per week'], 8.4);
assert.equal(by['Invoice follow-up']['Saving per week (USD)'], 336);
// P2: 1*.3 + 2*.25 + 2*.2 + 2*.15 + 1*.1 = .3+.5+.4+.3+.1 = 1.6
assert.equal(by['Job scheduling'].Score, 1.6);
assert.equal(by['Job scheduling'].Priority, "Don't automate yet");
// P3: no hours, so no score
assert.equal(by['Supplier ordering'].Score, null);
assert.equal(by['Supplier ordering'].Priority, 'Needs data');
assert.equal(by['Supplier ordering']['Hours saved per week'], null);
assert.deepEqual(rows.map((x) => x.Rank), [1, 2, 3]);
assert.equal(rows[0].Process, 'Invoice follow-up');
assert.equal(rows[2].Process, 'Supplier ordering');
assert.equal(rows[0]['Run AI cost (USD)'], 0.4);
console.log('score: ok');

// 4. Band edges: 4.0 is Build now, 3.0 is Build next
const edge = (ratings, hours) => {
  const b = JSON.parse(JSON.stringify(built));
  b.meta.processes = [{ process_id: 'P1', process: 'Edge', hours_per_week: hours }];
  const s = [{ process_id: 'P1', rule_clarity: r(ratings[0]), data_access: r(ratings[1]), risk_if_wrong: r(ratings[2]), strategic_value: r(ratings[3]), automatable_percent: 50, automation_idea: '', main_risks: '' }];
  return run('scorer-score.js', [{ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ scores: s }) }] }], { 'Build Claude request': b })[0].json;
};
assert.equal(edge([4, 4, 4, 4], 8).Priority, 'Build now');
assert.equal(edge([3, 3, 3, 3], 4).Priority, 'Build next');
console.log('bands: ok');

// 5. Error paths
const err = (resp) => run('scorer-score.js', [resp], { 'Build Claude request': built })[0].json.Error;
assert.ok(err({ stop_reason: 'refusal', content: [] }));
assert.ok(err({ stop_reason: 'max_tokens', content: [] }));
assert.ok(err({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{bad' }] }));
assert.ok(err({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ scores: scores.slice(0, 2) }) }] }).includes('Supplier ordering'));
console.log('error paths: ok');
