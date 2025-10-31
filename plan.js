(function () {
  const planContainer = document.getElementById('planContainer');
  const svg = document.getElementById('museumPlan');
  const hotRects = Array.from(svg.querySelectorAll('.hot'));
  const roomPanel = document.getElementById('roomPanel');
  const rpTitle = document.getElementById('rpTitle');
  const rpDesc = document.getElementById('rpDesc');
  const rpOpen = document.getElementById('rpOpen');
  const rpClose = document.getElementById('rpClose');

  const ROOM_MAP = {
    'room-1': { name: 'Salle A — Galerie historique', desc: 'Collections et objets fondateurs. Cliquez pour entrer.', url: 'galerie.html' },
    'room-2': { name: 'Salle B — Témoignages', desc: 'Témoignages et archives orales.', url: 'temoignages.html' },
    'room-3': { name: 'Grande Salle — Exposition centrale', desc: 'Exposition permanente sur le SAMU.', url: 'biographie.html' },
    'room-4': { name: 'Salle C — Médias', desc: 'Vidéos, radios et interviews.', url: 'media.html' },
    'room-5': { name: 'Archives', desc: 'Fonds d’archives et fichiers numérisés.', url: 'archives.html' },
    'room-6': { name: 'Chronologie', desc: 'Frise chronologique interactive du musée.', url: 'chronologie.html' }
  };

  let activeHot = null;
  let zoomed = false;

  function zoomToHot(hotEl) {
    const bbox = hotEl.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const svgRect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const screenX = svgRect.left + (cx - viewBox.x) * (svgRect.width / viewBox.width);
    const screenY = svgRect.top + (cy - viewBox.y) * (svgRect.height / viewBox.height);

    const pcRect = planContainer.getBoundingClientRect();
    const pcCenterX = pcRect.left + pcRect.width / 2;
    const pcCenterY = pcRect.top + pcRect.height / 2;

    const dx = pcCenterX - screenX;
    const dy = pcCenterY - screenY;

    const scale = Math.min(2.2, Math.max(1.2, 800 / Math.max(bbox.width, bbox.height)));

    planContainer.style.transition = 'transform 820ms cubic-bezier(.2,.9,.3,1)';
    planContainer.style.transformOrigin = 'center center';
    planContainer.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    zoomed = true;
  }

  function resetZoom() {
    planContainer.style.transform = '';
    zoomed = false;
  }

  function showPanelFor(roomId) {
    const info = ROOM_MAP[roomId] || { name: 'Salle', desc: '', url: '#' };
    rpTitle.textContent = info.name;
    rpDesc.textContent = info.desc;
    rpOpen.onclick = () => { window.location.href = info.url; };
    roomPanel.setAttribute('aria-hidden', 'false');
  }

  function hidePanel() {
    roomPanel.setAttribute('aria-hidden', 'true');
  }

  hotRects.forEach(h => {
    const roomId = h.dataset.room;
    const visual = svg.querySelector('#' + roomId);

    h.addEventListener('pointerenter', () => { if (visual) visual.classList.add('room-highlight'); });
    h.addEventListener('pointerleave', () => { if (visual) visual.classList.remove('room-highlight'); });

    h.addEventListener('click', (ev) => {
      ev.stopPropagation();
      activeHot = h;
      zoomToHot(h);
      setTimeout(() => { showPanelFor(roomId); }, 380);
    });

    h.setAttribute('tabindex', '0');
    h.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') h.click(); });
  });

  rpClose.addEventListener('click', () => {
    hidePanel();
    resetZoom();
    if (activeHot) {
      const v = svg.querySelector('#' + activeHot.dataset.room);
      if (v) v.classList.remove('room-highlight');
      activeHot = null;
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePanel();
      resetZoom();
      if (activeHot) {
        const v = svg.querySelector('#' + activeHot.dataset.room);
        if (v) v.classList.remove('room-highlight');
        activeHot = null;
      }
    }
  });

  document.addEventListener('click', (e) => {
    const isInsidePlan = planContainer.contains(e.target) || svg.contains(e.target);
    const isPanel = roomPanel.contains(e.target);
    if (!isInsidePlan && !isPanel) {
      hidePanel();
      resetZoom();
      if (activeHot) {
        const v = svg.querySelector('#' + activeHot.dataset.room);
        if (v) v.classList.remove('room-highlight');
        activeHot = null;
      }
    }
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => resetZoom(), 220);
  }, { passive: true });

  resetZoom();
})();
