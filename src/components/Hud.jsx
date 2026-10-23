import { useEffect } from 'react';
import { ACHIEVEMENTS, ARROWS_PER_ROUND, MAX_ROUND_SCORE } from '../game/config.js';
import { sfx } from '../game/sound.js';

function TargetLogo() {
  return (
    <svg viewBox="0 0 44 44" width="46" height="46" aria-hidden="true">
      <circle cx="22" cy="22" r="21" fill="#fff4dc" />
      <circle cx="22" cy="22" r="15" fill="#e5483d" />
      <circle cx="22" cy="22" r="9" fill="#fff4dc" />
      <circle cx="22" cy="22" r="4.5" fill="#ffd34d" />
    </svg>
  );
}

function ArrowIcon({ used }) {
  return (
    <svg viewBox="0 0 64 16" className={used ? 'used' : undefined} aria-hidden="true">
      <line x1="10" y1="8" x2="50" y2="8" stroke="#ff6f61" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="62,8 49,3 49,13" fill="#ff6f61" />
      <polygon points="2,8 10,3 14,8 10,13" fill="#ff6f61" />
    </svg>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

export function Header({
  level,
  rank,
  xp,
  score,
  goal,
  best,
  arrowsLeft,
  unlockedCount,
  muted,
  onToggleMute,
  onOpenAchievements,
}) {
  return (
    <header className="header card">
      <div className="brand">
        <TargetLogo />
        <div>
          <h1>Dusk Range</h1>
          <p>
            Level {level} · {rank.title}
          </p>
          <div className="xp" title={`${xp} XP`}>
            <span style={{ width: `${Math.round(rank.progress * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="quiver" aria-label={`${arrowsLeft} arrows left`}>
        {Array.from({ length: ARROWS_PER_ROUND }, (_, i) => (
          <ArrowIcon key={i} used={i >= arrowsLeft} />
        ))}
      </div>

      <div className="stats">
        <Stat label="Score" value={score} />
        <Stat label="Goal" value={goal} />
        <Stat label="Best" value={best} />
      </div>

      <div className="actions">
        <button className="pill-btn" onClick={onOpenAchievements}>
          🏆 {unlockedCount}/{ACHIEVEMENTS.length}
        </button>
        <button className="pill-btn" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}

export function BottomBar({ power, angle, wind, hint }) {
  const windArrow = wind > 0 ? '→' : wind < 0 ? '←' : '•';
  return (
    <footer className="hud card">
      <div>
        <div className="readouts">
          <span>
            Power <b>{Math.round(power * 100)}%</b>
          </span>
          <span>
            Angle <b>{Math.round(angle)}°</b>
          </span>
          <span>
            Wind <b>{windArrow} {Math.abs(wind)}</b>
          </span>
        </div>
        <div className="power-track">
          <div className="power-fill" style={{ width: `${power * 100}%` }} />
        </div>
      </div>
      <p className="hint">{hint}</p>
    </footer>
  );
}

export function ShotPopup({ shot }) {
  const kind = shot.ring === 10 ? 'gold' : shot.ring > 0 ? 'hit' : 'miss';
  const text = shot.ring === 10 ? 'BULLSEYE! +10' : shot.ring > 0 ? `+${shot.ring}` : 'Miss';
  return <div className={`shot-popup ${kind}`}>{text}</div>;
}

function Stars({ count }) {
  return (
    <div className="stars" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? 'on' : undefined}>
          ★
        </span>
      ))}
    </div>
  );
}

export function RoundModal({ phase, result, onNext, onRetry }) {
  if (!result || (phase !== 'levelWon' && phase !== 'roundLost')) return null;
  const won = phase === 'levelWon';

  return (
    <div className="overlay">
      <div className="modal card">
        <div className="modal-badge">{won ? '🏆' : '🎯'}</div>
        <h2>{won ? `Level ${result.level} cleared` : 'Not quite'}</h2>
        {won && <Stars count={result.stars} />}
        <p className="muted">
          Round score <b>{result.total}</b> / {MAX_ROUND_SCORE} · Goal {result.target}
        </p>
        {!won && <p className="muted">Hit the goal to unlock the next level.</p>}
        <p className="xp-gain">+{result.xp} XP</p>
        {won ? (
          <button className="btn primary" onClick={onNext}>
            Next level
          </button>
        ) : (
          <button className="btn primary" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function AchievementsModal({ profile, rank, onClose }) {
  const unlockedCount = Object.keys(profile.unlocked).length;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Achievements</h2>
          <button className="pill-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="muted">
          {unlockedCount} of {ACHIEVEMENTS.length} unlocked · {rank.title} · {profile.xp} XP · Best round {profile.best}
        </p>
        <ul className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const on = Boolean(profile.unlocked[a.id]);
            return (
              <li key={a.id} className={on ? 'ach on' : 'ach'}>
                <span className="ach-icon">{on ? a.icon : '🔒'}</span>
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.desc}</small>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Toast({ item, onDismiss }) {
  useEffect(() => {
    sfx.unlock();
    const timer = setTimeout(() => onDismiss(item.id), 3200);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div className="toast" role="status">
      <span>{item.icon}</span>
      <div>
        <b>Achievement unlocked</b>
        <small>
          {item.title} · +50 XP
        </small>
      </div>
    </div>
  );
}

export function Toasts({ items, onDismiss }) {
  return (
    <div className="toasts">
      {items.map((t) => (
        <Toast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
