(function(){
  const ARTICLES = [
    { id:1, title:"Création du SAMU et premières équipes", date:"1956", category:"Histoire", excerpt:"Retour sur la genèse du SAMU et les initiatives pionnières.", content:`<p>En 1956, les premières équipes voient le jour... (exemple).</p>` },
    { id:2, title:"Publication fondatrice de 1964", date:"1964", category:"Publication", excerpt:"Article fondateur qui a diffusé des pratiques structurées.", content:`<p>La publication de 1964 a permis...</p>` },
    { id:3, title:"Reportage terrain 1981", date:"1981", category:"Reportage", excerpt:"Images et témoignages sur le travail des équipes.", content:`<p>Reportage et témoignages sur le terrain...</p>` },
    { id:4, title:"Nouvelles pratiques (2004)", date:"2004", category:"Pratique", excerpt:"Mise à jour des procédures.", content:`<p>Mise à jour des protocoles...</p>` },
    { id:5, title:"Interview historique (2000)", date:"2000", category:"Interview", excerpt:"Entretien avec une figure centrale.", content:`<p>Entretien en profondeur...</p>` },
    { id:6, title:"Archives photo 2010", date:"2010", category:"Photo", excerpt:"Sélection d'images conservées par le musée.", content:`<p>Série photographique...</p>` },
    { id:7, title:"Témoignages associés (1995)", date:"1995", category:"Témoignage", excerpt:"Récits de praticiens et patients.", content:`<p>Témoignages poignants...</p>` },
    { id:8, title:"Étude & statistiques (2008)", date:"2008", category:"Publication", excerpt:"Résultats d'une étude nationale.", content:`<p>Analyse des données collectées...</p>` },
    { id:9, title:"Héritage et transmission (2022)", date:"2022", category:"Réflexion", excerpt:"Le legs pour les générations futures.", content:`<p>Réflexions contemporaines...</p>` },
    { id:10, title:"Événement 1999", date:"1999", category:"Documentaire", excerpt:"Événement marquant en 1999", content:`<p>Détails...</p>` },
    { id:11, title:"Publication 1975", date:"1975", category:"Publication", excerpt:"Publication importante.", content:`<p>Détails...</p>` },
    { id:12, title:"Archive 1968", date:"1968", category:"Photo", excerpt:"Photographie d'époque.", content:`<p>Détails...</p>` },
    { id:13, title:"Rencontre 1989", date:"1989", category:"Interview", excerpt:"Rencontre mémorable.", content:`<p>Détails...</p>` },
    { id:14, title:"Réforme 1992", date:"1992", category:"Publication", excerpt:"Réforme majeure.", content:`<p>Détails...</p>` },
    { id:15, title:"Témoignage 1978", date:"1978", category:"Témoignage", excerpt:"Récit...", content:`<p>Détails...</p>` },
    { id:16, title:"Article 2015", date:"2015", category:"Publication", excerpt:"Article récent.", content:`<p>Détails...</p>` },
    { id:17, title:"Reportage 2001", date:"2001", category:"Reportage", excerpt:"Reportage local.", content:`<p>Détails...</p>` },
    { id:18, title:"Enquête 1984", date:"1984", category:"Documentaire", excerpt:"Enquête approfondie.", content:`<p>Détails...</p>` },
    { id:19, title:"Mémoire 1971", date:"1971", category:"Histoire", excerpt:"Mémoire et archives.", content:`<p>Détails...</p>` },
    { id:20, title:"Article 1960", date:"1960", category:"Publication", excerpt:"Article d'époque.", content:`<p>Détails...</p>` }
  ];

  const categories = ["Toutes catégories", ...Array.from(new Set(ARTICLES.map(a=>a.category)))];

  const articlesEl = document.getElementById('articles');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const clearBtn = document.getElementById('clearBtn');
  const toggleViewBtn = document.getElementById('toggleViewBtn');

  const listView = document.getElementById('listView');
  const bookView = document.getElementById('bookView');
  const bookEl = document.getElementById('book');
  const pageIndicator = document.getElementById('pageIndicator');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');

  const modal = document.getElementById('articleModal');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalDate = document.getElementById('modalDate');
  const modalCategory = document.getElementById('modalCategory');
  const modalContent = document.getElementById('modalContent');
  const modalFigure = document.getElementById('modalFigure');

  function initCategories(){
    categorySelect.innerHTML = '';
    const optAll = document.createElement('option'); optAll.value='all'; optAll.textContent='Toutes catégories';
    categorySelect.appendChild(optAll);
    categories.slice(1).forEach(cat=>{
      const o = document.createElement('option'); o.value = cat; o.textContent = cat; categorySelect.appendChild(o);
    });
  }

  function renderList(list){
    articlesEl.innerHTML = '';
    if(!list || list.length === 0){
      articlesEl.innerHTML = `<div style="color:rgba(242,234,223,0.85);padding:18px">Aucun article trouvé.</div>`;
      return;
    }
    list.forEach((a, idx)=>{
      const el = document.createElement('article');
      el.className = 'article' + (idx===0 ? ' featured' : '');
      el.innerHTML = `
        <div class="kicker">${a.date} — ${a.category}</div>
        <h3>${escapeHtml(a.title)}</h3>
        <div class="meta">Archives · ${a.date}</div>
        <div class="article-figure" aria-hidden="true"></div>
        <p class="excerpt">${escapeHtml(a.excerpt)}</p>
        <button class="readBtn" data-id="${a.id}">Lire l'article</button>
      `;
      articlesEl.appendChild(el);
    });
    articlesEl.querySelectorAll('.readBtn').forEach(btn=>{
      btn.addEventListener('click', ()=> openArticle(parseInt(btn.getAttribute('data-id'),10)));
    });
  }

  let sheets = [];
  let currentSheetIndex = 0;

  function buildBook(list){
    bookEl.innerHTML = '';
    sheets = [];
    const pairs = [];
    for(let i=0;i<list.length;i+=2){
      pairs.push([list[i], list[i+1] || null]);
    }
    for(let s = pairs.length-1; s>=0; s--){
      const pair = pairs[s];
      const sheet = document.createElement('div');
      sheet.className = 'sheet';
      sheet.setAttribute('data-index', s);
      sheet.innerHTML = `
        <div class="front">
          <div class="left page"><div class="page-inner">${renderSmallArticle(pair[0])}</div></div>
          <div class="right page"><div class="page-inner">${renderSmallArticle(pair[1])}</div></div>
        </div>
      `;
      sheet.querySelectorAll('.readBtn').forEach(b=>{
        b.addEventListener('click', (ev)=>{
          ev.stopPropagation();
          openArticle(parseInt(b.getAttribute('data-id'),10));
        });
      });
      bookEl.appendChild(sheet);
      sheets.push(sheet);
    }
    currentSheetIndex = 0;
    updateBookUI();
  }

  function renderSmallArticle(a){
    if(!a) return `<div style="color:var(--muted)">—</div>`;
    return `<h4>${escapeHtml(a.title)}</h4>
            <div class="meta">${escapeHtml(a.date)} · ${escapeHtml(a.category)}</div>
            <p>${escapeHtml(a.excerpt)}</p>
            <button class="readBtn" data-id="${a.id}">Lire</button>`;
  }

  function updateBookUI(){
    const total = sheets.length;
    pageIndicator.textContent = `${Math.min(currentSheetIndex+1, total)} / ${total || 1}`;
    for(let i=0;i<sheets.length;i++){
      const sheet = sheets[i];
      if(i < currentSheetIndex) sheet.classList.add('flipped');
      else sheet.classList.remove('flipped');
      sheet.style.zIndex = (1000 - i);
    }
    prevPageBtn.disabled = currentSheetIndex === 0;
    nextPageBtn.disabled = currentSheetIndex >= sheets.length;
  }

  function nextSheet(){
    if(currentSheetIndex >= sheets.length) return;
    currentSheetIndex++;
    updateBookUI();
  }
  function prevSheet(){
    if(currentSheetIndex <= 0) return;
    currentSheetIndex--;
    updateBookUI();
  }

  function openArticle(id){
    const a = ARTICLES.find(x=>x.id===id); if(!a) return;
    modalTitle.textContent = a.title;
    modalDate.textContent = a.date;
    modalCategory.textContent = a.category;
    modalContent.innerHTML = a.content;
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }
  function closeModal(){ modal.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; modalContent.innerHTML=''; }

  function applyFilters(){
    const q = (searchInput.value || '').trim().toLowerCase();
    const cat = categorySelect.value;
    const filtered = ARTICLES.filter(a=>{
      const okCat = (cat==='all') || (a.category === cat);
      const okQ = !q || (a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.date.includes(q));
      return okCat && okQ;
    });
    renderList(filtered);
    buildBook(filtered);
  }

  function resetFilters(){ searchInput.value=''; categorySelect.value='all'; applyFilters(); }

  function toggleView(){
    const isBook = !bookView.hidden;
    if(isBook){
      bookView.hidden = true;
      listView.hidden = false;
      toggleViewBtn.textContent = 'Mode Journal';
    } else {
      listView.hidden = true;
      bookView.hidden = false;
      toggleViewBtn.textContent = 'Mode Liste';
      bookEl.focus();
    }
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[c]); }

  initCategories();
  renderList(ARTICLES);
  buildBook(ARTICLES);

  searchInput.addEventListener('input', ()=> applyFilters());
  categorySelect.addEventListener('change', ()=> applyFilters());
  clearBtn.addEventListener('click', ()=> resetFilters());
  toggleViewBtn.addEventListener('click', ()=> toggleView());

  nextPageBtn.addEventListener('click', ()=> nextSheet());
  prevPageBtn.addEventListener('click', ()=> prevSheet());

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (ev)=>{ if(ev.target === modal) closeModal(); });
  window.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(); });

  window.addEventListener('keydown', (ev)=>{
    if(!bookView.hidden){
      if(ev.key === 'ArrowRight') nextSheet();
      if(ev.key === 'ArrowLeft') prevSheet();
    }
  });
})();
