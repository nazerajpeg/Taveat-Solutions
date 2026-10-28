const fs = require('fs');
const path = require('path');

const code = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const ANTHROPIC_URL = process.env.ANTHROPIC_URL || 'https://api.anthropic.com/v1/messages';
const out = process.argv[2] || path.join(__dirname, 'process-mapper.json');
const skipAirtable = process.env.SKIP_AIRTABLE === '1';

const noError = (expr) => ({
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
    conditions: [{
      id: 'no-error',
      leftValue: expr,
      rightValue: '',
      operator: { type: 'string', operation: 'empty', singleValue: true },
    }],
    combinator: 'and',
  },
  options: {},
});

const nodes = [
  {
    id: 'a1', name: 'Walkthrough form', type: 'n8n-nodes-base.formTrigger', typeVersion: 2.3, position: [0, 300],
    webhookId: 'b7f1c1de-4e0a-4f55-9a57-1f3c1d2a9e01',
    parameters: {
      formTitle: 'Process walkthrough',
      formDescription: 'Paste the transcript of one process walkthrough. The Process Mapper turns it into a step-by-step map for the interviewee to confirm.',
      formFields: {
        values: [
          { fieldLabel: 'Client name', requiredField: true },
          { fieldLabel: 'Process name', placeholder: 'e.g. Invoice follow-up', requiredField: true },
          { fieldLabel: 'Person interviewed', requiredField: true },
          { fieldLabel: 'Their role' },
          { fieldLabel: 'Interview date', fieldType: 'date' },
          { fieldLabel: 'Transcript', fieldType: 'textarea', requiredField: true },
        ],
      },
      options: { path: 'process-mapper', appendAttribution: false },
    },
  },
  {
    id: 'a2', name: 'Build Claude request', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 300],
    parameters: { jsCode: code('build-request.js') },
  },
  {
    id: 'a3', name: 'Transcript OK?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [480, 300],
    parameters: noError('={{ $json.Error }}'),
  },
  {
    id: 'a4', name: 'Claude: map the process', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [720, 200],
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
      options: { timeout: 300000 },
    },
  },
  {
    id: 'a5', name: 'Parse and check', type: 'n8n-nodes-base.code', typeVersion: 2, position: [960, 160],
    parameters: { jsCode: code('parse-and-check.js') },
  },
  {
    id: 'a6', name: 'Map OK?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [1200, 160],
    parameters: noError('={{ $json.Error }}'),
  },
  {
    id: 'a7', name: 'Save to client file', type: 'n8n-nodes-base.airtable', typeVersion: 2.1, position: [1440, 80],
    credentials: { airtableTokenApi: { id: 'REPLACE_ME', name: 'Airtable' } },
    parameters: {
      operation: 'create',
      base: { __rl: true, mode: 'id', value: 'appREPLACE_ME' },
      table: { __rl: true, mode: 'name', value: 'Process Maps' },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] },
      options: { typecast: true },
    },
  },
  {
    id: 'a8', name: 'Show result', type: 'n8n-nodes-base.form', typeVersion: 1, position: [1680, 80],
    parameters: {
      operation: 'completion',
      completionTitle: "={{ $('Parse and check').first().json['Checklist passed'] ? 'Process map ready' : 'Process map ready: needs answers' }}",
      completionMessage: "={{ (() => { const r = $('Parse and check').first().json; return `${r['Process']}: ${r['Step count']} steps, ${r['Hours per week'] ?? 'unknown'} hours per week. Saved to the client file as \"Awaiting confirmation\". ` + (r['Checklist passed'] ? 'Checklist passed. Send the map to ' + r['Interviewee'] + ' to confirm.' : 'Still to resolve: ' + r['Checklist issues'].replace(/\\n/g, ' ')); })() }}",
    },
  },
  {
    id: 'a9', name: 'Show error', type: 'n8n-nodes-base.form', typeVersion: 1, position: [1440, 420],
    parameters: {
      operation: 'completion',
      completionTitle: 'The map was not created',
      completionMessage: "={{ $json.Error || ($json.error && ($json.error.message || JSON.stringify($json.error))) || 'Unknown error. Check the workflow executions in n8n.' }}",
    },
  },
];

const connections = {
  'Walkthrough form': { main: [[{ node: 'Build Claude request', type: 'main', index: 0 }]] },
  'Build Claude request': { main: [[{ node: 'Transcript OK?', type: 'main', index: 0 }]] },
  'Transcript OK?': { main: [
    [{ node: 'Claude: map the process', type: 'main', index: 0 }],
    [{ node: 'Show error', type: 'main', index: 0 }],
  ] },
  'Claude: map the process': { main: [
    [{ node: 'Parse and check', type: 'main', index: 0 }],
    [{ node: 'Show error', type: 'main', index: 0 }],
  ] },
  'Parse and check': { main: [[{ node: 'Map OK?', type: 'main', index: 0 }]] },
  'Map OK?': { main: [
    [{ node: skipAirtable ? 'Show result' : 'Save to client file', type: 'main', index: 0 }],
    [{ node: 'Show error', type: 'main', index: 0 }],
  ] },
  'Save to client file': { main: [[{ node: 'Show result', type: 'main', index: 0 }]] },
};

const finalNodes = skipAirtable ? nodes.filter((n) => n.name !== 'Save to client file') : nodes;
if (skipAirtable) delete connections['Save to client file'];

const workflow = {
  ...(process.env.WORKFLOW_ID ? { id: process.env.WORKFLOW_ID } : {}),
  name: 'I-2 Process Mapper',
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
