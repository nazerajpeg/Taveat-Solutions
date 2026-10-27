// n8n Code node: "Summary" (Airtable setup)
const defs = $('Find base and define tables').all().map((i) => i.json);
const results = $input.all().map((item, i) => {
  const r = item.json;
  const table = defs[i].table;
  const err = r.body && r.body.error;
  if (r.statusCode === 200) return { table: table.name, result: `Created with ${table.fields.length} fields` };
  if (err && /DUPLICATE_TABLE_NAME/i.test(JSON.stringify(err))) return { table: table.name, result: 'Already exists, left unchanged' };
  return { table: table.name, result: `Failed: ${err ? JSON.stringify(err) : 'HTTP ' + r.statusCode}` };
});
const ok = results.every((r) => !r.result.startsWith('Failed'));
return [{
  json: {
    base: defs[0].baseName,
    allOk: ok,
    results,
    nextStep: ok
      ? 'Done. Open the base in Airtable and delete the empty "Table 1" if it is there.'
      : 'Send the Failed message above to Claude to get the fix.',
  },
}];
