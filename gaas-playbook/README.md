# GaaS Delivery Playbook

The method, tool rules and agents Taveat Solutions uses to deliver AI implementation engagements.

| File | What it is |
|---|---|
| `PLAYBOOK.md` | The delivery method: stages, checklists, scoring rubric, templates |
| `STACK_REGISTRY.md` | Approved tools and when to use each |
| `MODEL_ROUTING.md` | Which AI model to use for each agent and workflow, with pricing |
| `n8n/process-mapper.json` | Agent I-2 Process Mapper: import into n8n |
| `n8n/SETUP.md` | How to set up the Process Mapper |
| `n8n/sample-transcript.txt` | Sample walkthrough transcript for testing |
| `n8n/src/` | Source for the workflow's code steps, the build script and tests |

Rebuild the workflow after editing a code step:

```bash
cd gaas-playbook/n8n/src
node test-code-nodes.js
node build-workflow.js ../process-mapper.json
```
