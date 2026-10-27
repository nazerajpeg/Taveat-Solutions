const fs = require('fs');
const path = require('path');

const code = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const AIRTABLE = process.env.AIRTABLE_URL || 'https://api.airtable.com';
const out = process.argv[2] || path.join(__dirname, '..', 'airtable-setup.json');

const airtableAuth = { authentication: 'predefinedCredentialType', nodeCredentialType: 'airtableTokenApi' };
const credentials = { airtableTokenApi: { id: process.env.AIRTABLE_CRED_ID || 'REPLACE_ME', name: 'Airtable' } };
const fullResponse = { response: { response: { fullResponse: true, neverError: true } } };
const http = (id, name, position, parameters) => ({
  id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position, credentials, onError: 'continueRegularOutput',
  parameters: { ...airtableAuth, ...parameters },
});
const codeNode = (id, name, position, file) => ({ id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position, parameters: { jsCode: code(file) } });

const nodes = [
  { id: 't1', name: 'Run setup', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 300], parameters: {} },
  http('t2', 'List my bases', [220, 300], { method: 'GET', url: `${AIRTABLE}/v0/meta/bases`, options: fullResponse }),
  codeNode('t3', 'Find base', [440, 300], 'setup-find-base.js'),
  http('t4', 'Read current tables', [660, 300], {
    method: 'GET',
    url: `={{ '${AIRTABLE}/v0/meta/bases/' + $json.baseId + '/tables' }}`,
    options: fullResponse,
  }),
  codeNode('t5', 'Plan changes', [880, 300], 'setup-plan.js'),
  {
    id: 't6', name: 'Anything to change?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [1100, 300],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ id: 'has-change', leftValue: '={{ $json.action }}', rightValue: 'none', operator: { type: 'string', operation: 'notEquals' } }],
        combinator: 'and',
      },
      options: {},
    },
  },
  http('t7', 'Apply change', [1320, 200], {
    method: 'POST',
    url: `={{ '${AIRTABLE}' + $json.url }}`,
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json.body) }}',
    options: { ...fullResponse, batching: { batch: { batchSize: 1, batchInterval: 300 } } },
  }),
  codeNode('t8', 'Summary', [1540, 300], 'setup-summary.js'),
];

const link = (node) => [{ node, type: 'main', index: 0 }];
const workflow = {
  ...(process.env.WORKFLOW_ID ? { id: process.env.WORKFLOW_ID } : {}),
  name: 'Setup: create Airtable tables',
  nodes,
  connections: {
    'Run setup': { main: [link('List my bases')] },
    'List my bases': { main: [link('Find base')] },
    'Find base': { main: [link('Read current tables')] },
    'Read current tables': { main: [link('Plan changes')] },
    'Plan changes': { main: [link('Anything to change?')] },
    'Anything to change?': { main: [link('Apply change'), link('Summary')] },
    'Apply change': { main: [link('Summary')] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
  active: false,
  meta: { templateCredsSetupCompleted: false },
  tags: [],
};

fs.writeFileSync(out, JSON.stringify(workflow, null, 2));
console.log('wrote', out);
