/* Presentation only: retain native range inputs and their existing audio handlers. */
(() => {
  // The navigation is installed after all four tools have created their buttons.
  const navigationIcons = {
    navEar: '<path d="M8 8a5 5 0 0 1 10 0c0 4-5 4-5 8a3 3 0 0 1-6 0M11 8a2 2 0 0 1 4 0c0 2-3 2-3 5M21 6a9 9 0 0 1 0 6"/>',
    navChord: '<path d="M3 19h18M5 15V9m7 3V6m7 3V3"/><circle cx="5" cy="15" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="9" r="2"/>',
    navRhythm: '<path d="M3 12h3l3-7 5 14 3-7h4"/>',
    navKnowledge: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m6-16v16M3 9h18M3 15h18"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    navChordShapes: '<path d="M5 5h14M5 10h14M5 15h14M5 20h14M5 5v15M12 5v15M19 5v15"/><path d="M5 5h14" stroke-width="3"/><circle cx="5" cy="12.5" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="17.5" r="2" fill="currentColor" stroke="none"/>'
  };
  Object.entries(navigationIcons).forEach(([id, drawing]) => {
    const button = document.getElementById(id);
    if (!button) return;
    const label = button.textContent.trim();
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('class', 'studio-nav-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.innerHTML = drawing;
    button.prepend(icon);
    button.title = label;
    button.setAttribute('aria-label', label);
  });
  const volumes = new Set(['ggGuitarVolume', 'ggDrumVolume', 'ggClickVolume']);
  function paint(input) {
    const min = Number(input.min || 0), max = Number(input.max || 100);
    const percentage = Math.max(0, Math.min(100, (Number(input.value) - min) / (max - min || 1) * 100));
    input.style.setProperty('--studio-fill', `${percentage}%`);
    if (volumes.has(input.id)) {
      let output = document.getElementById(`${input.id}Readout`);
      if (!output) {
        output = document.createElement('output');
        output.id = `${input.id}Readout`;
        output.htmlFor = input.id;
        output.className = 'studio-volume-value';
        input.before(output);
      }
      output.value = `${input.value}%`;
    }
  }
  function refresh() { document.querySelectorAll('input[type=range]').forEach(paint); }
  document.addEventListener('input', event => {
    if (event.target.matches('input[type=range]')) paint(event.target);
  });
  // Restore/daily practice can recreate controls and set values programmatically.
  let queued = false;
  const observer = new MutationObserver(records => {
    if (queued || !records.some(record => Array.from(record.addedNodes).some(node =>
      node.nodeType === 1 && (node.matches('input[type=range]') || node.querySelector('input[type=range]'))))) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refresh(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', () => requestAnimationFrame(refresh));
  document.addEventListener('change', () => requestAnimationFrame(refresh));
  refresh();
})();
