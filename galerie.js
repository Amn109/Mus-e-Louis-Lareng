(function(){
  const canvas = document.getElementById('sceneCanvas');
  const canvasWrap = document.getElementById('canvasWrap');
  const loader = new THREE.TextureLoader();

  function hasWebGL(){
    try{
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!(window.WebGLRenderingContext && gl && gl.getParameter);
    } catch(e){ return false; }
  }
  if(!hasWebGL()){
    document.getElementById('sceneFallback').style.display='block';
    canvas.style.display='none';
    return;
  }

  const COLORS = {
    bleu_engagement: 0x002666,
    bleu_transmission: 0x006CFE
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.bleu_engagement, 0.0008);

  const camera = new THREE.PerspectiveCamera(50, 16/9, 0.1, 2000);
  camera.position.set(0,3.2,14);

  const ambient = new THREE.AmbientLight(0xffffff, 0.45); scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(10,20,10); scene.add(dir);

  const corridor = { width:20, height:10, depth:28, offsetZ:-6 };

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2, corridor.depth*3),
    new THREE.MeshLambertMaterial({ color:0xb78551 }));
  floor.rotation.x = -Math.PI/2;
  floor.position.set(0,0,corridor.offsetZ - corridor.depth/2 - 2);
  scene.add(floor);
  for(let i=-corridor.width;i<=corridor.width;i+=0.6){
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,corridor.depth*3),
      new THREE.MeshLambertMaterial({ color:0x8a5f3a }));
    plank.position.set(i,0.01,corridor.offsetZ - corridor.depth/2 - 2);
    scene.add(plank);
  }

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(corridor.depth*3, corridor.height),
    new THREE.MeshLambertMaterial({ color: COLORS.bleu_engagement }));
  leftWall.rotation.y = Math.PI/2;
  leftWall.position.set(-corridor.width, corridor.height/2, corridor.offsetZ - corridor.depth/2 - 2);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(corridor.depth*3, corridor.height),
    new THREE.MeshLambertMaterial({ color: COLORS.bleu_transmission }));
  rightWall.rotation.y = -Math.PI/2;
  rightWall.position.set(corridor.width, corridor.height/2, corridor.offsetZ - corridor.depth/2 - 2);
  scene.add(rightWall);

  const farWall = new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2, corridor.height),
    new THREE.MeshLambertMaterial({ color: COLORS.bleu_transmission }));
  farWall.position.set(0, corridor.height/2, corridor.offsetZ - corridor.depth - 10);
  scene.add(farWall);

  const niche = new THREE.Mesh(new THREE.BoxGeometry(corridor.width*1.2, corridor.height*0.7, 1.4),
    new THREE.MeshLambertMaterial({ color: COLORS.bleu_engagement }));
  niche.position.set(0, corridor.height/2, farWall.position.z + 0.2);
  scene.add(niche);

  function makePlaceholder(w=1200,h=900,txt='Œuvre'){
    const c = document.createElement('canvas'); c.width=w; c.height=h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f3efe7'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#c9b78e'; ctx.fillRect(30,30,w-60,h-60);
    ctx.fillStyle = '#2a2a2a'; ctx.font = '700 48px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(txt, w/2, h/2);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }

  const paintingW = 8, paintingH = 6;
  function createFramedPainting(texture){
    const frameDepth = 0.35;
    const frameOuterW = paintingW * 1.12, frameOuterH = paintingH * 1.12;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a2f23, metalness:0.2, roughness:0.5 });

    const frameBox = new THREE.Mesh(new THREE.BoxGeometry(frameOuterW, frameOuterH, frameDepth), frameMat);
    const backplate = new THREE.Mesh(new THREE.BoxGeometry(frameOuterW*1.18, frameOuterH*1.18, 0.12),
      new THREE.MeshStandardMaterial({ color: COLORS.bleu_engagement, transparent:true, opacity:0.96 }));
    backplate.position.set(0,0,-frameDepth/2 - 0.06);

    const painting = new THREE.Mesh(new THREE.PlaneGeometry(paintingW, paintingH),
      new THREE.MeshBasicMaterial({ map: texture }));
    painting.position.set(0,0,frameDepth/2 + 0.02);

    const bevel = new THREE.Mesh(new THREE.BoxGeometry(paintingW*0.96, paintingH*0.96, 0.05),
      new THREE.MeshLambertMaterial({ color: 0xf2eadf }));
    bevel.position.set(0,0,frameDepth/2 + 0.01);

    const glow = new THREE.Mesh(new THREE.BoxGeometry(frameOuterW*1.04, frameOuterH*1.04, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffe7b5, transparent:true, opacity:0.06, blending:THREE.AdditiveBlending }));
    glow.position.set(0,0,-frameDepth/2 - 0.02);

    const group = new THREE.Group();
    group.add(frameBox, backplate, painting, bevel, glow);
    group.userData = { frameDepth };
    return group;
  }

  const placed = { center: null, left: [], right: [] };

  function placeCenterFrame(g){
    const z = farWall.position.z + 0.9;
    g.position.set(0, corridor.height * 0.60, z);
    scene.add(g);
    placed.center = g;
  }

  function placeLeftFrameAtIndex(g, index, total){
    const frameDepth = g.userData.frameDepth || 0.35;
    const x = leftWall.position.x + (frameDepth/2) + 0.02;
    const baseZ = leftWall.position.z;
    const span = 3.6;
    const step = span / Math.max(1, total-1);
    const z = baseZ - span/2 + index * step;
    g.rotation.y = Math.PI/2;
    g.position.set(x, corridor.height * 0.60, z);
    scene.add(g);
    placed.left.push(g);
  }

  function placeRightFrameAtIndex(g, index, total){
    const frameDepth = g.userData.frameDepth || 0.35;
    const x = rightWall.position.x - (frameDepth/2) - 0.02;
    const baseZ = rightWall.position.z;
    const span = 3.6;
    const step = span / Math.max(1, total-1);
    const z = baseZ - span/2 + index * step;
    g.rotation.y = -Math.PI/2;
    g.position.set(x, corridor.height * 0.60, z);
    scene.add(g);
    placed.right.push(g);
  }

  function loadAndPlace(src, placer, label){
    loader.load(src, tx => {
      const grp = createFramedPainting(tx);
      placer(grp);
    }, undefined, ()=> {
      const tx = makePlaceholder(1200,900, label || 'Œuvre');
      const grp = createFramedPainting(tx);
      placer(grp);
    });
  }

  loadAndPlace('tableau.jpg', placeCenterFrame, 'Central');

  const leftSources = ['tableau_left.jpg', 'tableau_left2.jpg'];
  leftSources.forEach((src, i) => {
    loadAndPlace(src, grp => placeLeftFrameAtIndex(grp, i, leftSources.length), `Gauche ${i+1}`);
  });

  const rightSources = ['tableau_right.jpg', 'tableau_right2.jpg'];
  rightSources.forEach((src, i) => {
    loadAndPlace(src, grp => placeRightFrameAtIndex(grp, i, rightSources.length), `Droite ${i+1}`);
  });

  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isZooming = false;

  function collectPlaneMeshes(){
    const planeMeshes = [];
    if(placed.center){
      const plane = placed.center.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry');
      if(plane) planeMeshes.push({ group: placed.center, plane });
    }
    for(const g of placed.left) {
      const plane = g.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry');
      if(plane) planeMeshes.push({ group: g, plane });
    }
    for(const g of placed.right) {
      const plane = g.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry');
      if(plane) planeMeshes.push({ group: g, plane });
    }
    return planeMeshes;
  }

  function onPointerDown(ev){
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);

    const planeMeshes = collectPlaneMeshes();
    if(planeMeshes.length === 0) return;

    const intersects = ray.intersectObjects(planeMeshes.map(p=>p.plane), true);
    if(!intersects.length) return;
    if(isZooming) return;

    const hit = intersects[0].object;
    const found = planeMeshes.find(p => p.plane === hit);
    if(!found) return;

    const grp = found.group;
    const worldPos = new THREE.Vector3(); grp.getWorldPosition(worldPos);

    const q = new THREE.Quaternion(); grp.getWorldQuaternion(q);
    const normal = new THREE.Vector3(0,0,1).applyQuaternion(q);

    const toCam = new THREE.Vector3().subVectors(camera.position, worldPos);
    if(normal.dot(toCam) < 0) normal.negate();

    const distance = 6.2;
    const targetCam = new THREE.Vector3().copy(worldPos).add(normal.multiplyScalar(distance));
    targetCam.y = Math.max(targetCam.y, corridor.height * 0.95);

    animateCameraTo(targetCam, worldPos);
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive:true });

  function animateCameraTo(targetPos, lookAtPos){
    isZooming = true;
    const from = camera.position.clone();
    const to = targetPos.clone();
    const start = performance.now();
    const duration = 1000;
    (function tick(now){
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(from, to, e);
      camera.lookAt(lookAtPos);
      if(t < 1) requestAnimationFrame(tick);
      else setTimeout(()=> { isZooming = false; }, 80);
    })();
  }

  let lastPointer = { x:0, y:0 };
  function onPointerMove(e){
    const r = canvas.getBoundingClientRect();
    lastPointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    lastPointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }
  if(!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
    canvas.addEventListener('pointermove', onPointerMove, { passive:true });
  }

  function resize(){
    const rect = canvasWrap.getBoundingClientRect();
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height));
    if(canvas.width !== w || canvas.height !== h){
      renderer.setSize(w,h,false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  function animate(){
    requestAnimationFrame(animate);
    if(!isZooming){
      const px = lastPointer.x * 0.8;
      const py = lastPointer.y * 0.6;
      camera.position.x += (px - camera.position.x) * 0.04;
      camera.position.y += ((3.2 + py) - camera.position.y) * 0.04;
      if(placed.center){
        const t = new THREE.Vector3(); placed.center.getWorldPosition(t);
        camera.lookAt(t);
      }
    }
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize, { passive:true });
  function init(){ resize(); animate(); }
  if(document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init,50);
  else window.addEventListener('load', init);

})();
