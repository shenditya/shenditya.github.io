/* Tweaks panel for Shendy's World — drives the live window.WORLD config + theme.
   Loaded after world.js. Uses the tweaks-panel.jsx helpers. */
const { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakColor } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "timeOfDay": "dusk",
  "accent": ["#6b46d9", "#5436b8"],
  "walkSpeed": 7,
  "jumpHeight": 130,
  "parallax": 1,
  "coins": true,
  "sound": true
}/*EDITMODE-END*/;

function applyAll(t){
  const W = window.WORLD || (window.WORLD = {});
  W.walkSpeed  = t.walkSpeed;
  W.jumpHeight = t.jumpHeight;
  W.parallax   = t.parallax;
  W.coins      = t.coins;
  W.sound      = t.sound;

  const root = document.documentElement;
  const acc = Array.isArray(t.accent) ? t.accent : [t.accent, t.accent];
  root.style.setProperty("--grape", acc[0]);
  root.style.setProperty("--grape-deep", acc[1] || acc[0]);

  document.body.classList.remove("tod-day","tod-dusk","tod-night");
  document.body.classList.add("tod-" + t.timeOfDay);
  document.body.classList.toggle("hide-coins", !t.coins);

  const sb = document.getElementById("sound-btn");
  if(sb) sb.textContent = t.sound ? "🔊 ON" : "🔇 OFF";
}

function TweaksApp(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(()=>{ applyAll(t); }, [t]);

  return (
    <TweaksPanel>
      <TweakSection label="World" />
      <TweakRadio label="Time of day" value={t.timeOfDay}
        options={["day","dusk","night"]}
        onChange={(v)=>setTweak("timeOfDay", v)} />
      <TweakColor label="Accent" value={t.accent}
        options={[["#6b46d9","#5436b8"],["#e0892a","#b96b18"],["#179a8a","#0f7064"],["#d94d4d","#b33636"]]}
        onChange={(v)=>setTweak("accent", v)} />
      <TweakSlider label="Parallax depth" value={t.parallax} min={0} max={2} step={0.1}
        onChange={(v)=>setTweak("parallax", v)} />

      <TweakSection label="Player" />
      <TweakSlider label="Walk speed" value={t.walkSpeed} min={3} max={20} unit="px/tick"
        onChange={(v)=>setTweak("walkSpeed", v)} />
      <TweakSlider label="Jump height" value={t.jumpHeight} min={60} max={260} unit="px"
        onChange={(v)=>setTweak("jumpHeight", v)} />

      <TweakSection label="Game" />
      <TweakToggle label="Coins" value={t.coins} onChange={(v)=>setTweak("coins", v)} />
      <TweakToggle label="Sound" value={t.sound} onChange={(v)=>setTweak("sound", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<TweaksApp />);
