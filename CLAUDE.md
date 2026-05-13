# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Local Development
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

### Deployment
Push to `main` branch. GitHub Pages auto-serves from repo root.
Live URL: https://newrelic-partners.github.io/aws-newrelic-blueprints/

## Product Requirements

Develop a static interactive webpage in mind map navigation style that will be hosted on GitHub for public. The goal of asset is to help the audience (Sales teams, GTM and marketing teams) to understand connectivity between AWS services and New Relic platform, the path, mechanism and protocol of connectivity between each service and New Relic platform - How the data is transported from AWS Service A to New Relic endpoint or service. Along with the data flow between services, endpoints and products, we need to show use cases that New Relic product and features can address using the data collected from these AWS services and data sources.

## Audience

**Primary:** GTM teams — Sales AEs and SEs learning to pitch AWS integrations and use cases to customers.

**UX principle:** Lead with business value and pitch content. Technical transport/protocol details are secondary and should be collapsible. The tool must be usable while screen-sharing in a live customer meeting.

## Architecture

**Stack:** Vanilla HTML + CSS + JavaScript (no framework, no build step)
**Visualization:** D3.js v7 loaded from CDN
**Hosting:** GitHub Pages, org `newrelic-partners`, repo root deployment
**Data:** Static JSON files loaded via `fetch()` at runtime

### Folder responsibilities
- `data/` — App topology layer (graph nodes/links, transport definitions). Change when adding new AWS integrations.
- `content/` — GTM content layer (use cases, pitch assets). Updated by sales/marketing team independently of app code.
- `js/` — Application logic
- `css/` — Styles
- `Icon-package_01302026.*/` — Official AWS SVG icons (64px SVGs used for node rendering)

### Adding a new AWS service
1. Add a node entry to `data/graph.json` with `iconPath` pointing to the correct SVG in the icon package
2. Add a link from the service to its category node and a `data-flow` link to `nr-platform`
3. Add use cases to `content/use-cases.json` keyed by the new node's `id`
4. Run local dev server to verify the node renders and panel opens correctly

---

## Priority 1: Public Access — No authentication required to use the interactive webpage or application

---

## Priority 2: Validate user interaction before committing

Only commit and push after this check passes.
Never commit credentials and secrets.

---

## Priority 3: Read New Relic Product feature documentation and AWS Documentation Before Suggesting Changes

---

## Priority 4: Commit Before Deploying

Always create a git commit of the working state **before** running any deployment script. This ensures a rollback point exists.

---
