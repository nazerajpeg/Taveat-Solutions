// n8n Code node: "Score and rank" (A-1 Opportunity Scorer)
const res = $input.first().json;
const meta = $('Build Claude request').first().json.meta;

const PRICE_PER_MTOK = { input: 4.0, output: 20.0 }; // Claude Opus 5.5, USD
const WEIGHTS = { volume: 0.3, rule_clarity: 0.25, data_access: 0.2, risk_if_wrong: 0.15, strategic_value: 0.1 };

const fail = (msg) => [{ json: { Error: msg } }];

if (res.stop_reason === 'refusal') return fail('Claude declined to score these processes. Check the process maps for content unrelated to the business and try again.');
if (res.stop_reason === 'max_tokens') return fail('The scoring was cut off because there were too many processes. Score them in smaller groups.');
const textBlock = (res.content || []).find((b) => b.type === 'text');
if (!textBlock) return fail(`Claude returned no scores (stop reason: ${res.stop_reason || 'unknown'}).`);
let out;
try {
  out = JSON.parse(textBlock.text);
} catch (e) {
  return fail('Claude returned scores that could not be read. Submit the form again.');
}

const byId = {};
for (const s of out.scores || []) byId[s.process_id] = s;
const missing = meta.processes.filter((p) => !byId[p.process_id]).map((p) => p.process);
if (missing.length) return fail(`Claude did not score: ${missing.join(', ')}. Submit the form again.`);

// Volume comes from measured hours, not from the model (PLAYBOOK A-1 rubric).
const volumeRating = (h) => {
  if (h == null) return null;
  if (h < 1) return 1;
  if (h < 3) return 2;
  if (h <= 5) return 3;
  if (h <= 10) return 4;
  return 5;
};
const round = (n, dp) => Math.round(n * 10 ** dp) / 10 ** dp;
const band = (score) => (score == null ? 'Needs data' : score >= 4 ? 'Build now' : score >= 3 ? 'Build next' : "Don't automate yet");

const usage = res.usage || {};
const cost = round(((usage.input_tokens || 0) * PRICE_PER_MTOK.input + (usage.output_tokens || 0) * PRICE_PER_MTOK.output) / 1e6, 4);
const today = new Date().toISOString().slice(0, 10);

const rows = meta.processes.map((p) => {
  const s = byId[p.process_id];
  const volume = volumeRating(p.hours_per_week);
  const score =
    volume == null
      ? null
      : round(
          volume * WEIGHTS.volume +
            s.rule_clarity.rating * WEIGHTS.rule_clarity +
            s.data_access.rating * WEIGHTS.data_access +
            s.risk_if_wrong.rating * WEIGHTS.risk_if_wrong +
            s.strategic_value.rating * WEIGHTS.strategic_value,
          2,
        );
  const hoursSaved = p.hours_per_week == null ? null : round((p.hours_per_week * s.automatable_percent) / 100, 1);
  const saving = hoursSaved != null && meta.hourlyCost ? Math.round(hoursSaved * meta.hourlyCost) : null;
  const volumeReason =
    volume == null ? 'Hours per week unknown. Fill in the process map before this can be scored.' : `${p.hours_per_week} hours per week.`;
  return {
    'Client': meta.client,
    'Process': p.process,
    'Priority': band(score),
    'Score': score,
    'Volume': volume,
    'Rule clarity': s.rule_clarity.rating,
    'Data access': s.data_access.rating,
    'Risk if wrong': s.risk_if_wrong.rating,
    'Strategic value': s.strategic_value.rating,
    'Reasons': [
      `Volume: ${volumeReason}`,
      `Rule clarity: ${s.rule_clarity.reason}`,
      `Data access: ${s.data_access.reason}`,
      `Risk if wrong: ${s.risk_if_wrong.reason}`,
      `Strategic value: ${s.strategic_value.reason}`,
    ].join('\n'),
    'Hours per week': p.hours_per_week,
    'Automatable %': s.automatable_percent,
    'Hours saved per week': hoursSaved,
    'Saving per week (USD)': saving,
    'Automation idea': s.automation_idea,
    'Main risks': s.main_risks,
    'Status': 'Proposed',
    'Scored on': today,
    'Model': res.model || 'claude-opus-5-5',
    'Run AI cost (USD)': cost,
  };
});

rows.sort((a, b) => (b.Score ?? -1) - (a.Score ?? -1));
rows.forEach((r, i) => (r['Rank'] = i + 1));

return rows.map((r) => ({ json: r }));
