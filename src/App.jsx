import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Scene from './components/Scene.jsx';
import {
  AchievementsModal,
  BottomBar,
  Header,
  RoundModal,
  ShotPopup,
  Toasts,
} from './components/Hud.jsx';
import { gameReducer, initialState, saveProfile } from './game/gameReducer.js';
import { MIN_POWER, SCENE, TARGET, levelConfig, rankFor, targetYAt } from './game/config.js';
import {
  aimFromDrag,
  bowString,
  createArrow,
  predictPath,
  ringScore,
  rotationOf,
  stepArrow,
} from './game/physics.js';
import { sfx, setSound } from './game/sound.js';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  const [drag, setDrag] = useState(null);       // live drag, for rendering
  const [angle, setAngle] = useState(17);       // last shot angle, shown when idle
  const [muted, setMuted] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [frame, setFrame] = useState({ targetY: TARGET.baseY, flight: null });

  const sceneRef = useRef(null);
  const dragRef = useRef(null);
  // Mutable simulation state, read by the animation loop without re-subscribing.
  const sim = useRef({ t: 0, flight: null, cfg: levelConfig(1) });

  const cfg = levelConfig(state.level);
  const canShoot = state.phase === 'aim' && state.arrowsLeft > 0 && !showAchievements;
  const rank = rankFor(state.profile.xp);
  const unlockedCount = Object.keys(state.profile.unlocked).length;

  useEffect(() => {
    sim.current.cfg = levelConfig(state.level);
  }, [state.level]);

  useEffect(() => {
    saveProfile(state.profile);
  }, [state.profile]);

  useEffect(() => {
    setSound(!muted);
  }, [muted]);

  useEffect(() => {
    if (state.phase === 'levelWon') sfx.win();
    if (state.phase === 'roundLost') sfx.fail();
  }, [state.phase]);

  // One loop drives the moving target and the arrow in flight.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const s = sim.current;
      s.t += dt;
      const targetY = targetYAt(s.t, s.cfg);
      let flight = null;

      if (s.flight) {
        const res = stepArrow(s.flight, dt, { y: targetY, radius: s.cfg.radius });
        if (res.status === 'flying') {
          flight = { x: s.flight.x, y: s.flight.y, rot: rotationOf(s.flight) };
        } else {
          const ring = res.status === 'hit' ? ringScore(res.dist, s.cfg.radius) : 0;
          const rot = rotationOf(s.flight);
          s.flight = null;
          if (ring === 10) sfx.bullseye();
          else if (ring > 0) sfx.hit(ring);
          else sfx.miss();
          dispatch({ type: 'RESOLVE', ring, dx: res.dx ?? 0, dy: res.dy ?? 0, rot });
        }
      }

      setFrame({ targetY, flight });
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismissToast = useCallback((id) => dispatch({ type: 'DISMISS_TOAST', id }), []);

  const sceneCoords = (e) => {
    const r = sceneRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * SCENE.W,
      y: ((e.clientY - r.top) / r.height) * SCENE.H,
    };
  };

  const shoot = ({ ox, oy, x, y }) => {
    const { power, angle: a } = aimFromDrag(ox, oy, x, y);
    if (power < MIN_POWER || sim.current.flight) return;
    const { tip } = bowString(a, power);
    sim.current.flight = createArrow(tip, a, power, sim.current.cfg.wind);
    setAngle(a);
    dispatch({ type: 'FIRE' });
    sfx.shoot();
  };

  const onPointerDown = (e) => {
    if (!canShoot || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = sceneCoords(e);
    dragRef.current = { ox: p.x, oy: p.y, x: p.x, y: p.y };
    setDrag(dragRef.current);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const p = sceneCoords(e);
    dragRef.current = { ...dragRef.current, x: p.x, y: p.y };
    setDrag(dragRef.current);
  };

  const onPointerUp = (e) => {
    if (!dragRef.current) return;
    const p = sceneCoords(e);
    const d = { ...dragRef.current, x: p.x, y: p.y };
    dragRef.current = null;
    setDrag(null);
    shoot(d);
  };

  const onPointerCancel = () => {
    dragRef.current = null;
    setDrag(null);
  };

  // Live aim readout while dragging; otherwise the bow rests at the last angle.
  const live = drag ? aimFromDrag(drag.ox, drag.oy, drag.x, drag.y) : null;
  const power = live ? live.power : 0;
  const shownAngle = live ? live.angle : angle;
  const bow = bowString(shownAngle, power);
  const trail = power >= MIN_POWER ? predictPath(bow.tip, shownAngle, power, cfg.wind) : [];

  let hint = '';
  if (state.phase === 'flying') {
    hint = 'Arrow in flight…';
  } else if (canShoot) {
    if (!live) hint = 'Drag back anywhere, then let go to shoot.';
    else if (power < MIN_POWER) hint = 'Pull back further…';
    else hint = 'Let go to shoot!';
  }

  return (
    <div className="app">
      <Header
        level={state.level}
        rank={rank}
        xp={state.profile.xp}
        score={state.roundTotal}
        goal={cfg.target}
        best={state.profile.best}
        arrowsLeft={state.arrowsLeft}
        unlockedCount={unlockedCount}
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
        onOpenAchievements={() => setShowAchievements(true)}
      />

      <div className="stage">
        <div
          ref={sceneRef}
          className="scene"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <Scene
            targetY={frame.targetY}
            radius={cfg.radius}
            stuck={state.stuck}
            bow={bow}
            flight={frame.flight}
            trail={trail}
          />
          {state.combo >= 2 && <div className="combo">🔥 {state.combo} in a row</div>}
          {state.lastShot && <ShotPopup key={state.lastShot.id} shot={state.lastShot} />}
        </div>
      </div>

      <BottomBar power={power} angle={shownAngle} wind={cfg.wind} hint={hint} />

      <RoundModal
        phase={state.phase}
        result={state.result}
        onNext={() => dispatch({ type: 'NEXT_LEVEL' })}
        onRetry={() => dispatch({ type: 'RETRY' })}
      />

      {showAchievements && (
        <AchievementsModal
          profile={state.profile}
          rank={rank}
          onClose={() => setShowAchievements(false)}
        />
      )}

      <Toasts items={state.toasts} onDismiss={dismissToast} />
    </div>
  );
}
