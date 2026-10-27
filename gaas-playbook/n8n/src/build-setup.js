const fs = require('fs');
const path = require('path');

const code = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const AIRTABLE = process.env.AIRTABLE_URL || 'https://api.airtable.com';
const out = process.argv[2] || path.join(__dirname, '..', 'airtable-setup.json');

const airtableAuth = {
  authentication: 'predefinedCredentialType',
  nodeCredentialType: 'airtableTokenApi',
};
const credentials = { airtableTokenApi: { id: process.env.AIRTABLE_CRED_ID || 'REPLACE_ME', name: 'Airtable' } };
const fullResponse = { response: { response: { fullResponse: true, neverError: true } } };

const nodes = [
  { id: 't1', name: 'Run setup', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 300], parameters: {} },
  {
    id: 't2', name: 'List my bases', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [240, 300], credentials, onError: 'continueRegularOutput',
    parameters: { method: 'GET', url: `${AIRTABLE}/v0/meta/bases`, ...airtableAuth, options: fullResponse },
  },
  {
    id: 't3', name: 'Find base and define tables', type: 'n8n-nodes-base.code', typeVersion: 2, position: [480, 300],
    parameters: { jsCode: code('setup-tables.js') },
  },
  {
    id: 't4', name: 'Create table', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [720, 300], credentials, onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: `={{ '${AIRTABLE}/v0/meta/bases/' + $json.baseId + '/tables' }}`,
      ...airtableAuth,
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.table) }}',
      options: { ...fullResponse, batching: { batch: { batchSize: 1, batchInterval: 500 } } },
    },
  },
  {
    id: 't5', name: 'Summary', type: 'n8n-nodes-base.code', typeVersion: 2, position: [960, 300],
    parameters: { jsCode: code('setup-summary.js') },
  },
];

const link = (node) => [{ node, type: 'main', index: 0 }];
const workflow = {
  ...(process.env.WORKFLOW_ID ? { id: process.env.WORKFLOW_ID } : {}),
  name: 'Setup: create Airtable tables',
  nodes,
  connections: {
    'Run setup': { main: [link('List my bases')] },
    'List my bases': { main: [link('Find base and define tables')] },
    'Find base and define tables': { main: [link('Create table')] },
    'Create table': { main: [link('Summary')] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
  active: false,
  meta: { templateCredsSetupCompleted: false },
  tags: [],
};

fs.writeFileSync(out, JSON.stringify(workflow, null, 2));
console.log('wrote', out);
