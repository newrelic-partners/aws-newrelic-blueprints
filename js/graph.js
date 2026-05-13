import { seedPositions, RADII } from './layout.js';

let simulation, svgSel, gRoot, nodesLayer, linksLayer;
let nodeMap, transportMap;
let currentFocusId = null;
let onNodeClickCb = null;

// Node radii per tier
const NODE_R = { 0: 36, 1: 28, 2: 20 };

// Transport CSS color variable names
const TRANSPORT_COLOR = {
  't-lambda-ext': 'var(--t-lambda-ext)',
  't-adot':       'var(--t-adot)',
  't-cwlogs':     'var(--t-cwlogs)',
  't-cwms':       'var(--t-cwms)',
  't-apoll':      'var(--t-apoll)',
};

export function initGraph({ nodes, links }, maps, onNodeClick) {
  nodeMap      = maps.nodeMap;
  transportMap = maps.transportMap;
  onNodeClickCb = onNodeClick;

  svgSel = d3.select('#graph-svg');
  gRoot  = d3.select('#graph-root');
  nodesLayer = d3.select('#nodes-layer');
  linksLayer = d3.select('#links-layer');

  const width  = svgSel.node().clientWidth  || window.innerWidth;
  const height = svgSel.node().clientHeight || (window.innerHeight - 56);
  const cx = width / 2;
  const cy = height / 2;

  seedPositions(nodes, cx, cy);

  // Build simulation
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
      if (d.type === 'structural') {
        const src = typeof d.source === 'object' ? d.source : nodeMap.get(d.source);
        return src?.tier === 0 ? RADII[1] : RADII[2] - RADII[1];
      }
      return 0; // data-flow links don't drive layout
    }).strength(0.15))
    .force('radial-cat', d3.forceRadial(RADII[1], cx, cy).strength(d => d.tier === 1 ? 0.8 : 0))
    .force('radial-svc', d3.forceRadial(RADII[2], cx, cy).strength(d => d.tier === 2 ? 0.6 : 0))
    .force('charge', d3.forceManyBody().strength(d => d.tier === 2 ? -120 : -200))
    .force('collide', d3.forceCollide().radius(d => NODE_R[d.tier] + 18))
    .alphaDecay(0.03)
    .on('tick', ticked);

  drawLinks(links);
  drawNodes(nodes);
  setupZoom(gRoot, svgSel);
  setupResize(nodes, links, cx, cy);
}

// ── Draw links ───────────────────────────────────────────────────────
function drawLinks(links) {
  linksLayer.selectAll('.link')
    .data(links.filter(l => l.type !== 'data-flow'))
    .join('line')
      .attr('class', 'link link--structural')
      .attr('data-link-id', d => `${d.source?.id || d.source}-${d.target?.id || d.target}`);

  linksLayer.selectAll('.link-flow')
    .data(links.filter(l => l.type === 'data-flow'))
    .join('line')
      .attr('class', d => `link link--data-flow link--${d.transportId}`)
      .attr('data-link-id', d => `flow-${d.source?.id || d.source}`)
      .attr('stroke-dasharray', '6 4')
      .attr('marker-end', 'url(#arrow-data)');
}

// ── Draw nodes ───────────────────────────────────────────────────────
function drawNodes(nodes) {
  const groups = nodesLayer.selectAll('.node')
    .data(nodes, d => d.id)
    .join('g')
      .attr('class', d => `node node--${d.type}`)
      .attr('data-id', d => d.id)
      .style('cursor', d => d.type === 'hub' ? 'default' : 'pointer')
      .call(drag(simulation))
      .on('click', handleNodeClick)
      .on('mouseenter', handleNodeEnter)
      .on('mouseleave', handleNodeLeave);

  // Background circle
  groups.append('circle')
    .attr('r', d => NODE_R[d.tier])
    .attr('stroke', d => getCategoryColor(d))
    .style('--node-color', d => getCategoryColor(d));

  // AWS icon image (service + category nodes only)
  groups.filter(d => d.iconPath)
    .append('image')
      .attr('href', d => d.iconPath)
      .attr('width', d => d.tier === 1 ? 28 : 22)
      .attr('height', d => d.tier === 1 ? 28 : 22)
      .attr('x', d => d.tier === 1 ? -14 : -11)
      .attr('y', d => d.tier === 1 ? -14 : -11)
      .attr('preserveAspectRatio', 'xMidYMid meet');

  // Hub label (no icon)
  groups.filter(d => d.tier === 0)
    .append('text')
      .attr('y', 0)
      .attr('dy', '0.35em')
      .text('New Relic');

  // Node labels below the circle
  nodesLayer.selectAll('.node-label')
    .data(nodes.filter(d => d.tier > 0), d => d.id)
    .join('text')
      .attr('class', 'node-label')
      .attr('data-label-for', d => d.id)
      .attr('dy', d => NODE_R[d.tier] + 13)
      .text(d => d.label);
}

// ── Tick: update positions ─────────────────────────────────────────
function ticked() {
  linksLayer.selectAll('line')
    .attr('x1', d => (d.source?.x ?? 0))
    .attr('y1', d => (d.source?.y ?? 0))
    .attr('x2', d => (d.target?.x ?? 0))
    .attr('y2', d => (d.target?.y ?? 0));

  nodesLayer.selectAll('.node')
    .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

  nodesLayer.selectAll('.node-label')
    .attr('x', d => d.x ?? 0)
    .attr('y', d => d.y ?? 0);
}

// ── Focus mode ────────────────────────────────────────────────────────
export function focusNode(nodeId) {
  clearFocus();
  if (!nodeId) return;

  currentFocusId = nodeId;
  const svgNode = svgSel.node();
  if (svgNode) svgNode.classList.add('graph--focused');

  // Mark selected node as active
  nodesLayer.select(`[data-id="${nodeId}"]`).classed('node--active', true);

  // Mark hub active
  const hub = nodesLayer.select('[data-id="nr-platform"]');
  hub.classed('node--active', true);

  // Find the data-flow link from this service to hub and mark it active
  linksLayer.selectAll('.link--data-flow')
    .filter(d => {
      const src = d.source?.id || d.source;
      return src === nodeId;
    })
    .classed('link--active', true);

  // Add pulse ring to selected node
  const selGroup = nodesLayer.select(`[data-id="${nodeId}"]`);
  const r = NODE_R[nodeMap.get(nodeId)?.tier ?? 2];
  selGroup.insert('circle', ':first-child')
    .attr('class', 'pulse-ring')
    .style('--node-color', getCategoryColor(nodeMap.get(nodeId)))
    .attr('r', r);

  // Mark labels
  nodesLayer.select(`[data-label-for="${nodeId}"]`).classed('node-label--active', true);
  nodesLayer.select('[data-label-for="nr-platform"]').classed('node-label--active', true);
}

export function clearFocus() {
  currentFocusId = null;
  const svgNode = svgSel?.node();
  if (svgNode) svgNode.classList.remove('graph--focused');

  nodesLayer?.selectAll('.node').classed('node--active', false);
  nodesLayer?.selectAll('.pulse-ring').remove();
  linksLayer?.selectAll('.link').classed('link--active', false);
  nodesLayer?.selectAll('.node-label').classed('node-label--active', false);
}

// ── Filter: dim nodes not matching filter ─────────────────────────
export function applyFilter({ category, product, transport }) {
  const hasFilter = category || product || transport;

  nodesLayer.selectAll('.node--service').each(function(d) {
    let visible = true;
    if (category  && d.categoryId !== category)  visible = false;
    if (product   && !d.nrProducts?.includes(product)) visible = false;
    if (transport && d.primaryTransportId !== transport) visible = false;

    d3.select(this).classed('node--filtered-out', !visible);
    d3.select(this).style('opacity', hasFilter ? (visible ? 1 : 0.1) : null);
  });
}

// ── Search highlight ──────────────────────────────────────────────
export function highlightSearch(query) {
  nodesLayer.selectAll('.node--service,.node--category')
    .classed('node--search-match', d => {
      if (!query) return false;
      return d.label.toLowerCase().includes(query.toLowerCase());
    });
}

// ── Zoom ──────────────────────────────────────────────────────────
function setupZoom(root, svg) {
  const zoom = d3.zoom()
    .scaleExtent([0.3, 3])
    .on('zoom', e => root.attr('transform', e.transform));
  svg.call(zoom);

  // Click on background exits focus
  svg.on('click', (e) => {
    if (e.target === svg.node() || e.target === root.node()) {
      clearFocus();
      if (onNodeClickCb) onNodeClickCb(null);
    }
  });
}

// ── Drag ──────────────────────────────────────────────────────────
function drag(sim) {
  return d3.drag()
    .on('start', (e, d) => {
      if (!e.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on('drag', (e, d) => {
      d.fx = e.x; d.fy = e.y;
    })
    .on('end', (e, d) => {
      if (!e.active) sim.alphaTarget(0);
      if (d.tier !== 0) { d.fx = null; d.fy = null; }
    });
}

// ── Resize ────────────────────────────────────────────────────────
function setupResize(nodes, links, cx, cy) {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = svgSel.node().clientWidth;
      const h = svgSel.node().clientHeight;
      const hub = nodes.find(n => n.tier === 0);
      if (hub) { hub.fx = w / 2; hub.fy = h / 2; }
      simulation
        .force('radial-cat', d3.forceRadial(RADII[1], w / 2, h / 2).strength(d => d.tier === 1 ? 0.8 : 0))
        .force('radial-svc', d3.forceRadial(RADII[2], w / 2, h / 2).strength(d => d.tier === 2 ? 0.6 : 0))
        .alpha(0.5).restart();
    }, 200);
  });
}

// ── Interaction helpers ───────────────────────────────────────────
function handleNodeClick(event, d) {
  event.stopPropagation();
  if (d.type === 'hub') return;

  if (d.type === 'category') {
    // Category click: filter to that category
    if (onNodeClickCb) onNodeClickCb({ type: 'category', node: d });
    return;
  }

  focusNode(d.id);
  if (onNodeClickCb) onNodeClickCb({ type: 'service', node: d });
}

function handleNodeEnter(event, d) {
  if (d.type === 'hub') return;
  const tooltip = document.getElementById('node-tooltip');
  if (!tooltip) return;
  tooltip.textContent = d.label;
  tooltip.classList.add('visible');
  positionTooltip(event, tooltip);
}

function handleNodeLeave() {
  const tooltip = document.getElementById('node-tooltip');
  if (tooltip) tooltip.classList.remove('visible');
}

function positionTooltip(event, el) {
  const rect = svgSel.node().getBoundingClientRect();
  el.style.left = (event.clientX - rect.left + 12) + 'px';
  el.style.top  = (event.clientY - rect.top  - 32) + 'px';
}

// ── Color helpers ─────────────────────────────────────────────────
function getCategoryColor(node) {
  if (!node) return 'var(--nr-muted)';
  if (node.tier === 0) return 'var(--nr-green)';
  if (node.tier === 1) return node.color || 'var(--nr-muted)';

  // Service: color by primary transport
  return TRANSPORT_COLOR[node.primaryTransportId] || 'var(--nr-muted)';
}
