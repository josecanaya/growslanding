
const $=s=>document.querySelector(s),roles=[
 {id:'invest',name:'Inversores',verb:'CIMIENTOS · EL CAPITAL',color:'#d9ec8b',x:415,y:739,anchor:[185,0,-47]},
 {id:'design',name:'Proyectistas',verb:'COLUMNAS Y VIGAS · EL DISEÑO',color:'#99c7db',x:148,y:354,anchor:[0,0,280]},
 {id:'contract',name:'Contratistas',verb:'PAREDES · LOS OFICIOS',color:'#e8b17d',x:817,y:442,anchor:[425,128,302]},
 {id:'crew',name:'Equipo de obra',verb:'LOSAS · EL AVANCE',color:'#d3a0ae',x:145,y:516,anchor:[0,40,121]},
 {id:'agent',name:'Agentes',verb:'CONEXIONES · LOS DATOS',color:'#b8addf',x:822,y:598,anchor:[425,280,133]},
 {id:'project',name:'El proyecto',verb:'OBRA NORTE · 4 PISOS',color:'#d9ec8b',x:592,y:81,anchor:[210,142,484]}
];
let seed=72;
function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
const P=(x,y,z)=>[228+x+.65*y,626+.20*x-.35*y-z];
const net=$('#network');
const faces=[];
function surface(id,a,b,d,nx=7,ny=4,windows=[]){
  const c=b.map((value,i)=>value+d[i]-a[i]);
  faces.push({id,a,b,c,d,nx,ny,windows});
}
function box(id,x,y,z,w,d,h){
  surface(id,[x,y,z],[x+w,y,z],[x,y,z+h],Math.max(2,Math.ceil(w/27)),Math.max(2,Math.ceil(h/24)));
  surface(id,[x+w,y,z],[x+w,y+d,z],[x+w,y,z+h],Math.max(2,Math.ceil(d/27)),Math.max(2,Math.ceil(h/24)));
  surface(id,[x,y,z+h],[x+w,y,z+h],[x,y+d,z+h],Math.max(2,Math.ceil(w/27)),Math.max(2,Math.ceil(d/27)));
}
// The exposed footings carry the column grid, with a continuous foundation beam above.
for(const y of [215,0])for(const x of [0,140,280,420]){
  box('invest',x-20,y-14,-60,40,36,16);
  box('invest',x-8,y-6,-44,16,14,32);
}
box('invest',-13,-14,-15,446,292,16);
const windowBand=[[.12,.88,.28,.79]];
for(let floor=0;floor<4;floor++){
  const z=floor*121;
  // The rear columns are visible through the bays left open.
  for(const x of [0,140,280,420])box('design',x-5,267,z,11,12,121);
  box('design',-5,267,z+106,437,12,15);
  box('crew',-10,-11,z,446,296,9);
  // Brick infill occupies selected bays so the structural frame stays legible.
  const front=floor%2===0?[146,286]:[286];
  for(const x of front)surface('contract',[x,0,z+9],[x+129,0,z+9],[x,0,z+106],10,8,windowBand);
  for(const y of (floor===0?[143]:[13,143])){
    surface('contract',[425,y,z+9],[425,y+120,z+9],[425,y,z+106],9,8,windowBand);
  }
  for(const x of [0,140,280,420])box('design',x-5,-6,z+9,12,13,112);
  box('design',-5,-6,z+106,437,13,15);
  box('design',421,7,z+106,11,272,15);
}
box('project',-12,-13,484,451,299,12);
const point=(f,u,v)=>P(...f.a.map((a,k)=>a+(f.b[k]-a)*u+(f.d[k]-a)*v));
const isWindow=(f,u,v)=>f.windows?.some(([l,r,b,t])=>u>l&&u<r&&v>b&&v<t);
const line=(a,b,cls='thread')=>`<line class="${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
let svg='<defs><radialGradient id="houseGlow"><stop stop-color="#c6dfa1" stop-opacity=".08"/><stop offset="1" stop-color="#c6dfa1" stop-opacity="0"/></radialGradient></defs><ellipse cx="490" cy="490" rx="440" ry="290" fill="url(#houseGlow)"/>';
// Extend the house graph into the background from its structural vertices.
const anchors = [[0,0,484],[420,0,484],[420,270,484],[0,0,242],[420,270,242],[0,0,0],[420,0,0],[420,270,0]].map(vertex => P(...vertex));
const networkCenter = [550,400];
svg += '<g class="ambient-network" pointer-events="none">';
anchors.forEach(anchor => {
  const angle = Math.atan2(anchor[1]-networkCenter[1],anchor[0]-networkCenter[0]);
  const points = [anchor];
  for(let i=0;i<130;i++){
    const direction = angle+(random()-.5)*2.25;
    const distance = 20+Math.pow(random(),.85)*245;
    const point = [anchor[0]+Math.cos(direction)*distance,anchor[1]+Math.sin(direction)*distance];
    if(point[0]<-80||point[0]>1015||point[1]<4||point[1]>780)continue;
    const nearest = points.map(from=>({from,distance:Math.hypot(from[0]-point[0],from[1]-point[1])}))
      .sort((a,b)=>a.distance-b.distance);
    svg += line(nearest[0].from,point,'ambient-link');
    if(nearest[1]?.distance<52 && random()>.48)svg += line(nearest[1].from,point,'ambient-link secondary-link');
    const radius = random()>.92?2.3:.65+random()*.95;
    const opacity = .18+random()*.43;
    svg += `<circle class="ambient-node" cx="${point[0]}" cy="${point[1]}" r="${radius}" opacity="${opacity}"/>`;
    points.push(point);
  }
});
svg += '</g>';
faces.forEach((f,fi)=>{const r=roles.find(r=>r.id===f.id),corners=[f.a,f.b,f.c,f.d].map(v=>P(...v));svg+=`<g class="mesh house-face" data-area="${f.id}" style="--color:${r.color}"><polygon class="face-base" points="${corners.map(p=>p.join(',')).join(' ')}"/><polygon class="region" points="${corners.map(p=>p.join(',')).join(' ')}"/>`;
const nodes=[];for(let j=0;j<=f.ny;j++){nodes[j]=[];for(let i=0;i<=f.nx;i++){const boundary=i===0||j===0||i===f.nx||j===f.ny;const u=i/f.nx+(boundary?0:(random()-.5)*.3/f.nx),v=j/f.ny+(boundary?0:(random()-.5)*.3/f.ny);nodes[j][i]={p:point(f,u,v),u,v}}}
for(let j=0;j<=f.ny;j++)for(let i=0;i<=f.nx;i++){const n=nodes[j][i];if(isWindow(f,n.u,n.v))continue;[[i+1,j],[i,j+1],[i+(j%2?1:-1),j+1]].forEach(([ii,jj])=>{const q=nodes[jj]?.[ii];if(q&&!isWindow(f,q.u,q.v)&&!isWindow(f,(q.u+n.u)/2,(q.v+n.v)/2))svg+=line(n.p,q.p)});svg+=`<circle class="particle" cx="${n.p[0]}" cy="${n.p[1]}" r="${i===0||j===0||i===f.nx||j===f.ny?1.8:random()>.86?2.1:1.15}"/>`}
// Glazing: dark voids, connected frames and mullions make the house legible.
(f.windows||[]).forEach(([l,r,b,t])=>{const c=[[l,b],[r,b],[r,t],[l,t]].map(([u,v])=>point(f,u,v));svg+=`<polygon class="glazing" points="${c.map(p=>p.join(',')).join(' ')}"/>`;for(let u=l;u<=r+.001;u+=(r-l)/4){svg+=line(point(f,u,b),point(f,u,t),'mullion');const p=point(f,u,t);svg+=`<circle class="particle" cx="${p[0]}" cy="${p[1]}" r="2"/>`}svg+=line(point(f,l,b+.08),point(f,r,b+.08),'mullion')});svg+='</g>'});
// A data path follows the edge of the building and links the floor nodes.
const route=[[0,0,-44],[0,0,0],[0,0,121],[140,0,121],[140,0,242],[280,0,242],[280,0,363],[420,0,363],[420,270,363],[420,270,484]].map(v=>P(...v));
svg+=`<g class="mesh data-route" data-area="agent" style="--color:#b8addf"><path id="buildingRoute" d="M${route.map(p=>p.join(',')).join('L')}" fill="none" stroke="#b8addf" stroke-opacity=".58" stroke-width="1.8"/>${route.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.8" fill="#cbbce9"/>`).join('')}</g>`;
for(let i=0;i<3;i++)svg+=`<circle class="travel" r="2.6" fill="#e0d1ff"><animateMotion dur="13s" begin="-${i*4}s" repeatCount="indefinite"><mpath href="#buildingRoute"/></animateMotion></circle>`;
roles.forEach(r=>{
  const b=P(...r.anchor);
  svg+=`<g class="role-leader" style="--color:${r.color}">${line([r.x,r.y],b,'leader')}<circle cx="${b[0]}" cy="${b[1]}" r="3" fill="${r.color}"/></g>`;
});
net.innerHTML=svg;
function highlight(id,on){document.querySelectorAll(`[data-area="${id}"]`).forEach(g=>g.classList.toggle('selected',on));net.classList.toggle('is-focused',on)}
const destinations = {
  invest: '/inversores',
  design: '/inversores?sector=proyecto',
  contract: '/inversores?sector=trabajo',
  crew: '/inversores?sector=trabajo',
  agent: '/inversores',
  project: '/inversores?sector=proyecto',
};

function roleUrl(id) {
  return destinations[id];
}

roles.forEach(role => {
  const mobile = {
    invest: [43, 94], design: [16, 42], contract: [82, 52],
    crew: [16, 66], agent: [83, 77], project: [61, 10],
  }[role.id];
  const link = document.createElement('a');
  link.className = 'label' + (role.id === 'project' ? ' center' : '');
  link.href = roleUrl(role.id);
  link.style.cssText = `left:${role.x / 10}%;top:${role.y / 8}%;--color:${role.color};--mobile-x:${mobile[0]}%;--mobile-y:${mobile[1]}%`;
  link.innerHTML = `<b>${role.name}</b><small>${role.verb}</small><span class="arrow" aria-hidden="true">↗</span>`;
  link.onpointerenter = link.onfocus = () => highlight(role.id, true);
  link.onpointerleave = link.onblur = () => highlight(role.id, false);
  $('#labels').append(link);
});
document.querySelectorAll('[data-area]').forEach(g=>{g.onclick=()=>window.location.assign(roleUrl(g.dataset.area));g.onpointerenter=()=>highlight(g.dataset.area,true);g.onpointerleave=()=>highlight(g.dataset.area,false)});
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;function movement(){net[paused?'pauseAnimations':'unpauseAnimations']();$('#motion').textContent=paused?'Activar movimiento':'Pausar movimiento';$('#motion').setAttribute('aria-pressed',String(paused))}$('#motion').onclick=()=>{paused=!paused;movement()};movement();
