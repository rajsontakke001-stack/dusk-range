import {
  ANGLE_MAX,
  ANGLE_MIN,
  ARROW_LEN,
  BOW,
  DRAW_DIST,
  GRAVITY,
  MAX_PULL,
  MAX_SPEED,
  SCENE,
  TARGET,
} from './config.js';

const SUBSTEPS = 4;
const TRAIL_STEPS = 40;
const TRAIL_DT = 0.035;

// Screen-space unit vector for a launch angle in degrees (0 = right, 90 = straight up).
export function dirFromAngle(deg) {
  const r = (deg * Math.PI) / 180;
  return { x: Math.cos(r), y: -Math.sin(r) };
}

// Dragging back is the opposite of the launch direction, like pulling a bowstring.
export function aimFromDrag(ox, oy, x, y) {
  const px = ox - x;
  const py = oy - y;
  const power = Math.min(1, Math.hypot(px, py) / MAX_PULL);
  const raw = (Math.atan2(-py, px) * 180) / Math.PI;
  return { power, angle: Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, raw)) };
}

// Where the string nock and arrow tip sit for a given aim.
export function bowString(angle, power) {
  const dir = dirFromAngle(angle);
  const nock = {
    x: BOW.x - 18 - dir.x * power * DRAW_DIST,
    y: BOW.y - dir.y * power * DRAW_DIST,
  };
  const tip = { x: nock.x + dir.x * ARROW_LEN, y: nock.y + dir.y * ARROW_LEN };
  return { dir, nock, tip };
}

export function createArrow(tip, angle, power, wind) {
  const dir = dirFromAngle(angle);
  const speed = power * MAX_SPEED;
  return { x: tip.x, y: tip.y, vx: dir.x * speed, vy: dir.y * speed, wind, passed: false };
}

export const rotationOf = (a) => (Math.atan2(a.vy, a.vx) * 180) / Math.PI;

// Advances the arrow in place. The target is a face at x = TARGET.x, so the shot is
// scored where the arrow crosses that line. Returns 'hit' with the ring offset, 'miss'
// once the arrow leaves the playfield, or 'flying'.
export function stepArrow(a, dt, target) {
  const h = dt / SUBSTEPS;
  for (let i = 0; i < SUBSTEPS; i++) {
    a.vx += a.wind * h;
    a.vy += GRAVITY * h;
    a.x += a.vx * h;
    a.y += a.vy * h;

    if (!a.passed && a.x >= TARGET.x) {
      a.passed = true;
      const dx = a.x - TARGET.x;
      const dy = a.y - target.y;
      const dist = Math.hypot(dx, dy);
      if (dist < target.radius) return { status: 'hit', dist, dx, dy };
    }

    if (a.y > SCENE.GROUND_Y || a.y < -80 || a.x > SCENE.W + 80) {
      return { status: 'miss' };
    }
  }
  return { status: 'flying' };
}

// Dots shown while aiming so the player can read the wind and gravity.
export function predictPath(tip, angle, power, wind) {
  const dir = dirFromAngle(angle);
  const speed = power * MAX_SPEED;
  let x = tip.x;
  let y = tip.y;
  let vx = dir.x * speed;
  let vy = dir.y * speed;
  const pts = [];
  for (let i = 0; i < TRAIL_STEPS; i++) {
    vx += wind * TRAIL_DT;
    vy += GRAVITY * TRAIL_DT;
    x += vx * TRAIL_DT;
    y += vy * TRAIL_DT;
    if (y > SCENE.GROUND_Y || x > SCENE.W) break;
    pts.push({ x, y });
  }
  return pts;
}

// Ring 10 is the bullseye at the centre; every radius/10 step drops one point.
export function ringScore(dist, radius) {
  if (dist >= radius) return 0;
  return 10 - Math.floor(dist / (radius / 10));
}
