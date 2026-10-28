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
const runOne = (file, input, refs) => {
  const fn = new Function('$input', '$', fs.readFileSync(path.join(__dirname, file), 'utf8'));
  return fn({ first: () => ({ json: input }), all: () => [{ json: input }] }, (n) => ({ first: () => ({ json: refs[n] }) }))[0].json;
};

// 1. Find base: both response shapes, missing, duplicates, auth error
const bases = { statusCode: 200, body: { bases: [{ id: 'appOther', name: 'Personal' }, { id: 'appGaaS', name: 'GaaS Client Files' }] } };
assert.equal(run('setup-find-base.js', [bases])[0].baseId, 'appGaaS');
assert.equal(run('setup-find-base.js', [bases.body])[0].baseId, 'appGaaS');
assert.throws(() => run('setup-find-base.js', [{ bases: [{ id: 'x', name: 'Personal' }] }]), /No base called "GaaS Client Files".*"Personal"/);
assert.throws(() => run('setup-find-base.js', [{ bases: [{ id: 'app1', name: 'GaaS Client Files' }, { id: 'app2', name: 'gaas client files ' }] }]), /Found 2 bases.*app1, app2/);
assert.throws(() => run('setup-find-base.js', [{ error: { message: '401 - AUTHENTICATION_REQUIRED' } }]), /AUTHENTICATION_REQUIRED/);
console.log('find base: ok');

const refs = { 'Find base': [{ baseId: 'appGaaS', baseName: 'GaaS Client Files' }] };
const plan = (tables) => run('setup-plan.js', [{ tables }], refs);

// 2. Empty base: create both tables, with fields matching exactly what the agents write
const fresh = plan([]);
assert.deepEqual(fresh.map((a) => a.action), ['create table', 'create table']);
const fieldNames = (t) => fresh.find((a) => a.table === t).body.fields.map((f) => f.name);

const built = runOne('build-request.js', { 'Client name': 'A', 'Process name': 'B', 'Person interviewed': 'C', Transcript: 'x'.repeat(300) }, {});
const map = { process_name: 'B', summary: '', owner: '', trigger: '', frequency_per_week: 1, minutes_per_run: 1, tools_used: [], steps: [], exceptions: [], pain_points: [], open_questions: [] };
const mapperRow = runOne('parse-and-check.js', { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(map) }], usage: {} }, { 'Build Claude request': built });
assert.deepEqual([...fieldNames('Process Maps')].sort(), Object.keys(mapperRow).sort());

const r = (rating) => ({ rating, reason: '' });
const scores = [{ process_id: 'P1', rule_clarity: r(3), data_access: r(3), risk_if_wrong: r(3), strategic_value: r(3), automatable_percent: 50, automation_idea: '', main_risks: '' }];
const backlogRow = runOne('scorer-score.js', { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ scores }) }] }, { 'Build Claude request': { meta: { client: 'A', hourlyCost: 40, processes: [{ process_id: 'P1', process: 'B', hours_per_week: 2 }] } } });
assert.deepEqual([...fieldNames('Backlog')].sort(), Object.keys(backlogRow).sort());
console.log('fields match agents: ok');

// 3. The real-world case: Process Maps exists but has no Client column (primary field "Name")
const full = (t) => fresh.find((a) => a.table === t).body.fields.map((f, i) => ({ id: 'fld' + i, ...f }));
const broken = plan([
  { id: 'tblPM', name: 'Process Maps', fields: [{ id: 'fldN', name: 'Name', type: 'singleLineText' }, ...full('Process Maps').filter((f) => f.name !== 'Client')] },
  { id: 'tblBL', name: 'Backlog', fields: full('Backlog') },
]);
assert.equal(broken.length, 1);
assert.equal(broken[0].action, 'add column');
assert.equal(broken[0].field, 'Client');
assert.equal(broken[0].url, '/v0/meta/bases/appGaaS/tables/tblPM/fields');
assert.deepEqual(broken[0].body, { name: 'Client', type: 'singleLineText' });
console.log('missing Client column: ok');

// 4. Everything present: nothing to do
const ok = plan([{ id: 't1', name: 'Process Maps', fields: full('Process Maps') }, { id: 't2', name: 'Backlog', fields: full('Backlog') }]);
assert.equal(ok[0].action, 'none');
assert.deepEqual(ok[0].warnings, []);

// 5. Misnamed column and breaking type give warnings; harmless type does not
const pm = full('Process Maps').map((f) => (f.name === 'Client' ? { ...f, name: 'client' } : f.name === 'Checklist passed' ? { ...f, type: 'singleLineText' } : f.name === 'Status' ? { ...f, type: 'singleLineText' } : f));
const warned = plan([{ id: 't1', name: 'Process Maps', fields: pm }, { id: 't2', name: 'Backlog', fields: full('Backlog') }]);
assert.equal(warned[0].action, 'none');
assert.equal(warned[0].warnings.length, 2);
assert.ok(warned[0].warnings.some((w) => w.includes('"client" must be named exactly "Client"')));
assert.ok(warned[0].warnings.some((w) => w.includes('"Checklist passed" is Single line text but should be Checkbox')));
console.log('warnings: ok');

// 6. Summary
const nothing = run('setup-summary.js', ok, { 'Plan changes': ok })[0];
assert.equal(nothing.allOk, true);
assert.ok(nothing.results[0].startsWith('Nothing to change'));
const two = plan([{ id: 'tblBL', name: 'Backlog', fields: full('Backlog').filter((f) => f.name !== 'Rank') }]);
assert.deepEqual(two.map((a) => a.action), ['create table', 'add column']);
const done = run('setup-summary.js', [{ id: 'tblNew' }, { statusCode: 200, body: { id: 'fldNew' } }], { 'Plan changes': two })[0];
assert.deepEqual(done.results, ['Created table "Process Maps" (19 columns)', 'Added column "Rank" to Backlog']);
assert.equal(done.allOk, true);
const failed = run('setup-summary.js', [{ error: { type: 'INVALID_FIELD_TYPE' } }, { id: 'x' }], { 'Plan changes': two })[0];
assert.equal(failed.allOk, false);
assert.ok(failed.results[0].startsWith('Failed to create table "Process Maps". Airtable said:'));
console.log('summary: ok');
