/* Presentation only: retain native range inputs and their existing audio handlers. */
(() => {
  const navigationLabels = {
    navToday: '练习',
    navChord: '琶音',
    navRhythm: '律动',
    navEar: '听感',
    navKnowledge: '指板',
    navChordShapes: '和弦'
  };
  Object.entries(navigationLabels).forEach(([id, shortLabel]) => {
    const button = document.getElementById(id);
    if (!button) return;
    const label = button.textContent.trim();
    button.dataset.shortLabel = shortLabel;
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
