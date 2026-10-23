import {
  ACHIEVEMENTS,
  ARROWS_PER_ROUND,
  MAX_LEVEL,
  levelConfig,
  starsFor,
} from './config.js';

const STORAGE_KEY = 'dusk-range-profile-v1';

const DEFAULT_PROFILE = {
  best: 0,
  xp: 0,
  totalShots: 0,
  totalHits: 0,
  bullseyes: 0,
  highestLevel: 1,
  stars: {},
  unlocked: {},
};

function loadProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be blocked (private mode, quota). The game still works without it.
  }
}

export function initialState() {
  return {
    profile: loadProfile(),
    level: 1,
    arrowsLeft: ARROWS_PER_ROUND,
    roundTotal: 0,
    combo: 0,
    stuck: [],
    phase: 'aim', // aim | flying | levelWon | roundLost
    lastShot: null,
    result: null,
    toasts: [],
    nextId: 1,
  };
}

function resetRound(state) {
  return {
    ...state,
    arrowsLeft: ARROWS_PER_ROUND,
    roundTotal: 0,
    combo: 0,
    stuck: [],
    phase: 'aim',
    result: null,
    lastShot: null,
  };
}

function resolveShot(state, { ring, dx, dy, rot }) {
  const cfg = levelConfig(state.level);
  const hit = ring > 0;
  const combo = hit ? state.combo + 1 : 0;
  const roundTotal = state.roundTotal + ring;
  const roundEnded = state.arrowsLeft === 0;

  let nextId = state.nextId;
  const newId = () => nextId++;

  const stuck = hit ? [...state.stuck, { id: newId(), dx, dy, rot, ring }] : state.stuck;
  const shotId = newId();

  // XP for this shot.
  let xp = hit ? 5 + ring * 2 : 0;
  if (ring === 10) xp += 15;
  if (combo >= 3) xp += 10;
  if (hit && cfg.moving) xp += 10;

  const profile = {
    ...state.profile,
    totalShots: state.profile.totalShots + 1,
    totalHits: state.profile.totalHits + (hit ? 1 : 0),
    bullseyes: state.profile.bullseyes + (ring === 10 ? 1 : 0),
  };

  // Round end: decide stars and whether the level is cleared.
  let stars = 0;
  let levelWon = false;
  if (roundEnded) {
    stars = starsFor(roundTotal, cfg.target);
    levelWon = stars > 0;
    profile.best = Math.max(profile.best, roundTotal);
    if (levelWon) {
      profile.stars = {
        ...profile.stars,
        [state.level]: Math.max(profile.stars[state.level] ?? 0, stars),
      };
      profile.highestLevel = Math.max(profile.highestLevel, Math.min(state.level + 1, MAX_LEVEL));
      xp += 40 + stars * 20;
    }
  }

  // Achievements.
  const ctx = {
    ring,
    combo,
    moving: cfg.moving,
    wind: cfg.wind,
    level: state.level,
    totalHits: profile.totalHits,
    roundEnded,
    roundTotal,
    levelWon,
    stars,
  };
  const unlocked = { ...profile.unlocked };
  const toasts = [...state.toasts];
  for (const a of ACHIEVEMENTS) {
    if (!unlocked[a.id] && a.test(ctx)) {
      unlocked[a.id] = true;
      xp += 50;
      toasts.push({ id: newId(), icon: a.icon, title: a.title });
    }
  }
  profile.unlocked = unlocked;
  profile.xp = state.profile.xp + xp;

  const result = roundEnded
    ? { level: state.level, stars, total: roundTotal, target: cfg.target, xp, won: levelWon }
    : null;

  return {
    ...state,
    profile,
    combo,
    roundTotal,
    stuck,
    toasts,
    lastShot: { id: shotId, ring },
    phase: roundEnded ? (levelWon ? 'levelWon' : 'roundLost') : 'aim',
    result,
    nextId,
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'FIRE':
      if (state.phase !== 'aim' || state.arrowsLeft <= 0) return state;
      return { ...state, phase: 'flying', arrowsLeft: state.arrowsLeft - 1 };

    case 'RESOLVE':
      return resolveShot(state, action);

    case 'NEXT_LEVEL':
      if (state.phase !== 'levelWon') return state;
      return resetRound({ ...state, level: Math.min(state.level + 1, MAX_LEVEL) });

    case 'RETRY':
      if (state.phase !== 'roundLost') return state;
      return resetRound(state);

    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    default:
      return state;
  }
}
