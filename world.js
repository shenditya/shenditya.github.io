/* ===========================================================
   Shendy's World — parallax side-scroller engine (vanilla JS)
   =========================================================== */
(function(){
  "use strict";

  /* Live, tweakable config (Tweaks panel writes to this object) */
  window.WORLD = Object.assign({
    walkSpeed:7, runSpeed:14, jumpHeight:130, jumpDur:560, parallax:1, coins:true, sound:true
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
  const progressBar = document.getElementById("progress-bar");
  const progressMarker = document.getElementById("progress-marker");
  const coinCountEl = document.getElementById("coin-count");
  const navChips = document.getElementById("nav-chips");
  const walkRightBtn = document.getElementById("walk-right");

  /* ---------------- Layout config ---------------- */
  // Parallax factors (0 = static far, 1 = moves with camera)
  const FACTOR = {sky:0.05, far:0.2, mid:0.5, near:1.0, fore:1.45};

  let vw = window.innerWidth, vh = window.innerHeight;
  let stops = [];      // {id,label,worldX}
  let worldLength = 1; // camera travel distance in px
  let coins = [];      // {el,worldX,collected}
  let billboards = []; // {el,worldX,project}
  let contactPanelEl = null, contactFlagEl = null;

  function gap(){ return Math.max(420, vw*0.52); }

  // Order of stops along the world
  const SECTION_ORDER = [
    {id:"home",  label:"Home"},
    {id:"about", label:"About"},
    {id:"skills",label:"Skills"},
    {id:"p1",label:"Work"},{id:"p2"},{id:"p3"},{id:"p4"},{id:"p5"},{id:"p6"},
    {id:"contact",label:"Contact"}
  ];

  /* Scenery is now drawn with tiled pixel-art background layers (CSS),
     parallaxed via background-position in render(). Nothing to build here. */
  function buildScenery(){ /* no-op (pixel background layers) */ }

  /* ---------------- Stops (content) ---------------- */
  function buildStops(){
    nearInner.querySelectorAll(".stop,.flagpole").forEach(e=>e.remove());
    stops = [];
    billboards = [];
    let pos = 0;
    const baseX = vw/2, G = gap();

    SECTION_ORDER.forEach((sec)=>{
      const worldX = baseX + pos*G;
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
      // variable advance: wide text panels need more room; billboards stay tight
      const ADV={home:1.35, about:1.3, skills:1.15,
                 p1:0.95, p2:0.95, p3:0.95, p4:0.95, p5:0.95, p6:1.7, contact:0};
      pos += (ADV[sec.id]!=null ? ADV[sec.id] : 1);
    });

    worldLength = stops[stops.length-1].worldX - baseX;
    // Finish framing (camera locks here): contact panel on the LEFT, flag right at the
    // avatar's final walk position so the character reaches it exactly
    if(contactPanelEl) contactPanelEl.style.left = Math.round(vw*0.30 + worldLength) + "px";
    if(contactFlagEl)  contactFlagEl.style.left  = Math.round(vw*0.58 + worldLength) + "px";
    buildCoins();
    buildNavChips();
  }

  function heroPanel(){
    const d=document.createElement("div");
    d.innerHTML = `<div class="panel" style="width:600px">
      <div class="hero-portrait"><img src="assets/shendy.gif" alt="Shendy Aditya"></div>
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
    // Panel + flag are positioned later (in buildStops, once worldLength/tail is known)
    // so the avatar arrives beside the panel with the flag at its feet.
    const panel=document.createElement("div");panel.className="stop";
    panel.innerHTML=`<div class="panel" style="width:460px">
      <div class="kicker pixel">FINAL — CONTACT</div>
      <h2>You reached the flag! 🏁</h2>
      <p>Thanks for walking through. Let's build something together.</p>
      <div class="chiprow">
        <a class="chip grape" href="https://id.linkedin.com/in/shendyaditya" target="_blank" rel="noopener">LinkedIn ↗</a>
        <a class="chip" href="https://github.com/shenditya" target="_blank" rel="noopener">GitHub ↗</a>
        <a class="chip" href="https://github.com/shendy-justlogin" target="_blank" rel="noopener">GitHub · alt ↗</a>
        <a class="chip" href="mailto:mailshendy@gmail.com" title="mailshendy@gmail.com">✉ Gmail</a>
        <a class="chip" href="mailto:shendyaditya@live.com" title="shendyaditya@live.com">✉ Live</a>
      </div>
      <div class="credits">
        <span>Character sprites from <a href="https://craftpix.net/" target="_blank" rel="noopener">craftpix.net</a></span>
        <span>© 2026 Shendy Aditya Syamsudin</span>
      </div>
      <div class="post"></div></div>`;
    nearInner.appendChild(panel);
    contactPanelEl = panel;
    const pole=document.createElement("div");pole.className="flagpole";
    pole.innerHTML=`<div class="ball"></div><div class="flag"></div>`;
    nearInner.appendChild(pole);
    contactFlagEl = pole;
    return null;
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
    const maxScroll = track.offsetHeight - vh;
    if(s.id==="contact"){ window.scrollTo({top:maxScroll, behavior:"smooth"}); return; }
    const pCam = (s.worldX - vw/2)/worldLength;        // camera progress 0..1
    const rawP = Math.max(0,Math.min(1,pCam)) * END_SPLIT; // map back to scroll
    window.scrollTo({top: rawP*maxScroll, behavior:"smooth"});
  }

  /* ---------------- Camera / render ---------------- */
  let cameraX = 0, lastCamera = 0, lastAvatarX = 0, facing = 1;
  const END_SPLIT = 0.86; // last 14% of scroll = camera locks, hero walks into the flag
  let walkingUntil = 0;
  let isJumping = false;
  let isAttacking = false;
  let isHurt = false;
  let hurtTimer = null;
  let runHeld = false;   // Shift held
  let autoRun = false;   // held movement key > 2s
  let attackTimer = null;
  // effective run state
  function isRunning(){ return runHeld || autoRun; }

  /* Animation state machine */
  function setAnimState(state){
    player.classList.remove("idle","walking","running","attacking","jumping","hurt");
    if(state === "idle")       player.classList.add("idle");
    else if(state === "walk")  player.classList.add("walking");
    else if(state === "run")   player.classList.add("running");
    else if(state === "jump")  player.classList.add("jumping");
    else if(state === "attack")player.classList.add("attacking");
    else if(state === "hurt")  player.classList.add("hurt");
  }

  function doAttack(){
    if(isAttacking) return;
    isAttacking = true;
    ensureAudio();
    setAnimState("attack");
    sfx("swing");
    // Slash FX
    const slash = document.createElement("div");
    slash.className = "slash-fx";
    const pr = player.getBoundingClientRect();
    const ox = facing>0 ? 80 : -60;
    slash.style.cssText = `left:${pr.left + pr.width/2 + ox}px;top:${pr.top + pr.height*0.35}px;`;
    document.body.appendChild(slash);
    setTimeout(()=>slash.remove(), 360);
    // Hit any skill brick within the slash reach
    attackBricks(pr);
    // End attack after animation
    clearTimeout(attackTimer);
    attackTimer = setTimeout(()=>{ isAttacking=false; resolveAnimState(); }, 550);
  }

  // Damage skill bricks overlapping the player's slash reach.
  // Horizontal reach in front; vertical band is tight around the slash height
  // (~mid/upper torso) so reaching high bricks requires jumping.
  function attackBricks(pr){
    const reachX = facing>0 ? pr.right + 70 : pr.left - 70;
    const x0 = Math.min(pr.right - 10, reachX), x1 = Math.max(pr.right - 10, reachX);
    const slashY = pr.top + pr.height*0.42;          // slash center
    const y0 = slashY - pr.height*0.22;              // tight band
    const y1 = slashY + pr.height*0.22;
    document.querySelectorAll(".brick").forEach(b=>{
      if(b.classList.contains("hit")) return;
      const r = b.getBoundingClientRect();
      const overlap = r.right > x0 && r.left < x1 && r.bottom > y0 && r.top < y1;
      if(overlap) hitBrick(b);
    });
  }

  function resolveAnimState(){
    if(isHurt) return;
    if(isJumping){ setAnimState("jump"); return; }
    const now = performance.now();
    const walking = now < walkingUntil;
    if(isRunning() && walking)   setAnimState("run");
    else if(walking)             setAnimState("walk");
    else                         setAnimState("idle");
  }

  function jump(){
    if(isJumping) return;
    ensureAudio();
    isJumping = true;
    player.style.setProperty("--jump-h", window.WORLD.jumpHeight + "px");
    player.style.setProperty("--jump-dur", window.WORLD.jumpDur + "ms");
    // vertical arc is independent of sprite state so we can attack mid-air
    player.classList.remove("jump-arc");
    void player.offsetWidth; // restart animation
    player.classList.add("jump-arc");
    if(!isAttacking) setAnimState("jump");
    sfx("jump");
    setTimeout(()=>{
      isJumping=false;
      player.classList.remove("jump-arc");
      resolveAnimState();
    }, window.WORLD.jumpDur);
  }
  function doHurt(){
    if(isHurt) return;
    isHurt = true;
    ensureAudio();
    setAnimState("hurt");
    sfx("hit");
    clearTimeout(hurtTimer);
    hurtTimer = setTimeout(()=>{ isHurt=false; resolveAnimState(); }, 400);
  }

  window.WorldJump = jump;
  window.WorldAttack = doAttack;
  window.WorldHurt = doHurt;
  player.addEventListener("click", doHurt);

  function render(){
    const maxScroll = track.offsetHeight - vh;
    const rawP = maxScroll>0 ? (window.scrollY/maxScroll) : 0;

    // For most of the scroll the camera moves and the hero stays at ~26%.
    // For the final stretch the camera LOCKS and the hero walks right into the flag.
    let avatarX;
    if(rawP <= END_SPLIT){
      cameraX = (rawP/END_SPLIT) * worldLength;
      avatarX = vw*0.26;
    } else {
      cameraX = worldLength;
      const t = (rawP - END_SPLIT)/(1 - END_SPLIT); // 0..1
      avatarX = vw*0.26 + t*(vw*0.58 - vw*0.26);
    }

    // parallax: scenery layers scroll via background-position, near layer via transform
    // clouds drift slowly rightward over time (independent of camera)
    const cloudDrift = (performance.now() * 0.02) % 640;
    const P = window.WORLD.parallax;
    layers.sky.style.backgroundPositionX  = ((-cameraX*0.12*P) - cloudDrift)+"px";
    layers.far.style.backgroundPositionX  = (-cameraX*0.28*P)+"px";
    layers.mid.style.backgroundPositionX  = (-cameraX*0.55*P)+"px";
    layers.fore.style.backgroundPositionX = (-cameraX*0.8*P)+"px";
    layers.near.style.transform = `translateX(${-cameraX*FACTOR.near}px)`;

    // position the hero horizontally (walks into the flag at the very end)
    player.style.left = avatarX + "px";

    // progress HUD (rawP so it fills to the very finish)
    progressBar.style.width = (rawP*100).toFixed(2)+"%";
    const trackEl = document.querySelector("#progress-wrap .track");
    if(trackEl){ progressMarker.style.left = (14 + rawP*(trackEl.offsetWidth)) + "px"; }
    progressMarker.textContent = rawP>=0.999 ? "🏁" : "🚩";

    // player facing + walk state (from combined camera + hero movement)
    const now = performance.now();
    const moveDelta = (cameraX - lastCamera) + (avatarX - lastAvatarX);
    if(Math.abs(moveDelta) > 0.4){
      facing = moveDelta>0 ? 1 : -1;
      walkingUntil = now + 200;
    }
    lastCamera = cameraX; lastAvatarX = avatarX;
    player.classList.toggle("face-left", facing<0);

    // Resolve animation state (defer to attack/jump/hurt if active)
    if(!isJumping && !isAttacking && !isHurt){
      const walking = now < walkingUntil;
      if(isRunning() && walking)   setAnimState("run");
      else if(walking)             setAnimState("walk");
      else                         setAnimState("idle");

      // Footstep audio for scroll/wheel-driven movement (keyboard hold handles its own)
      if(walking && !keyTimer){
        const running = isRunning();
        const interval = running ? 180 : 280;
        if(now - footstepT > interval){
          footstepT = now;
          sfx(running ? "footrun" : "footstep");
        }
      }
    }

    // Hide right arrow when at the end; show otherwise
    const atEnd = rawP >= 0.998;
    walkRightBtn.style.opacity = atEnd ? "0" : "1";
    walkRightBtn.style.pointerEvents = atEnd ? "none" : "auto";

    // player screen X (in px)
    const playerScreenX = avatarX;

    // coins: collect when the player overlaps a coin AND reaches it.
    // Low coins are grabbed walking; high coins are grabbed by jumping near them
    // (forgiving: any time the player is mid-jump and the coin is within jump reach).
    if(window.WORLD.coins){
      const pr = player.getBoundingClientRect();
      const jumpReach = 150 + window.WORLD.jumpHeight + 24;
      for(let ci=0; ci<coins.length; ci++){
        const c = coins[ci];
        if(c.collected) continue;
        const cr = c.el.getBoundingClientRect();
        const overlapX = cr.left < pr.right + 10 && cr.right > pr.left - 10;
        if(!overlapX) continue;
        const reaches = (pr.top <= cr.bottom + 8) || (isJumping && c.y <= jumpReach);
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
    // map all project stops (p1..p6) to "p1" so "Work" nav chip stays active
    if(id && /^p\d$/.test(id)) id = "p1";
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
    const t=actx.currentTime;
    // Two-oscillator helpers for richer sound
    function mk(){ const o=actx.createOscillator(), g2=actx.createGain(); o.connect(g2);g2.connect(actx.destination); return {o,g:g2}; }
    function noise(dur,gain){ const buf=actx.createBuffer(1,actx.sampleRate*dur,actx.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*gain; const s=actx.createBufferSource(); s.buffer=buf; const gg=actx.createGain(); gg.gain.setValueAtTime(gain,t); s.connect(gg);gg.connect(actx.destination); s.start(t);s.stop(t+dur); }

    if(kind==="coin"){const a=mk();a.o.type="square";a.o.frequency.setValueAtTime(880,t);a.o.frequency.setValueAtTime(1320,t+0.07);a.g.gain.setValueAtTime(0.06,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);a.o.start(t);a.o.stop(t+0.2);}
    else if(kind==="open"){const a=mk();a.o.type="triangle";a.o.frequency.setValueAtTime(523,t);a.o.frequency.exponentialRampToValueAtTime(1046,t+0.12);a.g.gain.setValueAtTime(0.05,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.22);a.o.start(t);a.o.stop(t+0.24);}
    else if(kind==="jump"){const a=mk();a.o.type="square";a.o.frequency.setValueAtTime(440,t);a.o.frequency.exponentialRampToValueAtTime(900,t+0.16);a.g.gain.setValueAtTime(0.05,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);a.o.start(t);a.o.stop(t+0.22);}
    else if(kind==="close"){const a=mk();a.o.type="triangle";a.o.frequency.setValueAtTime(740,t);a.o.frequency.exponentialRampToValueAtTime(330,t+0.14);a.g.gain.setValueAtTime(0.05,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);a.o.start(t);a.o.stop(t+0.22);}
    else if(kind==="power"){const a=mk();a.o.type="square";[523,659,784,1046].forEach(function(f,i){a.o.frequency.setValueAtTime(f,t+i*0.06);});a.g.gain.setValueAtTime(0.07,t);a.g.gain.setValueAtTime(0.07,t+0.2);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.36);a.o.start(t);a.o.stop(t+0.38);}
    // New sounds
    else if(kind==="swing"){const a=mk();a.o.type="sawtooth";a.o.frequency.setValueAtTime(300,t);a.o.frequency.exponentialRampToValueAtTime(80,t+0.25);a.g.gain.setValueAtTime(0.08,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.28);a.o.start(t);a.o.stop(t+0.3);noise(0.15,0.05);}
    else if(kind==="footstep"){const a=mk();a.o.type="sine";a.o.frequency.setValueAtTime(180,t);a.g.gain.setValueAtTime(0.08,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.07);a.o.start(t);a.o.stop(t+0.08);noise(0.12,0.04);}
    else if(kind==="footrun"){const a=mk();a.o.type="sine";a.o.frequency.setValueAtTime(220,t);a.g.gain.setValueAtTime(0.1,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.06);a.o.start(t);a.o.stop(t+0.07);noise(0.1,0.05);}
    else if(kind==="hit"){const a=mk(),b=mk();a.o.type="square";a.o.frequency.setValueAtTime(800,t);a.o.frequency.exponentialRampToValueAtTime(200,t+0.08);a.g.gain.setValueAtTime(0.06,t);a.g.gain.exponentialRampToValueAtTime(0.0001,t+0.1);a.o.start(t);a.o.stop(t+0.12);b.o.type="triangle";b.o.frequency.setValueAtTime(120,t);b.o.frequency.exponentialRampToValueAtTime(60,t+0.12);b.g.gain.setValueAtTime(0.07,t);b.g.gain.exponentialRampToValueAtTime(0.0001,t+0.15);b.o.start(t);b.o.stop(t+0.16);noise(0.08,0.04);}
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
  function closeModal(){ if(modal.classList.contains("open")) sfx("close"); modal.classList.remove("open"); }
  document.getElementById("m-close").addEventListener("click",closeModal);
  modal.addEventListener("click",e=>{ if(e.target===modal) closeModal(); });

  /* ---------------- Skill bricks: click = power-up + points ---------------- */
  function floatScore(x,y,txt){
    const s=document.createElement("div");s.className="floatscore";s.textContent=txt;
    s.style.left=x+"px";s.style.top=y+"px";
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),800);
  }
  function hitBrick(b){
    if(b.classList.contains("hit")) return;
    b.classList.add("hit");
    ensureAudio(); sfx("hit");
    coinTotal += 1; coinCountEl.textContent = String(coinTotal).padStart(2,"0");
    const r=b.getBoundingClientRect();
    floatScore(r.left + r.width/2, r.top - 6, "+1");
  }
  nearInner.addEventListener("click", function(e){
    const b = e.target.closest && e.target.closest(".brick");
    if(b) hitBrick(b);
  });

  /* ---------------- Keyboard / buttons ---------------- */
  let keyTimer=null;
  let keyDir = 0;
  let footstepT = 0;
  let holdStarted = 0;
  const HOLD_RUN_MS = 500; // auto-sprint after holding 0.5s

  function nudge(){
    if(!keyTimer) return;
    // Auto-sprint after holding movement key long enough
    if(!autoRun && keyDir !== 0 && performance.now() - holdStarted > HOLD_RUN_MS){
      autoRun = true;
    }
    const running = isRunning();
    const maxScroll=track.offsetHeight - vh;
    const step = running ? (window.WORLD.runSpeed || 14) : (window.WORLD.walkSpeed || 7);
    const next = Math.max(0,Math.min(maxScroll, window.scrollY + keyDir*step));
    if(next === window.scrollY && keyDir > 0) return;
    window.scrollTo({top: next});
    const now = performance.now();
    const interval = running ? 180 : 280;
    if(now - footstepT > interval){
      footstepT = now;
      sfx(running ? "footrun" : "footstep");
    }
  }
  function startHold(dir){
    ensureAudio();
    // Ignore OS key-repeat / re-press in same direction so the 2s timer keeps counting
    if(keyTimer && keyDir === dir) return;
    keyDir = dir;
    footstepT = 0;
    holdStarted = performance.now();
    autoRun = false;
    if(keyTimer) return;
    keyTimer=setInterval(()=>nudge(),16);
    nudge();
  }
  function stopHold(){
    if(keyTimer){clearInterval(keyTimer);keyTimer=null;keyDir=0;}
    autoRun = false;
    if(!isAttacking && !isJumping) setAnimState("idle");
  }

  window.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closeModal();return;}
    // Block Tab focus traversal — it scrolls focus into world content and breaks layout
    if(e.key==="Tab"){ e.preventDefault(); return; }
    if(modal.classList.contains("open")) return;

    if(e.key==="Shift"){ runHeld=true; e.preventDefault(); return; }
    if(e.key==="e"||e.key==="E"){ e.preventDefault(); doAttack(); return; }

    if(e.key==="ArrowRight"||e.key==="d"){
      e.preventDefault(); startHold(1);
    }
    else if(e.key==="ArrowLeft"||e.key==="a"){
      e.preventDefault(); startHold(-1);
    }
    else if(e.key===" "){ e.preventDefault(); jump(); }
  });
  window.addEventListener("keyup",e=>{
    if(e.key==="Shift"){ runHeld=false; return; }
    if(["ArrowRight","ArrowLeft","a","d"].includes(e.key)){
      stopHold();
    }
  });

  ["walk-left","walk-right"].forEach(id=>{
    const el=document.getElementById(id); const dir=id==="walk-right"?1:-1;
    el.addEventListener("mousedown",()=>{ startHold(dir); });
    el.addEventListener("touchstart",e=>{e.preventDefault();startHold(dir);},{passive:false});
    ["mouseup","mouseleave","touchend"].forEach(ev=>el.addEventListener(ev,()=>{ stopHold(); }));
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
