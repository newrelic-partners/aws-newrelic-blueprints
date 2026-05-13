import { clearFocus, focusNode } from './graph.js';
import { closePanel } from './panel.js';

export function initInteraction() {
  document.addEventListener('keydown', handleKeydown);

  // Legend toggle
  const legendToggle = document.getElementById('legend-toggle');
  const legendBody   = document.getElementById('legend-body');
  if (legendToggle && legendBody) {
    legendToggle.addEventListener('click', () => {
      const expanded = legendToggle.getAttribute('aria-expanded') === 'true';
      legendToggle.setAttribute('aria-expanded', String(!expanded));
      legendBody.hidden = expanded;
    });
  }

  // First-visit hint: hide if already seen
  if (localStorage.getItem('nrmapHintSeen')) {
    const hint = document.getElementById('first-visit-hint');
    if (hint) hint.style.display = 'none';
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    clearFocus();
    closePanel();
  }
}
