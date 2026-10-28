// n8n Code node: "Summary" (Airtable setup)
const plan = $('Plan changes').all().map((i) => i.json);
const warnings = plan[0].warnings || [];
let results;

if (plan[0].action === 'none') {
  results = ['Nothing to change: both tables already have every column the agents need.'];
} else {
  results = $input.all().map((item, i) => {
    const p = plan[i];
    const r = item.json;
    const body = r && r.body !== undefined ? r.body : r;
    const err = body && body.error;
    const what = p.action === 'create table' ? `Created table "${p.table}" (${p.body.fields.length} columns)` : `Added column "${p.field}" to ${p.table}`;
    if (body && body.id && !err) return what;
    if (err && /DUPLICATE/i.test(JSON.stringify(err))) return `${what.replace(/^Created|^Added/, 'Skipped')}: already exists`;
    const task = p.action === 'create table' ? `create table "${p.table}"` : `add column "${p.field}" to ${p.table}`;
    return `Failed to ${task}. Airtable said: ${err ? JSON.stringify(err) : JSON.stringify(r).slice(0, 300)}`;
  });
}

const failed = results.some((r) => r.startsWith('Failed'));
return [{
  json: {
    base: plan[0].baseName,
    allOk: !failed && warnings.length === 0,
    results,
    warnings,
    nextStep: failed || warnings.length
      ? 'Fix the items in "warnings" (or send the Failed message to Claude), then run this workflow again.'
      : 'Done. In each agent workflow, re-select Base and Table from the list on its Airtable box, then run it.',
  },
}];
