(function(){
  const bgCanvas = document.getElementById('bgCanvas');
  const bookRoot = document.getElementById('bookRoot');
  const tpl = document.getElementById('pageTemplate');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const indicator = document.getElementById('indicator');

  const STORAGE_KEY = 'musee_lareng_guestbook_v2';

  function createFormPage(initialData){
    const node = tpl.content.firstElementChild.cloneNode(true);
    const form = node.querySelector('.entryForm');
    const textarea = form.querySelector('.entryText');
    const author = form.querySelector('.author');
    const display = node.querySelector('.display');

    if(initialData && initialData.text){
      renderFinal(display, initialData);
      form.style.display = 'none';
      display.style.display = 'block';
      node.dataset.filled = 'true';
    } else {
      setTimeout(()=> {
        try { textarea.focus(); } catch(e){}
      }, 120);
    }

    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      const txt = textarea.value && textarea.value.trim();
      if(!txt) { textarea.focus(); return; }
      const auth = author.value && author.value.trim();
      const item = { text: txt, author: auth || 'Anonyme', date: new Date().toISOString() };
      renderFinal(display, item);
      form.style.display = 'none';
      display.style.display = 'block';
      node.dataset.filled = 'true';
      saveTestimonial(item);
      const newPg = createFormPage();
      appendPage(newPg, { animate:true, focus:true });
      flipTo(totalPages()-1);
    });

    return node;
  }

  function renderFinal(displayEl, item){
    displayEl.innerHTML = '';
    const p = document.createElement('div'); p.className='text'; p.textContent = item.text;
    const meta = document.createElement('div'); meta.className='meta';
    const d = new Date(item.date);
    meta.textContent = `${item.author} — ${d.toLocaleString()}`;
    displayEl.appendChild(p); displayEl.appendChild(meta);
  }

  const wrapper = document.createElement('div'); wrapper.className='book';
  const stack = document.createElement('div'); stack.className='stack'; wrapper.appendChild(stack);
  bookRoot.appendChild(wrapper);

  const saved = loadSaved();
  if(Array.isArray(saved) && saved.length){
    saved.forEach(it => {
      const pg = createFormPage(it);
      stack.appendChild(pg);
    });
  }
  const blank = createFormPage();
  stack.appendChild(blank);

  function refreshZIndices(){
    const els = Array.from(stack.children);
    els.forEach((el,i)=> el.style.zIndex = (els.length - i) * 10);
  }
  refreshZIndices();

  let currentPage = stack.children.length - 1;
  function totalPages(){ return stack.children.length; }
  function updateIndicator(){
    indicator.textContent = `${currentPage+1} / ${totalPages()}`;
    const pct = totalPages() > 1 ? Math.round(((currentPage+1)/totalPages())*100) : 0;
    indicator.setAttribute('data-progress', String(pct));
  }
  updateIndicator();

  function applyTurns(){
    const els = Array.from(stack.children);
    for(let i=0;i<els.length;i++){
      const el = els[i];
      if(i < currentPage) el.classList.add('turned');
      else el.classList.remove('turned');
    }
  }
  applyTurns();

  let animating = false;
  function flipNext(){
    if(animating) return;
    if(currentPage >= totalPages()-1) return;
    animating = true;
    const els = Array.from(stack.children);
    els[currentPage].classList.add('turned');
    currentPage++;
    updateIndicator();
    setTimeout(()=> animating=false, 520);
  }
  function flipPrev(){
    if(animating) return;
    if(currentPage <= 0) return;
    animating = true;
    const els = Array.from(stack.children);
    const target = currentPage - 1;
    els[target].classList.remove('turned');
    currentPage--;
    updateIndicator();
    setTimeout(()=> animating=false, 520);
  }

  function flipTo(idx){
    idx = Math.max(0, Math.min(idx, totalPages()-1));
    currentPage = idx;
    applyTurns();
    updateIndicator();
  }

  function appendPage(pageEl, opts = {}){
    pageEl.classList.remove('added');
    stack.appendChild(pageEl);
    refreshZIndices();
    if(opts.animate){
      void pageEl.offsetWidth;
      pageEl.classList.add('added');
      setTimeout(()=> pageEl.classList.remove('added'), 700);
    }
    currentPage = totalPages() - 1;
    applyTurns(); updateIndicator();
    if(opts.focus){
      const ta = pageEl.querySelector('.entryText');
      if(ta) setTimeout(()=> ta.focus(), 120);
    }
  }

  nextBtn.addEventListener('click', flipNext);
  prevBtn.addEventListener('click', flipPrev);
  window.addEventListener('keydown', (e)=>{ if(e.key==='ArrowRight') flipNext(); if(e.key==='ArrowLeft') flipPrev(); });

  let sx=0, st=0;
  bookRoot.addEventListener('touchstart', (e)=>{ if(e.touches.length===1){ sx=e.touches[0].clientX; st=Date.now(); } }, {passive:true});
  bookRoot.addEventListener('touchend', (e)=>{ const dx = e.changedTouches[0].clientX - sx; const dt = Date.now()-st; if(Math.abs(dx)>40 && dt<700){ dx<0 ? flipNext() : flipPrev(); } }, {passive:true});

  function loadSaved(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch(e){ return []; }
  }
  function saveTestimonial(item){
    try{ const arr = loadSaved(); arr.push(item); localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch(e){}
  }

  (function bgDecor(){
    if(!bgCanvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas:bgCanvas, antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0,6,28);

    function resize(){
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize, {passive:true});
    resize();

    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#002666';
    ctx.fillRect(0,0,c.width,c.height);
    const tx = new THREE.CanvasTexture(c);
    tx.needsUpdate = true;

    const mat = new THREE.MeshBasicMaterial({ map: tx, transparent: false, opacity: 1.0 });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), mat);
    plane.position.set(0, 6, -40);
    scene.add(plane);

    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e)=>{ mx = (e.clientX/window.innerWidth)*2-1; my = (e.clientY/window.innerHeight)*2-1; }, {passive:true});

    (function anim(){
      requestAnimationFrame(anim);
      camera.position.x += (mx*1.5 - camera.position.x) * 0.03;
      camera.position.y += ((-my*1.2 + 6) - camera.position.y) * 0.03;
      camera.lookAt(0,6,-40);
      renderer.render(scene,camera);
    })();
  })();

  window._guestbook = { flipNext, flipPrev, flipTo, appendPage, stack };

})();
