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
  const walkLeftBtn  = document.getElementById("walk-left");
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
    if(contactPanelEl) contactPanelEl.style.left = Math.round(vw*0.40 + worldLength) + "px";
    if(contactFlagEl)  contactFlagEl.style.left  = Math.round(vw*0.92 + worldLength) + "px";
    buildNpcs();
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
        <span class="chip grape">Top 6 shipped apps</span>
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
      <h2>You reached the end! 🏁</h2>
      <p>Thanks for walking through. Let's build something together.</p>
      <div class="chiprow">
        <a class="chip" href="https://id.linkedin.com/in/shendyaditya" target="_blank" rel="noopener">LinkedIn</a>
        <a class="chip" href="https://github.com/shenditya" target="_blank" rel="noopener">GitHub</a>
        <a class="chip" href="https://github.com/shendy-justlogin" target="_blank" rel="noopener">GitHub · alt</a>
        <a class="chip" href="mailto:mailshendy@gmail.com" title="mailshendy@gmail.com">@ Gmail</a>
        <a class="chip" href="mailto:shendyaditya@live.com" title="shendyaditya@live.com">@ Live</a>
      </div>
      <div class="credits">
        <span class="claude-credit">Created with Claude — get a free week of
          <a href="https://claude.ai/referral/hWl_6z2aig" target="_blank" rel="noopener">
            <svg class="claude-logo" viewBox="0 0 24 24" aria-hidden="true"><g fill="#D97757">
              <rect x="11" y="0" width="2" height="24" rx="1"/>
              <rect x="0" y="11" width="24" height="2" rx="1"/>
              <rect x="11" y="0" width="2" height="24" rx="1" transform="rotate(45 12 12)"/>
              <rect x="11" y="0" width="2" height="24" rx="1" transform="rotate(-45 12 12)"/>
              <rect x="11" y="3" width="2" height="18" rx="1" transform="rotate(22.5 12 12)"/>
              <rect x="11" y="3" width="2" height="18" rx="1" transform="rotate(-22.5 12 12)"/>
              <rect x="11" y="3" width="2" height="18" rx="1" transform="rotate(67.5 12 12)"/>
              <rect x="11" y="3" width="2" height="18" rx="1" transform="rotate(-67.5 12 12)"/>
            </g></svg>Claude Code</a></span>
        <span>Character sprites from <a href="https://craftpix.net/" target="_blank" rel="noopener">craftpix.net</a></span>
        <span>Avatar created using ChatGPT and Google Omni</span>
        <span>© 2026 Shendy Aditya S.</span>
      </div>
      <div class="post"></div></div>`;
    nearInner.appendChild(panel);
    contactPanelEl = panel;
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
    // map camera progress back into the scrolling band [START_SPLIT, END_SPLIT]
    const rawP = START_SPLIT + Math.max(0,Math.min(1,pCam)) * (END_SPLIT - START_SPLIT);
    window.scrollTo({top: rawP*maxScroll, behavior:"smooth"});
  }

  /* ---------------- Camera / render ---------------- */
  let cameraX = 0, lastCamera = 0, lastAvatarX = 0, facing = 1;
  const START_SPLIT = 0.05; // first 5% of scroll = camera locked, hero walks in from left edge
  const END_SPLIT = 0.86;   // last 14% of scroll = camera locks, hero walks into the flag
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

  /* ---------------- City NPCs (random walk/run pedestrians) ---------------- */
  let npcs = [];          // {el, sprite, worldX, dir, speed, running, state, until}
  let lastNpcT = 0;

  const NPC_KINDS = ["men1","men2","gang1","gang2","gang3","home1","home2","home3"];
  const NPC_PER_KIND = 2;     // per kind
  const NPC_HP = 3;           // hits to kill
  const isGang = k => k.startsWith("gang");
  const isHomeless = k => k.startsWith("home");
  const GANG_ATTACK_RANGE = 70;   // px center distance a gangster strikes a homeless
  const GANG_ATTACK_CD = 900;     // ms between a gangster's strikes
  const FLEE_RANGE = 300;         // homeless notice a gangster within this distance
  const FLEE_SPEED = 130;         // px/sec when running away

  // Spawn one NPC of `kind` at world x; returns the npc object.
  function spawnNpc(kind, startX, minX, maxX){
    const el = document.createElement("div");
    el.className = `npc ${kind}`;
    el.innerHTML = `<div class="npc-shadow"></div><div class="npc-sprite"></div>`;
    el.style.left = startX + "px";
    nearInner.appendChild(el);
    const npc = { el, kind, worldX: startX, dir: Math.random()<0.5?-1:1,
                  speed: 0, running: false, state: "", until: 0,
                  minX, maxX, hp: NPC_HP, hurt: false, dead: false,
                  hurtTimer: null, nextAtk: 0 };
    npcs.push(npc);
    pickNpcAction(npc, performance.now());
    return npc;
  }

  function buildNpcs(){
    nearInner.querySelectorAll(".npc").forEach(n=>n.remove());
    npcs = [];
    const minX = 40, maxX = worldLength + vw - 40;
    NPC_KINDS.forEach((kind, ki)=>{
      for(let i=0;i<NPC_PER_KIND;i++){
        // spread spawns across the world, offset each kind so they interleave
        const frac = (i + 0.5 + ki/NPC_KINDS.length) / (NPC_PER_KIND + 1);
        const startX = minX + (maxX-minX)*Math.min(0.95, frac);
        spawnNpc(kind, startX, minX, maxX);
      }
    });
  }

  // An NPC takes a hit — deduct hp; hurt anim, or death + respawn at hp 0.
  // attackerX = world x of whoever struck (player or gangster); knockback pushes away.
  function hurtNpc(npc, attackerX){
    if(npc.hurt || npc.dead) return;
    npc.hp--;
    sfx("hit");
    const pushRight = attackerX != null ? (npc.worldX >= attackerX) : (facing>0);
    const kb = pushRight ? 26 : -26;
    npc.worldX = Math.max(npc.minX, Math.min(npc.maxX, npc.worldX + kb));
    npc.el.style.left = npc.worldX + "px";
    npc.dir = pushRight ? 1 : -1;         // face away from the hit
    npc.el.classList.toggle("face-left", npc.dir<0);

    if(npc.hp <= 0){ killNpc(npc); return; }

    npc.hurt = true;
    npc.el.classList.remove("walking","running");
    npc.el.classList.add("hurt");
    clearTimeout(npc.hurtTimer);
    npc.hurtTimer = setTimeout(()=>{
      npc.hurt = false;
      npc.el.classList.remove("hurt");
      pickNpcAction(npc, performance.now());  // resume roaming
    }, 420);
  }

  // Death: play dead anim, fade out, remove, then spawn a fresh NPC elsewhere.
  function killNpc(npc){
    npc.dead = true;
    npc.speed = 0;
    clearTimeout(npc.hurtTimer);
    npc.el.classList.remove("walking","running","hurt");
    npc.el.classList.add("dead","dying");
    dropCoin(npc.worldX);
    setTimeout(()=>{
      const kind = npc.kind, minX = npc.minX, maxX = npc.maxX;
      npc.el.remove();
      const idx = npcs.indexOf(npc);
      if(idx>=0) npcs.splice(idx,1);
      // respawn fresh one at a random spot away from the player's camera view
      const x = minX + Math.random()*(maxX-minX);
      spawnNpc(kind, x, minX, maxX);
    }, 1000);
  }

  // Randomly choose idle / walk (/ run) + direction, for a random duration.
  // Homeless never random-run — they only run when fleeing a gangster.
  function pickNpcAction(npc, now){
    npc.running = false;
    const r = Math.random();
    const canRun = !isHomeless(npc.kind);
    if(r < 0.25){            // idle
      npc.state = "idle"; npc.speed = 0;
      npc.until = now + 800 + Math.random()*2200;
    } else if(r < 0.78 || !canRun){     // walk
      npc.state = "walk";
      npc.speed = 30 + Math.random()*25;   // px/sec
      npc.dir = Math.random()<0.5?-1:1;
      npc.until = now + 1500 + Math.random()*3000;
    } else {                 // run
      npc.state = "run"; npc.running = true;
      npc.speed = 90 + Math.random()*60;
      npc.dir = Math.random()<0.5?-1:1;
      npc.until = now + 1200 + Math.random()*2200;
    }
    applyNpcAnim(npc);
  }

  function applyNpcAnim(npc){
    npc.el.classList.toggle("walking", npc.state==="walk");
    npc.el.classList.toggle("running", npc.state==="run");
    npc.el.classList.toggle("face-left", npc.dir<0);
  }

  function updateNpcs(now){
    if(!lastNpcT) lastNpcT = now;
    const dt = Math.min(0.05, (now - lastNpcT)/1000); // clamp big gaps
    lastNpcT = now;
    npcs.slice().forEach(npc=>{
      if(npc.dead) return;

      // Homeless flee: run away only when a gangster is near; else roam normally.
      if(!npc.hurt && isHomeless(npc.kind)){
        let threat=null, best=FLEE_RANGE;
        npcs.forEach(o=>{
          if(o.dead || !isGang(o.kind)) return;
          const d = Math.abs(o.worldX - npc.worldX);
          if(d < best){ best=d; threat=o; }
        });
        if(threat){
          npc.fleeing = true;
          npc.dir = npc.worldX >= threat.worldX ? 1 : -1;   // run opposite the gangster
          npc.speed = FLEE_SPEED;
          npc.state = "run";
          npc.until = now + 400;        // re-evaluate threat soon
          applyNpcAnim(npc);
        } else if(npc.fleeing){
          npc.fleeing = false;          // safe now — back to normal wandering
          pickNpcAction(npc, now);
        }
      }

      // Gangsters attack nearby homeless (works even briefly while not hurt)
      if(!npc.hurt && isGang(npc.kind) && now >= npc.nextAtk){
        let target=null, best=GANG_ATTACK_RANGE;
        npcs.forEach(o=>{
          if(o.dead || o.hurt || !isHomeless(o.kind)) return;
          const d = Math.abs(o.worldX - npc.worldX);
          if(d < best){ best=d; target=o; }
        });
        if(target){
          npc.nextAtk = now + GANG_ATTACK_CD;
          npc.dir = target.worldX >= npc.worldX ? 1 : -1;   // turn toward victim
          npc.el.classList.toggle("face-left", npc.dir<0);
          hurtNpc(target, npc.worldX);
        }
      }
      if(npc.hurt) return;                 // frozen during hurt anim
      if(now >= npc.until){ pickNpcAction(npc, now); }
      if(npc.speed > 0){
        npc.worldX += npc.dir * npc.speed * dt;
        // bounce off world bounds and flip direction
        if(npc.worldX <= npc.minX){ npc.worldX = npc.minX; npc.dir = 1; applyNpcAnim(npc); }
        else if(npc.worldX >= npc.maxX){ npc.worldX = npc.maxX; npc.dir = -1; applyNpcAnim(npc); }
        npc.el.style.left = npc.worldX + "px";
      }
    });
  }

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
    // Hit any city NPC close in front of the player. Sprite boxes are 128px
    // with lots of transparent padding, so compare visible CENTERS, not edges.
    const playerCX = pr.left + pr.width/2;
    const HIT_RANGE = 70;   // how far in front the slash reaches (px)
    npcs.slice().forEach(npc=>{
      if(npc.hurt || npc.dead) return;
      const r = npc.el.getBoundingClientRect();
      const npcCX = r.left + r.width/2;
      const dx = npcCX - playerCX;
      const inFront = facing>0 ? (dx > -10 && dx < HIT_RANGE) : (dx < 10 && dx > -HIT_RANGE);
      // push away in the player's facing direction
      if(inFront) hurtNpc(npc, npc.worldX - facing);
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

    // Hero rest position (screen-x) while the camera scrolls the world.
    const REST_X = vw*0.26;
    // START_SPLIT: first slice = camera LOCKED at 0, hero walks IN from the left edge.
    // END_SPLIT:   last slice  = camera LOCKED at end, hero walks OUT to the flag.
    let avatarX;
    if(rawP < START_SPLIT){
      // camera pinned at world start; hero strolls from the very left edge to REST_X
      cameraX = 0;
      const t = rawP/START_SPLIT; // 0..1
      avatarX = vw*0.06 + t*(REST_X - vw*0.06);
    } else if(rawP <= END_SPLIT){
      cameraX = ((rawP - START_SPLIT)/(END_SPLIT - START_SPLIT)) * worldLength;
      avatarX = REST_X;
    } else {
      cameraX = worldLength;
      const t = (rawP - END_SPLIT)/(1 - END_SPLIT); // 0..1
      avatarX = REST_X + t*(vw*0.92 - REST_X);   // walk almost to the right edge
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

    // Hide arrows at scroll limits
    const atStart = rawP <= 0.002;
    const atEnd = rawP >= 0.998;
    walkLeftBtn.style.opacity = atStart ? "0" : "1";
    walkLeftBtn.style.pointerEvents = atStart ? "none" : "auto";
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

    // city pedestrians roam the world
    updateNpcs(now);

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
  // Spawn a collectable coin at world x (dropped by a killed NPC).
  function dropCoin(wx){
    const y = 26;   // low — grabbed by walking past
    const c = document.createElement("div");
    c.className = "coin pixel drop";
    c.textContent = "$";
    c.style.cssText = `left:${wx}px;bottom:calc(var(--ground-h) + ${y}px);`;
    nearInner.appendChild(c);
    coins.push({ el:c, worldX:wx, y:y, collected:false });
  }

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
