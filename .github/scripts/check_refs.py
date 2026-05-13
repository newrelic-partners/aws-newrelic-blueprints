#!/usr/bin/env python3
"""
Cross-reference integrity check:
- All link source/target IDs exist as node IDs
- All transportIds on service nodes exist in transports.json
- All categoryId values on service nodes exist as category nodes
"""
import json, sys

graph      = json.load(open('data/graph.json'))
transports = json.load(open('data/transports.json'))

node_ids      = {n['id'] for n in graph['nodes']}
transport_ids = {t['id'] for t in transports['transports']}

errors = []

for link in graph['links']:
    src = link['source']
    tgt = link['target']
    if src not in node_ids:
        errors.append(f"Link source '{src}' not found in nodes")
    if tgt not in node_ids:
        errors.append(f"Link target '{tgt}' not found in nodes")
    if link.get('transportId') and link['transportId'] not in transport_ids:
        errors.append(f"Link transportId '{link['transportId']}' not found in transports.json")

for node in graph['nodes']:
    if node.get('type') == 'service':
        if node.get('categoryId') and node['categoryId'] not in node_ids:
            errors.append(f"Node '{node['id']}' categoryId '{node['categoryId']}' not found in nodes")
        for tid in node.get('transportIds', []):
            if tid not in transport_ids:
                errors.append(f"Node '{node['id']}' transportId '{tid}' not found in transports.json")
        if node.get('primaryTransportId') and node['primaryTransportId'] not in transport_ids:
            errors.append(f"Node '{node['id']}' primaryTransportId '{node['primaryTransportId']}' not found in transports.json")

if errors:
    for e in errors:
        print(f"ERROR: {e}")
    sys.exit(1)

print(f"OK — {len(node_ids)} nodes, {len(graph['links'])} links, {len(transport_ids)} transports all cross-reference correctly.")
