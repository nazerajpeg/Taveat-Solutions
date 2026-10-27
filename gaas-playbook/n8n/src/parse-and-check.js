// n8n Code node: "Parse and check"
const res = $input.first().json;
const meta = $('Build Claude request').first().json.meta;

const PRICE_PER_MTOK = { input: 2.0, output: 10.0 }; // Claude Sonnet 5.5, USD

const fail = (msg) => [{ json: { Error: msg } }];

if (res.stop_reason === 'refusal') {
  return fail('Claude declined to process this transcript. Check it for content unrelated to the business process and try again.');
}
if (res.stop_reason === 'max_tokens') {
  return fail('The map was cut off because it was too long. Split the transcript into separate processes and submit each one.');
}
const textBlock = (res.content || []).find((b) => b.type === 'text');
if (!textBlock) {
  return fail(`Claude returned no map (stop reason: ${res.stop_reason || 'unknown'}).`);
}
let map;
try {
  map = JSON.parse(textBlock.text);
} catch (e) {
  return fail('Claude returned a map that could not be read. Submit the form again.');
}

const isUnknown = (v) => !v || /^\s*(unknown|n\/a|none|unclear)\s*$/i.test(v);
const steps = map.steps || [];
const issues = [];

const missingPerson = steps.filter((s) => isUnknown(s.person)).map((s) => s.n);
const missingTool = steps.filter((s) => isUnknown(s.tool)).map((s) => s.n);
if (steps.length === 0) issues.push('No steps were found in the transcript.');
if (missingPerson.length) issues.push(`Steps ${missingPerson.join(', ')} have no person.`);
if (missingTool.length) issues.push(`Steps ${missingTool.join(', ')} have no tool.`);
if (map.frequency_per_week == null) issues.push('How often this runs per week is unknown.');
if (map.minutes_per_run == null) issues.push('Minutes per run is unknown.');
if (!(map.exceptions || []).length) issues.push('No exceptions were described. Ask what happens when something goes wrong.');

const hoursPerWeek =
  map.frequency_per_week != null && map.minutes_per_run != null
    ? Math.round(((map.frequency_per_week * map.minutes_per_run) / 60) * 10) / 10
    : null;

const usage = res.usage || {};
const cost =
  ((usage.input_tokens || 0) * PRICE_PER_MTOK.input + (usage.output_tokens || 0) * PRICE_PER_MTOK.output) / 1e6;

const lines = [];
lines.push(`# ${map.process_name}`);
lines.push('');
lines.push(map.summary);
lines.push('');
lines.push(`Owner: ${map.owner}`);
lines.push(`Starts when: ${map.trigger}`);
lines.push(`Runs per week: ${map.frequency_per_week ?? 'unknown'} · Minutes per run: ${map.minutes_per_run ?? 'unknown'} · Hours per week: ${hoursPerWeek ?? 'unknown'}`);
lines.push(`Tools: ${(map.tools_used || []).join(', ')}`);
lines.push('');
lines.push('## Steps');
for (const s of steps) {
  lines.push(`${s.n}. ${s.action} (${s.person}, ${s.tool})`);
  lines.push(`   In: ${s.input} → Out: ${s.output}`);
  if (s.judgment_needed) lines.push(`   Judgment: ${s.judgment_notes}`);
}
if ((map.exceptions || []).length) {
  lines.push('');
  lines.push('## When things go differently');
  for (const x of map.exceptions) lines.push(`- If ${x.when}: ${x.what_happens}`);
}
if ((map.pain_points || []).length) {
  lines.push('');
  lines.push('## Pain points');
  for (const p of map.pain_points) lines.push(`- ${p}`);
}
if ((map.open_questions || []).length) {
  lines.push('');
  lines.push('## Questions for you');
  for (const q of map.open_questions) lines.push(`- ${q}`);
}

return [{
  json: {
    'Client': meta.client,
    'Process': map.process_name || meta.process,
    'Interviewee': meta.interviewee,
    'Interview date': meta.interviewDate || null,
    'Owner': map.owner,
    'Runs per week': map.frequency_per_week,
    'Minutes per run': map.minutes_per_run,
    'Hours per week': hoursPerWeek,
    'Step count': steps.length,
    'Judgment steps': steps.filter((s) => s.judgment_needed).length,
    'Exception count': (map.exceptions || []).length,
    'Checklist passed': issues.length === 0,
    'Checklist issues': issues.join('\n'),
    'Open questions': (map.open_questions || []).map((q) => `- ${q}`).join('\n'),
    'Map': lines.join('\n'),
    'Map JSON': JSON.stringify(map, null, 2),
    'Status': 'Awaiting confirmation',
    'Model': res.model || 'claude-sonnet-5-5',
    'AI cost (USD)': Math.round(cost * 10000) / 10000,
  },
}];
