# AWS → New Relic Connectivity Map

Interactive mind-map for GTM teams — click any AWS service to see New Relic use cases, pitch headlines, and how data flows to the platform.

**Live:** https://newrelic-partners.github.io/aws-newrelic-blueprints/

---

## What it does

- **22 AWS services** across Compute, Database, Networking, Storage, Streaming, Security, and Monitoring
- **5 transport mechanisms** color-coded by data freshness (Lambda Extension, ADOT, CW Logs, CW Metric Streams, API Polling)
- **90+ GTM use cases** with customer pain points, pitch statements, discovery questions, and NRQL examples
- **Shareable URLs** — filter state and selected service are preserved in the URL hash
- **Focus mode** — clicking a service dims everything else, highlights the data path to New Relic

## Local development

Requires only a static file server (no build step):

```bash
cd aws-newrelic-blueprints
python3 -m http.server 8080
# Open http://localhost:8080
```

## Deployment

Push to `main` — GitHub Pages auto-serves from the repo root.

## Updating pitch content

GTM teams can edit `content/use-cases.json` directly via the GitHub UI or a PR. See [`content/README.md`](content/README.md) for the schema and field guide.

## Adding a new AWS service

1. Add a node to `data/graph.json` (see existing entries for the schema)
2. Add structural and data-flow links for the new node
3. Add use cases in `content/use-cases.json` keyed by the new node ID
4. Open a PR — the CI will validate JSON syntax and cross-references

## Architecture

```
index.html          ← Entry point, no build step
css/
  main.css          ← Design tokens, toolbar, layout
  graph.css         ← D3 SVG styles, focus mode, animations
  panel.css         ← Detail panel, use case cards
js/
  app.js            ← Bootstrap: loads data, wires modules
  data-loader.js    ← fetch() all JSON, build lookup maps
  graph.js          ← D3 simulation, rendering, focus mode
  layout.js         ← Radial pre-seeding of node positions
  interaction.js    ← Keyboard, legend, first-visit hint
  panel.js          ← Side panel HTML generation
  filters.js        ← Filter dropdowns + URL hash persistence
data/
  graph.json        ← Node topology + links (app-owned)
  transports.json   ← Transport mechanism definitions
content/
  use-cases.json    ← GTM pitch content (sales/marketing-owned)
```
