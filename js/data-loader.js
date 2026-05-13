/**
 * Loads all three JSON data files in parallel and constructs lookup maps.
 * Returns { nodes, links, transports, useCases, nodeMap, transportMap, useCaseMap }
 */
export async function loadData() {
  const [graphData, transportsData, useCasesData] = await Promise.all([
    fetch('data/graph.json').then(r => r.json()),
    fetch('data/transports.json').then(r => r.json()),
    fetch('content/use-cases.json').then(r => r.json()),
  ]);

  const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));
  const transportMap = new Map(transportsData.transports.map(t => [t.id, t]));

  // Build use-case map keyed by service node id
  // use-cases.json has a top-level "useCases" wrapper key
  const useCaseMap = new Map();
  const useCaseEntries = useCasesData.useCases ?? useCasesData;
  for (const [serviceId, cases] of Object.entries(useCaseEntries)) {
    useCaseMap.set(serviceId, cases);
  }

  return {
    nodes: graphData.nodes,
    links: graphData.links,
    transports: transportsData.transports,
    useCases: useCasesData,
    nodeMap,
    transportMap,
    useCaseMap,
  };
}
