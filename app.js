(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ss=(k,v)=>{try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){}};
const T={en:{home:'Home',suites:'Suites',avail:'Availability',contact:'Contact',intro:'Two suites — see which dates are available.',suite:'Suite',guests:'{n} Guests',free:'Available',res:'Reserved',wa:'WhatsApp',em:'Email',own:'Owner Login',ey1:'Two suites',ey2:'Check dates',
A1:['Private entrance','Free WiFi','Access to a comfortable backyard','Option to add a port-a-crib','Windows facing President Street'],A2:['Private entrance','Free WiFi','2nd floor','Option to add a port-a-crib','Split A/C units','Washer / dryer']},
he:{home:'בית',suites:'סוויטות',avail:'זמינות',contact:'יצירת קשר',intro:'שתי סוויטות — בדקו אילו תאריכים פנויים.',suite:'סוויטה',guests:'{n} אורחים',free:'פנוי',res:'תפוס',wa:'וואטסאפ',em:'אימייל',own:'כניסת בעלים',ey1:'שתי סוויטות',ey2:'בדיקת תאריכים',
A1:['כניסה פרטית','WiFi חינם','גישה לחצר אחורית נוחה','אפשרות להוסיף עריסת נסיעה','חלונות הפונים לרחוב President'],A2:['כניסה פרטית','WiFi חינם','קומה שנייה','אפשרות להוסיף עריסת נסיעה','מזגנים מפוצלים','מכונת כביסה / מייבש']}};
const IMG={script:'/img/script.png',a:[1,2,3,4,5].map(i=>`/img/a${i}.jpg`),b:[1,2,3,4,5].map(i=>`/img/b${i}.jpg`)};
const LOC={en:'en-US',he:'he-IL'},P={s1:['1–4','$150–$180',IMG.b,'A1'],s2:['1–6','$160–$245',IMG.a,'A2']};
let lang=ss('lang')=='he'?'he':'en',suite=ss('suite')=='s2'?'s2':'s1',S={s1:new Set(),s2:new Set()},loaded=0;
const now=new Date(),ty=now.getFullYear(),tm=now.getMonth();let vy=ty,vm=tm;
const k=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),todayK=k(ty,tm,now.getDate());
const gem=n=>{const t=['','י','כ','ל'],o=['','א','ב','ג','ד','ה','ו','ז','ח','ט'];let s=n==15?'טו':n==16?'טז':t[Math.floor(n/10)]+o[n%10];return s.length>1?s.slice(0,-1)+'״'+s.slice(-1):s+'׳'};
const hf=new Intl.DateTimeFormat('he-u-ca-hebrew',{day:'numeric',month:'long'}),hc={};
const heb=(y,m,d)=>{const q=k(y,m,d);if(hc[q])return hc[q];const p=hf.formatToParts(new Date(y,m,d,12));return hc[q]=gem(+p.find(x=>x.type=='day').value)+' '+p.find(x=>x.type=='month').value};
const inRange=(y,m)=>y*12+m>=ty*12+tm&&y*12+m<=2032*12+11;
const cells=(y,m,set)=>{const fd=new Date(y,m,1).getDay(),dn=new Date(y,m+1,0).getDate();let h='';for(let d=1;d<=dn;d++){const q=k(y,m,d);h+=`<div class="d${q<todayK?' p':''}${q==todayK?' t':''}${set.has(q)?' r':''}" data-q="${q}"${d==1?` style="grid-column-start:${fd+1}"`:''}><span class="n">${d}</span><span class="h">${heb(y,m,d)}</span></div>`}return h};
const wds=(loc,w)=>{const f=new Intl.DateTimeFormat(loc,{weekday:w});let h='';for(let i=0;i<7;i++)h+='<div class="wd">'+f.format(new Date(2023,0,1+i))+'</div>';return h};
const mTitle=(loc,y,m)=>new Intl.DateTimeFormat(loc,{month:'long',year:'numeric'}).format(new Date(y,m,1));

$('#app').innerHTML=`<header class="top"><a class="brand" href="#home"><b>MAON SUITES</b><i>President &amp; Kingston</i></a><button id="mb" aria-label="Menu"><span></span><span></span></button></header>
<nav id="menu"><a class="l" href="#home" data-k="home"></a><a class="l" href="#suites" data-k="suites"></a><a class="l" href="#availability" data-k="avail"></a><a class="l" href="#contact" data-k="contact"></a><div class="langs"><button data-l="en">English</button><button data-l="he">עברית</button></div><button id="ownbtn" data-k="own"></button></nav>
<section id="home" class="hero" style="max-width:none"><div class="bh">ב״ה</div><h1>MAON SUITES</h1><img class="script" src="${IMG.script}" alt="President &amp; Kingston"><p class="intro" data-k="intro"></p><div class="cue"></div></section>
<section id="suites"><p class="ey rv" data-k="ey1"></p><h2 class="rv" data-k="suites"></h2><div class="suites">${['s1','s2'].map((s,i)=>`<article class="rv"><div class="gal"><div class="m"><img id="m${s}" src="${P[s][2][0]}" alt=""></div>${P[s][2].map((u,j)=>`<button data-s="${s}" data-j="${j}" class="${j?'':'on'}"><img src="${u}" alt="" decoding="async" loading="lazy"></button>`).join('')}</div><div class="info"><h3><span data-k="suite"></span> ${i+1}</h3><div class="meta"><span class="gs" data-n="${P[s][0]}"></span><s></s><span>${P[s][1]}</span></div><ul id="am${s}"></ul></div></article>`).join('')}</div></section>
<section id="availability"><p class="ey rv" data-k="ey2"></p><h2 class="rv" data-k="avail"></h2><div class="tabs"><button data-t="s1"></button><button data-t="s2"></button></div><div class="cal rv" id="cal"><div class="cn"><button id="pv" aria-label="‹">‹</button><h3 id="mt"></h3><button id="nx" aria-label="›">›</button></div><div class="grid" id="gr"></div><div class="lg"><span><i></i><em data-k="free"></em></span><span><i class="r"></i><em data-k="res"></em></span></div></div></section>
<footer id="contact"><h2 style="margin-bottom:0" data-k="contact"></h2><div class="row"><div><small data-k="wa"></small><a href="https://wa.me/18433851094">843-385-1094</a></div><div><small data-k="em"></small><a href="mailto:ch.short.term.rentals@gmail.com">ch.short.term.rentals@gmail.com</a></div></div></footer><div id="toast"></div>`;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('o');clearTimeout(toast.i);toast.i=setTimeout(()=>t.classList.remove('o'),2600)};

function setLang(l){lang=l;ss('lang',l);const t=T[l];document.documentElement.lang=l;document.documentElement.dir=l=='he'?'rtl':'ltr';
$$('[data-k]').forEach(e=>e.textContent=t[e.dataset.k]);$$('.gs').forEach(e=>e.textContent=t.guests.replace('{n}',e.dataset.n));
['s1','s2'].forEach(s=>$('#am'+s).innerHTML=t[P[s][3]].map(x=>'<li>'+x+'</li>').join(''));
$$('[data-t]').forEach(b=>b.textContent=t.suite+' '+b.dataset.t[1]);$$('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l==l));cal()}
function cal(){const loc=LOC[lang];$$('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==suite));$('#mt').textContent=mTitle(loc,vy,vm);
$('#pv').disabled=vy==ty&&vm==tm;$('#nx').disabled=vy==2032&&vm==11;$('#gr').innerHTML=wds(loc,lang=='he'?'narrow':'short')+cells(vy,vm,S[suite])}
function mv(n){let m=vm+n,y=vy;if(m<0){m=11;y--}if(m>11){m=0;y++}if(!inRange(y,m))return;vy=y;vm=m;cal()}
$('#pv').onclick=()=>mv(-1);$('#nx').onclick=()=>mv(1);
$$('[data-t]').forEach(b=>b.onclick=()=>{suite=b.dataset.t;ss('suite',suite);cal()});
$$('[data-l]').forEach(b=>b.onclick=()=>setLang(b.dataset.l));
$$('.gal button').forEach(b=>b.onclick=()=>{const i=$('#m'+b.dataset.s);i.style.opacity=0;setTimeout(()=>{i.src=P[b.dataset.s][2][b.dataset.j];i.style.opacity=1},180);$$('.gal button[data-s="'+b.dataset.s+'"]').forEach(x=>x.classList.toggle('on',x==b))});
const mn=$('#menu'),mb=$('#mb'),tg=o=>{mn.classList.toggle('o',o);mb.classList.toggle('o',o)};
mb.onclick=()=>tg(!mn.classList.contains('o'));$$('#menu a').forEach(a=>a.onclick=()=>tg(false));
let sc0=false;addEventListener('scroll',()=>{const v=scrollY>20;if(v!==sc0){sc0=v;$('.top').classList.toggle('sc',v)}},{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});$$('.rv').forEach(e=>io.observe(e));

// ---- data (public, read-only) ----
const api=(p,b)=>fetch(p,b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b),credentials:'same-origin'}:{cache:'no-store',credentials:'same-origin'});
const load=async()=>{try{const d=await(await api('/api/availability')).json();apply(d);loaded=Date.now()}catch(e){}};
const apply=d=>{S={s1:new Set(d.s1),s2:new Set(d.s2)};cal();if(D)dcal()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-loaded>60000)load()});

// ---- owner: login screen (separate from the dashboard) ----
$('#ownbtn').onclick=async()=>{tg(false);try{if((await(await api('/api/me')).json()).auth)return dash()}catch(e){}login()};
function login(){const el=document.createElement('div');el.id='login';el.innerHTML=`<div class="pane"><div class="hd"><span></span><button id="lx">Close</button></div><h2>Owner Login</h2><form class="f" id="lf" novalidate><label for="le">Email</label><input id="le" type="email" autocomplete="username" autocapitalize="off" inputmode="email"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password"><div class="err" id="lr" role="alert"></div><button class="big" id="ls" type="submit">Sign In</button></form></div>`;document.body.append(el);document.body.style.overflow='hidden';$('#le').focus();
const close=()=>{el.remove();document.body.style.overflow=''};$('#lx').onclick=close;
$('#lf').onsubmit=async e=>{e.preventDefault();const em=$('#le').value.trim(),pw=$('#lp').value,r=$('#lr');
if(!em||!pw){r.textContent='Enter both email and password.';return}
$('#ls').disabled=true;r.textContent='';
try{const x=await api('/api/login',{email:em,password:pw});$('#lp').value='';
if(x.ok){close();dash()}else r.textContent=x.status==429?'Too many attempts. Please wait a few minutes.':'Incorrect email or password.'}
catch(err){r.textContent='Connection problem. Please try again.'}const l=$('#ls');if(l)l.disabled=false}}

// ---- owner: dashboard (built only after the server confirms the session) ----
let D=null;
function dash(){const el=document.createElement('div');el.id='dash';
el.innerHTML=`<div class="pane"><div class="hd"><span class="serif" style="font-size:13px;letter-spacing:.3em">MAON SUITES</span><button id="dlo">Log out</button></div><h2>Owner Dashboard</h2><div class="two" id="dt"><button data-s="s1">Suite 1</button><button data-s="s2">Suite 2</button></div><div class="cn" style="margin-top:14px"><button id="dpv" aria-label="Previous month">‹</button><h3 id="dm"></h3><button id="dnx" aria-label="Next month">›</button></div><div class="grid" id="dg"></div></div><div id="dp"><div class="in"><b id="dpt"></b><small id="dps"></small><div class="two" id="dst"><button data-v="reserved">Reserved</button><button data-v="available">Available</button></div><div class="row"><button id="dcn">Cancel</button><button class="pr" id="dsv">Save Changes</button></div></div></div>`;
document.body.append(el);document.body.style.overflow='hidden';
D={s:suite,y:vy,m:vm,a:null,b:null,v:null,busy:false,el};
const fm=q=>{const[y,m,d]=q.split('-').map(Number);return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date(y,m-1,d))};
const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5)+1;
const $d=s=>el.querySelector(s);
function paint(){const a=D.a,b=D.b||D.a;for(const c of el.querySelectorAll('#dg .d')){const q=c.dataset.q,on=!!a&&q>=a&&q<=b;c.classList.toggle('g',on);c.classList.toggle('s',q==a);c.classList.toggle('z',!!D.b&&q==D.b)}
const t=$d('#dpt'),s=$d('#dps'),st=$d('#dst'),sv=$d('#dsv');
$d('#dt').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.s==D.s));
st.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.v==D.v));
if(!a){t.textContent='Suite '+D.s[1];s.textContent='Tap a start date.';st.style.display='none';sv.disabled=true;$d('#dcn').disabled=true}
else if(!D.b){t.textContent='Start: '+fm(a);s.textContent='Suite '+D.s[1]+' — now tap the end date (tap the same date again for one day).';st.style.display='none';sv.disabled=true;$d('#dcn').disabled=false}
else{t.textContent=a==D.b?fm(a):fm(a)+' – '+fm(D.b);s.textContent='Suite '+D.s[1]+' · '+days(a,D.b)+(days(a,D.b)==1?' day':' days')+' selected';st.style.display='';sv.disabled=!D.v;$d('#dcn').disabled=false}}
D.paint=paint;
window.dcal=()=>{if(!D)return;$d('#dm').textContent=mTitle('en-US',D.y,D.m);$d('#dpv').disabled=D.y==ty&&D.m==tm;$d('#dnx').disabled=D.y==2032&&D.m==11;$d('#dg').innerHTML=wds('en-US','short')+cells(D.y,D.m,S[D.s]);paint()};
const clear=()=>{D.a=D.b=null;D.v=null;paint()};
$d('#dg').onclick=e=>{const c=e.target.closest('.d');if(!c||c.classList.contains('p'))return;const q=c.dataset.q;
if(!D.a||D.b){D.a=q;D.b=null}else{D.b=q;if(D.b<D.a)[D.a,D.b]=[D.b,D.a]}D.v=null;paint()};
$d('#dt').onclick=e=>{const b=e.target.closest('button');if(!b||b.dataset.s==D.s)return;D.s=b.dataset.s;D.a=D.b=null;D.v=null;dcal()};
$d('#dst').onclick=e=>{const b=e.target.closest('button');if(b){D.v=b.dataset.v;paint()}};
const nav=n=>{let m=D.m+n,y=D.y;if(m<0){m=11;y--}if(m>11){m=0;y++}if(!inRange(y,m))return;D.y=y;D.m=m;dcal()};
$d('#dpv').onclick=()=>nav(-1);$d('#dnx').onclick=()=>nav(1);$d('#dcn').onclick=clear;
const out=()=>{el.remove();D=null;window.dcal=null;document.body.style.overflow=''};
$d('#dlo').onclick=async()=>{try{await api('/api/logout',{})}catch(e){}out();toast('Logged out')};
$d('#dsv').onclick=async()=>{if(D.busy||!D.a||!D.b||!D.v)return;D.busy=true;const sv=$d('#dsv');sv.disabled=true;
try{const x=await api('/api/availability',{suite:D.s,from:D.a,to:D.b,status:D.v});
if(x.status==401){out();toast('Session ended. Please log in again.');login();return}
if(!x.ok)throw 0;const d=await x.json();D.a=D.b=null;D.v=null;apply(d);toast('Saved')}
catch(e){toast('Could not save. Please try again.');paint()}finally{if(D)D.busy=false}};
dcal()}
setLang(lang);load();
})();
