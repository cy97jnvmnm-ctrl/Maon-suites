(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ss=(k,v)=>{try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){}return null};
const AM={en:{A1:['Private entrance','Free WiFi','Access to a comfortable backyard','Option to add a port-a-crib','Windows facing President Street'],A2:['Private entrance','Free WiFi','2nd floor','Option to add a port-a-crib','Split A/C units','Washer / dryer']},
he:{A1:['כניסה פרטית','WiFi חינם','גישה לחצר אחורית נוחה','אפשרות להוסיף עריסת נסיעה','חלונות הפונים לרחוב President'],A2:['כניסה פרטית','WiFi חינם','קומה שנייה','אפשרות להוסיף עריסת נסיעה','מזגנים מפוצלים','מכונת כביסה / מייבש']},
de:{A1:['Privater Eingang','Kostenloses WLAN','Zugang zu einem gemütlichen Hinterhof','Reisebett auf Wunsch','Fenster zur President Street'],A2:['Privater Eingang','Kostenloses WLAN','2. Stock','Reisebett auf Wunsch','Split-Klimageräte','Waschmaschine / Trockner']}};
const T={
en:{home:'Home',suites:'Suites',avail:'Availability',contact:'Contact',intro:'Two suites — see which dates are available.',suite:'Suite',guests:'{n} Guests',free:'Available',res:'Reserved',wa:'WhatsApp',em:'Email',own:'Owner Login',ey1:'Two suites',ey2:'Check dates',lang:'Language',
ol:'Owner Login',em_:'Email',pw:'Password',si:'Sign In',bad:'Incorrect email or password.',both:'Enter both email and password.',many:'Too many attempts. Please wait a few minutes.',conn:'Connection problem. Please try again.',sd:'Start date',ed:'End date',cl:'Close',od:'Owner Dashboard',lo:'Log Out',idle:'Tap a start date.',st:'Start date selected',tapend:'Now tap the end date (tap the same date again for a single day).',dys:'{n} days selected',d1:'1 day selected',status:'Status',sv:'Save Changes',cn:'Cancel',saving:'Saving…',saved:'Saved',nosv:'Could not save. Please try again.',sess:'Your session ended. Please sign in again.',cont:'You are already signed in.',ctn:'Continue as Owner',ldg:'Loading availability…',lde:'Could not load availability.',retry:'Try again',bye:'Logged out'},
he:{home:'בית',suites:'סוויטות',avail:'זמינות',contact:'יצירת קשר',intro:'שתי סוויטות — בדקו אילו תאריכים פנויים.',suite:'סוויטה',guests:'{n} אורחים',free:'פנוי',res:'תפוס',wa:'וואטסאפ',em:'אימייל',own:'כניסת בעלים',ey1:'שתי סוויטות',ey2:'בדיקת תאריכים',lang:'שפה',
ol:'כניסת בעלים',em_:'אימייל',pw:'סיסמה',si:'כניסה',bad:'אימייל או סיסמה שגויים.',both:'יש להזין אימייל וסיסמה.',many:'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.',conn:'בעיית חיבור. נסו שוב.',sd:'תאריך התחלה',ed:'תאריך סיום',cl:'סגירה',od:'לוח בעלים',lo:'התנתקות',idle:'בחרו תאריך התחלה.',st:'תאריך התחלה נבחר',tapend:'כעת בחרו תאריך סיום (אותו תאריך שוב = יום אחד).',dys:'{n} ימים נבחרו',d1:'יום אחד נבחר',status:'סטטוס',sv:'שמירת שינויים',cn:'ביטול',saving:'שומר…',saved:'נשמר',nosv:'השמירה נכשלה. נסו שוב.',sess:'ההתחברות פגה. יש להתחבר מחדש.',cont:'כבר מחוברים.',ctn:'המשך כבעלים',ldg:'טוען זמינות…',lde:'לא ניתן לטעון את הזמינות.',retry:'נסו שוב',bye:'התנתקתם'},
de:{home:'Start',suites:'Suiten',avail:'Verfügbarkeit',contact:'Kontakt',intro:'Zwei Suiten — sehen Sie, welche Termine frei sind.',suite:'Suite',guests:'{n} Gäste',free:'Frei',res:'Reserviert',wa:'WhatsApp',em:'E-Mail',own:'Eigentümer-Login',ey1:'Zwei Suiten',ey2:'Termine prüfen',lang:'Sprache',
ol:'Eigentümer-Login',em_:'E-Mail',pw:'Passwort',si:'Anmelden',bad:'E-Mail oder Passwort falsch.',both:'Bitte E-Mail und Passwort eingeben.',many:'Zu viele Versuche. Bitte einige Minuten warten.',conn:'Verbindungsproblem. Bitte erneut versuchen.',sd:'Starttag',ed:'Endtag',cl:'Schließen',od:'Eigentümer-Bereich',lo:'Abmelden',idle:'Starttag antippen.',st:'Starttag gewählt',tapend:'Jetzt den Endtag antippen (denselben Tag erneut = ein Tag).',dys:'{n} Tage gewählt',d1:'1 Tag gewählt',status:'Status',sv:'Änderungen speichern',cn:'Abbrechen',saving:'Speichert…',saved:'Gespeichert',nosv:'Speichern fehlgeschlagen. Bitte erneut versuchen.',sess:'Sitzung beendet. Bitte erneut anmelden.',cont:'Sie sind bereits angemeldet.',ctn:'Als Eigentümer fortfahren',ldg:'Verfügbarkeit wird geladen…',lde:'Verfügbarkeit konnte nicht geladen werden.',retry:'Erneut versuchen',bye:'Abgemeldet'}};
const IMG={script:'/script.png',a:[1,2,3,4,5].map(i=>`/a${i}.jpg`),b:[1,2,3,4,5].map(i=>`/b${i}.jpg`)};
const LOC={en:'en-US',he:'he-IL',de:'de-DE'},P={s1:['1–4','$150–$180',IMG.b,'A1'],s2:['1–6','$160–$245',IMG.a,'A2']};
const saved=ss('lang');let lang=LOC[saved]?saved:'en',suite=ss('suite')=='s2'?'s2':'s1';
let S={s1:new Set(),s2:new Set()},loaded=0,state='loading',pubDirty=false,D=null,OV=null;
const L=()=>T[lang];
const now=new Date(),ty=now.getFullYear(),tm=now.getMonth();let vy=ty,vm=tm;
const k=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),todayK=k(ty,tm,now.getDate());
const MONTHS_OK=(y,m)=>y*12+m>=ty*12+tm&&y*12+m<=2032*12+11;
// cached formatters (created once)
const fcache={},F=(key,loc,o)=>fcache[key+loc]||(fcache[key+loc]=new Intl.DateTimeFormat(loc,o));
const monthF=l=>F('m',LOC[l],{month:'long',year:'numeric'}),dayF=l=>F('d',LOC[l],{month:'long',day:'numeric',year:'numeric'});
const hf=new Intl.DateTimeFormat('he-u-ca-hebrew',{day:'numeric',month:'long'}),hc={};
const gem=n=>{const t=['','י','כ','ל'],o=['','א','ב','ג','ד','ה','ו','ז','ח','ט'];const s=n==15?'טו':n==16?'טז':t[Math.floor(n/10)]+o[n%10];return s.length>1?s.slice(0,-1)+'״'+s.slice(-1):s+'׳'};
const heb=(y,m,d)=>{const q=k(y,m,d);if(hc[q])return hc[q];const p=hf.formatToParts(new Date(y,m,d,12));return hc[q]=gem(+p.find(x=>x.type=='day').value)+' '+p.find(x=>x.type=='month').value};
const cells=(y,m,set,lab)=>{const fd=new Date(y,m,1).getDay(),dn=new Date(y,m+1,0).getDate();let h='';for(let d=1;d<=dn;d++){const q=k(y,m,d),r=set.has(q);h+=`<div class="d${q<todayK?' p':''}${q==todayK?' t':''}${r?' r':''}" data-q="${q}"${r?` aria-label="${d}, ${lab}"`:''}${d==1?` style="grid-column-start:${fd+1}"`:''}><span class="n">${d}</span><span class="h">${heb(y,m,d)}</span></div>`}return h};
const wds=l=>{const f=F('w',LOC[l],{weekday:l=='he'?'narrow':'short'});let h='';for(let i=0;i<7;i++)h+='<div class="wd">'+f.format(new Date(2023,0,1+i))+'</div>';return h};

$('#app').innerHTML=`<header class="top"><a class="brand" href="#home"><b>MAON SUITES</b><i>President &amp; Kingston</i></a><button id="mb" aria-label="Menu" aria-expanded="false"><span></span><span></span></button></header>
<nav id="menu" aria-hidden="true"><a class="l" href="#home" data-k="home"></a><a class="l" href="#suites" data-k="suites"></a><a class="l" href="#availability" data-k="avail"></a><a class="l" href="#contact" data-k="contact"></a><div class="langs" role="group"><button data-l="en">English</button><button data-l="he">עברית</button><button data-l="de">Deutsch</button></div><button id="ownbtn" data-k="own"></button></nav>
<section id="home" class="hero" style="max-width:none"><div class="bh">ב״ה</div><h1>MAON SUITES</h1><img class="script" src="${IMG.script}" alt="President &amp; Kingston"><p class="intro" data-k="intro"></p><div class="cue"></div></section>
<section id="suites"><p class="ey rv" data-k="ey1"></p><h2 class="rv" data-k="suites"></h2><div class="suites">${['s1','s2'].map((s,i)=>`<article class="rv"><div class="gal"><div class="m"><img id="m${s}" src="${P[s][2][0]}" alt=""></div>${P[s][2].map((u,j)=>`<button data-s="${s}" data-j="${j}" class="${j?'':'on'}" aria-label="${i+1}.${j+1}"><img src="${u}" alt="" decoding="async" loading="lazy"></button>`).join('')}</div><div class="info"><h3><span data-k="suite"></span> ${i+1}</h3><div class="meta"><span class="gs" data-n="${P[s][0]}"></span><s></s><span>${P[s][1]}</span></div><ul id="am${s}"></ul></div></article>`).join('')}</div></section>
<section id="availability"><p class="ey rv" data-k="ey2"></p><h2 class="rv" data-k="avail"></h2><div class="tabs"><button data-t="s1"></button><button data-t="s2"></button></div><div class="cal rv" id="cal"><div class="cn"><button id="pv" aria-label="‹">‹</button><h3 id="mt"></h3><button id="nx" aria-label="›">›</button></div><div class="grid ld" id="gr"></div><p class="ldm" id="ldm"></p><div class="lg"><span><i></i><em data-k="free"></em></span><span><i class="r"></i><em data-k="res"></em></span></div></div></section>
<footer id="contact"><h2 style="margin-bottom:0" data-k="contact"></h2><div class="row"><div><small data-k="wa"></small><a href="https://wa.me/18433851094">843-385-1094</a></div><div><small data-k="em"></small><a href="mailto:ch.short.term.rentals@gmail.com">ch.short.term.rentals@gmail.com</a></div></div></footer><div id="toast" role="status"></div>`;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('o');clearTimeout(toast.i);toast.i=setTimeout(()=>t.classList.remove('o'),2600)};

// ---------- public side (read-only) ----------
function setLang(l){lang=l;ss('lang',l);const t=T[l];const de=document.documentElement;de.lang=l;de.dir=l=='he'?'rtl':'ltr';
$$('[data-k]').forEach(e=>e.textContent=t[e.dataset.k]);$$('.gs').forEach(e=>e.textContent=t.guests.replace('{n}',e.dataset.n));
['s1','s2'].forEach(s=>$('#am'+s).innerHTML=AM[l][P[s][3]].map(x=>'<li>'+x+'</li>').join(''));
$$('[data-t]').forEach(b=>b.textContent=t.suite+' '+b.dataset.t[1]);$$('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l==l));$('#mb').setAttribute('aria-label',t.home);cal()}
function cal(){const t=L();$$('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==suite));$('#mt').textContent=monthF(lang).format(new Date(vy,vm,1));
$('#pv').disabled=vy==ty&&vm==tm;$('#nx').disabled=vy==2032&&vm==11;
const g=$('#gr');g.classList.toggle('ld',state!='ok');g.innerHTML=wds(lang)+cells(vy,vm,S[suite],t.res);
const m=$('#ldm');m.textContent=state=='loading'?t.ldg:state=='error'?t.lde+' ':'';
if(state=='error'){const b=document.createElement('button');b.textContent=t.retry;b.onclick=load;m.append(b)}}
function mv(n){let m=vm+n,y=vy;if(m<0){m=11;y--}if(m>11){m=0;y++}if(!MONTHS_OK(y,m))return;vy=y;vm=m;cal()}
$('#pv').onclick=()=>mv(-1);$('#nx').onclick=()=>mv(1);
$$('[data-t]').forEach(b=>b.onclick=()=>{suite=b.dataset.t;ss('suite',suite);cal()});
$$('[data-l]').forEach(b=>b.onclick=()=>setLang(b.dataset.l));
const gtok={};$$('.gal button').forEach(b=>b.onclick=()=>{const s=b.dataset.s,i=$('#m'+s),tk=gtok[s]=(gtok[s]||0)+1;i.style.opacity=0;setTimeout(()=>{if(gtok[s]!=tk)return;i.src=P[s][2][b.dataset.j];i.style.opacity=1},160);$$('.gal button[data-s="'+s+'"]').forEach(x=>x.classList.toggle('on',x==b))});
const mn=$('#menu'),mb=$('#mb'),tg=o=>{mn.classList.toggle('o',o);mb.classList.toggle('o',o);mb.setAttribute('aria-expanded',o);mn.setAttribute('aria-hidden',!o)};
mb.onclick=()=>tg(!mn.classList.contains('o'));$$('#menu a').forEach(a=>a.onclick=()=>tg(false));
let sc0=false;addEventListener('scroll',()=>{const v=scrollY>20;if(v!==sc0){sc0=v;$('.top').classList.toggle('sc',v)}},{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});$$('.rv').forEach(e=>io.observe(e));
const api=(p,b)=>fetch(p,b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b),credentials:'same-origin'}:{cache:'no-store',credentials:'same-origin'});
const apply=d=>{S={s1:new Set(d.s1),s2:new Set(d.s2)};state='ok';loaded=Date.now()};
async function load(){if(state!='ok'){state='loading';cal()}try{const r=await api('/api/availability');if(!r.ok)throw 0;apply(await r.json())}catch(e){if(state!='ok')state='error'}if(!OV)cal();else pubDirty=true}
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(k(...(d=>[d.getFullYear(),d.getMonth(),d.getDate()])(new Date()))!=todayK){location.reload();return}if(!OV&&Date.now()-loaded>60000)load()});

// ---------- overlays (login / dashboard): one at a time, back button closes ----------
function lock(on){document.body.style.overflow=on?'hidden':''}
function rmOv(){if(!OV)return;OV.el.remove();OV=null;D=null;lock(false);if(pubDirty){pubDirty=false;cal()}}
function closeOv(){rmOv();if(history.state&&history.state.ov)history.back()}
function openOv(el){if(OV){OV.el.remove();OV.el=el}else{history.pushState({ov:1},'');OV={el}}document.body.append(el);lock(true);const f=el.querySelector('input,button');f&&f.focus({preventScroll:true})}
addEventListener('popstate',()=>{if(OV)rmOv()});
addEventListener('keydown',e=>{if(e.key!='Escape')return;if(OV)closeOv();else if(mn.classList.contains('o'))tg(false)});
const mk=h=>{const d=document.createElement('div');d.innerHTML=h;return d.firstElementChild};

// ---------- owner: login screen (ALWAYS shown first) ----------
$('#ownbtn').onclick=()=>{tg(false);showLogin()};
function showLogin(msg){const t=L();
const el=mk(`<div id="login" role="dialog" aria-modal="true" aria-label="${t.ol}"><div class="pane"><div class="hd"><span class="serif brandsm">MAON SUITES</span><button id="lx" type="button">${t.cl}</button></div><h2>${t.ol}</h2><div id="lc"></div><form class="f" id="lf" novalidate><label for="le">${t.em_}</label><input id="le" name="email" type="email" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="email"><label for="lp">${t.pw}</label><input id="lp" name="password" type="password" autocomplete="current-password"><div class="err" id="lr" role="alert"></div><button class="big" id="ls" type="submit">${t.si}</button></form></div></div>`);
openOv(el);if(msg)el.querySelector('#lr').textContent=msg;
el.querySelector('#lx').onclick=closeOv;
// if a valid session already exists, offer (never force) continuing
api('/api/me').then(r=>r.json()).then(j=>{if(!j.auth||!OV||OV.el!==el)return;const c=el.querySelector('#lc');c.innerHTML=`<div class="ctn"><p>${t.cont}</p><button class="big" id="lcc" type="button">${t.ctn}</button><button class="lnk" id="lcl" type="button">${t.lo}</button></div>`;
c.querySelector('#lcc').onclick=()=>showDash();c.querySelector('#lcl').onclick=async()=>{try{await api('/api/logout',{})}catch(e){}c.innerHTML='';toast(t.bye)}}).catch(()=>{});
el.querySelector('#lf').onsubmit=async e=>{e.preventDefault();const em=el.querySelector('#le').value.trim(),pw=el.querySelector('#lp').value,r=el.querySelector('#lr'),b=el.querySelector('#ls');
if(!em||!pw){r.textContent=t.both;return}b.disabled=true;r.textContent='';
try{const x=await api('/api/login',{email:em,password:pw});el.querySelector('#lp').value='';
if(x.ok){showDash();return}r.textContent=x.status==429?t.many:t.bad}catch(err){r.textContent=t.conn}b.disabled=false}}

// ---------- owner: dashboard (built only after the server accepted a login / confirmed the session) ----------
function showDash(){const t=L();
const el=mk(`<div id="dash" role="dialog" aria-modal="true" aria-label="${t.od}"><div class="pane"><div class="hd"><span class="serif brandsm">MAON SUITES</span><button id="dlo" type="button">${t.lo}</button></div><h2>${t.od}</h2>
<div class="two" id="dt"><button data-s="s1" type="button">${t.suite} 1</button><button data-s="s2" type="button">${t.suite} 2</button></div>
<div class="cn"><button id="dpv" type="button" aria-label="‹">‹</button><h3 id="dm"></h3><button id="dnx" type="button" aria-label="›">›</button></div><div class="grid" id="dg"></div>
<div class="card"><div class="step" id="cs"></div><div class="pvw" id="cp"></div><div class="stt" id="cv"></div><div id="cx" hidden><div class="lbl">${t.status}</div><div class="two" id="dst"><button data-v="reserved" type="button">${t.res}</button><button data-v="available" type="button">${t.free}</button></div></div><div class="row" id="cr" hidden><button id="dcn" type="button">${t.cn}</button><button class="pr" id="dsv" type="button">${t.sv}</button></div></div></div></div>`);
openOv(el);const q=s=>el.querySelector(s);
D={s:suite,y:vy,m:vm,a:null,b:null,v:null,busy:false,cells:[]};const Dd=D;
const span=()=>Math.round((Date.parse(D.b)-Date.parse(D.a))/864e5)+1;
const fmt=s=>{const[y,m,d]=s.split('-').map(Number);return dayF(lang).format(new Date(y,m-1,d))};
const md=s=>{const[y,m,d]=s.split('-').map(Number);return F('md',LOC[lang],{month:'long',day:'numeric'}).format(new Date(y,m-1,d))};const rng=()=>D.a==D.b?fmt(D.a):D.a.slice(0,4)==D.b.slice(0,4)?md(D.a)+' – '+md(D.b)+', '+D.a.slice(0,4):fmt(D.a)+' – '+fmt(D.b);
function paint(){const a=D.a,b=D.b||D.a;for(const c of D.cells){const s=c.dataset.q,on=!!a&&s>=a&&s<=b,e=c.classList;e.toggle('g',on);e.toggle('s',s===a);e.toggle('z',!!D.b&&s===D.b&&D.b!==a)}
q('#dt').childNodes.forEach(x=>x.classList.toggle('on',x.dataset.s==D.s));q('#dst').childNodes.forEach(x=>x.classList.toggle('on',x.dataset.v==D.v));
const hasA=!!D.a,hasB=!!D.b;q('#cr').hidden=!hasA;q('#cx').hidden=!hasB;q('#dsv').disabled=!(hasB&&D.v)||D.busy;q('#dsv').hidden=!hasB;
q('#cs').textContent=!hasA?t.idle:!hasB?t.st+': '+fmt(D.a):t.sd+': '+fmt(D.a)+'  →  '+t.ed+': '+fmt(D.b);q('#cp').textContent=!hasA?'':!hasB?t.tapend:rng()+' — '+(span()==1?t.d1:t.dys.replace('{n}',span()));q('#cv').textContent=hasB&&D.v?(D.v=='reserved'?t.res:t.free).toUpperCase():''}
function month(){q('#dm').textContent=monthF(lang).format(new Date(D.y,D.m,1));q('#dpv').disabled=D.y==ty&&D.m==tm;q('#dnx').disabled=D.y==2032&&D.m==11;
q('#dg').innerHTML=wds(lang)+cells(D.y,D.m,S[D.s],t.res);D.cells=[...q('#dg').querySelectorAll('.d')];paint()}
q('#dg').onclick=e=>{const c=e.target.closest('.d');if(!c||D.busy)return;const s=c.dataset.q;if(!D.a||D.b){D.a=s;D.b=null}else{D.b=s;if(D.b<D.a)[D.a,D.b]=[D.b,D.a]}D.v=null;paint()};
q('#dt').onclick=e=>{const b=e.target.closest('button');if(!b||b.dataset.s==D.s||D.busy)return;D.s=b.dataset.s;D.a=D.b=null;D.v=null;month()};
q('#dst').onclick=e=>{const b=e.target.closest('button');if(b){D.v=b.dataset.v;paint()}};
const nav=n=>{let m=D.m+n,y=D.y;if(m<0){m=11;y--}if(m>11){m=0;y++}if(!MONTHS_OK(y,m))return;D.y=y;D.m=m;month()};
q('#dpv').onclick=()=>nav(-1);q('#dnx').onclick=()=>nav(1);q('#dcn').onclick=()=>{D.a=D.b=null;D.v=null;paint()};
q('#dlo').onclick=async()=>{try{await api('/api/logout',{})}catch(e){}closeOv();toast(t.bye)};
q('#dsv').onclick=async()=>{if(D.busy||!D.a||!D.b||!D.v)return;D.busy=true;const btn=q('#dsv');btn.textContent=t.saving;btn.disabled=true;
try{const x=await api('/api/availability',{suite:D.s,from:D.a,to:D.b,status:D.v});
if(x.status==401){rmOv();showLogin(t.sess);return}
if(!x.ok)throw 0;apply(await x.json());pubDirty=true;D.a=D.b=null;D.v=null;month();toast(t.saved)}
catch(e){toast(t.nosv)}finally{if(D===Dd){D.busy=false;btn.textContent=t.sv;paint()}}};
month()}
setLang(lang);load();
})();
