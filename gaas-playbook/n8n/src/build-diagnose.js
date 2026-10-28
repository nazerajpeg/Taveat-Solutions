const fs = require('fs');
const path = require('path');

const code = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const AIRTABLE = process.env.AIRTABLE_URL || 'https://api.airtable.com';
const out = process.argv[2] || path.join(__dirname, '..', 'airtable-diagnose.json');

const credentials = { airtableTokenApi: { id: process.env.AIRTABLE_CRED_ID || 'REPLACE_ME', name: 'Airtable' } };
const fullResponse = { response: { response: { fullResponse: true, neverError: true } } };
const http = (id, name, position, parameters) => ({
  id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position, credentials, onError: 'continueRegularOutput',
  parameters: { authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi', options: fullResponse, ...parameters },
});

// Same shape and value types the Process Mapper writes.
const sampleRow = {
  'Client': 'Diagnostic test',
  'Process': 'Diagnostic full row',
  'Interviewee': 'Test',
  'Interview date': null,
  'Owner': 'Test',
  'Runs per week': 5,
  'Minutes per run': 45,
  'Hours per week': 3.8,
  'Step count': 2,
  'Judgment steps': 1,
  'Exception count': 0,
  'Checklist passed': false,
  'Checklist issues': 'Step 2 has no tool.',
  'Open questions': '- Which tool do you use?',
  'Map': '# Diagnostic\n\n1. Test step',
  'Map JSON': '{"process_name":"Diagnostic"}',
  'Status': 'Awaiting confirmation',
  'Model': 'claude-sonnet-5-5',
  'AI cost (USD)': 0.0123,
};
const recordsUrl = `={{ '${AIRTABLE}/v0/' + $('Find base').first().json.baseId + '/Process%20Maps' }}`;

const nodes = [
  { id: 'd1', name: 'Run check', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 300], parameters: {} },
  http('d2', 'Who am I', [220, 300], { method: 'GET', url: `${AIRTABLE}/v0/meta/whoami` }),
  http('d3', 'List my bases', [440, 300], { method: 'GET', url: `${AIRTABLE}/v0/meta/bases` }),
  { id: 'd4', name: 'Find base', type: 'n8n-nodes-base.code', typeVersion: 2, position: [660, 300], parameters: { jsCode: code('setup-find-base.js') } },
  http('d5', 'Write test: 2 columns', [880, 300], {
    method: 'POST', url: recordsUrl, sendBody: true, specifyBody: 'json',
    jsonBody: JSON.stringify({ typecast: true, fields: { Client: 'Diagnostic test', Process: 'Diagnostic small row' } }),
  }),
  http('d6', 'Write test: all columns', [1100, 300], {
    method: 'POST', url: recordsUrl, sendBody: true, specifyBody: 'json',
    jsonBody: JSON.stringify({ typecast: true, fields: sampleRow }),
  }),
  { id: 'd7', name: 'Diagnosis', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1320, 300], parameters: { jsCode: code('diagnose-summary.js') } },
];

const link = (node) => [{ node, type: 'main', index: 0 }];
const workflow = {
  ...(process.env.WORKFLOW_ID ? { id: process.env.WORKFLOW_ID } : {}),
  name: 'Check: Airtable connection',
  nodes,
  connections: {
    'Run check': { main: [link('Who am I')] },
    'Who am I': { main: [link('List my bases')] },
    'List my bases': { main: [link('Find base')] },
    'Find base': { main: [link('Write test: 2 columns')] },
    'Write test: 2 columns': { main: [link('Write test: all columns')] },
    'Write test: all columns': { main: [link('Diagnosis')] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
  active: false,
  meta: { templateCredsSetupCompleted: false },
  tags: [],
};

fs.writeFileSync(out, JSON.stringify(workflow, null, 2));
console.log('wrote', out);
