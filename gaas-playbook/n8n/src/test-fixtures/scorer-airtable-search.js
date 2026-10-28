// Test stand-in for the Airtable search node. Returns records in the Airtable v2.1 output shape.
const client = $input.first().json['Client name'];
if (client === 'Nobody') return [];
const map = (name, pains) => JSON.stringify({ process_name: name, summary: '', owner: 'Dana', trigger: '', frequency_per_week: 5, minutes_per_run: 30, tools_used: ['QuickBooks', 'Gmail'], steps: [], exceptions: [], pain_points: pains, open_questions: [] });
return [
  { json: { id: 'rec001', createdTime: '2026-10-27T00:00:00.000Z', Client: client, Process: 'Invoice follow-up', 'Hours per week': 12, Status: 'Confirmed', 'Map JSON': map('Invoice follow-up', ['eats my whole morning']) } },
  { json: { id: 'rec002', createdTime: '2026-10-27T00:00:00.000Z', Client: client, Process: 'Job scheduling', 'Hours per week': 0.5, Status: 'Confirmed', 'Map JSON': map('Job scheduling', []) } },
  { json: { id: 'rec003', createdTime: '2026-10-27T00:00:00.000Z', Client: client, Process: 'Supplier ordering', Status: 'Confirmed', 'Map JSON': map('Supplier ordering', []) } },
];
