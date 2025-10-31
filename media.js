(function(){
  const DOOR_COUNT = 6;
  const DOOR_VIDEOS = [
    'videos/video1.mp4',
    'videos/video2.mp4',
    'videos/video3.mp4',
    'videos/video4.mp4',
    'videos/video5.mp4',
    'videos/video6.mp4'
  ];
  const DOOR_LABELS = [
    "Interview 2005",
    "Interview 2008",
    "Interview 2011",
    "Reportage 1999",
    "Témoignage 1995",
    "Documentaire 1988"
  ];

  const QUOTES = [
    "Fondateur du SAMU — une vision pour l'urgence.",
    "Pionnier de la médecine d'urgence en France.",
    "« Sauver une vie, c’est toute une organisation »",
    "Médecin, professeur et homme d’organisation.",
    "Transmission du savoir : sa passion.",
    "Innovation au service du patient.",
    "Humanisme et rigueur clinique.",
    "Un engagement pour l'accessibilité des soins.",
    "Organisation, formation, efficacité.",
    "Héritage pour les générations futures."
  ];

  const canvas = document.getElementById('sceneCanvas');
  const canvasWrap = document.getElementById('canvasWrap');
  const videoModal = document.getElementById('videoModal');
  const mediaPlayer = document.getElementById('mediaPlayer');
  const videoClose = document.getElementById('videoClose');
  const quoteModal = document.getElementById('quoteModal');
  const quoteClose = document.getElementById('quoteClose');
  const quoteContent = document.getElementById('quoteContent');

  if(!canvas) return;

  function isWebGLAvailable(){
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!(window.WebGLRenderingContext && gl && gl.getParameter);
    } catch(e){ return false; }
  }
  if(!isWebGLAvailable()){
    const fallback = document.getElementById('sceneFallback');
    if(fallback) fallback.style.display='block';
    canvas.style.display='none';
    return;
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00142a, 0.00045);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  camera.position.set(0,3.2,14);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35); scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.5); dir.position.set(10,20,10); scene.add(dir);

  const corridor = {width:20, height:10, depth:28, offsetZ:-6};
  const loader = new THREE.TextureLoader();
  const farWallZ = corridor.offsetZ - corridor.depth - 10;

  const floorMat = new THREE.MeshStandardMaterial({color:0xb78551, roughness:0.4, metalness:0.02});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2, corridor.depth*3), floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.position.set(0,0,corridor.offsetZ - corridor.depth/2 - 2);
  scene.add(floor);

  for(let i=-corridor.width;i<=corridor.width;i+=0.6){
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,corridor.depth*3),
      new THREE.MeshStandardMaterial({color:0x8a5f3a, roughness:0.3}));
    plank.position.set(i,0.01,corridor.offsetZ-corridor.depth/2-2);
    scene.add(plank);
  }

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(corridor.depth*3, corridor.height),
    new THREE.MeshStandardMaterial({color:0x071c3a, roughness:0.9}));
  leftWall.rotation.y = Math.PI/2;
  leftWall.position.set(-corridor.width, corridor.height/2, corridor.offsetZ - corridor.depth/2 - 2);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(corridor.depth*3, corridor.height),
    new THREE.MeshStandardMaterial({color:0x1167d6, roughness:0.9}));
  rightWall.rotation.y = -Math.PI/2;
  rightWall.position.set(corridor.width, corridor.height/2, corridor.offsetZ - corridor.depth/2 - 2);
  scene.add(rightWall);

  const backWallMaterial = new THREE.MeshStandardMaterial({ color: 0x041e33, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2 + 0.2, corridor.height + 0.4), backWallMaterial);
  backWall.position.set(0, corridor.height/2, farWallZ);
  scene.add(backWall);

  loader.load('tableau.jpg', tx=>{ const pm = new THREE.Mesh(new THREE.PlaneGeometry(6,4), new THREE.MeshBasicMaterial({map:tx})); pm.position.set(0, corridor.height*0.55, farWallZ + 0.9); pm.scale.setScalar(0.85); scene.add(pm); }, undefined, ()=>{});

  [-8,-4,0,4,8].forEach(x=>{ const s = new THREE.SpotLight(0xffffff, 0.25, 40, Math.PI/10, 0.4, 1.6); s.position.set(x, 9.2, -2); s.target.position.set(x, 3.4, -6); scene.add(s); scene.add(s.target); });

  const doors = [];

  function makePlaqueTexture(text, w=512, h=128){
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1b2328'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#cfd8dc'; ctx.font = '600 '+Math.round(h*0.45)+'px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w/2, h/2);
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate=true; tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function makeTopSignTexture(text, w=1200, h=300){
    const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d');
    ctx.fillStyle = '#f6f5f3'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#c9d7e6'; ctx.lineWidth = Math.max(2, Math.round(w*0.0015));
    ctx.strokeRect(ctx.lineWidth/2,ctx.lineWidth/2,w-ctx.lineWidth,h-ctx.lineWidth);
    ctx.fillStyle = '#021937';
    let fs = Math.round(h*0.42);
    ctx.font = `700 ${fs}px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    while(ctx.measureText(text).width > w*0.88 && fs>10){ fs = Math.floor(fs*0.92); ctx.font = `700 ${fs}px Inter, sans-serif`; }
    ctx.fillText(text, w/2, h/2);
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate=true; tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function makeDoorMesh(index){
    const doorWidth=1.6, doorHeight=2.6, doorDepth=0.08;
    const group=new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth,doorHeight,doorDepth),
      new THREE.MeshStandardMaterial({color:0x22262b, metalness:0.12, roughness:0.45}));
    panel.position.set(0, doorHeight/2, 0); group.add(panel);

    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.16),
      new THREE.MeshBasicMaterial({map: makePlaqueTexture((index+1).toString(),512,128)}));
    plaque.position.set(0, doorHeight*0.55, doorDepth/2 + 0.002); group.add(plaque);

    const sign = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth*1.6, 0.48),
      new THREE.MeshBasicMaterial({map: makeTopSignTexture(DOOR_LABELS[index] || `Doc ${index+1}`, 1200, 300)}));
    sign.position.set(0, doorHeight + 0.32, doorDepth/2 + 0.02); group.add(sign);

    const poleGeo = new THREE.CylinderGeometry(0.03,0.03,0.6,8);
    const poleMat = new THREE.MeshStandardMaterial({color:0x0b0f11});
    const poleL = new THREE.Mesh(poleGeo, poleMat);
    const poleR = new THREE.Mesh(poleGeo, poleMat);
    poleL.position.set(- (doorWidth*1.6)/2 + 0.16, doorHeight + 0.12, doorDepth/2 + 0.02);
    poleR.position.set(  (doorWidth*1.6)/2 - 0.16, doorHeight + 0.12, doorDepth/2 + 0.02);
    group.add(poleL); group.add(poleR);

    group.userData = { index: index, video: DOOR_VIDEOS[index] || null };
    return group;
  }

  function populateDoors(total){
    const leftCount = Math.ceil(total*0.5), rightCount = Math.floor(total*0.5);
    const placeAlongWall = (count, side) => {
      const zStart = corridor.offsetZ - 4, zEnd = corridor.offsetZ - corridor.depth - 6;
      for(let i=0;i<count;i++){
        const t = count === 1 ? 0.5 : i/(count-1);
        const z = zStart + (zEnd - zStart) * t;
        const idx = doors.length;
        const door = makeDoorMesh(idx);
        const x = (side === 'left') ? -corridor.width + 0.02 : corridor.width - 0.02;
        door.rotation.y = (side === 'left') ? Math.PI/2 : -Math.PI/2;
        door.position.set(x, 0, z);
        scene.add(door);
        doors.push(door);
      }
    };
    placeAlongWall(leftCount, 'left');
    placeAlongWall(rightCount, 'right');
  }
  populateDoors(DOOR_COUNT);

  const quotePanels = [];
  const quoteGroup = new THREE.Group();
  quoteGroup.position.set(0,0, farWallZ + 0.02);
  scene.add(quoteGroup);

  function createQuoteTexture(text, w=1400, h=300){
    const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d');
    ctx.fillStyle = '#f6f7f8'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#d6e1ea'; ctx.lineWidth = Math.max(3, Math.round(w*0.0015));
    ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, w-ctx.lineWidth, h-ctx.lineWidth);
    const padding = 36;
    let fontSize = Math.round(h*0.34);
    ctx.font = `700 ${fontSize}px Playfair Display, serif`; ctx.textBaseline='middle';
    while(ctx.measureText(text).width > w - padding*2 && fontSize>18){
      fontSize = Math.floor(fontSize*0.92); ctx.font = `700 ${fontSize}px Playfair Display, serif`;
    }
    const words = text.split(' '); let line = ''; const lines=[];
    for(const word of words){
      const test = line ? (line + ' ' + word) : word;
      if(ctx.measureText(test).width > w - padding*2){ lines.push(line); line = word; } else line = test;
    }
    if(line) lines.push(line);
    const totalH = lines.length * fontSize * 1.08;
    let y = (h - totalH)/2 + fontSize/2;
    ctx.fillStyle = '#021937';
    for(const ln of lines){
      ctx.textAlign = 'left';
      ctx.fillText(ln, padding, y);
      y += fontSize * 1.08;
    }
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate=true; tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function placeQuotes(){
    const columns = 5;
    const rows = Math.ceil(QUOTES.length / columns);
    const totalW = corridor.width*2 - 6;
    const panelW_world = (totalW / columns) * 0.85;
    const panelH_world = 1.2;
    const startY = corridor.height * 0.78;
    let qi = 0;
    for(let r=0;r<rows;r++){
      for(let c=0;c<columns;c++){
        if(qi >= QUOTES.length) break;
        const text = QUOTES[qi];
        const tex = createQuoteTexture(text, 1400, 300);
        const mat = new THREE.MeshBasicMaterial({ map: tex });
        mat.polygonOffset = true; mat.polygonOffsetFactor = 1; mat.polygonOffsetUnits = 1;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(panelW_world, panelH_world), mat);
        const colWidth = totalW / columns;
        const x = -corridor.width + 3 + c * colWidth + colWidth/2;
        const y = startY - r * (panelH_world + 0.6);
        mesh.position.set(x, y, 0.01);
        mesh.userData = { quoteIndex: qi, text: text };
        mesh.renderOrder = 2000;
        quoteGroup.add(mesh);
        quotePanels.push(mesh);
        qi++;
      }
    }
  }
  placeQuotes();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  function setHover(obj){
    if(hovered && hovered !== obj){ hovered.scale.setScalar(1); hovered = null; document.body.style.cursor = ''; }
    if(obj && obj !== hovered){ hovered = obj; hovered.scale.setScalar(1.03); document.body.style.cursor = 'pointer'; }
  }

  function onPointerMove(e){
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const check = [];
    check.push(...doors);
    check.push(...quotePanels);
    const ints = raycaster.intersectObjects(check, true);
    if(ints && ints.length>0){
      let obj = ints[0].object;
      while(obj && !obj.userData?.index && obj.userData?.quoteIndex === undefined) obj = obj.parent;
      if(obj && obj.userData && obj.userData.quoteIndex !== undefined) setHover(obj);
      else if(obj && obj.userData && obj.userData.index !== undefined) setHover(obj);
      else setHover(null);
    } else setHover(null);
  }
  canvas.addEventListener('pointermove', onPointerMove, {passive:true});

  const defaultCamPos = camera.position.clone();
  const defaultCamLook = new THREE.Vector3(0, corridor.height*0.55, farWallZ+0.7);

  let isZooming = false;
  function animateCameraTo(targetPos, lookAtPos, duration = 900, cb){
    if(reduceMotion){ camera.position.copy(targetPos); camera.lookAt(lookAtPos); if(cb) cb(); return; }
    isZooming = true;
    const start = performance.now();
    const fromPos = camera.position.clone();
    const fromLook = new THREE.Vector3(); camera.getWorldDirection(fromLook); fromLook.add(camera.position);
    const targetLook = lookAtPos.clone();
    function frame(now){
      const t = Math.min(1, (now-start)/duration);
      const ease = 1 - Math.pow(1-t,3);
      camera.position.lerpVectors(fromPos, targetPos, ease);
      camera.lookAt(fromLook.clone().lerp(targetLook, ease));
      if(t < 1) requestAnimationFrame(frame);
      else { isZooming = false; if(cb) cb(); }
    }
    requestAnimationFrame(frame);
  }

  function onPointerDown(e){
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hitQuote = raycaster.intersectObjects(quotePanels, true);
    if(hitQuote && hitQuote.length>0){
      let q = hitQuote[0].object;
      while(q && q.userData && q.userData.quoteIndex === undefined) q = q.parent;
      if(q && q.userData && q.userData.quoteIndex !== undefined){
        const quoteIndex = q.userData.quoteIndex;
        const quoteText = q.userData.text || QUOTES[quoteIndex];
        const worldPos = new THREE.Vector3(); q.getWorldPosition(worldPos);
        const dir = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
        const target = new THREE.Vector3().copy(worldPos).addScaledVector(dir, 3.2);
        target.y = Math.max(target.y, 2.2);
        animateCameraTo(target, worldPos, 700, ()=> openQuoteModal(quoteText));
        return;
      }
    }

    const ints = raycaster.intersectObjects(doors, true);
    if(ints && ints.length>0){
      let obj = ints[0].object;
      while(obj && !obj.userData?.index) obj = obj.parent;
      if(!obj) return;
      const data = obj.userData || {};
      const doorIndex = data.index ?? 0;
      const videoUrl = data.video || DOOR_VIDEOS[doorIndex];

      const doorWorldPos = new THREE.Vector3(); obj.getWorldPosition(doorWorldPos);
      const dir = new THREE.Vector3().subVectors(camera.position, doorWorldPos).normalize();
      const targetCamPos = new THREE.Vector3().copy(doorWorldPos).addScaledVector(dir, 3.2);
      targetCamPos.y = Math.max(targetCamPos.y, 2.6);
      const lookAtPos = new THREE.Vector3(doorWorldPos.x, doorWorldPos.y + 1.2, doorWorldPos.z);

      animateCameraTo(targetCamPos, lookAtPos, 850, ()=> openVideoForIndex(doorIndex, videoUrl));
    }
  }
  canvas.addEventListener('pointerdown', onPointerDown, {passive:true});

  function openVideoForIndex(idx, url){
    if(!url){ alert('Aucune vidéo assignée à cette porte.'); return; }
    mediaPlayer.src = url; mediaPlayer.currentTime = 0;
    mediaPlayer.play().catch(()=>{});
    videoModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function closeVideo(){ mediaPlayer.pause(); mediaPlayer.src=''; videoModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; animateCameraTo(defaultCamPos.clone(), defaultCamLook.clone(), 700); }
  videoClose.addEventListener('click', closeVideo);
  window.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape' && videoModal.getAttribute('aria-hidden') === 'false') closeVideo(); });

  function openQuoteModal(text){ quoteContent.innerText = text; quoteModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeQuoteModal(){ quoteModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; animateCameraTo(defaultCamPos.clone(), defaultCamLook.clone(), 700); }
  quoteClose.addEventListener('click', closeQuoteModal);
  quoteModal.addEventListener('click', (ev)=>{ if(ev.target === quoteModal) closeQuoteModal(); });
  window.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape' && quoteModal.getAttribute('aria-hidden') === 'false') closeQuoteModal(); });

  function resizeCanvas(){
    const rect = canvasWrap.getBoundingClientRect();
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height));
    if(canvas.width !== w || canvas.height !== h){
      renderer.setSize(w,h,false);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    }
  }

  let lastPointer = {x:0,y:0};
  function onMove(e){ const wrap = canvas.getBoundingClientRect(); lastPointer.x = ((e.clientX - wrap.left)/wrap.width)*2 - 1; lastPointer.y = -((e.clientY - wrap.top)/wrap.height)*2 + 1; }
  if(!reduceMotion) canvas.addEventListener('pointermove', onMove, {passive:true});

  function animate(){
    requestAnimationFrame(animate);
    if(!reduceMotion && !isZooming){
      const px = lastPointer.x * 0.5, py = lastPointer.y * 0.35;
      camera.position.x += (px - camera.position.x) * 0.03;
      camera.position.y += ((3.0 + py) - camera.position.y) * 0.03;
    }
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resizeCanvas, {passive:true});
  resizeCanvas();
  animate();
  camera.lookAt(0, corridor.height*0.55, farWallZ+0.7);

})();
