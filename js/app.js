import { loadData }      from './data-loader.js';
import { initGraph, focusNode, clearFocus } from './graph.js';
import { initPanel, openPanel, closePanel } from './panel.js';
import { initFilters }   from './filters.js';
import { initInteraction } from './interaction.js';

async function main() {
  const data = await loadData();

  const maps = {
    nodeMap:      data.nodeMap,
    transportMap: data.transportMap,
    useCaseMap:   data.useCaseMap,
  };

  initPanel(maps);
  initInteraction();
  initFilters();

  initGraph(
    { nodes: data.nodes, links: data.links },
    maps,
    (evt) => {
      if (!evt) {
        clearFocus();
        closePanel();
        return;
      }

      if (evt.type === 'service') {
        focusNode(evt.node.id);
        openPanel(evt.node);
      }

      if (evt.type === 'category') {
        // Filter graph to this category
        document.getElementById('filter-category').value = evt.node.id;
        document.getElementById('filter-category').dispatchEvent(new Event('change'));
        clearFocus();
        closePanel();
      }
    }
  );

  // Restore service panel from URL hash on load
  const params = new URLSearchParams(window.location.hash.slice(1));
  const serviceId = params.get('service');
  if (serviceId && data.nodeMap.has(serviceId)) {
    const node = data.nodeMap.get(serviceId);
    focusNode(serviceId);
    openPanel(node);
  }
}

main().catch(err => {
  console.error('Failed to initialize AWS → New Relic map:', err);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#e2e8f0;font-family:sans-serif;text-align:center;padding:20px">
      <div>
        <div style="font-size:24px;margin-bottom:12px">⚠️</div>
        <div style="font-size:16px;margin-bottom:8px">Failed to load the connectivity map</div>
        <div style="font-size:13px;color:#7a8ea0">${err.message}</div>
        <div style="font-size:12px;color:#7a8ea0;margin-top:8px">Open the browser console for details. Ensure you're serving via HTTP (e.g. python3 -m http.server 8080).</div>
      </div>
    </div>
  `;
});
