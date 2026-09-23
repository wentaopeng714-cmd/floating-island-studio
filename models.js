import * as THREE from './three.module.js';
import {byId} from './catalog.js';

const matCache = new Map();
function mat(color, extra='') {
  const key=color+extra;
  if(!matCache.has(key)) matCache.set(key,new THREE.MeshStandardMaterial({color,roughness:.94,metalness:0,flatShading:true,transparent:extra==='glass',opacity:extra==='glass'?.72:1,side:extra==='double'?THREE.DoubleSide:THREE.FrontSide}));
  return matCache.get(key);
}
const C={grass:'#5bc6a5',grass2:'#81c796',dirt:'#9b735e',wood:'#98765e',woodLight:'#c49a73',stone:'#8994a8',stoneLight:'#b1bac8',slate:'#5b687e',water:'#7ed8e6',cream:'#f3dfbd',window:'#f5d799',trunk:'#826b59',pine:'#358f81',leaf:'#70ad73',pink:'#eda8bd',snow:'#e4e8eb'};
function mesh(g,geo,color,x=0,y=0,z=0,extra='') {const m=new THREE.Mesh(geo,mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function box(g,w,h,d,color,x=0,y=0,z=0){return mesh(g,new THREE.BoxGeometry(w,h,d),color,x,y,z);}
function cyl(g,rt,rb,h,color,x=0,y=0,z=0,n=8){return mesh(g,new THREE.CylinderGeometry(rt,rb,h,n),color,x,y,z);}
function cone(g,r,h,color,x=0,y=0,z=0,n=7){return mesh(g,new THREE.ConeGeometry(r,h,n),color,x,y,z);}
function ball(g,r,color,x=0,y=0,z=0,n=8){return mesh(g,new THREE.IcosahedronGeometry(r,n===8?1:0),color,x,y,z);}
function plank(g,w,d,color,x=0,z=0,y=.035){return box(g,w,.07,d,color,x,y,z);}
function roof(g,color,y=1.25,r=.8){const m=cone(g,r,.58,color,0,y,0,4);m.rotation.y=Math.PI/4;return m;}
function windowAt(g,x,y,z,w=.17,h=.22){box(g,w,h,.025,C.window,x,y,z);}
function house(g,opt={}){
  const {roofColor='#678bc5',wall=C.cream,scale=1,chimney=false,porch=false}=opt;
  const h=new THREE.Group();g.add(h);h.scale.setScalar(scale);
  box(h,.9,.72,.85,wall,0,.59,0);roof(h,roofColor,1.13,.78);
  box(h,.21,.38,.04,C.wood,0,.38,.45);windowAt(h,-.29,.67,.446);windowAt(h,.29,.67,.446);
  if(chimney){box(h,.16,.48,.16,C.stone,.28,1.23,-.19);box(h,.23,.08,.23,C.stoneLight,.28,1.49,-.19)}
  if(porch){box(h,.58,.07,.28,C.woodLight,0,.23,.59);box(h,.07,.38,.07,C.woodLight,-.26,.43,.63);box(h,.07,.38,.07,C.woodLight,.26,.43,.63)}
}
function tower(g,opt={}){
  const round=opt.round;
  if(round)cyl(g,.37,.43,1.28,C.stone,0,.87,0,8);else box(g,.7,1.28,.7,C.stone,0,.87,0);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;box(g,.14,.26,.14,C.stoneLight,Math.sin(a)*.33,1.59,Math.cos(a)*.33)}
  if(round)cone(g,.58,.58,opt.roof||'#7468ae',0,1.74,0,8);
  else box(g,.86,.1,.86,C.stoneLight,0,1.55,0);
  windowAt(g,0,.94,round?.4:.365,.13,.26);box(g,.17,.39,.035,C.slate,0,.39,round?.41:.37);
}
function pine(g,height=1.55,color=C.pine){cyl(g,.085,.12,.56,C.trunk,0,.3,0,6);cone(g,.43,.72,color,0,.77,0,6);cone(g,.35,.68,color,0,1.12,0,6);cone(g,.27,.62,color,0,1.46,0,6);g.scale.y=height/1.75;}
function tree(g,color=C.leaf,shape='oak'){
  cyl(g,.105,.14,.92,C.trunk,0,.49,0,7);
  if(shape==='willow'){
    ball(g,.56,color,0,1.27,0);for(let i=0;i<9;i++){let a=i*Math.PI*2/9;cone(g,.15,.75,color,Math.cos(a)*.42,.78,Math.sin(a)*.42,5)}
  }else if(shape==='cherry'){
    for(const [x,y,z,r] of [[0,1.34,0,.43],[-.37,1.16,.04,.31],[.29,1.26,.22,.32],[.15,1.18,-.29,.28]])ball(g,r,color,x,y,z);
  }else{ball(g,.55,color,0,1.28,0);ball(g,.31,color,-.36,1.1,.14);ball(g,.3,color,.29,1.46,-.13)}
}
function deterministic(i){return (Math.sin(i*78.233)*43758.5453)%1;}
function shrub(g,colors=[C.leaf]){for(let i=0;i<5;i++){let a=i*2.399,r=.19+.08*(i%2);ball(g,.22+(i%3)*.035,colors[i%colors.length],Math.cos(a)*r,.23,Math.sin(a)*r)}}
function flower(g,color){cyl(g,.015,.02,.28,'#5c9e70',0,.17,0,5);ball(g,.09,color,0,.34,0,0);ball(g,.036,'#f8d77f',0,.39,0,0)}
function surfacePatch(g,color,rx,rz,y=.018){
  const outline=new THREE.Shape();
  for(let i=0;i<12;i++){const a=i*Math.PI*2/12,r=1+.075*Math.sin(i*2.7)+.045*Math.cos(i*4.3),x=Math.cos(a)*rx*r,z=Math.sin(a)*rz*r;if(i===0)outline.moveTo(x,z);else outline.lineTo(x,z)}
  outline.closePath();const geo=new THREE.ShapeGeometry(outline);geo.rotateX(-Math.PI/2);return mesh(g,geo,color,0,y,0,'double');
}
function mountain(g){const rock=cone(g,.78,1.24,'#8996ac',0,.61,0,5);rock.rotation.y=.4;cone(g,.32,.42,C.snow,0,1.16,0,5);cone(g,.34,.75,'#78879e',-.41,.37,.22,5);}
function makeWater(g,kind='pond'){
  surfacePatch(g,C.water,.67,kind==='pond'?.49:.31,.018);
  if(kind==='pond'){for(let i=0;i<3;i++)ball(g,.065,'#eff8df',-.25+i*.21,.044,.07+i*.045,0)}
}
function makeTerrain(g,id){
  if(id==='sand'){surfacePatch(g,'#e9bd87',.72,.63);for(let i=0;i<3;i++)ball(g,.09,'#f3d59e',-.4+i*.33,.07,.25-i*.1,0)}
  else if(id==='pond')makeWater(g);
  else if(id==='hill'){cone(g,.68,.73,'#81bd8b',0,.37,0,7);cone(g,.33,.4,'#9fd0a3',-.22,.61,.05,7)}
  else if(id==='mountain')mountain(g);
  else if(id==='rocks'){for(const [x,z,s] of [[0,0,.43],[-.43,.25,.26],[.38,-.28,.31]]){const m=ball(g,s,C.stone,x,.09+s*.57,z,0);m.scale.y=.75}}
  else if(id==='stream'){surfacePatch(g,C.water,.76,.28);for(const z of [-.33,.33])plank(g,1.25,.035,'#edc890',0,z,.035)}
  else if(id==='path'){for(let i=-1;i<=1;i++)plank(g,.38,.6,i===0?'#d9bd93':'#c6b399',i*.43,0,.04)}
  else if(id==='bridge'){makeWater(g,'stream');for(let i=-3;i<=3;i++)plank(g,.19,.86,i%2?'#b98360':'#ca9470',i*.18,0,.16);for(const z of [-.49,.49]){box(g,1.3,.06,.06,C.wood,0,.4,z);for(const x of [-.58,0,.58])box(g,.055,.3,.055,C.wood,x,.28,z)}}
  else if(id==='flowerfield'){for(let i=0;i<11;i++){let x=(i%4-.5*3)*.33,z=(Math.floor(i/4)-1)*.35;const f=new THREE.Group();f.position.set(x,0,z);g.add(f);flower(f,['#ec9aaf','#f5ca83','#ae9bd2'][i%3])}}
  else if(id==='cliff'){cyl(g,.63,.78,.51,'#849591',0,.25,0,9);cyl(g,.64,.66,.08,C.grass,0,.55,0,9);for(let i=0;i<3;i++)box(g,.11,.34,.03,'#657e80',-.32+i*.31,.25,.7)}
  else if(id==='islet'){cyl(g,.74,.83,.35,C.dirt,0,.18,0,8);cyl(g,.74,.74,.1,C.grass,0,.4,0,8);const p=new THREE.Group();g.add(p);p.position.set(.12,.45,-.08);pine(p,.85)}
}
function makeBuilding(g,id){
  if(['cottage','redhouse','farmhouse','cabin'].includes(id))house(g,{roofColor:({cottage:'#6388cc',redhouse:'#d97568',farmhouse:'#ab9561',cabin:'#81715e'})[id],wall:id==='cabin'?'#ba946d':C.cream,chimney:id!=='cottage',porch:id==='farmhouse'});
  else if(id==='barn'){box(g,1.08,.9,.93,'#b8675d',0,.68,0);roof(g,'#755e62',1.39,.9);box(g,.36,.55,.04,'#f4d8b0',0,.47,.49);box(g,.33,.04,.06,'#b8675d',0,.54,.54)}
  else if(id==='windmill'){house(g,{roofColor:'#6888b7',scale:.88});const hub=new THREE.Group();hub.position.set(0,1.03,.6);g.add(hub);cyl(hub,.12,.12,.12,C.woodLight,0,0,0,8).rotation.x=Math.PI/2;for(let i=0;i<4;i++){let blade=box(hub,.12,.57,.035,'#e6d8b7',0,.41,.04);blade.rotation.z=i*Math.PI/2;blade.position.set(-Math.sin(i*Math.PI/2)*.41,Math.cos(i*Math.PI/2)*.41,.04)}g.userData.rotor=hub;}
  else if(id==='watermill'){house(g,{roofColor:'#8274ad',scale:.88});const wheel=new THREE.Group();wheel.position.set(.61,.46,.12);wheel.rotation.y=Math.PI/2;g.add(wheel);cyl(wheel,.42,.42,.08,C.wood,0,0,0,12).rotation.x=Math.PI/2;cyl(wheel,.3,.3,.1,C.water,0,0,.06,12).rotation.x=Math.PI/2;for(let i=0;i<8;i++){let a=i*Math.PI/4;box(wheel,.08,.24,.08,C.woodLight,Math.cos(a)*.34,Math.sin(a)*.34,.12).rotation.z=-a}g.userData.rotor=wheel;}
  else if(id==='watchtower')tower(g);
  else if(id==='roundtower')tower(g,{round:true,roof:'#7167a6'});
  else if(id==='castle'){box(g,1.08,.88,.83,C.stone,0,.64,0);for(const x of [-.52,.52])for(const z of [-.39,.39]){cyl(g,.21,.24,1.2,'#8792a6',x,.78,z,7);cone(g,.31,.42,'#7770ae',x,1.59,z,7)}box(g,.3,.46,.04,C.slate,0,.37,.43);for(const x of [-.34,.34])windowAt(g,x,.78,.43,.11,.18)}
  else if(id==='gate'){for(const x of [-.5,.5]){box(g,.38,1.1,.52,C.stone,x,.75,0);box(g,.48,.1,.62,C.stoneLight,x,1.34,0)}box(g,1.25,.31,.53,C.stone,0,1.12,0);}
  else if(id==='chapel'){box(g,.8,.85,1.1,'#d8c8b4',0,.67,0);roof(g,'#927bad',1.33,.82);box(g,.08,.47,.08,C.wood,0,1.68,0);box(g,.29,.08,.08,C.wood,0,1.78,0);box(g,.22,.39,.035,C.wood,0,.4,.566)}
  else if(id==='greenhouse'){box(g,1.12,.7,1.05,'#79b6b3',0,.63,0);for(const x of [-.36,0,.36])box(g,.04,.7,1.07,'#e4e6c8',x,.63,0);for(const z of [-.34,.34])box(g,1.12,.04,.04,'#e4e6c8',0,.62,z);roof(g,'#b5ddd2',1.2,.83)}
  else if(id==='market'){for(const x of [-.54,.54])for(const z of [-.4,.4])box(g,.07,.84,.07,C.wood,x,.68,z);box(g,1.28,.1,1.02,'#e99973',0,1.14,0);for(let i=0;i<5;i++)box(g,.16,.035,1.03,i%2?'#fff1cf':'#d77973',-.48+i*.24,1.21,0);box(g,.88,.15,.38,C.wood,0,.61,.09)}
  else if(id==='bakery'){house(g,{roofColor:'#cf9875',wall:'#e9c9a2',chimney:true});for(let i=0;i<3;i++)ball(g,.09,'#e9b56b',-.23+i*.23,.26,.68,0)}
  else if(id==='smithy'){house(g,{roofColor:'#6e7890',wall:'#a49c91',chimney:true});box(g,.37,.08,.32,'#6f7681',.48,.31,.49);box(g,.15,.22,.17,C.slate,.48,.44,.49)}
  else if(id==='library'){box(g,1.16,.98,.95,'#c7b7a8',0,.74,0);roof(g,'#8c76ad',1.48,.92);for(const x of [-.42,.42]){cyl(g,.08,.08,.8,C.cream,x,.7,.52,8);windowAt(g,x,.83,.482,.16,.29)}box(g,.23,.45,.04,C.wood,0,.43,.49)}
  else if(id==='lighthouse'){cyl(g,.3,.42,1.48,'#eee2d2',0,.91,0,8);cyl(g,.36,.36,.12,'#d87c6f',0,.57,0,8);cyl(g,.32,.32,.12,'#d87c6f',0,1.3,0,8);cyl(g,.35,.35,.3,'#f2d084',0,1.79,0,8);cone(g,.48,.34,'#a57572',0,2.11,0,8)}
  else if(id==='pagoda'){cyl(g,.54,.59,.18,C.stone,0,.31,0,8);for(let i=0;i<3;i++){let y=.38+i*.48;box(g,.6-i*.1,.37,.6-i*.1,'#d0b39b',0,y+.18,0);let r=cone(g,.65-i*.08,.26,'#a76668',0,y+.49,0,4);r.rotation.y=Math.PI/4}cone(g,.17,.32,'#a76668',0,1.99,0,4)}
  else if(id==='observatory'){cyl(g,.5,.55,.76,C.stone,0,.63,0,10);let dome=ball(g,.52,'#838fc0',0,1.22,0);dome.scale.y=.58;box(g,.06,.34,.5,C.slate,0,1.43,.25)}
}
function makePlant(g,id){
  if(id==='pine')pine(g);
  else if(id==='tallpine')pine(g,2.13,'#327d77');
  else if(id==='fir'){pine(g,1.78,'#4c9f94');for(let i=0;i<3;i++)ball(g,.065,'#dbe3dc',-.19+i*.19,.72+i*.26,.2,0)}
  else if(id==='forest'){for(const [x,z,s] of [[-.37,-.27,.75],[.33,-.17,.84],[.03,.35,.63]]){let p=new THREE.Group();p.position.set(x,0,z);g.add(p);pine(p,1.58*s,iColor(x))}}
  else if(id==='oak')tree(g);
  else if(id==='autumnoak')tree(g,'#d99462');
  else if(id==='cherry')tree(g,C.pink,'cherry');
  else if(id==='willow')tree(g,'#91bb73','willow');
  else if(id==='palm'){cyl(g,.09,.13,1.33,'#a58561',0,.68,0,7);for(let i=0;i<7;i++){let a=i*Math.PI*2/7;const leaf=cone(g,.17,.92,'#5cac82',Math.cos(a)*.32,1.38,Math.sin(a)*.32,5);leaf.rotation.z=Math.sin(a)*.6;leaf.rotation.x=-Math.cos(a)*.6}}
  else if(id==='bamboo'){for(let i=0;i<6;i++){let a=i*2.4,r=.2+(i%2)*.12,x=Math.cos(a)*r,z=Math.sin(a)*r,h=1.1+i%3*.23;cyl(g,.038,.05,h,'#7db57b',x,h/2,z,6);for(let j=1;j<4;j++){box(g,.11,.07,.04,'#4e9877',x+.06,h*j/4,z).rotation.z=.4}}}
  else if(id==='cypress'){cyl(g,.08,.1,.45,C.trunk,0,.24,0,6);cone(g,.3,1.64,'#467f70',0,1.09,0,8)}
  else if(id==='bush')shrub(g);
  else if(id==='hedge'){for(let i=-1;i<=1;i++){let h=new THREE.Group();h.position.x=i*.33;g.add(h);shrub(h,['#579d79','#65ab83'])}}
  else if(id==='flowers'||id==='lavender'){for(let i=0;i<9;i++){let f=new THREE.Group(),a=i*2.399,r=.1+.085*(i%3);f.position.set(Math.cos(a)*r,0,Math.sin(a)*r);g.add(f);flower(f,id==='lavender'?['#ad93d0','#8f78bc'][i%2]:['#ef9ab0','#f2c785','#e9e2c4'][i%3])}}
  else if(id==='mushrooms'){for(let i=0;i<4;i++){let a=i*2.2,r=i*.12;box(g,.08,.23,.08,'#f0dfc5',Math.cos(a)*r,.14,Math.sin(a)*r);cone(g,.2,.19,['#ce786f','#e8ad79'][i%2],Math.cos(a)*r,.33,Math.sin(a)*r,7)}}
  else if(id==='cactus'){cyl(g,.16,.18,.91,'#5caa83',0,.48,0,8);cyl(g,.11,.12,.43,'#5caa83',-.3,.57,0,7);cyl(g,.11,.12,.31,'#5caa83',.3,.45,0,7);box(g,.35,.11,.11,'#5caa83',-.18,.38,0);box(g,.31,.11,.11,'#5caa83',.18,.29,0)}
  else if(id==='reeds'){for(let i=0;i<10;i++){let a=i*2.39,r=.15+(i%3)*.1,x=Math.cos(a)*r,z=Math.sin(a)*r;box(g,.026,.75,.026,'#a2b982',x,.39,z);ball(g,.055,'#9c8069',x,.77,z,0)}}
}
function iColor(x){return x>0?'#4c9b88':'#348f80'}
function makeDetail(g,id){
  if(id==='bench'){for(const x of [-.43,.43]){box(g,.09,.45,.09,C.wood,x,.23,-.22);box(g,.09,.3,.09,C.wood,x,.15,.22)}box(g,1.03,.12,.46,C.woodLight,0,.49,0);box(g,1.03,.43,.1,C.woodLight,0,.71,-.22)}
  else if(id==='lantern'){cyl(g,.05,.07,1.18,C.slate,0,.6,0,8);box(g,.31,.31,.31,'#f6cc84',0,1.31,0);cone(g,.29,.23,C.slate,0,1.59,0,4);ball(g,.14,'#ffe2a2',0,1.31,.16,0)}
  else if(id==='well'){cyl(g,.47,.47,.53,C.stone,0,.3,0,10);cyl(g,.34,.34,.02,'#4d8899',0,.58,0,10);for(const x of [-.4,.4])box(g,.07,.86,.07,C.wood,x,.9,0);roof(g,'#a47669',1.45,.62)}
  else if(id==='fountain'){cyl(g,.58,.58,.18,C.stone,0,.1,0,12);cyl(g,.49,.49,.025,C.water,0,.2,0,12);cyl(g,.13,.16,.6,C.stoneLight,0,.53,0,8);cyl(g,.31,.31,.1,C.stoneLight,0,.83,0,10);ball(g,.15,C.water,0,1.01,0)}
  else if(id==='statue'){box(g,.62,.23,.62,C.stone,0,.12,0);box(g,.4,.69,.4,C.stoneLight,0,.59,0);ball(g,.24,C.stoneLight,0,1.05,0,0);cone(g,.32,.34,C.stoneLight,0,1.38,0,5)}
  else if(id==='fence'){for(const x of [-.62,0,.62]){box(g,.1,.7,.1,C.wood,x,.36,0);cone(g,.1,.18,C.wood,x,.79,0,4)}for(const y of [.32,.58])box(g,1.4,.075,.075,C.woodLight,0,y,0)}
  else if(id==='sign'){cyl(g,.06,.08,1.1,C.wood,0,.56,0,6);box(g,.8,.28,.07,C.woodLight,.22,1.04,0);cone(g,.18,.2,'#c98866',.68,1.04,0,3).rotation.z=-Math.PI/2}
  else if(id==='cart'){box(g,.85,.25,.56,C.woodLight,0,.44,0);for(const x of [-.34,.34])for(const z of [-.34,.34]){const wh=cyl(g,.17,.17,.08,C.slate,x,.23,z,8);wh.rotation.x=Math.PI/2}box(g,.6,.06,.06,C.wood,.72,.39,0);}
  else if(id==='campfire'){for(let i=0;i<6;i++){let a=i*Math.PI/3;ball(g,.13,C.stone,Math.cos(a)*.29,.1,Math.sin(a)*.29,0)}for(let i=0;i<3;i++){let a=i*2.1;const stick=box(g,.1,.55,.1,C.wood,Math.cos(a)*.1,.28,Math.sin(a)*.1);stick.rotation.z=.42*Math.cos(a)}cone(g,.18,.49,'#f4ac65',0,.47,0,5);cone(g,.095,.3,'#ffe094',0,.5,0,5)}
  else if(id==='dock'){for(let i=-3;i<=3;i++)plank(g,.16,1.24,i%2?'#bc8e68':'#ca9b73',i*.18,0,.43);for(const x of [-.61,.61])for(const z of [-.52,.52])box(g,.09,.56,.09,C.wood,x,.26,z)}
}
export function makeModel(id){
  const g=new THREE.Group(),item=byId[id];if(!item||id==='tile')return g;
  if(item.category==='terrain')makeTerrain(g,id);
  else if(item.category==='buildings'){
    makeBuilding(g,id);
    // Existing building dimensions included a 0.22-unit display plinth.
    // Move the model down by that amount without changing saved item coordinates.
    for(const part of g.children)part.position.y-=.22;
  }
  else if(item.category==='plants')makePlant(g,id);
  else makeDetail(g,id);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  return g;
}
