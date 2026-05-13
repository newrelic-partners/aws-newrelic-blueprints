# GTM Content Guide

This folder is owned by sales and marketing. You can update files here without touching any application code.

## What's in this folder

| File | What it controls |
|------|-----------------|
| `use-cases.json` | Pitch content for every AWS service — pain points, value statements, discovery questions, NRQL examples |
| `assets/` | Images, logos, or PDFs linked from use cases |

## How to edit use cases

Open `use-cases.json`. It is a JSON object keyed by the service node ID (e.g. `aws-lambda`). Each key maps to an array of use cases.

### Use case schema

```json
{
  "id": "uc-lambda-cold-start",
  "title": "Cold Start Latency Analysis",
  "nrProduct": "Serverless Monitoring",
  "nrFeature": "Function Details & Invocation Traces",
  "customerPainPoint": "We can't tell if Lambda cold starts are hurting our users",
  "pitchStatement": "New Relic breaks down every Lambda invocation — init vs handler duration, p99 per function",
  "discoveryQuestion": "Are you tracking cold start latency per function today?",
  "nrqlExample": "SELECT percentile(provider.duration.coldStart, 99) FROM ServerlessSample FACET provider.functionName"
}
```

### Field guide

| Field | Audience | Tips |
|-------|----------|------|
| `title` | Panel heading | Short, specific (4-6 words) |
| `customerPainPoint` | Customer voice | Write in customer's words, first person |
| `pitchStatement` | AE/SE pitch | One sentence, specific NR capability |
| `discoveryQuestion` | Discovery call | Open-ended, ties back to pain |
| `nrqlExample` | Technical demo | Keep it runnable, use real event types |

## How to add a new AWS service

1. Add the service node to `data/graph.json` (ask engineering)
2. Add use cases here in `content/use-cases.json` under the new service's node ID
3. Open a PR — the validation CI will check your JSON syntax automatically
