import {games,createState,act} from './games.js';
import {createWorld} from './world.js';
const grid=document.querySelector('#gameGrid');
for(const g of games){const a=document.createElement('a');a.className='game-card';a.href=`./play.html?game=${g.id}`;a.style.setProperty('--tint',g.color+'55');a.innerHTML=`<div class="card-art"><img alt="${g.name}的低多边形小岛"><span class="card-index">${g.n}</span><span class="card-time">${g.time}</span></div><div class="card-body"><small>${g.en}</small><div class="card-title"><h2>${g.name}</h2><span>↗</span></div><p>${g.intro}</p><div class="card-footer"><span>${g.tag}</span><b>开始试玩 →</b></div></div>`;grid.append(a);}
const temp=document.createElement('div');temp.style.cssText='position:fixed;left:-2000px;top:0;width:580px;height:330px;';document.body.append(temp);
for(const g of games){const s=createState(g.id);
 if(g.id==='town')for(const [type,x,z]of [['bakery',1,-1],['market',-1,1],['redhouse',-2,1],['oak',2,-1]])s.items.push({type,x,z});
 if(g.id==='puzzle')for(const [type,x,z]of [['forest',-1,0],['pond',0,1],['flowers',1,0],['cottage',-1,-1],['hill',1,1],['cottage',0,-1]])s.items.push({type,x,z});
 if(g.id==='train')for(const [x,z]of [[-2,0],[-1,0],[0,0],[0,-1],[0,1],[1,1],[2,1],[3,1]])s.items.push({type:'rail',x,z});
 if(g.id==='garden'){for(const [type,x,z]of [['cherry',-1,-1],['flowers',1,1],['lavender',-1,1],['mushrooms',1,-1],['flowers',2,0],['cherry',-2,0]])s.items.push({type,x,z,age:3,collected:true});s.visitors=['flowers','lavender'];}
 if(g.id==='defense'){for(const [type,x,z]of [['watchtower',-2,0],['roundtower',0,0],['ballista',1,-1],['watchtower',2,-2]])s.items.push({type,x,z});s.enemies=[{id:1,progress:1.2,hp:4,max:4},{id:2,progress:3.5,hp:2,max:4}];}
 try{const world=createWorld(temp,{id:g.id,preview:true});world.rebuild(s);world.scene.background.set(g.color).lerp({r:1,g:1,b:1},.55);world.step(s,1,0);document.querySelectorAll('.card-art img')[games.indexOf(g)].src=world.screenshot();world.dispose();}catch(e){console.error(e);}
}
temp.remove();
