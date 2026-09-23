import * as THREE from './three.module.js';

export const weatherOptions=[
  {id:'sunny',name:'晴朗',icon:'☀'},
  {id:'cloudy',name:'多云',icon:'☁'},
  {id:'rain',name:'小雨',icon:'☂'},
  {id:'snow',name:'飘雪',icon:'❄'},
  {id:'dusk',name:'黄昏',icon:'◒'},
];
const valid=new Set(weatherOptions.map(w=>w.id));
export function normalizeWeather(id){return valid.has(id)?id:'sunny'}

export function createWeather({scene,sun,hemi,fill,groundMat}){
  const cloudGroup=new THREE.Group();scene.add(cloudGroup);
  const clouds=[];
  const cloudMaterial=new THREE.MeshLambertMaterial({color:'#d3dce0',flatShading:true,transparent:true,opacity:.88,depthWrite:false});
  for(let i=0;i<5;i++){
    const cloud=new THREE.Group();cloud.position.set(-7+i*3.3,6.2+(i%2)*.55,-3.5+(i%3)*2.5);
    for(const [x,y,z,s] of [[0,0,0,.77],[-.57,-.12,.05,.55],[.62,-.09,0,.57],[.14,.27,-.08,.6]]){
      const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),cloudMaterial);m.position.set(x,y,z);cloud.add(m);
    }
    cloud.userData.homeX=cloud.position.x;clouds.push(cloud);cloudGroup.add(cloud);
  }
  const particles=new THREE.Group();scene.add(particles);
  let kind='sunny',array=null,geometry=null,particleCount=0;
  const rainMaterial=new THREE.LineBasicMaterial({color:'#a5d8ef',transparent:true,opacity:.64,depthWrite:false});
  const snowMaterial=new THREE.PointsMaterial({color:'#f4f8fc',size:.14,transparent:true,opacity:.88,depthWrite:false,sizeAttenuation:true});
  function clearParticles(){for(const child of [...particles.children]){particles.remove(child);child.geometry.dispose()}geometry=null;array=null;particleCount=0}
  function makeRain(){
    particleCount=290;array=new Float32Array(particleCount*6);
    for(let i=0;i<particleCount;i++){const x=(Math.random()-.5)*17,y=.8+Math.random()*8,z=(Math.random()-.5)*14,j=i*6;array.set([x,y,z,x-.08,y-.34,z-.04],j)}
    geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(array,3).setUsage(THREE.DynamicDrawUsage));particles.add(new THREE.LineSegments(geometry,rainMaterial));
  }
  function makeSnow(){
    particleCount=230;array=new Float32Array(particleCount*3);
    for(let i=0;i<particleCount;i++)array.set([(Math.random()-.5)*17,1+Math.random()*8,(Math.random()-.5)*14],i*3);
    geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(array,3).setUsage(THREE.DynamicDrawUsage));particles.add(new THREE.Points(geometry,snowMaterial));
  }
  function set(next){
    kind=normalizeWeather(next);clearParticles();
    const looks={
      sunny:{sky:'#233650',ground:'#5ac6a4',sun:2.2,hemi:1.1,fill:.45,light:'#fff0d7',clouds:false},
      cloudy:{sky:'#2b3c52',ground:'#58bda2',sun:1.25,hemi:1.2,fill:.45,light:'#e1eaf1',clouds:true},
      rain:{sky:'#1c2d43',ground:'#4eaf9d',sun:.83,hemi:.96,fill:.5,light:'#d7e7ef',clouds:true},
      snow:{sky:'#34455c',ground:'#a2c4b9',sun:1.35,hemi:1.25,fill:.55,light:'#eaf5ff',clouds:true},
      dusk:{sky:'#342c49',ground:'#61b49a',sun:1.65,hemi:.86,fill:.65,light:'#ffbb88',clouds:true},
    };
    const v=looks[kind];scene.background.set(v.sky);groundMat.color.set(v.ground);sun.intensity=v.sun;sun.color.set(v.light);hemi.intensity=v.hemi;fill.intensity=v.fill;cloudGroup.visible=v.clouds;
    cloudMaterial.color.set(kind==='rain'?'#778e9e':kind==='dusk'?'#a99baa':kind==='snow'?'#eef3f3':'#dae3e6');
    sun.position.set(kind==='dusk'?-10:-6,kind==='dusk'?5:12,8);
    if(kind==='rain')makeRain();else if(kind==='snow')makeSnow();
  }
  function update(time,delta){
    if(cloudGroup.visible)for(let i=0;i<clouds.length;i++)clouds[i].position.x=clouds[i].userData.homeX+Math.sin(time*.13+i*.8)*.55;
    if(!array)return;
    if(kind==='rain')for(let i=0;i<particleCount;i++){
      const j=i*6;let x=array[j]-.95*delta,y=array[j+1]-(4.7+i%5*.28)*delta,z=array[j+2];
      if(y<.35){x=(Math.random()-.5)*17;y=8+Math.random()*1.5;z=(Math.random()-.5)*14}
      array.set([x,y,z,x-.08,y-.34,z-.04],j);
    }
    if(kind==='snow')for(let i=0;i<particleCount;i++){
      const j=i*3;array[j]+=(Math.sin(time*.7+i)*.12+.09)*delta;array[j+1]-=(.62+i%4*.12)*delta;
      if(array[j+1]<.32){array[j]=(Math.random()-.5)*17;array[j+1]=8+Math.random();array[j+2]=(Math.random()-.5)*14}
    }
    geometry.attributes.position.needsUpdate=true;
  }
  set('sunny');return {set,update,get current(){return kind}};
}
