const fs = require('fs');
const path = require('path');

const code = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const ANTHROPIC_URL = process.env.ANTHROPIC_URL || 'https://api.anthropic.com/v1/messages';
const out = process.argv[2] || path.join(__dirname, '..', 'opportunity-scorer.json');
const testMode = process.env.TEST_MODE === '1';

const noError = (id) => ({
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
    conditions: [{ id, leftValue: '={{ $json.Error }}', rightValue: '', operator: { type: 'string', operation: 'empty', singleValue: true } }],
    combinator: 'and',
  },
  options: {},
});

const airtableBase = { __rl: true, mode: 'id', value: 'appREPLACE_ME' };
const airtableCred = { airtableTokenApi: { id: 'REPLACE_ME', name: 'Airtable' } };

const getMaps = testMode
  ? {
      id: 's2', name: 'Get confirmed maps', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 300], alwaysOutputData: true,
      parameters: { jsCode: code('test-fixtures/scorer-airtable-search.js') },
    }
  : {
      id: 's2', name: 'Get confirmed maps', type: 'n8n-nodes-base.airtable', typeVersion: 2.1, position: [240, 300], alwaysOutputData: true,
      credentials: airtableCred,
      parameters: {
        operation: 'search',
        base: airtableBase,
        table: { __rl: true, mode: 'name', value: 'Process Maps' },
        filterByFormula: "={{ \"AND({Client} = '\" + $json['Client name'].trim().replace(/'/g, \"\\\\'\") + \"', {Status} = 'Confirmed')\" }}",
        returnAll: true,
        options: {},
      },
    };

const summary = `={{ (() => {
  const rows = $('Score and rank').all().map((i) => i.json);
  const list = (p) => rows.filter((r) => r.Priority === p).map((r) => r.Process + (r.Score != null ? ' (' + r.Score + ')' : '')).join(', ') || 'none';
  const hours = rows.filter((r) => r.Priority === 'Build now').reduce((t, r) => t + (r['Hours saved per week'] || 0), 0);
  const needsData = rows.some((r) => r.Priority === 'Needs data') ? ' Needs data first: ' + list('Needs data') + '.' : '';
  return 'Scored ' + rows.length + ' processes and saved them to the Backlog table as Proposed. Build now: ' + list('Build now') + '. Build next: ' + list('Build next') + ". Don't automate yet: " + list("Don't automate yet") + '.' + needsData + ' Automating the Build now items would save about ' + Math.round(hours * 10) / 10 + ' hours per week.';
})() }}`;

const nodes = [
  {
    id: 's1', name: 'Scoring form', type: 'n8n-nodes-base.formTrigger', typeVersion: 2.3, position: [0, 300],
    webhookId: 'c3a2d5e8-7b1f-4c6a-9e2d-5f8a1b3c7d02',
    parameters: {
      formTitle: 'Score automation opportunities',
      formDescription: "Scores every confirmed process map for a client against the playbook rubric and builds a ranked backlog.",
      formFields: {
        values: [
          { fieldLabel: 'Client name', placeholder: 'Exactly as written in the Process Maps table', requiredField: true },
          { fieldLabel: "Owner's top pains", fieldType: 'textarea', placeholder: 'The owner\'s top 3 frustrations, from the intake questionnaire' },
          { fieldLabel: 'Loaded hourly cost (USD)', fieldType: 'number', placeholder: 'e.g. 40' },
        ],
      },
      options: { path: 'opportunity-scorer', appendAttribution: false },
    },
  },
  getMaps,
  {
    id: 's3', name: 'Build Claude request', type: 'n8n-nodes-base.code', typeVersion: 2, position: [480, 300],
    parameters: { jsCode: code('scorer-build-request.js') },
  },
  { id: 's4', name: 'Maps found?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [720, 300], parameters: noError('maps-found') },
  {
    id: 's5', name: 'Claude: score processes', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [960, 200],
    retryOnFail: true, maxTries: 3, waitBetweenTries: 5000, onError: 'continueErrorOutput',
    credentials: { httpHeaderAuth: { id: process.env.ANTHROPIC_CRED_ID || 'REPLACE_ME', name: 'Anthropic API key' } },
    parameters: {
      method: 'POST',
      url: ANTHROPIC_URL,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'anthropic-version', value: '2026-10-21' },
          { name: 'anthropic-beta', value: 'server-side-fallback-2026-07-01' },
          { name: 'content-type', value: 'application/json' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.request) }}',
      options: { timeout: 600000 },
    },
  },
  {
    id: 's6', name: 'Score and rank', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1200, 160],
    parameters: { jsCode: code('scorer-score.js') },
  },
  { id: 's7', name: 'Scored OK?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [1440, 160], parameters: noError('scored-ok') },
  {
    id: 's8', name: 'Save to backlog', type: 'n8n-nodes-base.airtable', typeVersion: 2.1, position: [1680, 80],
    credentials: airtableCred,
    parameters: {
      operation: 'create',
      base: airtableBase,
      table: { __rl: true, mode: 'name', value: 'Backlog' },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] },
      options: { typecast: true },
    },
  },
  {
    id: 's9', name: 'Show result', type: 'n8n-nodes-base.form', typeVersion: 1, position: [1920, 80],
    parameters: { operation: 'completion', completionTitle: 'Backlog ready', completionMessage: summary },
  },
  {
    id: 's10', name: 'Show error', type: 'n8n-nodes-base.form', typeVersion: 1, position: [1680, 420],
    parameters: {
      operation: 'completion',
      completionTitle: 'The backlog was not created',
      completionMessage: "={{ $json.Error || ($json.error && ($json.error.message || JSON.stringify($json.error))) || 'Unknown error. Check the workflow executions in n8n.' }}",
    },
  },
];

const link = (node) => [{ node, type: 'main', index: 0 }];
const connections = {
  'Scoring form': { main: [link('Get confirmed maps')] },
  'Get confirmed maps': { main: [link('Build Claude request')] },
  'Build Claude request': { main: [link('Maps found?')] },
  'Maps found?': { main: [link('Claude: score processes'), link('Show error')] },
  'Claude: score processes': { main: [link('Score and rank'), link('Show error')] },
  'Score and rank': { main: [link('Scored OK?')] },
  'Scored OK?': { main: [link(testMode ? 'Show result' : 'Save to backlog'), link('Show error')] },
  'Save to backlog': { main: [link('Show result')] },
};

const finalNodes = testMode ? nodes.filter((n) => n.name !== 'Save to backlog') : nodes;
if (testMode) delete connections['Save to backlog'];

const workflow = {
  ...(process.env.WORKFLOW_ID ? { id: process.env.WORKFLOW_ID } : {}),
  name: 'A-1 Opportunity Scorer',
  nodes: finalNodes,
  connections,
  settings: { executionOrder: 'v1' },
  pinData: {},
  active: false,
  meta: { templateCredsSetupCompleted: false },
  tags: [],
};

fs.writeFileSync(out, JSON.stringify(workflow, null, 2));
console.log('wrote', out);
