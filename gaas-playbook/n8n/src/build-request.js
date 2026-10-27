// n8n Code node: "Build Claude request"
const f = $input.first().json;

const meta = {
  client: (f['Client name'] || '').trim(),
  process: (f['Process name'] || '').trim(),
  interviewee: (f['Person interviewed'] || '').trim(),
  role: (f['Their role'] || '').trim(),
  interviewDate: f['Interview date'] || '',
};
const transcript = (f['Transcript'] || '').trim();

if (transcript.length < 200) {
  return [{ json: { Error: 'The transcript is too short to map (under 200 characters). Paste the full walkthrough transcript and submit again.' } }];
}

const system = `You are the Process Mapper for an AI implementation consultancy. You turn a recorded walkthrough of how someone does a task at work into an accurate, step-by-step process map.

Your map will be sent back to the person interviewed so they can confirm it, and later used to decide what to automate. Accuracy matters more than completeness: a wrong step is worse than a missing one.

Rules:
- Record only what the transcript says or clearly shows. Do not invent steps, tools, people or numbers.
- Each step is one action by one person in one tool. Split compound actions ("I copy it into the sheet and email Sarah") into separate steps.
- person: the role or name of whoever does the step. tool: the software or medium used (e.g. "Gmail", "QuickBooks", "paper form", "phone call"). If the transcript doesn't say, write "unknown" and add an open question.
- judgment_needed is true when the person has to decide something that isn't a fixed rule (e.g. "I check if it looks right", "depends on the customer"). Explain the decision in judgment_notes; otherwise leave judgment_notes empty.
- evidence: a short quote (under 25 words) from the transcript that supports the step.
- frequency_per_week and minutes_per_run: use numbers only if stated or directly calculable from what was said (e.g. "about 20 a day" on a 5-day week = 100). Otherwise use null and add an open question. Use minutes_per_run for one full run of the process, not one step.
- exceptions: what happens when things go wrong or differ from normal ("if the invoice is missing a PO number...").
- pain_points: frustrations, delays or errors the person mentions, in their words where possible.
- open_questions: specific questions to ask the person to fill gaps or resolve contradictions. Write them so they can be sent directly to that person.
- Write in plain English. No consulting jargon.`;

const str = { type: 'string' };
const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['process_name', 'summary', 'owner', 'trigger', 'frequency_per_week', 'minutes_per_run', 'tools_used', 'steps', 'exceptions', 'pain_points', 'open_questions'],
  properties: {
    process_name: str,
    summary: str,
    owner: str,
    trigger: str,
    frequency_per_week: nullableNumber,
    minutes_per_run: nullableNumber,
    tools_used: { type: 'array', items: str },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['n', 'action', 'person', 'tool', 'input', 'output', 'judgment_needed', 'judgment_notes', 'evidence'],
        properties: {
          n: { type: 'integer' },
          action: str, person: str, tool: str, input: str, output: str,
          judgment_needed: { type: 'boolean' },
          judgment_notes: str,
          evidence: str,
        },
      },
    },
    exceptions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['when', 'what_happens'],
        properties: { when: str, what_happens: str },
      },
    },
    pain_points: { type: 'array', items: str },
    open_questions: { type: 'array', items: str },
  },
};

const userMessage = `<context>
Client: ${meta.client}
Process: ${meta.process}
Person interviewed: ${meta.interviewee}${meta.role ? ` (${meta.role})` : ''}
</context>

<transcript>
${transcript}
</transcript>

Build the process map for "${meta.process}" from this walkthrough.`;

const request = {
  model: 'claude-sonnet-5-5',
  max_tokens: 16000,
  fallbacks: 'default',
  output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
  system,
  messages: [{ role: 'user', content: userMessage }],
};

return [{ json: { request, meta } }];
