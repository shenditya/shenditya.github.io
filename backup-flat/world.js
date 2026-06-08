/* ===========================================================
   Shendy's World — parallax side-scroller engine (vanilla JS)
   =========================================================== */
(function(){
  "use strict";

  /* Live, tweakable config (Tweaks panel writes to this object) */
  window.WORLD = Object.assign({
    walkSpeed:42, jumpHeight:130, jumpDur:560, parallax:1, coins:true, sound:true
  }, window.WORLD||{});

  /* ---------------- Data ---------------- */
  const PROJECTS = [
    {n:"01", title:"JakLingko SuperApp", client:"PT. JakLingko Indonesia",
     cover:"assets/jaklingko1.png", shots:["assets/jaklingko1.png","assets/jaklingko2.png"],
     desc:"Integrated public-transport super-app for Jakarta — trip planning, fares and NFC tap-to-pay across modes.",
     stack:["Swift","RxSwift","Moya","CoreNFC","GoogleMaps","GooglePlaces","UIKit","MVVM"]},
    {n:"02", title:"mCampus", client:"PT. Solusi Kampus Indonesia",
     cover:"assets/mcampus1.png", shots:["assets/mcampus1.png","assets/mcampus2.png"],
     desc:"Campus companion app connecting students with schedules, academics and campus services.",
     stack:["Swift","RxSwift","Moya","REST","UIKit","MVVM"]},
    {n:"03", title:"Safe Travel", client:"Ministry of Foreign Affairs, Indonesia",
     cover:"assets/safetravel1.png", shots:["assets/safetravel1.png","assets/safetravel2.png","assets/safetravel3.png"],
     desc:"Official travel-safety app for Indonesian citizens abroad — embassy info, alerts and live location help.",
     stack:["Swift","REST","UIKit","MapKit","MVC"]},
    {n:"04", title:"Solo Destination", client:"Diskominfo Kota Surakarta",
     cover:"assets/soldes1.png", shots:["assets/soldes1.png","assets/soldes2.png","assets/soldes3.png"],
     desc:"City tourism guide for Surakarta (Solo) — destinations, culture, events and maps for visitors.",
     stack:["Swift","REST","UIKit","MapKit","MVC"]},
    {n:"05", title:"Jogja Istimewa", client:"Pemerintah Daerah Istimewa Yogyakarta",
     cover:"assets/jogjis.jpeg", shots:["assets/jogjis.jpeg"],
     desc:"Official app of the Yogyakarta Special Region — public services, news and regional information.",
     stack:["Swift","REST","UIKit","MapKit","MVC"]},
    {n:"06", title:"PIHPS Harga Pangan", client:"Bank Indonesia (Central Bank)",
     cover:"assets/pihps.jpeg", shots:["assets/pihps.jpeg"],
     desc:"National food-price information system surfacing real-time commodity prices across Indonesian markets.",
     stack:["Swift","REST","UIKit","MVC"]}
  ];

  const SKILLS = ["Swift","RxSwift","UIKit","MVVM","REST","Moya","MapKit","CoreNFC","Maps","MVC"];

  /* ---------------- Element refs ---------------- */
  const track   = document.getElementById("scroll-track");
  const player   = document.getElementById("player");
  const layers   = {
    sky:   document.getElementById("layer-sky"),
    far:   document.getElementById("layer-far"),
    mid:   document.getElementById("layer-mid"),
    near:  document.getElementById("layer-near"),
    fore:  document.getElementById("layer-fore")
  };
  const nearInner = document.getElementById("near-inner");
  const foreInner = document.getElementById("fore-inner");
  const midInner  = document.getElementById("mid-inner");
  const farInner  = document.getElementById("far-inner");
  const progressBar = document.getElementById("progress-bar");
  const progressMarker = document.getElementById("progress-marker");
  const coinCountEl = document.getElementById("coin-count");
  const navChips = document.getElementById("nav-chips");

  /* ---------------- Layout config ---------------- */
  // Parallax factors (0 = static far, 1 = moves with camera)
  const FACTOR = {sky:0.05, far:0.2, mid:0.5, near:1.0, fore:1.45};

  let vw = window.innerWidth, vh = window.innerHeight;
  let stops = [];      // {id,label,worldX}
  let worldLength = 1; // camera travel distance in px
  let coins = [];      // {el,worldX,collected}
  let billboards = []; // {el,worldX,project}

  function gap(){ return Math.max(660, vw*0.82); }

  // Order of stops along the world
  const SECTION_ORDER = [
    {id:"home",  label:"Home"},
    {id:"about", label:"About"},
    {id:"skills",label:"Skills"},
    {id:"p1",label:"Work"},{id:"p2"},{id:"p3"},{id:"p4"},{id:"p5"},{id:"p6"},
    {id:"contact",label:"Contact"}
  ];

  /* ---------------- Build the world ---------------- */
  function buildScenery(){
    // Clouds on sky + far layers
    const skyInner = document.getElementById("sky-inner");
    skyInner.innerHTML = "";
    const cloudDefs = [
      {x:280,y:90,s:1.2},{x:900,y:150,s:0.8},{x:1500,y:70,s:1.4},
      {x:2200,y:130,s:1.0},{x:2900,y:90,s:1.1},{x:3600,y:160,s:0.9},
      {x:4300,y:80,s:1.3},{x:5100,y:140,s:1.0},{x:5900,y:100,s:1.2},
      {x:6700,y:150,s:0.85},{x:7400,y:90,s:1.15}
    ];
    cloudDefs.forEach(c=>skyInner.appendChild(makeCloud(c.x,c.y,c.s)));

    // Far hills
    farInner.innerHTML = "";
    for(let i=0;i<14;i++){
      const h=document.createElement("div");h.className="hill";
      const w=420+(i%3)*120, ht=180+(i%4)*60;
      h.style.cssText=`left:${i*560 - 100}px;width:${w}px;height:${ht}px;background:var(--hill-far);opacity:.7;`;
      farInner.appendChild(h);
    }
    // Mid hills + trees
    midInner.innerHTML = "";
    for(let i=0;i<16;i++){
      const h=document.createElement("div");h.className="hill";
      const w=360+(i%3)*100, ht=150+(i%3)*70;
      h.style.cssText=`left:${i*520 - 60}px;width:${w}px;height:${ht}px;background:var(--hill-mid);`;
      midInner.appendChild(h);
    }
    for(let i=0;i<18;i++){
      midInner.appendChild(makeTree(i*460 + 220, 0.8 + (i%3)*0.18));
    }
    // Foreground bushes + pipes
    foreInner.innerHTML = "";
    for(let i=0;i<26;i++){
      const b=document.createElement("div");b.className="bush";
      const w=120+(i%4)*60;
      b.style.cssText=`left:${i*380 + 40}px;width:${w}px;height:${w*0.6}px;`;
      foreInner.appendChild(b);
    }
  }

  function makeCloud(x,y,s){
    const c=document.createElement("div");c.className="cloud";
    c.style.cssText=`left:${x}px;top:${y}px;transform:scale(${s});`;
    const base=document.createElement("span");base.className="c-base";
    base.style.cssText="left:0;top:18px;width:150px;";
    const b1=document.createElement("span");b1.style.cssText="left:18px;top:0;width:54px;height:54px;";
    const b2=document.createElement("span");b2.style.cssText="left:60px;top:-10px;width:70px;height:70px;";
    const b3=document.createElement("span");b3.style.cssText="left:104px;top:4px;width:50px;height:50px;";
    c.append(base,b1,b2,b3);return c;
  }
  function makeTree(x,s){
    const t=document.createElement("div");t.className="tree";
    t.style.cssText=`left:${x}px;transform:scale(${s});`;
    const trunk=document.createElement("div");trunk.className="trunk";trunk.style.height="120px";
    const leaves=document.createElement("div");leaves.className="leaves";
    leaves.style.cssText="bottom:96px;width:140px;height:140px;";
    t.append(trunk,leaves);return t;
  }

  /* ---------------- Stops (content) ---------------- */
  function buildStops(){
    nearInner.querySelectorAll(".stop,.flagpole").forEach(e=>e.remove());
    stops = [];
    billboards = [];
    let idx = 0;
    const baseX = vw/2;

    SECTION_ORDER.forEach((sec)=>{
      const worldX = baseX + idx*gap();
      let el;
      if(sec.id==="home")        el = heroPanel();
      else if(sec.id==="about")  el = aboutPanel();
      else if(sec.id==="skills") el = skillsPanel();
      else if(sec.id==="contact")el = contactStop(worldX);
      else { // project
        const p = PROJECTS[parseInt(sec.id.slice(1))-1];
        el = billboardEl(p);
      }
      if(el && el.classList.contains("flagpole")){
        el.style.left = worldX+"px"; nearInner.appendChild(el);
      } else if(el){
        el.classList.add("stop"); el.style.left = worldX+"px"; nearInner.appendChild(el);
      }
      stops.push({id:sec.id, label:sec.label, worldX, el});
      idx++;
    });

    worldLength = (idx-1)*gap();
    buildCoins();
    buildNavChips();
  }

  function heroPanel(){
    const d=document.createElement("div");
    d.innerHTML = `<div class="panel" style="width:600px">
      <div class="hero-portrait"><img src="assets/Man.gif" alt="Shendy Aditya"></div>
      <div class="kicker pixel">PLAYER 1 — READY</div>
      <h1>Shendy Aditya&nbsp;S.</h1>
      <p class="lead">Mobile Apps Developer · iOS / Swift</p>
      <p style="margin-top:8px">I build production iOS apps for governments and companies across Indonesia.
      Use the arrow keys or scroll to walk through my world →</p>
      <div class="post"></div>
    </div>`;
    return d;
  }
  function aboutPanel(){
    const d=document.createElement("div");
    d.innerHTML = `<div class="panel">
      <div class="kicker pixel">LEVEL 1 — ABOUT</div>
      <h2>Nice to meet you 👋</h2>
      <p>I'm an iOS developer specialising in clean, maintainable Swift apps using
      <b>RxSwift</b> and <b>MVVM</b>. Over the years I've shipped public-service and
      enterprise apps used by thousands — from transit payments to national price indices.</p>
      <div class="chiprow">
        <span class="chip grape">6 shipped apps</span>
        <span class="chip">iOS · Swift</span>
        <span class="chip">Reactive · MVVM</span>
      </div>
      <div class="post"></div>
    </div>`;
    return d;
  }
  function skillsPanel(){
    const d=document.createElement("div");
    const bricks = SKILLS.map(s=>`<div class="brick">${s}</div>`).join("");
    d.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:16px">
      <div class="panel" style="width:520px;margin-bottom:6px">
        <div class="kicker pixel">LEVEL 2 — TOOLKIT</div>
        <h2>Power-ups I carry</h2>
        <p>The tech stack behind the apps. Hit a brick!</p>
      </div>
      <div class="brickrow">${bricks}</div>
    </div>`;
    return d;
  }
  function billboardEl(p){
    const d=document.createElement("div");d.className="billboard";
    d.dataset.title = p.title;
    d.innerHTML = `
      <div class="bounce-hint">▲ CLICK TO ENTER</div>
      <div class="bb-num pixel">${p.n}</div>
      <div class="bb-frame">
        <div class="bb-screen"><img src="${p.cover}" alt="${p.title}"></div>
        <div class="bb-title">${p.title}</div>
        <div class="bb-client">${p.client}</div>
        <div class="bb-cta">▶ VIEW PROJECT</div>
      </div>
      <div class="bb-legs"><span></span><span></span></div>`;
    d.addEventListener("click", ()=>{ openModal(p); sfx("open"); });
    billboards.push({el:d, project:p});
    return d;
  }
  function contactStop(worldX){
    const pole=document.createElement("div");pole.className="flagpole";
    pole.innerHTML=`<div class="ball"></div><div class="flag"></div>`;
    // contact panel sits just before the pole
    const panel=document.createElement("div");panel.className="stop";
    panel.style.left=(worldX-220)+"px";
    panel.innerHTML=`<div class="panel" style="width:460px">
      <div class="kicker pixel">FINAL — CONTACT</div>
      <h2>You reached the flag! 🏁</h2>
      <p>Thanks for walking through. Let's build something together.</p>
      <div class="chiprow">
        <a class="chip grape" href="https://github.com/shenditya" target="_blank" rel="noopener">GitHub ↗</a>
        <a class="chip" href="#" data-fill="linkedin">LinkedIn ↗</a>
        <a class="chip" href="#" data-fill="email">Email ↗</a>
      </div>
      <div class="post"></div></div>`;
    nearInner.appendChild(panel);
    return pole;
  }

  /* ---------------- Coins ---------------- */
  function buildCoins(){
    nearInner.querySelectorAll(".coin").forEach(c=>c.remove());
    coins = [];
    for(let i=0;i<stops.length-1;i++){
      const a=stops[i].worldX, b=stops[i+1].worldX;
      const n=5, base=30, arc=170; // coins arc up so the middle ones need a jump
      for(let k=1;k<=n;k++){
        const wx = a + (b-a)*(k/(n+1));
        const c=document.createElement("div");c.className="coin pixel";c.textContent="$";
        const y = Math.round(base + arc*Math.sin(Math.PI*k/(n+1)));
        if(y>150) c.classList.add("high"); // visual cue: needs a jump
        c.style.cssText=`left:${wx}px;bottom:calc(var(--ground-h) + ${y}px);`;
        nearInner.appendChild(c);
        coins.push({el:c, worldX:wx, y:y, collected:false});
      }
    }
  }

  /* ---------------- Nav chips ---------------- */
  function buildNavChips(){
    navChips.innerHTML="";
    stops.filter(s=>s.label).forEach(s=>{
      const b=document.createElement("button");b.textContent=s.label;b.dataset.id=s.id;
      b.addEventListener("click",()=>scrollToStop(s));
      navChips.appendChild(b);
    });
  }
  function scrollToStop(s){
    const p = (s.worldX - vw/2)/worldLength; // 0..1
    const maxScroll = track.offsetHeight - vh;
    window.scrollTo({top: Math.max(0,Math.min(1,p))*maxScroll, behavior:"smooth"});
  }

  /* ---------------- Camera / render ---------------- */
  let cameraX = 0, lastCamera = 0, facing = 1;
  let walkingUntil = 0;
  let isJumping = false;

  function jump(){
    if(isJumping) return;
    ensureAudio();
    isJumping = true;
    player.style.setProperty("--jump-h", window.WORLD.jumpHeight + "px");
    player.style.setProperty("--jump-dur", window.WORLD.jumpDur + "ms");
    player.classList.remove("walking","idle");
    // force reflow so the animation restarts cleanly
    player.classList.remove("jumping"); void player.offsetWidth;
    player.classList.add("jumping");
    sfx("jump");
    setTimeout(()=>{ player.classList.remove("jumping"); isJumping=false; }, window.WORLD.jumpDur);
  }
  window.WorldJump = jump;
  player.addEventListener("click", jump);

  function render(){
    const maxScroll = track.offsetHeight - vh;
    const p = maxScroll>0 ? (window.scrollY/maxScroll) : 0;
    cameraX = p * worldLength;

    // move layers (parallax depth scaled by tweak)
    const P = window.WORLD.parallax;
    layers.sky.style.transform  = `translateX(${-cameraX*FACTOR.sky*P}px)`;
    layers.far.style.transform  = `translateX(${-cameraX*FACTOR.far*P}px)`;
    layers.mid.style.transform  = `translateX(${-cameraX*FACTOR.mid*P}px)`;
    layers.near.style.transform = `translateX(${-cameraX*FACTOR.near}px)`;
    layers.fore.style.transform = `translateX(${-cameraX*FACTOR.fore*P}px)`;

    // progress HUD
    progressBar.style.width = (p*100).toFixed(2)+"%";
    const trackEl = document.querySelector("#progress-wrap .track");
    if(trackEl){ progressMarker.style.left = (14 + p*(trackEl.offsetWidth)) + "px"; }

    // player facing + walk state
    const delta = cameraX - lastCamera;
    if(Math.abs(delta) > 0.4){
      facing = delta>0 ? 1 : -1;
      walkingUntil = performance.now() + 140;
    }
    lastCamera = cameraX;
    const now = performance.now();
    const walking = now < walkingUntil;
    player.classList.toggle("face-left", facing<0);
    if(!isJumping){
      player.classList.toggle("walking", walking);
      player.classList.toggle("idle", !walking);
    }

    // player screen X (in px)
    const playerScreenX = vw * 0.26;

    // coins: collect only when the player overlaps a coin AND physically reaches it.
    // Low coins are grabbed while walking; high coins require jumping up to them.
    if(window.WORLD.coins){
      const pr = player.getBoundingClientRect();
      for(let ci=0; ci<coins.length; ci++){
        const c = coins[ci];
        if(c.collected) continue;
        const cr = c.el.getBoundingClientRect();
        const overlapX = cr.left < pr.right - 8 && cr.right > pr.left + 8;
        if(!overlapX) continue;
        const reaches = pr.top <= cr.bottom;   // player's head/hands reach the coin
        if(reaches) collectCoin(c);
      }
    }

    // active billboard (nearest to player)
    let best=null, bestDist=Infinity;
    billboards.forEach(b=>{
      const sx = b.elWorldX - cameraX;
      const dist = Math.abs(sx - playerScreenX);
      b.el.classList.toggle("active", false);
      if(dist<bestDist){bestDist=dist;best=b;}
    });
    if(best && bestDist < vw*0.42){ best.el.classList.add("active"); }

    // active nav chip
    const cur = nearestStop(cameraX);
    navChips.querySelectorAll("button").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.id===cur);
    });

    requestAnimationFrame(render);
  }

  function nearestStop(cx){
    let id=null,best=Infinity;
    stops.forEach(s=>{const d=Math.abs(s.worldX - vw/2 - cx);if(d<best){best=d;id=s.id;}});
    return id;
  }

  let coinTotal=0;
  function collectCoin(c){
    c.collected=true;c.el.classList.add("collected");
    coinTotal++;coinCountEl.textContent=String(coinTotal).padStart(2,"0");
    sfx("coin");
    setTimeout(()=>c.el.remove(),360);
  }

  /* ---------------- Cache billboard world positions ---------------- */
  function cacheBillboardX(){
    let bi=0;
    stops.forEach(s=>{
      if(/^p\d$/.test(s.id)){
        if(billboards[bi]) billboards[bi].elWorldX = s.worldX;
        bi++;
      }
    });
  }

  /* ---------------- Sound (WebAudio, gentle) ---------------- */
  let actx=null;
  function ensureAudio(){ if(!actx){ try{actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } }
  function sfx(kind){
    if(!window.WORLD.sound||!actx) return;
    const t=actx.currentTime, o=actx.createOscillator(), g=actx.createGain();
    o.connect(g);g.connect(actx.destination);
    if(kind==="coin"){o.type="square";o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1320,t+0.07);g.gain.setValueAtTime(0.06,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);o.start(t);o.stop(t+0.2);}
    else if(kind==="open"){o.type="triangle";o.frequency.setValueAtTime(523,t);o.frequency.exponentialRampToValueAtTime(1046,t+0.12);g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.22);o.start(t);o.stop(t+0.24);}
    else if(kind==="jump"){o.type="square";o.frequency.setValueAtTime(440,t);o.frequency.exponentialRampToValueAtTime(900,t+0.16);g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);o.start(t);o.stop(t+0.22);}
  }

  /* ---------------- Modal ---------------- */
  const modal=document.getElementById("modal");
  function openModal(p){
    document.getElementById("m-title").textContent=p.title;
    document.getElementById("m-client").textContent=p.client;
    document.getElementById("m-desc").textContent=p.desc;
    document.getElementById("m-shots").innerHTML=p.shots.map(s=>`<img src="${s}" alt="${p.title}">`).join("");
    document.getElementById("m-stack").innerHTML=p.stack.map(s=>`<span class="chip">${s}</span>`).join("");
    modal.classList.add("open");
  }
  function closeModal(){ modal.classList.remove("open"); }
  document.getElementById("m-close").addEventListener("click",closeModal);
  modal.addEventListener("click",e=>{ if(e.target===modal) closeModal(); });

  /* ---------------- Keyboard / buttons ---------------- */
  let keyTimer=null;
  function nudge(dir){
    const maxScroll=track.offsetHeight - vh;
    window.scrollTo({top: Math.max(0,Math.min(maxScroll, window.scrollY + dir*42))});
  }
  function startHold(dir){ ensureAudio(); nudge(dir); keyTimer=setInterval(()=>nudge(dir),16); }
  function stopHold(){ if(keyTimer){clearInterval(keyTimer);keyTimer=null;} }

  window.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closeModal();return;}
    if(modal.classList.contains("open")) return;
    if(e.key==="ArrowRight"||e.key==="d"){ e.preventDefault(); if(!keyTimer) startHold(1); }
    else if(e.key==="ArrowLeft"||e.key==="a"){ e.preventDefault(); if(!keyTimer) startHold(-1); }
    else if(e.key===" "){ // jump (Mario-style)
      e.preventDefault(); jump();
    }
  });
  window.addEventListener("keyup",e=>{ if(["ArrowRight","ArrowLeft","a","d"].includes(e.key)) stopHold(); });

  ["walk-left","walk-right"].forEach(id=>{
    const el=document.getElementById(id); const dir=id==="walk-right"?1:-1;
    el.addEventListener("mousedown",()=>startHold(dir));
    el.addEventListener("touchstart",e=>{e.preventDefault();startHold(dir);},{passive:false});
    ["mouseup","mouseleave","touchend"].forEach(ev=>el.addEventListener(ev,stopHold));
  });

  /* sound toggle */
  document.getElementById("sound-btn").addEventListener("click",function(){
    ensureAudio(); window.WORLD.sound=!window.WORLD.sound; this.textContent = window.WORLD.sound?"🔊 ON":"🔇 OFF";
  });

  /* start overlay */
  const startcard=document.getElementById("startcard");
  document.getElementById("start-btn").addEventListener("click",()=>{
    ensureAudio();
    startcard.style.opacity="0";
    setTimeout(()=>startcard.style.display="none",500);
  });

  /* ---------------- Resize ---------------- */
  function layout(){
    vw=window.innerWidth; vh=window.innerHeight;
    buildStops();
    cacheBillboardX();
  }
  let rT=null;
  window.addEventListener("resize",()=>{clearTimeout(rT);rT=setTimeout(layout,180);});

  /* ---------------- Init ---------------- */
  function init(){
    buildScenery();
    layout();
    requestAnimationFrame(render);
  }
  if(document.readyState!=="loading") init();
  else document.addEventListener("DOMContentLoaded",init);

})();
