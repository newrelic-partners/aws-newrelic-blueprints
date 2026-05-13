let transportMap;
let useCaseMap;
let nodeMap;

export function initPanel(maps) {
  transportMap = maps.transportMap;
  useCaseMap   = maps.useCaseMap;
  nodeMap      = maps.nodeMap;

  document.getElementById('panel-close')?.addEventListener('click', closePanel);
}

export function openPanel(node) {
  const panel   = document.getElementById('detail-panel');
  const content = document.getElementById('panel-content');
  if (!panel || !content) return;

  content.innerHTML = buildPanelHTML(node);
  wireInteractivity(content, node);

  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('panel--open');

  // Update URL hash for shareability
  const hash = new URLSearchParams(window.location.hash.slice(1));
  hash.set('service', node.id);
  window.history.replaceState(null, '', '#' + hash.toString());

  // Hide first-visit hint
  const hint = document.getElementById('first-visit-hint');
  if (hint) hint.style.display = 'none';
  localStorage.setItem('nrmapHintSeen', '1');
}

export function closePanel() {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;
  panel.setAttribute('aria-hidden', 'true');
  panel.classList.remove('panel--open');

  const hash = new URLSearchParams(window.location.hash.slice(1));
  hash.delete('service');
  const hashStr = hash.toString();
  window.history.replaceState(null, '', hashStr ? '#' + hashStr : window.location.pathname);
}

// ── HTML builder ──────────────────────────────────────────────────
function buildPanelHTML(node) {
  const transport = transportMap.get(node.primaryTransportId);
  const useCases  = useCaseMap.get(node.id) || [];
  const catNode   = nodeMap.get(node.categoryId);
  const products  = (node.nrProducts || []).slice(0, 3);

  return `
    <!-- Header -->
    <h2 class="panel__service-name">${esc(node.label)}</h2>

    <div class="panel__badges">
      ${catNode ? `<span class="badge badge--category">${esc(catNode.label)}</span>` : ''}
      ${products.map(p => `<span class="badge badge--product">${esc(p)}</span>`).join('')}
      ${transport ? `<span class="badge badge--transport badge--${node.primaryTransportId}">${esc(transport.shortLabel)}</span>` : ''}
    </div>

    <hr class="panel__divider" />

    <!-- Pitch headline -->
    <div class="panel__section-label">
      <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
        <path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Pitch Headline
    </div>
    <p class="panel__pitch-headline">"${esc(node.pitchHeadline || '')}"</p>

    <hr class="panel__divider" />

    <!-- Use cases -->
    <div class="panel__section-label">
      <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 8h6M5 5h6M5 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Use Cases
    </div>
    <div class="use-cases-list" id="use-cases-container">
      ${useCases.map((uc, i) => buildUseCaseCard(uc, i)).join('')}
    </div>

    <hr class="panel__divider" />

    <!-- Transport / data flow -->
    <div class="transport-section">
      <button class="transport-toggle" aria-expanded="false" aria-controls="transport-body-${node.id}">
        <div class="panel__section-label" style="margin:0">
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
            <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          How Data Flows
        </div>
        <svg viewBox="0 0 12 8" width="10" height="7" fill="none" aria-hidden="true">
          <path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="transport-body" id="transport-body-${node.id}" hidden>
        ${transport ? buildTransportHTML(transport, node.primaryTransportId) : '<p style="color:var(--nr-muted);font-size:12px">No transport data available.</p>'}
      </div>
    </div>

    <hr class="panel__divider" />

    <!-- Footer links -->
    <div class="panel__footer">
      <button class="panel__share-btn" id="share-btn" title="Copy link to clipboard">
        <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
          <circle cx="12" cy="3" r="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="4"  cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="12" cy="13" r="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M6 7l4-3M6 9l4 3" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Share
      </button>
      ${node.docUrl ? `<a class="panel__link" href="${esc(node.docUrl)}" target="_blank" rel="noopener">NR Docs ↗</a>` : ''}
      ${node.awsDocUrl ? `<a class="panel__link" href="${esc(node.awsDocUrl)}" target="_blank" rel="noopener">AWS Docs ↗</a>` : ''}
    </div>
  `;
}

function buildUseCaseCard(uc, i) {
  const nrqlId = `nrql-${i}-${Date.now()}`;
  return `
    <div class="use-case-card">
      <div class="use-case-card__title">${esc(uc.title)}</div>
      <div class="use-case-card__product">${esc(uc.nrProduct)} · ${esc(uc.nrFeature || '')}</div>
      <div class="use-case-card__pain"><strong>Pain:</strong> "${esc(uc.customerPainPoint)}"</div>
      <div class="use-case-card__pitch">${esc(uc.pitchStatement)}</div>
      <div class="use-case-card__discovery">${esc(uc.discoveryQuestion)}</div>
      ${uc.nrqlExample ? `
        <button class="nrql-toggle" aria-expanded="false" aria-controls="${nrqlId}">
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10" aria-hidden="true">
            <path d="M4 2l5 4-5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          NRQL Example
        </button>
        <code class="nrql-block" id="${nrqlId}" hidden>${esc(uc.nrqlExample)}</code>
      ` : ''}
    </div>
  `;
}

function buildTransportHTML(t, transportId) {
  const steps = (t.path || []).map((step, i, arr) => {
    const isActive = i === 0 || i === arr.length - 1;
    return `
      <div class="transport-step ${isActive ? 'transport-step--active' : ''}">
        <span class="transport-step__dot"></span>
        ${esc(step)}
        ${i < arr.length - 1 ? '<span class="transport-step__arrow">↓</span>' : ''}
      </div>
    `;
  });

  const freshnessClass = {
    'realtime':       'realtime',
    'near-realtime':  'near-realtime',
    'polling':        'polling',
  }[t.freshnessClass] || 'polling';

  return `
    <div class="transport-path">${steps.join('')}</div>
    <div class="transport-meta">
      <div class="transport-meta__item"><strong>Protocol:</strong> ${esc(t.protocol || '')}</div>
      <div class="transport-meta__item"><strong>Latency:</strong> ${esc(t.latency || '')}</div>
    </div>
    <div style="margin-top:8px">
      <span class="freshness-badge freshness-badge--${freshnessClass}">${esc(t.label)}</span>
    </div>
    ${t.description ? `<p style="font-size:12px;color:var(--nr-muted);margin-top:10px;line-height:1.5">${esc(t.description)}</p>` : ''}
  `;
}

// ── Wire up in-panel interactivity ────────────────────────────────
function wireInteractivity(container, node) {
  // NRQL toggles
  container.querySelectorAll('.nrql-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const target   = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!expanded));
      if (target) target.hidden = expanded;
    });
  });

  // Transport toggle
  const transportToggle = container.querySelector('.transport-toggle');
  if (transportToggle) {
    transportToggle.addEventListener('click', () => {
      const expanded = transportToggle.getAttribute('aria-expanded') === 'true';
      const bodyId   = transportToggle.getAttribute('aria-controls');
      const body     = document.getElementById(bodyId);
      transportToggle.setAttribute('aria-expanded', String(!expanded));
      if (body) body.hidden = expanded;
    });
  }

  // Share button
  const shareBtn = container.querySelector('#share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.href).then(() => {
        shareBtn.classList.add('copied');
        shareBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          shareBtn.classList.remove('copied');
          shareBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true"><circle cx="12" cy="3" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 7l4-3M6 9l4 3" stroke="currentColor" stroke-width="1.5"/></svg>Share`;
        }, 2000);
      });
    });
  }
}

// ── Safe HTML escape ──────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
