// Scene geometry, in units of the 1000 x 500 SVG viewBox.
export const SCENE = { W: 1000, H: 500, GROUND_Y: 440 };
export const BOW = { x: 215, y: 300 };
export const TARGET = { x: 790, baseY: 252 };

// Round rules.
export const ARROWS_PER_ROUND = 5;
export const MAX_ROUND_SCORE = ARROWS_PER_ROUND * 10;
export const MAX_LEVEL = 10;

// Physics tuning.
export const MAX_PULL = 200;   // drag distance (scene units) for 100% power
export const MAX_SPEED = 1000; // units per second at 100% power
export const GRAVITY = 520;    // units per second squared
export const ARROW_LEN = 72;
export const DRAW_DIST = 46;
export const MIN_POWER = 0.08;
export const ANGLE_MIN = -5;
export const ANGLE_MAX = 85;

export const RING_FILL = {
  1: '#fff4dc', 2: '#fff4dc',
  3: '#1f1c2e', 4: '#1f1c2e',
  5: '#3b8fe0', 6: '#3b8fe0',
  7: '#e5483d', 8: '#e5483d',
  9: '#ffd34d', 10: '#ffd34d',
};

export const RING_TEXT = {
  1: '#7a6650', 2: '#7a6650',
  3: '#ffffff', 4: '#ffffff',
  5: '#ffffff', 6: '#ffffff',
  7: '#ffffff', 8: '#ffffff',
  9: '#3a2300', 10: '#3a2300',
};

// Difficulty curve. Levels 1–2 are calm; wind starts at 3, a moving target at 3,
// and the target shrinks from level 3 onward.
export function levelConfig(level) {
  const n = level;
  const radius = n < 3 ? 150 : Math.max(105, 150 - (n - 2) * 9);
  const amp = n < 3 ? 0 : Math.min(60, 20 + (n - 2) * 8);
  return {
    level: n,
    radius,
    amp,
    omega: 0.7 + n * 0.08,
    moving: amp > 0,
    wind: n < 3 ? 0 : (n % 2 === 0 ? 1 : -1) * Math.min(90, n * 10),
    target: 20 + n * 2,
  };
}

export function targetYAt(t, cfg) {
  return TARGET.baseY + (cfg.moving ? cfg.amp * Math.sin(cfg.omega * t) : 0);
}

// 1 star = reach the goal, 2 = six more, 3 = twelve more (capped at a perfect round).
export function starsFor(total, target) {
  if (total >= Math.min(MAX_ROUND_SCORE, target + 12)) return 3;
  if (total >= Math.min(MAX_ROUND_SCORE, target + 6)) return 2;
  if (total >= target) return 1;
  return 0;
}

export const RANKS = [
  { min: 0, title: 'Novice' },
  { min: 300, title: 'Archer' },
  { min: 900, title: 'Marksman' },
  { min: 1800, title: 'Sharpshooter' },
  { min: 3000, title: 'Bowmaster' },
  { min: 5000, title: 'Dusk Legend' },
];

export function rankFor(xp) {
  const idx = RANKS.reduce((acc, r, i) => (xp >= r.min ? i : acc), 0);
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] ?? null;
  return {
    title: cur.title,
    next: next ? next.min : null,
    progress: next ? (xp - cur.min) / (next.min - cur.min) : 1,
  };
}

export const ACHIEVEMENTS = [
  { id: 'first_blood', icon: '🎯', title: 'First Blood', desc: 'Hit the target for the first time', test: (c) => c.totalHits >= 1 },
  { id: 'bullseye', icon: '💥', title: 'Bullseye!', desc: 'Score a 10 ring', test: (c) => c.ring === 10 },
  { id: 'hot_streak', icon: '🔥', title: 'Hot Streak', desc: 'Hit 3 arrows in a row', test: (c) => c.combo >= 3 },
  { id: 'on_fire', icon: '☄️', title: 'On Fire', desc: 'Hit 5 arrows in a row', test: (c) => c.combo >= 5 },
  { id: 'moving_target', icon: '🌀', title: 'Moving Target', desc: 'Hit a target that is moving', test: (c) => c.ring > 0 && c.moving },
  { id: 'perfect_round', icon: '👑', title: 'Perfect Round', desc: 'Score a full 50 in one round', test: (c) => c.roundEnded && c.roundTotal === MAX_ROUND_SCORE },
  { id: 'wind_walker', icon: '🍃', title: 'Wind Walker', desc: 'Clear a level with wind', test: (c) => c.levelWon && c.wind !== 0 },
  { id: 'triple_star', icon: '⭐', title: 'Triple Star', desc: 'Earn 3 stars on one level', test: (c) => c.levelWon && c.stars === 3 },
  { id: 'halfway_hero', icon: '🏅', title: 'Halfway Hero', desc: 'Clear level 5', test: (c) => c.levelWon && c.level >= 5 },
  { id: 'sunset_champion', icon: '🏆', title: 'Sunset Champion', desc: 'Clear level 10', test: (c) => c.levelWon && c.level >= MAX_LEVEL },
];
