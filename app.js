import * as THREE from './three.module.js';
import {catalog,byId,categories} from './catalog.js';
import {makeModel} from './models.js';
import {createWeather,weatherOptions,normalizeWeather} from './weather.js';
import {createMusic} from './music.js';

const $=s=>document.querySelector(s);
const TILE=1.8, FLOOR=.34, STORE='floating-island-studio-v1';
const wrap=$('#canvasWrap'),catalogEl=$('#catalog'),statsEl=$('#sceneStats'),tipEl=$('#selectedTip');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.93;
wrap.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#233650');
const camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,100);
const hemi=new THREE.HemisphereLight('#efffff','#78848c',1.1);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0d7',2.2);sun.position.set(-6,12,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.bias=-.0006;scene.add(sun);
const fill=new THREE.DirectionalLight('#7ecfe2',.45);fill.position.set(8,7,-10);scene.add(fill);
const root=new THREE.Group();scene.add(root);
const island=new THREE.Group(),river=new THREE.Group(),models=new THREE.Group();root.add(island,river,models);
const selectionRing=new THREE.Mesh(new THREE.TorusGeometry(.82,.022,4,48),new THREE.MeshBasicMaterial({color:'#d8ffe7',transparent:true,opacity:.85,depthTest:false}));selectionRing.rotation.x=Math.PI/2;selectionRing.visible=false;root.add(selectionRing);
const groundMat=new THREE.MeshStandardMaterial({color:'#5ac6a4',roughness:1,flatShading:true,side:THREE.DoubleSide});
const sideMat=new THREE.MeshStandardMaterial({color:'#86685c',roughness:1,flatShading:true,side:THREE.DoubleSide});
const waterMat=new THREE.MeshStandardMaterial({color:'#a4e3e8',roughness:.55,metalness:.04,side:THREE.DoubleSide});
const shoreMat=new THREE.MeshStandardMaterial({color:'#f4b985',roughness:1,side:THREE.DoubleSide});
const blueMat=new THREE.MeshStandardMaterial({color:'#e4f4df',roughness:1,side:THREE.DoubleSide});
const weatherFx=createWeather({scene,sun,hemi,fill,groundMat});
const music=createMusic();
const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-FLOOR);
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),hit=new THREE.Vector3();
let azimuth=.66,elevation=.7,zoom=1,lookX=0,lookZ=0;
let mode='place',active='cottage',category='all',query='',selected=null;
let data,undoStack=[],redoStack=[],toastTimer;

function defaultData(){
  const tiles=[];
  for(let x=-3;x<=3;x++)for(let z=-2;z<=2;z++)if(Math.abs(x)+Math.abs(z)<=5)tiles.push([x,z]);
  tiles.push([-4,0],[4,0],[-3,2],[3,-2],[0,3],[1,3],[-1,-3]);
  const items=[
    ['castle',0,0,0],['roundtower',-1.35,-.85,.3],['watchtower',-3.5,.3,.15],
    ['mountain',1.7,.2,0],['windmill',3.5,1.55,.3],['cottage',2.7,-2.25,-.2],
    ['pine',-2.15,-1.5,0],['tallpine',-1.9,1.3,0],['forest',-.4,1.8,0],
    ['pine',1.2,-1.65,0],['fir',2.65,.9,0],['oak',-3.1,-1.7,0],
    ['bush',-.8,-2.35,0],['rocks',1.9,2.05,0],['flowers',-2.9,1.45,0],
  ].map(([type,x,z,rot],i)=>({id:i+1,type,x,z,rot}));
  return {version:1,tiles,items,nextId:items.length+1,river:true,weather:'sunny'};
}
function validData(v){return v&&Array.isArray(v.tiles)&&Array.isArray(v.items)&&v.tiles.length<500&&v.items.length<1000&&v.tiles.every(t=>Array.isArray(t)&&t.length===2&&t.every(Number.isFinite))&&v.items.every(i=>i&&byId[i.type]&&Number.isFinite(i.x)&&Number.isFinite(i.z)&&Number.isFinite(i.rot));}
try{const saved=JSON.parse(localStorage.getItem(STORE));data=validData(saved)?saved:defaultData()}catch{data=defaultData()}
data.nextId=Math.max(Number.isFinite(data.nextId)?data.nextId:1,...data.items.map(i=>i.id+1));
data.weather=normalizeWeather(data.weather);
function tileKey(x,z){return `${x},${z}`}
function tileSet(){return new Set(data.tiles.map(([x,z])=>tileKey(x,z)))}
function cellAt(x,z){return [Math.round(x/TILE),Math.round(z/TILE)]}
function onTile(x,z){const [a,b]=cellAt(x,z);return tileSet().has(tileKey(a,b))}
function clearGroup(group){for(const child of [...group.children]){group.remove(child);child.traverse(o=>{if(o.geometry)o.geometry.dispose()})}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(data))}catch{} updateStats()}
function checkpoint(){undoStack.push(JSON.stringify(data));if(undoStack.length>50)undoStack.shift();redoStack=[];updateHistory()}
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(data));data=JSON.parse(undoStack.pop());selected=null;rebuild();save();updateHistory();toast('已撤销')}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(data));data=JSON.parse(redoStack.pop());selected=null;rebuild();save();updateHistory();toast('已重做')}
function updateHistory(){$('#undoBtn').disabled=!undoStack.length;$('#redoBtn').disabled=!redoStack.length}

function geoMesh(verts,material){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.computeVertexNormals();const m=new THREE.Mesh(geometry,material);m.receiveShadow=true;m.castShadow=true;return m}
function rebuildIsland(){
  clearGroup(island);const set=tileSet(),top=[],sides=[],bottom=-.27;
  function tri(a,b,c){top.push(...a,...b,...c)}
  function wall(a,b){sides.push(a[0],FLOOR,a[1],b[0],FLOOR,b[1],b[0],bottom,b[1]);sides.push(a[0],FLOOR,a[1],b[0],bottom,b[1],a[0],bottom,a[1])}
  for(const [cx,cz] of data.tiles){
    const x=cx*TILE,z=cz*TILE,h=TILE/2;
    const a=[x-h,FLOOR,z-h],b=[x+h,FLOOR,z-h],c=[x+h,FLOOR,z+h],d=[x-h,FLOOR,z+h];tri(a,c,b);tri(a,d,c);
    if(!set.has(tileKey(cx,cz-1)))wall([x+h,z-h],[x-h,z-h]);
    if(!set.has(tileKey(cx+1,cz)))wall([x+h,z+h],[x+h,z-h]);
    if(!set.has(tileKey(cx,cz+1)))wall([x-h,z+h],[x+h,z+h]);
    if(!set.has(tileKey(cx-1,cz)))wall([x-h,z-h],[x-h,z+h]);
  }
  island.add(geoMesh(top,groundMat),geoMesh(sides,sideMat));
}
function ribbon(points,width,material,y){const v=[];for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length],prev=points[(i-1+points.length)%points.length],next=points[(i+1)%points.length];const tx=next[0]-prev[0],tz=next[1]-prev[1],l=Math.hypot(tx,tz);const nx=-tz/l,nz=tx/l;const ax=p[0]+nx*width/2,az=p[1]+nz*width/2,bx=p[0]-nx*width/2,bz=p[1]-nz*width/2;const tx2=q[0]-points[i][0],tz2=q[1]-points[i][1],ll=Math.hypot(tx2,tz2),nnx=-tz2/ll,nnz=tx2/ll;const cx=q[0]+nnx*width/2,cz=q[1]+nnz*width/2,dx=q[0]-nnx*width/2,dz=q[1]-nnz*width/2;
    const mx=(p[0]+q[0])/2,mz=(p[1]+q[1])/2;if(!onTile(mx,mz))continue;
    v.push(ax,y,az,bx,y,bz,cx,y,cz,bx,y,bz,dx,y,dz,cx,y,cz);
  }return geoMesh(v,material)}
function rebuildRiver(){
  clearGroup(river);if(!data.river)return;
  const points=[];for(let i=0;i<76;i++){let a=i*Math.PI*2/76;let w=1+.035*Math.sin(a*5)+.025*Math.cos(a*9);points.push([Math.cos(a)*4.45*w,Math.sin(a)*2.95*w]);}
  river.add(ribbon(points,.57,shoreMat,FLOOR+.008),ribbon(points,.43,waterMat,FLOOR+.016),ribbon(points,.075,blueMat,FLOOR+.023));
}
function rebuildModels(){
  clearGroup(models);for(const item of data.items){const g=makeModel(item.type);g.position.set(item.x,FLOOR+.016,item.z);g.rotation.y=item.rot;g.userData.itemId=item.id;g.traverse(o=>{if(o.isMesh)o.userData.itemId=item.id});models.add(g)}
  updateSelection();
}
function rebuild(){rebuildIsland();rebuildRiver();rebuildModels();weatherFx.set(data.weather);updateWeatherUI();updateStats()}
function updateStats(){statsEl.textContent=`${data.tiles.length} 个地块 · ${data.items.length} 件作品`;$('#catalogCount').textContent=catalog.length}
function updateSelection(){const item=data.items.find(i=>i.id===selected);tipEl.hidden=!item;tipEl.textContent=item?`已选择：${byId[item.type].name} · 按 R 旋转 / Delete 删除`:'';$('#rotateBtn').disabled=!item;selectionRing.visible=!!item;if(item)selectionRing.position.set(item.x,FLOOR+.06,item.z)}
function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);const aspect=w/h;const view=Math.max(5.3,8.4/aspect)/zoom;camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;camera.updateProjectionMatrix();updateCamera()}
function updateCamera(){const d=18;camera.position.set(lookX+Math.sin(azimuth)*Math.cos(elevation)*d,Math.sin(elevation)*d,lookZ+Math.cos(azimuth)*Math.cos(elevation)*d);camera.lookAt(lookX,0,lookZ);camera.updateMatrixWorld()}
function screenRay(e){const rect=renderer.domElement.getBoundingClientRect();mouse.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(mouse,camera)}
function groundPoint(e){screenRay(e);return raycaster.ray.intersectPlane(plane,hit)?hit.clone():null}
function pickedItem(e){screenRay(e);const hits=raycaster.intersectObjects(models.children,true);return hits.length?hits[0].object.userData.itemId:null}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200)}

function placeAt(p){
  if(active==='tile'){
    const [x,z]=cellAt(p.x,p.z),set=tileSet(),key=tileKey(x,z);
    if(set.has(key)){toast('这里已经有地块了');return}
    if(Math.abs(x)>10||Math.abs(z)>10){toast('请在现有岛屿附近扩建');return}
    if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>set.has(tileKey(x+dx,z+dz)))){toast('请从岛屿边缘开始扩建');return}
    checkpoint();data.tiles.push([x,z]);rebuildIsland();rebuildRiver();save();toast('地块已扩建');return;
  }
  const x=Math.round(p.x/(TILE/4))*(TILE/4),z=Math.round(p.z/(TILE/4))*(TILE/4);
  if(!onTile(x,z)){toast('请点击岛屿地面放置');return}
  checkpoint();const item={id:data.nextId++,type:active,x,z,rot:0};data.items.push(item);selected=item.id;rebuildModels();save();toast(`已放置 ${byId[active].name}`)
}
function eraseAt(e,p){const id=pickedItem(e);if(id){checkpoint();data.items=data.items.filter(i=>i.id!==id);selected=null;rebuildModels();save();toast('物件已删除');return}
  const [x,z]=cellAt(p.x,p.z),set=tileSet(),key=tileKey(x,z);if(!set.has(key))return;
  if(data.tiles.length<=1){toast('至少保留一个地块');return}
  if(data.items.some(i=>{const [a,b]=cellAt(i.x,i.z);return a===x&&b===z})){toast('请先移开或删除地块上的物件');return}
  checkpoint();data.tiles=data.tiles.filter(t=>tileKey(...t)!==key);rebuildIsland();rebuildRiver();save();toast('地块已移除');
}
function rotateSelected(){if(selected===null)return;const item=data.items.find(i=>i.id===selected);if(!item)return;checkpoint();item.rot=(item.rot+Math.PI/4)%(Math.PI*2);rebuildModels();save();toast('已旋转 45°')}
function deleteSelected(){if(selected===null)return;checkpoint();data.items=data.items.filter(i=>i.id!==selected);selected=null;rebuildModels();save();toast('物件已删除')}
function setMode(next){mode=next;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));renderer.domElement.style.cursor=mode==='place'?'crosshair':mode==='erase'?'not-allowed':'grab'}
function setActive(id){active=id;setMode('place');renderCatalog();toast(`已选择 ${byId[id].name}`)}
function renderTabs(){const tabs=$('#categoryTabs');tabs.innerHTML='';for(const c of categories){const b=document.createElement('button');b.innerHTML=`<span>${c.glyph}</span>${c.name}`;b.classList.toggle('active',category===c.id);b.addEventListener('click',()=>{category=c.id;renderTabs();renderCatalog()});tabs.appendChild(b)}}
function renderCatalog(){catalogEl.innerHTML='';const list=catalog.filter(i=>(category==='all'||i.category===category)&&(!query||i.name.includes(query)||i.id.includes(query.toLowerCase())));for(const item of list){const b=document.createElement('button');b.className='item-card'+(active===item.id?' active':'');b.style.setProperty('--item-color',item.color);b.title=item.name;b.innerHTML=`<span class="item-icon">${item.glyph}</span><span class="item-name">${item.name}</span>`;b.addEventListener('click',()=>setActive(item.id));catalogEl.appendChild(b)}if(!list.length){const d=document.createElement('div');d.style.cssText='color:#99a9b9;font-size:12px;padding:20px;white-space:nowrap';d.textContent='没有找到素材';catalogEl.appendChild(d)}$('#catalogCount').textContent=list.length}
function updateWeatherUI(){const weather=weatherOptions.find(w=>w.id===data.weather)||weatherOptions[0];$('#weatherIcon').textContent=weather.icon;$('#weatherLabel').textContent=weather.name;document.querySelectorAll('#weatherMenu button').forEach(b=>b.classList.toggle('active',b.dataset.weather===weather.id))}
function closeWeatherMenu(){$('#weatherMenu').hidden=true;$('#weatherBtn').setAttribute('aria-expanded','false')}
function renderWeatherMenu(){const menu=$('#weatherMenu');for(const weather of weatherOptions){const b=document.createElement('button');b.dataset.weather=weather.id;b.innerHTML=`<span>${weather.icon}</span>${weather.name}`;b.addEventListener('click',()=>{closeWeatherMenu();if(data.weather===weather.id)return;checkpoint();data.weather=weather.id;weatherFx.set(weather.id);updateWeatherUI();save();toast(`天气已切换为${weather.name}`)});menu.appendChild(b)}updateWeatherUI()}
function updateMusicUI(){const on=music.playing;$('#musicBtn').setAttribute('aria-pressed',String(on));$('#musicBtn').setAttribute('aria-label',on?'关闭背景音乐':'开启背景音乐');$('#musicBtn').title=on?'关闭背景音乐':'开启背景音乐';$('#musicControl').classList.toggle('playing',on)}

const pointers=new Map();let start=null,dragged=false,pinchDistance=null,dragItemId=null,moveStarted=false;
renderer.domElement.addEventListener('pointerdown',e=>{
  renderer.domElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1){start={x:e.clientX,y:e.clientY};dragged=false;moveStarted=false;dragItemId=mode==='select'?pickedItem(e):null;if(dragItemId!==null){selected=dragItemId;updateSelection()}}
  else if(pointers.size===2){dragItemId=null;const a=[...pointers.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);dragged=true}
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchDistance){zoom=Math.max(.55,Math.min(2.4,zoom*d/pinchDistance));resize()}pinchDistance=d;return}
  const dx=e.clientX-prev.x,dy=e.clientY-prev.y;if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)dragged=true;
  if(dragged&&dragItemId!==null){const p=groundPoint(e);if(!p)return;const x=Math.round(p.x/(TILE/4))*(TILE/4),z=Math.round(p.z/(TILE/4))*(TILE/4);if(!onTile(x,z))return;const item=data.items.find(i=>i.id===dragItemId);if(!item||item.x===x&&item.z===z)return;if(!moveStarted){checkpoint();moveStarted=true}item.x=x;item.z=z;const g=models.children.find(g=>g.userData.itemId===dragItemId);if(g)g.position.set(x,FLOOR+.016,z);updateSelection();return}
  if(dragged){azimuth-=dx*.008;elevation=Math.max(.22,Math.min(1.32,elevation+dy*.006));updateCamera()}
});
renderer.domElement.addEventListener('pointerup',e=>{
  const wasSingle=pointers.size===1;pointers.delete(e.pointerId);pinchDistance=null;
  if(moveStarted){save();toast('物件已移动');start=null;dragItemId=null;moveStarted=false;return}
  if(!wasSingle||dragged||!start){start=null;dragItemId=null;return}
  start=null;dragItemId=null;const p=groundPoint(e);if(!p)return;
  if(mode==='place')placeAt(p);else if(mode==='erase')eraseAt(e,p);else {selected=pickedItem(e);updateSelection();if(selected===null)toast('点击物件即可选择')}
});
renderer.domElement.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);if(moveStarted)save();start=null;pinchDistance=null;dragItemId=null;moveStarted=false});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.4,zoom*(e.deltaY>0?.91:1.09)));resize()},{passive:false});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('#rotateBtn').addEventListener('click',rotateSelected);$('#undoBtn').addEventListener('click',undo);$('#redoBtn').addEventListener('click',redo);
$('#searchInput').addEventListener('input',e=>{query=e.target.value.trim();renderCatalog()});
$('#weatherBtn').addEventListener('click',()=>{const menu=$('#weatherMenu');menu.hidden=!menu.hidden;$('#weatherBtn').setAttribute('aria-expanded',String(!menu.hidden))});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.weather-control'))closeWeatherMenu()});
$('#musicBtn').addEventListener('click',async()=>{try{if(music.playing){await music.stop();toast('背景音乐已关闭')}else{await music.start();toast('背景音乐已开启')}updateMusicUI()}catch(err){toast(err.message||'音频启动失败')}});
$('#musicVolume').addEventListener('input',e=>{const n=Number(e.target.value);music.setVolume(n/100);try{localStorage.setItem('floating-island-music-volume',String(n))}catch{}});
$('#zoomIn').addEventListener('click',()=>{zoom=Math.min(2.4,zoom*1.18);resize()});$('#zoomOut').addEventListener('click',()=>{zoom=Math.max(.55,zoom/1.18);resize()});$('#resetView').addEventListener('click',()=>{azimuth=.66;elevation=.7;zoom=1;lookX=0;lookZ=0;resize()});
$('#newBtn').addEventListener('click',()=>{if(!confirm('新建场景？当前作品已自动保存，可先导出备份。'))return;checkpoint();data={version:1,tiles:[[0,0]],items:[],nextId:1,river:false,weather:'sunny'};selected=null;rebuild();save();toast('空白浮岛已创建')});
$('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});download(URL.createObjectURL(blob),`浮岛场景-${new Date().toISOString().slice(0,10)}.json`);toast('场景文件已导出')});
$('#importBtn').addEventListener('click',()=>$('#importInput').click());
$('#importInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=JSON.parse(await file.text());if(!validData(incoming))throw Error('格式不正确');checkpoint();data=incoming;data.nextId=Math.max(Number.isFinite(data.nextId)?data.nextId:1,...data.items.map(i=>i.id+1));data.weather=normalizeWeather(data.weather);selected=null;rebuild();save();toast('场景已导入')}catch(err){toast(`导入失败：${err.message}`)}e.target.value=''});
$('#shotBtn').addEventListener('click',()=>{renderer.render(scene,camera);download(renderer.domElement.toDataURL('image/png'),`浮岛作品-${new Date().toISOString().slice(0,10)}.png`);toast('图片已导出')});
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),5000)}
const dialog=$('#helpDialog');$('#helpBtn').addEventListener('click',()=>dialog.showModal());$('#closeHelp').addEventListener('click',()=>dialog.close());$('#startBtn').addEventListener('click',()=>dialog.close());
document.addEventListener('keydown',e=>{if(e.target.matches('input')||dialog.open)return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}if(e.key==='1')setMode('place');if(e.key==='2')setMode('select');if(e.key==='3')setMode('erase');if(e.key.toLowerCase()==='r')rotateSelected();if(e.key==='Delete'||e.key==='Backspace')deleteSelected();if(e.key==='Escape'){if(!$('#weatherMenu').hidden){closeWeatherMenu();return}selected=null;updateSelection();setMode('select')}});
try{const savedVolume=Number(localStorage.getItem('floating-island-music-volume'));if(savedVolume>=0&&savedVolume<=100&&localStorage.getItem('floating-island-music-volume')!==null){$('#musicVolume').value=String(savedVolume);music.setVolume(savedVolume/100)}}catch{}
new ResizeObserver(resize).observe(wrap);renderTabs();renderCatalog();renderWeatherMenu();rebuild();updateHistory();updateMusicUI();resize();setMode('place');
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);const delta=clock.getDelta(),t=clock.elapsedTime;for(const g of models.children){if(g.userData.rotor){g.userData.rotor.rotation.z=t*.7}}weatherFx.update(t,delta);renderer.render(scene,camera)}frame();
