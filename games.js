export const games=[
 {id:'town',n:'01',name:'浮岛小镇',en:'LITTLE TOWN',tag:'建造 · 资源经营',color:'#76bca6',time:'5–8 分钟',intro:'让一座空中小镇，慢慢有了烟火气。',goal:'20 天内达到 12 位居民、80 金币和 12 份食物。',guide:'选择建筑，点击空地建造。推进一天会生产资源，居民每天消耗食物。先种树林和建农场，再扩大住宅。',tools:[['cottage','小屋','10 金 · 4 木｜+2 居民'],['forest','树林','8 金｜每天 +3 木'],['farmhouse','农场','12 金 · 3 木｜每天 +6 食物'],['bakery','面包房','18 金 · 5 木｜每天 2 食物换 12 金'],['market','集市','15 金 · 4 木｜每天 +7 金']],action:'推进一天',caption:'经营自己的天空小镇'},
 {id:'puzzle',n:'02',name:'浮岛拼图',en:'ISLAND MOSAIC',tag:'三选一 · 邻接策略',color:'#e8b882',time:'3–5 分钟',intro:'每一块的邻居，都决定了它的价值。',goal:'放完 14 块拼图，争取达到 140 分。',guide:'从三张牌里选一张，放到已有拼图旁。同类邻接每格 +6 分，异类邻接每格 +2 分，基础 +3 分。完成三个组合目标，各 +15 分。',tools:[],action:null,caption:'用有限的拼图拼出理想岛屿'},
 {id:'train',n:'03',name:'云上小火车',en:'CLOUD EXPRESS',tag:'铺轨 · 路线规划',color:'#89aecd',time:'4–6 分钟',intro:'穿过树林，把岛上的小站连起来。',goal:'给东部小镇和北部农场各送达 4 箱货物。',guide:'选择铁轨，点击空地铺设，上下左右相连即可通车。山和池塘需要绕开。选择目的地后发车，每趟送 2 箱。拆除铁轨可返还材料。',tools:[['rail','铺设铁轨','消耗 1 根轨道'],['erase','拆除铁轨','返还 1 根轨道']],action:'发车送货',caption:'给每一段旅程找到一条路'},
 {id:'garden',n:'04',name:'四季花园',en:'SEASON GARDEN',tag:'种植 · 生物收集',color:'#d6a7c0',time:'4–6 分钟',intro:'种下不同的花，等小客人来拜访。',goal:'收集四种植物的花蜜，吸引四种花园访客。',guide:'种下花丛、薰衣草、樱花或蘑菇。浇水后推进一天会生长；雨天会自动浇水。成熟后用收集工具点击植物，获得访客和种子。',tools:[['flowers','花丛','1 种子｜生长 2 天'],['lavender','薰衣草','2 种子｜生长 2 天'],['cherry','樱花树','3 种子｜生长 3 天'],['mushrooms','蘑菇','1 种子｜生长 2 天'],['water','浇水','每株消耗 1 水'],['harvest','收集花蜜','点击成熟的植物']],action:'等待一天',caption:'让花园成为小动物的家'},
 {id:'defense',n:'05',name:'口袋城堡',en:'POCKET KEEP',tag:'塔防 · 布阵策略',color:'#aaa2cf',time:'5–8 分钟',intro:'用几座小塔，守住云海边的城堡。',goal:'守住城堡，抵挡全部 5 波小怪。',guide:'在道路旁建塔，再开始下一波。箭塔射速快，冰塔减速，重弩伤害高。每次击败小怪和守住一波都会获得金币。防守中也能建塔。',tools:[['watchtower','箭塔','25 金｜快射 · 范围 2.4'],['roundtower','冰塔','35 金｜减速 · 范围 2.2'],['ballista','重弩','45 金｜高伤 · 范围 3.2']],action:'开始下一波',caption:'一座小城堡，也有大冒险'},
];
export const gameById=Object.fromEntries(games.map(g=>[g.id,g]));
export const GRID=[];for(let x=-3;x<=3;x++)for(let z=-2;z<=2;z++)if(!(Math.abs(x)===3&&Math.abs(z)===2))GRID.push([x,z]);
export const key=(x,z)=>`${x},${z}`;
export const neighbors=(x,z)=>[[x-1,z],[x+1,z],[x,z-1],[x,z+1]];
export const ROAD=[[-3,1],[-2,1],[-1,1],[0,1],[1,1],[2,1],[2,0],[2,-1],[3,-1]];
export const TRAIN_STATIONS=[[-3,0],[3,0],[0,-2]];
const visitors={flowers:'粉蝶',lavender:'蜜蜂',cherry:'小鸟',mushrooms:'萤火虫'};
const growth={flowers:2,lavender:2,cherry:3,mushrooms:2};
const price={cottage:[10,4],forest:[8,0],farmhouse:[12,3],bakery:[18,5],market:[15,4]};
const towerData={watchtower:{cost:25,range:2.4,rate:.55,damage:1.5},roundtower:{cost:35,range:2.2,rate:1.05,damage:1,slow:true},ballista:{cost:45,range:3.2,rate:1.3,damage:4}};
export function createState(id){
 const s={version:1,id,rev:0,turn:1,items:[],weather:'sunny',status:'playing',message:'挑一个工具，然后点击岛上的空地。'};
 const add=(type,x,z,extra={})=>s.items.push({type,x,z,...extra});
 if(id==='town'){Object.assign(s,{gold:55,wood:10,food:12});add('cottage',0,0);add('forest',-2,-1);add('farmhouse',2,1);s.message='居民搬来了。先增加树林与农场，让资源持续生产。'}
 if(id==='puzzle'){Object.assign(s,{score:0,placed:0,contracts:[],hand:draft(0)});add('forest',0,0);s.message='从三张拼图里选一张，放到中央树林旁。'}
 if(id==='train'){Object.assign(s,{rails:20,delivered:{town:0,farm:0},destination:'town',running:null});add('barn',-3,0,{station:true});add('cottage',3,0,{station:true});add('farmhouse',0,-2,{station:true});for(const [type,x,z] of [['mountain',1,0],['pond',1,-1],['rocks',-1,-2]])add(type,x,z,{blocked:true});s.message='仓库在西侧，小镇在东侧，农场在北侧。把它们连起来。'}
 if(id==='garden'){Object.assign(s,{seeds:12,water:8,visitors:[]});add('pond',0,0,{fixed:true});add('windmill',-3,0,{fixed:true});add('oak',3,0,{fixed:true});s.message='先种四种植物，再浇水。每到新的一天会补满水壶。'}
 if(id==='defense'){Object.assign(s,{gold:100,hp:12,wave:0,battle:false,enemies:[],spawn:0,spawnClock:0,nextEnemy:1,kills:0,shots:[]});add('castle',3,-1,{fixed:true});s.message='先沿道路布置防御塔，再开始第一波。'}
 return s;
}
function draft(n){const pool=['forest','cottage','pond','flowers','hill'];return [pool[n%5],pool[(n+1)%5],pool[(n+3)%5]];}
const at=(s,x,z)=>s.items.find(i=>i.x===x&&i.z===z);
const inside=(x,z)=>GRID.some(p=>p[0]===x&&p[1]===z);
const residents=s=>s.items.filter(i=>i.type==='cottage').length*2;
function reject(s,m){s.message=m;return false;}
function change(s,m){s.message=m;s.rev++;return true;}
export function act(s,type,p={}){
 if(s.status!=='playing')return reject(s,'这一局已经结束，可以再玩一次。');
 const {x,z,tool}=p;
 if(type==='destination'){if(s.running)return reject(s,'等火车到站后再选择目的地。');s.destination=p.value;return change(s,'目的地已切换，准备好后发车。');}
 if(type==='place'){
  if(!inside(x,z))return reject(s,'请点击岛上的格子。');const item=at(s,x,z);
  if(s.id==='train'&&s.running)return reject(s,'火车行驶中，请等到站后调整线路。');
  if(s.id==='garden'&&['water','harvest'].includes(tool)){
   if(!item||!growth[item.type])return reject(s,'请点击已经种下的植物。');
   if(tool==='water'){if(item.collected)return reject(s,'这株已盛开，继续种植新的植物吧。');if(item.wet)return reject(s,'这株植物今天已经浇过水了。');if(s.water<1)return reject(s,'水壶空了，等待一天会补满。');s.water--;item.wet=true;return change(s,'已浇水。推进一天后，这株植物会长大。');}
   if(item.collected)return reject(s,'这株植物的花蜜已经收集过了。');if(item.age<growth[item.type])return reject(s,`还需要 ${growth[item.type]-item.age} 个生长日，浇水后再等待。`);
   item.collected=true;s.seeds+=3;if(!s.visitors.includes(item.type))s.visitors.push(item.type);if(s.visitors.length===4)s.status='won';return change(s,`${visitors[item.type]}来拜访了！收获 3 颗种子。`);
  }
  if(s.id==='train'&&tool==='erase'){if(item?.type!=='rail')return reject(s,'这里只能拆除自己铺的铁轨。');s.items=s.items.filter(i=>i!==item);s.rails++;return change(s,'铁轨已拆除，材料已返还。');}
  if(item)return reject(s,'这格已经有东西了，换一块空地吧。');
  if(s.id==='town'){const cost=price[tool];if(!cost)return false;if(s.gold<cost[0]||s.wood<cost[1])return reject(s,'资源不够。树林生产木材，集市和面包房赚取金币。');s.gold-=cost[0];s.wood-=cost[1];s.items.push({type:tool,x,z});return change(s,'建筑已落成，下一天开始参与生产。');}
  if(s.id==='puzzle'){
   if(!s.hand.includes(tool))return reject(s,'请从本回合的三张牌中选择。');const ns=neighbors(x,z).map(([a,b])=>at(s,a,b)).filter(Boolean);if(!ns.length)return reject(s,'拼图必须和已放置的拼图相邻。');
   let gain=3+ns.reduce((n,i)=>n+(i.type===tool?6:2),0);s.items.push({type:tool,x,z});s.placed++;s.score+=gain;
   const clusters=t=>s.items.filter(i=>i.type===t&&neighbors(i.x,i.z).some(([a,b])=>at(s,a,b)?.type===t)).length;
   const contracts=[clusters('forest')>=3,s.items.filter(i=>i.type==='cottage'&&neighbors(i.x,i.z).some(([a,b])=>at(s,a,b)?.type==='forest')).length>=2,new Set(s.items.map(i=>i.type)).size>=4];
   let bonus=0;contracts.forEach((done,i)=>{if(done&&!s.contracts.includes(i)){s.contracts.push(i);s.score+=15;bonus+=15;}});s.hand=draft(s.placed);if(s.placed===14)s.status=s.score>=140?'won':'lost';return change(s,`这块获得 ${gain} 分${bonus?`，组合奖励 +${bonus} 分`:''}。`);
  }
  if(s.id==='train'){if(tool!=='rail')return false;if(s.rails<=0)return reject(s,'轨道用完了，可拆除多余路段返还材料。');s.rails--;s.items.push({type:'rail',x,z});return change(s,'已铺设铁轨。相邻格会自动连接。');}
  if(s.id==='garden'){const cost={flowers:1,lavender:2,cherry:3,mushrooms:1}[tool];if(!cost)return false;if(s.seeds<cost)return reject(s,'种子不够，收集成熟植物的花蜜可获得种子。');s.seeds-=cost;s.items.push({type:tool,x,z,age:0,wet:false,collected:false});return change(s,'已经种下。选择浇水工具，再点击这株植物。');}
  if(s.id==='defense'){if(ROAD.some(p=>p[0]===x&&p[1]===z))return reject(s,'道路要留给小怪通行，请在道路旁建塔。');const d=towerData[tool];if(!d)return false;if(s.gold<d.cost)return reject(s,'金币不够，击败小怪或守住一波会获得金币。');s.gold-=d.cost;s.items.push({type:tool,x,z,cooldown:0});return change(s,'防御塔就位。范围圈显示它能覆盖的区域。');}
 }
 if(type==='advance'){
  if(s.id==='town'){
   let income=0;s.items.forEach(i=>{if(i.type==='forest')s.wood+=3;if(i.type==='farmhouse')s.food+=6;if(i.type==='market'){s.gold+=7;income+=7;}});
   s.items.forEach(i=>{if(i.type==='bakery'&&s.food>=2){s.food-=2;s.gold+=12;income+=12;}});const eat=Math.ceil(residents(s)/2);const short=s.food<eat;s.food=Math.max(0,s.food-eat);s.gold+=short?0:3;income+=short?0:3;s.turn++;
   if(residents(s)>=12&&s.gold>=80&&s.food>=12)s.status='won';else if(s.turn>20)s.status='lost';return change(s,short?'食物不足，今天没有居民税收。先增加农场。':`新的一天：收入 ${income} 金币，居民消耗 ${eat} 份食物。`);
  }
  if(s.id==='garden'){const rain=s.weather==='rain';let grown=0;s.items.forEach(i=>{if(growth[i.type]&&!i.collected&&(i.wet||rain)){i.age=Math.min(growth[i.type],i.age+1);grown++;}i.wet=false;});s.turn++;s.water=8;s.weather=Math.floor((s.turn-1)/4)%4===3?'snow':['sunny','rain','cloudy','dusk'][(s.turn-1)%4];return change(s,`${grown} 株植物长大了，水壶已补满。${s.weather==='rain'?'今天有雨，不用手动浇水。':''}`);}
  if(s.id==='train'){if(s.running)return reject(s,'火车正在运送货物。');if(s.delivered[s.destination]>=4)return reject(s,'这里已送满 4 箱，换另一个目的地吧。');const path=findRoute(s,s.destination);if(!path)return reject(s,'路线还没连通。铁轨需上下左右连接，从西侧仓库通向目的地。');s.running={path,progress:0,target:s.destination};return change(s,'小火车出发了！到站后会自动卸货。');}
  if(s.id==='defense'){if(s.battle)return reject(s,'这一波还没结束，先守住道路。');s.wave++;s.battle=true;s.spawn=0;s.spawnClock=.9;return change(s,`第 ${s.wave} 波来袭！可以继续建塔支援。`);}
 }
 return false;
}
export function findRoute(s,destination){const start=TRAIN_STATIONS[0],goal=TRAIN_STATIONS[destination==='town'?1:2];const nodes=new Set(s.items.filter(i=>i.station||i.type==='rail').map(i=>key(i.x,i.z)));const q=[[start]],seen=new Set([key(...start)]);while(q.length){const path=q.shift(),p=path.at(-1);if(key(...p)===key(...goal))return path;for(const n of neighbors(...p)){const k=key(...n);if(nodes.has(k)&&!seen.has(k)){seen.add(k);q.push([...path,n]);}}}return null;}
export function pointOnPath(path,progress){const i=Math.min(path.length-2,Math.floor(progress)),a=path[Math.max(0,i)],b=path[Math.max(0,i)+1]||a,t=Math.min(1,progress-i);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
export function tick(s,dt){
 if(s.status!=='playing')return false;
 if(s.id==='train'&&s.running){s.running.progress+=dt*1.6;if(s.running.progress>=s.running.path.length-1){s.delivered[s.running.target]+=2;const label=s.running.target==='town'?'小镇':'农场';s.running=null;if(s.delivered.town>=4&&s.delivered.farm>=4)s.status='won';return change(s,`${label}收到 2 箱货物！继续安排下一趟。`);}return false;}
 if(s.id!=='defense'||!s.battle)return false;
 s.shots=s.shots.filter(shot=>(shot.life-=dt)>0);s.spawnClock+=dt;const count=4+s.wave;
 if(s.spawn<count&&s.spawnClock>=1.1){s.spawnClock-=1.1;s.enemies.push({id:s.nextEnemy++,progress:0,hp:3+s.wave*1.2,max:3+s.wave*1.2,slow:0});s.spawn++;}
 const beforeGold=s.gold,beforeHP=s.hp;
 for(const e of s.enemies){e.slow=Math.max(0,e.slow-dt);e.progress+=dt*(.54+s.wave*.025)*(e.slow>0?.43:1);}
 for(const t of s.items){const d=towerData[t.type];if(!d)continue;t.cooldown=Math.max(0,t.cooldown-dt);if(t.cooldown>0)continue;const target=s.enemies.filter(e=>e.hp>0&&e.progress<ROAD.length-1).sort((a,b)=>b.progress-a.progress).find(e=>{const [x,z]=pointOnPath(ROAD,e.progress);return Math.hypot(t.x-x,t.z-z)<=d.range;});if(target){target.hp-=d.damage;if(d.slow)target.slow=2.4;t.cooldown=d.rate;s.shots.push({x:t.x,z:t.z,to:pointOnPath(ROAD,target.progress),type:t.type,life:.16});}}
 s.enemies=s.enemies.filter(e=>{if(e.hp<=0){s.gold+=6;s.kills++;return false;}if(e.progress>=ROAD.length-1){s.hp--;return false;}return true;});
 if(s.hp<=0){s.hp=0;s.battle=false;s.shots=[];s.status='lost';return change(s,'城堡失守了。下一局试试把塔集中在道路拐角。');}
 if(s.spawn===count&&!s.enemies.length){s.battle=false;s.shots=[];s.gold+=25;if(s.wave===5)s.status='won';return change(s,`守住第 ${s.wave} 波！获得 25 金币，可以补充防御。`);}
 if(s.gold!==beforeGold||s.hp!==beforeHP){s.rev++;return true;}return false;
}
export function metrics(s){
 if(s.id==='town')return [['金币',s.gold],['木材',s.wood],['食物',s.food],['居民',`${residents(s)} / 12`]];
 if(s.id==='puzzle')return [['总分',s.score],['目标','140'],['已放',`${s.placed} / 14`],['组合',`${s.contracts.length} / 3`]];
 if(s.id==='train')return [['剩余轨道',s.rails],['小镇货物',`${s.delivered.town} / 4`],['农场货物',`${s.delivered.farm} / 4`],['状态',s.running?'行驶中':'待发车']];
 if(s.id==='garden')return [['种子',s.seeds],['水壶',`${s.water} / 8`],['访客',`${s.visitors.length} / 4`],['日期',`第 ${s.turn} 天`]];
 return [['金币',s.gold],['城堡生命',`${s.hp} / 12`],['波次',`${s.wave} / 5`],['击败',s.kills]];
}
export function tasks(s){
 if(s.id==='town')return [[`居民 ${residents(s)} / 12`,residents(s)>=12],[`金币 ${s.gold} / 80`,s.gold>=80],[`食物 ${s.food} / 12`,s.food>=12]];
 if(s.id==='puzzle')return [['3 块相连的树林',s.contracts.includes(0)],['2 座邻近树林的小屋',s.contracts.includes(1)],['岛上有 4 种拼图',s.contracts.includes(2)]];
 if(s.id==='train')return [['小镇收到 4 箱货物',s.delivered.town>=4],['农场收到 4 箱货物',s.delivered.farm>=4]];
 if(s.id==='garden')return Object.entries(visitors).map(([id,name])=>[`${name} · ${id==='flowers'?'花丛':id==='lavender'?'薰衣草':id==='cherry'?'樱花':'蘑菇'}`,s.visitors.includes(id)]);
 return [['城堡仍然安全',s.hp>0],[`抵挡全部 5 波（已完成 ${s.battle?s.wave-1:s.wave}）`,s.wave===5&&!s.battle&&s.status==='won']];
}
export function progress(s){if(s.id==='town')return Math.min(1,(Math.min(1,residents(s)/12)+Math.min(1,s.gold/80)+Math.min(1,s.food/12))/3);if(s.id==='puzzle')return s.placed/14;if(s.id==='train')return (s.delivered.town+s.delivered.farm)/8;if(s.id==='garden')return s.visitors.length/4;return (s.battle?s.wave-1:s.wave)/5;}
