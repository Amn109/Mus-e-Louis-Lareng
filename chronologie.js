(function(){
  const EVENTS = [
    { id:'e1', year:1956, title:"Création du SAMU", type:'documentaire', short:"Mise en place d'une structure d'urgence", media:[] },
    { id:'e2', year:1960, title:"Premières expérimentations", type:'publication', short:"Tests locaux et retours initiaux", media:[] },
    { id:'e3', year:1964, title:"Publication clé 1964", type:'publication', short:"Article fondateur sur l'organisation", media:[] },
    { id:'e4', year:1970, title:"Déploiement pilote régional", type:'reportage', short:"Expérimentations et adaptations", media:[] },
    { id:'e5', year:1972, title:"Interview 1972", type:'interview', short:"Témoignage audio d'époque", media:['videos/sample1.mp4'] },
    { id:'e6', year:1975, title:"Premières formations", type:'publication', short:"Création de modules pédagogiques", media:[] },
    { id:'e7', year:1981, title:"Reportage 1981", type:'documentaire', short:"Reportage illustrant les équipes", media:['videos/sample2.mp4'] },
    { id:'e8', year:1984, title:"Enquête nationale", type:'documentaire', short:"Analyse des pratiques et résultats", media:[] },
    { id:'e9', year:1986, title:"Publications académiques", type:'publication', short:"Articles et synthèses", media:[] },
    { id:'e10', year:1990, title:"Généralisation du dispositif", type:'publication', short:"Adoption régionale et nationale", media:[] },
    { id:'e11', year:1995, title:"Témoignages associés", type:'temoignage', short:"Récits de praticiens et patients", media:[] },
    { id:'e12', year:1999, title:"Evénement marquant 1999", type:'documentaire', short:"Moment clé pour l'organisation", media:[] },
    { id:'e13', year:2000, title:"Interview 2000", type:'interview', short:"Entretien avec une figure centrale", media:['videos/sample3.mp4'] },
    { id:'e14', year:2001, title:"Reportage 2001", type:'reportage', short:"Reportage local", media:[] },
    { id:'e15', year:2004, title:"Nouvelles pratiques (2004)", type:'publication', short:"Mise à jour des procédures", media:[] },
    { id:'e16', year:2008, title:"Étude nationale", type:'publication', short:"Résultats et recommandations", media:[] },
    { id:'e17', year:2010, title:"Archive 2010", type:'photo', short:"Sélection photographique", media:['images/sample.jpg'] },
    { id:'e18', year:2015, title:"Article 2015", type:'publication', short:"Article récent", media:[] },
    { id:'e19', year:2018, title:"Réflexions contemporaines", type:'reportage', short:"Adaptation aux nouveaux défis", media:[] },
    { id:'e20', year:2022, title:"Héritage et transmission", type:'réflexion', short:"Bilan et perspectives", media:[] }
  ];

  const canvas = document.getElementById('sceneCanvas');
  const scrubber = document.getElementById('scrubber');
  const scrubLabel = document.getElementById('scrubLabel');
  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  const detailOverlay = document.getElementById('detailOverlay');
  const detailClose = document.getElementById('detailClose');
  const detailTitle = document.getElementById('detailTitle');
  const detailYear = document.getElementById('detailYear');
  const detailText = document.getElementById('detailText');
  const detailVideo = document.getElementById('detailVideo');

  if(!canvas) return;

  const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00142a, 0.0006);

  const camera = new THREE.PerspectiveCamera(50,1,0.1,2000);
  camera.position.set(0, 3.2, 14);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35); scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.7); dir.position.set(10,20,10); scene.add(dir);

  const corridor = { width:20, height:10, depth:28, offsetZ:-6 };

  const floorMat = new THREE.MeshStandardMaterial({color:0xb78551, roughness:0.4, metalness:0.02});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2, corridor.depth*3), floorMat);
  floor.rotation.x = -Math.PI/2; floor.position.set(0,0,corridor.offsetZ - corridor.depth/2 - 2); scene.add(floor);
  for(let i=-corridor.width;i<=corridor.width;i+=0.6){
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,corridor.depth*3), new THREE.MeshStandardMaterial({color:0x8a5f3a}));
    plank.position.set(i,0.01,corridor.offsetZ - corridor.depth/2 - 2); scene.add(plank);
  }

  const farWallZ = corridor.offsetZ - corridor.depth - 10;
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2 + 0.2, corridor.height + 0.4),
    new THREE.MeshStandardMaterial({ color: 0x041e33, roughness:0.95 }));
  backWall.position.set(0, corridor.height/2, farWallZ); scene.add(backWall);

  const loader = new THREE.TextureLoader();
  loader.load('tableau.jpg', tx => {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(5.2,3.2), new THREE.MeshBasicMaterial({map:tx}));
    pm.position.set(0, corridor.height*0.55, farWallZ + 0.9);
    scene.add(pm);
  }, undefined, ()=>{});

  [-8,-4,0,4,8].forEach(x=>{ const s = new THREE.SpotLight(0xffffff,0.28,40,Math.PI/10,0.4,1.6); s.position.set(x,9.2,-2); s.target.position.set(x,3.4,-6); scene.add(s); scene.add(s.target); });

  const panels = [];
  const panelGroup = new THREE.Group();
  panelGroup.position.set(0,0, farWallZ + 0.02);
  scene.add(panelGroup);

  function createPanelTexture(evt, w=1600, h=420){
    const c = document.createElement('canvas'); c.width=w; c.height=h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f6f7f8'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#d6e1ea'; ctx.lineWidth = Math.max(3, w*0.002); ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, w - ctx.lineWidth, h - ctx.lineWidth);
    ctx.fillStyle = '#021937';
    let titleFont = Math.round(h*0.22);
    ctx.font = `700 ${titleFont}px Playfair Display, serif`;
    while(ctx.measureText(evt.title).width > w - 80 && titleFont > 20){
      titleFont = Math.floor(titleFont * 0.92); ctx.font = `700 ${titleFont}px Playfair Display, serif`;
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(evt.title, 36, 28);
    ctx.fillStyle = '#0f6a63'; ctx.font = `600 ${Math.round(h*0.11)}px Inter, sans-serif`; ctx.fillText(String(evt.year), 36, 28 + titleFont + 8);
    ctx.fillStyle = '#021937'; ctx.font = `400 ${Math.round(h*0.09)}px Inter, sans-serif`;
    wrapText(ctx, evt.short, 36, 28 + titleFont + 8 + Math.round(h*0.11) + 8, w-72, Math.round(h*0.095));
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight){
    const words = (text||'').split(' ');
    let line = '';
    for(let n=0;n<words.length;n++){
      const test = line + words[n] + ' ';
      const metrics = ctx.measureText(test);
      if(metrics.width > maxWidth && n > 0){
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if(line) ctx.fillText(line, x, y);
  }

  function makePanel(evt, idx){
    const aspect = 1600/420;
    const worldW = 2.8;
    const worldH = worldW / aspect * (1600/420);
    const tex = createPanelTexture(evt, 1600, 420);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    mat.depthWrite = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH), mat);
    mesh.userData = { idx: idx, evt: evt };
    const frame = new THREE.Mesh(new THREE.BoxGeometry(worldW + 0.06, worldH + 0.06, 0.02), new THREE.MeshStandardMaterial({color:0x071526}));
    frame.position.set(0,0,-0.02);
    const g = new THREE.Group();
    g.add(frame); g.add(mesh);
    return g;
  }

  function clearPanels(){
    while(panelGroup.children.length){
      const c = panelGroup.children[0];
      panelGroup.remove(c);
    }
    panels.length = 0;
  }

  function placePanels(list){
    clearPanels();
    if(!list || list.length === 0) return;
    const columns = 5;
    const rows = Math.ceil(list.length / columns);
    const totalW = corridor.width*2 - 6;
    const colWidth = totalW / columns;
    const startX = -corridor.width + 3 + colWidth/2;
    const startY = corridor.height * 0.78;
    let i = 0;
    for(let r=0;r<rows;r++){
      for(let c=0;c<columns;c++){
        if(i >= list.length) break;
        const evt = list[i];
        const panel = makePanel(evt, i);
        const x = startX + c * colWidth;
        const y = startY - r * (1.2 + 0.6);
        panel.position.set(x, y, 0.02);
        panel.userData = { idx: i };
        panelGroup.add(panel);
        panels.push(panel);
        i++;
      }
    }
    scrubber.max = Math.max(0, panels.length - 1);
    scrubLabel.textContent = panels.length ? `1 / ${panels.length}` : `0 / 0`;
  }

  placePanels(EVENTS);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredPanel = null;

  function setHoverPanel(p){
    if(hoveredPanel && hoveredPanel !== p){
      hoveredPanel.children[1].scale.set(1,1,1);
      hoveredPanel = null; document.body.style.cursor = '';
    }
    if(p && p !== hoveredPanel){
      hoveredPanel = p;
      hoveredPanel.children[1].scale.set(1.03,1.03,1.03);
      document.body.style.cursor = 'pointer';
    }
  }

  function onPointerMove(e){
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const meshes = panels.map(p=>p.children[1]);
    const intersects = raycaster.intersectObjects(meshes, true);
    if(intersects.length > 0){
      let obj = intersects[0].object;
      let parent = obj.parent;
      while(parent && parent.parent !== panelGroup) parent = parent.parent;
      if(parent) setHoverPanel(parent);
      else setHoverPanel(null);
    } else {
      setHoverPanel(null);
    }
  }
  canvas.addEventListener('pointermove', onPointerMove, {passive:true});

  let isCameraAnimating = false;
  function animateCameraTo(targetPos, lookAt, duration = 700, cb){
    if(isCameraAnimating) return;
    const fromPos = camera.position.clone();
    const start = performance.now();
    isCameraAnimating = true;
    function frame(now){
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(fromPos, targetPos, ease);
      camera.lookAt(lookAt);
      if(t < 1) requestAnimationFrame(frame);
      else { isCameraAnimating = false; if(cb) cb(); }
    }
    requestAnimationFrame(frame);
  }

  function onPointerDown(e){
    if(isCameraAnimating) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(panels.map(p=>p.children[1]), true);
    if(intersects.length > 0){
      let mesh = intersects[0].object;
      let grp = mesh.parent;
      while(grp && grp.parent && grp.parent !== panelGroup) grp = grp.parent;
      const worldPos = new THREE.Vector3(); grp.getWorldPosition(worldPos);
      const dir = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
      const targetCam = new THREE.Vector3().copy(worldPos).addScaledVector(dir, 3.2);
      targetCam.y = Math.max(targetCam.y, 2.2);
      const lookAt = worldPos.clone();
      animateCameraTo(targetCam, lookAt, 700, ()=> openDetailForGroup(grp));
    }
  }
  canvas.addEventListener('pointerdown', onPointerDown, {passive:true});

  function openDetailForGroup(grp){
    const idx = grp.userData?.idx ?? 0;
    const evt = EVENTS[idx];
    if(!evt) return;
    detailTitle.innerText = evt.title;
    detailYear.innerText = String(evt.year);
    detailText.innerText = evt.short || '';
    if(evt.media && evt.media.length > 0 && evt.media[0].endsWith('.mp4')){
      detailVideo.style.display = 'block';
      detailVideo.src = evt.media[0];
      detailVideo.play().catch(()=>{});
    } else {
      detailVideo.pause();
      detailVideo.src = '';
      detailVideo.style.display = 'none';
    }
    detailOverlay.setAttribute('aria-hidden','false');
  }
  function closeDetail(){
    detailOverlay.setAttribute('aria-hidden','true');
    detailVideo.pause();
    detailVideo.src = '';
    animateCameraTo(new THREE.Vector3(0,3.2,14), new THREE.Vector3(0, corridor.height*0.55, farWallZ+0.7), 700);
  }
  detailClose.addEventListener('click', closeDetail);
  detailOverlay.addEventListener('click', (ev)=>{ if(ev.target === detailOverlay) closeDetail(); });

  function goToIndex(i){
    i = Math.max(0, Math.min(panels.length -1, i));
    const grp = panels[i];
    if(!grp) return;
    const wpos = new THREE.Vector3(); grp.getWorldPosition(wpos);
    const dir = new THREE.Vector3().subVectors(camera.position, wpos).normalize();
    const targetCam = new THREE.Vector3().copy(wpos).addScaledVector(dir, 5.0);
    targetCam.y = Math.max(targetCam.y, 2.6);
    animateCameraTo(targetCam, wpos, 800);
    scrubber.value = i;
    scrubLabel.textContent = `${i+1} / ${panels.length}`;
  }
  scrubber.addEventListener('input', (e)=>{ goToIndex(parseInt(e.target.value,10)); });

  function applyFilterAndSearch(){
    const filter = filterSelect.value;
    const query = (searchInput.value||'').trim().toLowerCase();
    const filtered = EVENTS.filter((ev)=> {
      const okType = (filter === 'all') || (ev.type === filter);
      const okQuery = !query || (ev.title.toLowerCase().includes(query) || (ev.short && ev.short.toLowerCase().includes(query)) || String(ev.year).includes(query));
      return okType && okQuery;
    });
    placePanels(filtered);
    scrubber.value = 0;
    scrubLabel.textContent = panels.length ? `1 / ${panels.length}` : `0 / 0`;
  }
  filterSelect.addEventListener('change', applyFilterAndSearch);
  searchInput.addEventListener('input', ()=> { applyFilterAndSearch(); });

  let autoplayInterval = null;
  playBtn.addEventListener('click', ()=>{
    if(panels.length === 0) return;
    playBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    let i = 0;
    goToIndex(i);
    autoplayInterval = setInterval(()=>{
      i++;
      if(i >= panels.length){ clearInterval(autoplayInterval); autoplayInterval = null; playBtn.style.display='inline-block'; stopBtn.style.display='none'; return; }
      goToIndex(i);
    }, 2400);
  });
  stopBtn.addEventListener('click', ()=>{
    if(autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = null;
    playBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
  });

  function resizeCanvas(){
    const wrap = document.getElementById('canvasWrap');
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height));
    if(canvas.width !== w || canvas.height !== h){
      renderer.setSize(w,h,false);
      camera.aspect = w/h; camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resizeCanvas, {passive:true});
  resizeCanvas();

  function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
})();
