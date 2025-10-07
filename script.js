(function(){
const canvas=document.getElementById('sceneCanvas')
const enterBtn=document.getElementById('enterBtn')
const visitBtn=document.getElementById('visitBtn')
const learnBtn=document.getElementById('learnBtn')
const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches
const renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true})
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2))
renderer.setClearColor(0x000000,0)
const scene=new THREE.Scene()
scene.fog=new THREE.FogExp2(0x07120f,0.0018)
const camera=new THREE.PerspectiveCamera(50,1,0.1,2000)
camera.position.set(0,3.0,12)
const ambient=new THREE.AmbientLight(0xffffff,0.45)
scene.add(ambient)
const dir=new THREE.DirectionalLight(0xffffff,0.8)
dir.position.set(10,20,10)
scene.add(dir)
const corridor={width:20,height:10,depth:28,offsetZ:-6}
const floorMat=new THREE.MeshLambertMaterial({color:0xb78551})
const floor=new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2,corridor.depth*3),floorMat)
floor.rotation.x=-Math.PI/2
floor.position.set(0,0,corridor.offsetZ-corridor.depth/2-2)
scene.add(floor)
for(let i=-corridor.width*1;i<=corridor.width*1;i+=0.6){
  const plank=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,corridor.depth*3),new THREE.MeshLambertMaterial({color:0x8a5f3a}))
  plank.position.set(i,0.01,corridor.offsetZ-corridor.depth/2-2)
  scene.add(plank)
}
const leftWall=new THREE.Mesh(new THREE.PlaneGeometry(corridor.depth*3,corridor.height),new THREE.MeshLambertMaterial({color:0x0f6a63}))
leftWall.rotation.y=Math.PI/2
leftWall.position.set(-corridor.width,corridor.height/2,corridor.offsetZ-corridor.depth/2-2)
scene.add(leftWall)
const rightWall=new THREE.Mesh(new THREE.PlaneGeometry(corridor.depth*3,corridor.height),new THREE.MeshLambertMaterial({color:0x0e6a5e}))
rightWall.rotation.y=-Math.PI/2
rightWall.position.set(corridor.width,corridor.height/2,corridor.offsetZ-corridor.depth/2-2)
scene.add(rightWall)
const farWall=new THREE.Mesh(new THREE.PlaneGeometry(corridor.width*2,corridor.height),new THREE.MeshLambertMaterial({color:0x0f6a63}))
farWall.position.set(0,corridor.height/2,corridor.offsetZ-corridor.depth-10)
scene.add(farWall)
const niche=new THREE.Mesh(new THREE.BoxGeometry(corridor.width*1.2,corridor.height*0.7,1.4),new THREE.MeshLambertMaterial({color:0x0b4f49}))
niche.position.set(0,corridor.height/2,farWall.position.z+0.8)
scene.add(niche)
const loader=new THREE.TextureLoader()
function makePlaceholder(w=1024,h=800){
  const c=document.createElement('canvas')
  c.width=w;c.height=h
  const ctx=c.getContext('2d')
  ctx.fillStyle='#e9e4d9';ctx.fillRect(0,0,w,h)
  ctx.fillStyle='#c4a57a';ctx.fillRect(w*0.07,h*0.6,w*0.86,h*0.26)
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(w/2,h*0.36,Math.min(w,h)*0.22,0,Math.PI*2);ctx.fill()
  ctx.strokeStyle='#3d271b';ctx.lineWidth=Math.max(8,Math.round(Math.min(w,h)*0.02))
  ctx.strokeRect(ctx.lineWidth/2,ctx.lineWidth/2,w-ctx.lineWidth,h-ctx.lineWidth)
  return new THREE.CanvasTexture(c)
}
const paintingW=8
const paintingH=6
let paintingMesh=null
function createFramedPainting(texture){
  const frameOuterW=paintingW*1.12
  const frameOuterH=paintingH*1.12
  const frameDepth=0.35
  const frameMaterial=new THREE.MeshStandardMaterial({color:0x4a2f23,metalness:0.2,roughness:0.5})
  frameMaterial.depthTest=false
  frameMaterial.depthWrite=false
  const frame=new THREE.Mesh(new THREE.BoxGeometry(frameOuterW,frameOuterH,frameDepth),frameMaterial)
  const frontZ=farWall.position.z+0.9
  frame.position.set(0,corridor.height*0.55,frontZ)
  frame.renderOrder=999
  const backplateGeom=new THREE.BoxGeometry(frameOuterW*1.18,frameOuterH*1.18,0.12)
  const backplateMat=new THREE.MeshStandardMaterial({color:0x0a3b36,metalness:0.05,roughness:0.45,transparent:true,opacity:0.78})
  backplateMat.depthTest=false
  backplateMat.depthWrite=false
  const backplate=new THREE.Mesh(backplateGeom,backplateMat)
  backplate.position.set(0,0,-frameDepth/2-0.06)
  backplate.renderOrder=998
  const innerGeom=new THREE.PlaneGeometry(paintingW,paintingH)
  const mat=new THREE.MeshBasicMaterial({map:texture})
  mat.depthTest=false
  mat.depthWrite=false
  const painting=new THREE.Mesh(innerGeom,mat)
  painting.position.set(0,0,frameDepth/2+0.02)
  painting.renderOrder=1000
  const bevel=new THREE.Mesh(new THREE.BoxGeometry(paintingW*0.96,paintingH*0.96,0.05),new THREE.MeshLambertMaterial({color:0xf2eadf}))
  bevel.position.set(0,0,frameDepth/2+0.01)
  bevel.material.depthTest=false
  bevel.material.depthWrite=false
  const glowGeom=new THREE.BoxGeometry(frameOuterW*1.04,frameOuterH*1.04,0.02)
  const glowMat=new THREE.MeshBasicMaterial({color:0xffe7b5,transparent:true,opacity:0.08,blending:THREE.AdditiveBlending,depthWrite:false})
  glowMat.depthTest=false
  const glow=new THREE.Mesh(glowGeom,glowMat)
  glow.position.set(0,0,-frameDepth/2-0.02)
  glow.renderOrder=997
  frame.add(painting)
  frame.add(bevel)
  frame.add(backplate)
  frame.add(glow)
  return frame
}
loader.load('tableau.jpg',tx=>{
  paintingMesh=createFramedPainting(tx)
  scene.add(paintingMesh)
  addSpotForPainting()
},undefined,()=>{
  const tex=makePlaceholder(1200,900)
  paintingMesh=createFramedPainting(tex)
  scene.add(paintingMesh)
  addSpotForPainting()
})
function addSmallFrame(x,z,url){
  loader.load(url,tx=>{
    const m=new THREE.MeshBasicMaterial({map:tx})
    const sm=new THREE.Mesh(new THREE.PlaneGeometry(2.2,3.0),m)
    sm.position.set(x,corridor.height*0.5,z)
    sm.rotation.y=(x<0)?Math.PI/2-0.08:-Math.PI/2+0.08
    scene.add(sm)
  },undefined,()=>{})
}
addSmallFrame(-corridor.width+0.8,farWall.position.z+6,'portrait1.jpg')
addSmallFrame(corridor.width-0.8,farWall.position.z+10,'portrait2.jpg')
const raycaster=new THREE.Raycaster()
const pointer=new THREE.Vector2()
let isZooming=false
function resizeCanvasToDisplaySize(){
  const wrap=document.getElementById('canvasWrap')||canvas.parentElement
  const rect=wrap.getBoundingClientRect()
  const width=Math.max(10,Math.floor(rect.width))
  const height=Math.max(10,Math.floor(rect.height))
  if(canvas.width!==width||canvas.height!==height){
    renderer.setSize(width,height,false)
    camera.aspect=width/height
    camera.updateProjectionMatrix()
  }
}
function layoutInitialCamera(){
  resizeCanvasToDisplaySize()
  camera.position.set(0,3.2,14)
  camera.lookAt(0,corridor.height*0.55,farWall.position.z+0.7)
}
function onPointerDown(e){
  if(!paintingMesh)return
  const wrap=canvas.getBoundingClientRect()
  pointer.x=((e.clientX-wrap.left)/wrap.width)*2-1
  pointer.y=-((e.clientY-wrap.top)/wrap.height)*2+1
  raycaster.setFromCamera(pointer,camera)
  const intersects=raycaster.intersectObject(paintingMesh,true)
  if(intersects.length>0&&!isZooming){
    const paintPos=new THREE.Vector3()
    paintingMesh.getWorldPosition(paintPos)
    const dir=new THREE.Vector3().subVectors(camera.position,paintPos).normalize()
    const distanceWanted=6.5
    const targetPos=new THREE.Vector3().copy(paintPos).addScaledVector(dir,distanceWanted)
    startZoomTo(targetPos,paintPos)
  }
}
let zoomAnim=null
function startZoomTo(targetCamPos,lookAtPos){
  if(reduceMotion){
    camera.position.copy(targetCamPos)
    camera.lookAt(lookAtPos)
    enterBtn.style.display='inline-block'
    return
  }
  isZooming=true
  const duration=1100
  const start=performance.now()
  const fromPos=camera.position.clone()
  zoomAnim=function frame(now){
    const t=Math.min(1,(now-start)/duration)
    const ease=1-Math.pow(1-t,3)
    camera.position.lerpVectors(fromPos,targetCamPos,ease)
    camera.lookAt(lookAtPos)
    if(t<1){
      requestAnimationFrame(zoomAnim)
    } else {
      isZooming=false
      enterBtn.style.display='inline-block'
    }
  }
  requestAnimationFrame(zoomAnim)
}
let lastPointer={x:0,y:0}
function onPointerMove(e){
  const wrap=canvas.getBoundingClientRect()
  lastPointer.x=((e.clientX-wrap.left)/wrap.width)*2-1
  lastPointer.y=-((e.clientY-wrap.top)/wrap.height)*2+1
}
if(!reduceMotion){
  canvas.addEventListener('pointermove',onPointerMove,{passive:true})
}
function animate(){
  requestAnimationFrame(animate)
  if(!reduceMotion&&!isZooming){
    const px=lastPointer.x*0.8
    const py=lastPointer.y*0.6
    camera.position.x+=(px-camera.position.x)*0.04
    camera.position.y+=((3.2+py)-camera.position.y)*0.04
    if(paintingMesh)camera.lookAt(paintingMesh.position)
  }
  renderer.render(scene,camera)
}
canvas.addEventListener('pointerdown',onPointerDown)
window.addEventListener('resize',()=>{resizeCanvasToDisplaySize()},{passive:true})
visitBtn.addEventListener('click',()=>{
  if(!paintingMesh)return
  const paintPos=new THREE.Vector3();paintingMesh.getWorldPosition(paintPos)
  const dir=new THREE.Vector3().subVectors(camera.position,paintPos).normalize()
  const targetPos=new THREE.Vector3().copy(paintPos).addScaledVector(dir,6.5)
  startZoomTo(targetPos,paintPos)
})
enterBtn.addEventListener('click',()=>{window.location.href='galerie.html'})
learnBtn.addEventListener('click',()=>{alert('En savoir plus — remplacer par page réelle.')})
window.addEventListener('keydown',(e)=>{if(e.key&&e.key.toLowerCase()==='s'){window.location.href='galerie.html'}})
function addSpotForPainting(){
  const spot=new THREE.SpotLight(0xfff1d7,1.2,40,Math.PI/8,0.45,1.6)
  spot.position.set(0,corridor.height*1.2,farWall.position.z+1.8)
  spot.target.position.set(0,corridor.height*0.55,farWall.position.z+0.7)
  scene.add(spot)
  scene.add(spot.target)
  const coneGeom=new THREE.ConeGeometry(6,12,32,1,true)
  const coneMat=new THREE.MeshBasicMaterial({color:0xfff4d9,transparent:true,opacity:0.06,blending:THREE.AdditiveBlending,depthWrite:false})
  const cone=new THREE.Mesh(coneGeom,coneMat)
  cone.position.copy(spot.position)
  cone.rotateX(Math.PI)
  cone.translateZ(-6)
  scene.add(cone)
}
function init(){layoutInitialCamera();resizeCanvasToDisplaySize();animate()}
window.addEventListener('load',init)
if(document.readyState==='complete'||document.readyState==='interactive'){setTimeout(init,50)}
})();
