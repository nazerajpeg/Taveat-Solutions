const fs = require('fs');
const path = require('path');
const assert = require('assert');

const run = (file, inputs, refs = {}) => {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const fn = new Function('$input', '$', src);
  const $input = { first: () => ({ json: inputs[0] }), all: () => inputs.map((json) => ({ json })) };
  const $ = (name) => ({ first: () => ({ json: refs[name][0] }), all: () => refs[name].map((json) => ({ json })) });
  return fn($input, $).map((x) => x.json);
};

// 1. Finds the base by name and defines two tables
const bases = { statusCode: 200, body: { bases: [{ id: 'appOther', name: 'Personal' }, { id: 'appGaaS', name: 'GaaS Client Files' }] } };
const defs = run('setup-tables.js', [bases]);
assert.equal(defs.length, 2);
assert.equal(defs[0].baseId, 'appGaaS');
const fieldNames = (t) => defs.find((d) => d.table.name === t).table.fields.map((f) => f.name);

// 2. Table fields match exactly what the agents write
const mapperRow = (() => {
  const runOne = (file, input, refs) => {
    const fn = new Function('$input', '$', fs.readFileSync(path.join(__dirname, file), 'utf8'));
    return fn({ first: () => ({ json: input }), all: () => [{ json: input }] }, (n) => ({ first: () => ({ json: refs[n] }) }))[0].json;
  };
  const built = runOne('build-request.js', { 'Client name': 'A', 'Process name': 'B', 'Person interviewed': 'C', Transcript: 'x'.repeat(300) }, {});
  const map = { process_name: 'B', summary: '', owner: '', trigger: '', frequency_per_week: 1, minutes_per_run: 1, tools_used: [], steps: [], exceptions: [], pain_points: [], open_questions: [] };
  return runOne('parse-and-check.js', { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(map) }], usage: {} }, { 'Build Claude request': built });
})();
assert.deepEqual([...fieldNames('Process Maps')].sort(), Object.keys(mapperRow).sort());

const scorerMeta = { client: 'A', hourlyCost: 40, processes: [{ process_id: 'P1', process: 'B', hours_per_week: 2 }] };
const r = (rating) => ({ rating, reason: '' });
const scores = [{ process_id: 'P1', rule_clarity: r(3), data_access: r(3), risk_if_wrong: r(3), strategic_value: r(3), automatable_percent: 50, automation_idea: '', main_risks: '' }];
const backlogRow = (() => {
  const fn = new Function('$input', '$', fs.readFileSync(path.join(__dirname, 'scorer-score.js'), 'utf8'));
  return fn({ first: () => ({ json: { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ scores }) }] } }) }, () => ({ first: () => ({ json: { meta: scorerMeta } }) }))[0].json;
})();
assert.deepEqual([...fieldNames('Backlog')].sort(), Object.keys(backlogRow).sort());
console.log('fields match agents: ok');

// 2b. Raw-body response shape (some n8n versions) works too
assert.equal(run('setup-tables.js', [bases.body])[0].baseId, 'appGaaS');
const rawSummary = run('setup-summary.js', [{ id: 'tbl1', name: 'Process Maps' }, { error: { message: '422 - {"error":{"type":"DUPLICATE_TABLE_NAME"}}' } }], { 'Find base and define tables': defs })[0];
assert.deepEqual(rawSummary.results.map((r) => r.result), ['Created with 19 fields', 'Already exists, left unchanged']);
assert.throws(() => run('setup-tables.js', [{ error: { message: '401 - AUTHENTICATION_REQUIRED' } }]), /AUTHENTICATION_REQUIRED/);
console.log('raw response shape: ok');

// 3. Scorer filters on Client and Status in Process Maps
assert.ok(fieldNames('Process Maps').includes('Client') && fieldNames('Process Maps').includes('Status'));

// 4. Base missing / bad token give clear errors
assert.throws(() => run('setup-tables.js', [{ statusCode: 200, body: { bases: [{ id: 'x', name: 'Personal' }] } }]), /No base called "GaaS Client Files".*"Personal"/);
assert.throws(() => run('setup-tables.js', [{ statusCode: 401, body: { error: { type: 'AUTHENTICATION_REQUIRED' } } }]), /AUTHENTICATION_REQUIRED/);
console.log('base errors: ok');

// 5. Summary: created, duplicate, failure
const summary = run('setup-summary.js', [
  { statusCode: 200, body: { id: 'tbl1' } },
  { statusCode: 422, body: { error: { type: 'DUPLICATE_TABLE_NAME', message: 'exists' } } },
], { 'Find base and define tables': defs })[0];
assert.equal(summary.allOk, true);
assert.equal(summary.results[0].result, 'Created with 19 fields');
assert.equal(summary.results[1].result, 'Already exists, left unchanged');
const failed = run('setup-summary.js', [{ statusCode: 422, body: { error: { type: 'INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE' } } }, { statusCode: 200, body: {} }], { 'Find base and define tables': defs })[0];
assert.equal(failed.allOk, false);
assert.ok(failed.results[0].result.startsWith('Failed: '));
console.log('summary: ok');
