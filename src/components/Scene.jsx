import { BOW, RING_FILL, RING_TEXT, SCENE, TARGET } from '../game/config.js';

const SUN = { x: 474, y: 378, r: 56 };

const STARS = [
  [60, 38], [150, 92], [262, 40], [344, 118], [470, 52], [540, 22],
  [30, 190], [160, 10], [425, 200], [600, 140], [700, 30], [230, 150],
];

const BACK_MOUNTAINS =
  'M0 330 L90 262 L190 320 L300 236 L420 318 L520 268 L640 330 L760 250 L880 320 L1000 282 L1000 500 L0 500 Z';
const FRONT_MOUNTAINS =
  'M0 380 L140 320 L250 360 L358 252 L474 348 L607 292 L720 360 L840 318 L1000 372 L1000 500 L0 500 Z';
const HILLS = 'M0 400 C200 360 380 400 520 392 S820 372 1000 398 L1000 500 L0 500 Z';

function zigzag(top, amp, step, width) {
  let d = `M0 ${top}`;
  for (let x = step, i = 1; x <= width; x += step, i++) {
    d += ` L${x} ${i % 2 ? top + amp : top}`;
  }
  return `${d} L${width} 500 L0 500 Z`;
}
const GRASS = zigzag(SCENE.GROUND_Y - 12, 12, 36, SCENE.W);

function pine(x, base, h) {
  const t = base - h;
  return [
    `M${x} ${t} L${x - h * 0.22} ${t + h * 0.45} L${x + h * 0.22} ${t + h * 0.45} Z`,
    `M${x} ${t + h * 0.2} L${x - h * 0.3} ${t + h * 0.7} L${x + h * 0.3} ${t + h * 0.7} Z`,
    `M${x} ${t + h * 0.42} L${x - h * 0.36} ${base} L${x + h * 0.36} ${base} Z`,
  ].join(' ');
}
const PINES = [pine(40, 440, 170), pine(255, 440, 96), pine(905, 440, 150), pine(975, 440, 110)];

function Cloud({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#c9a2d0" opacity="0.35">
      <ellipse cx="0" cy="0" rx="62" ry="16" />
      <ellipse cx="-20" cy="-12" rx="30" ry="18" />
      <ellipse cx="20" cy="-14" rx="36" ry="22" />
    </g>
  );
}

function Birds() {
  return (
    <g fill="none" stroke="#f0e6ff" strokeWidth="2" strokeLinecap="round" opacity="0.8">
      <path d="M292 120 q6 -6 12 0 q6 -6 12 0" />
      <path d="M650 70 q5 -5 10 0 q5 -5 10 0" />
    </g>
  );
}

function Target({ y, radius }) {
  const step = radius / 10;
  const rings = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <g>
      <line x1={TARGET.x} y1={y} x2={TARGET.x} y2={SCENE.GROUND_Y} stroke="#4a2c16" strokeWidth="12" />
      <ellipse cx={TARGET.x} cy={SCENE.GROUND_Y} rx="34" ry="6" fill="#2a1a0e" />
      <circle cx={TARGET.x + 8} cy={y + 8} r={radius + 4} fill="rgba(0,0,0,0.3)" />
      {rings.map((s) => (
        <circle
          key={s}
          cx={TARGET.x}
          cy={y}
          r={(11 - s) * step}
          fill={RING_FILL[s]}
          stroke="rgba(20,12,35,0.35)"
          strokeWidth="1"
        />
      ))}
      {rings.map((s) => {
        const ny = s === 10 ? y : y - (10 - s + 0.5) * step;
        return (
          <text
            key={`n${s}`}
            x={TARGET.x}
            y={ny}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={step * 0.62}
            fontWeight="800"
            fill={RING_TEXT[s]}
          >
            {s}
          </text>
        );
      })}
    </g>
  );
}

function Arrow({ x, y, rot }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
      <line x1="-66" y1="0" x2="-8" y2="0" stroke="#efe2c4" strokeWidth="2.6" strokeLinecap="round" />
      <polygon points="0,0 -11,-4.5 -11,4.5" fill="#cfd6e3" />
      <polygon points="-72,0 -62,-7 -66,0 -62,7" fill="#e5483d" />
    </g>
  );
}

function Archer({ nock }) {
  const ink = '#150d2b';
  const shoulder = { x: 150, y: 292 };
  return (
    <g stroke={ink} strokeLinecap="round" fill="none">
      <circle cx="150" cy="256" r="21" fill={ink} stroke="none" />
      <line x1="150" y1="292" x2="150" y2="352" strokeWidth="30" />
      <line x1="150" y1="352" x2="136" y2="438" strokeWidth="15" />
      <line x1="150" y1="352" x2="166" y2="438" strokeWidth="15" />
      <line x1={shoulder.x} y1={shoulder.y} x2={BOW.x} y2={BOW.y} strokeWidth="11" />
      <line x1={shoulder.x} y1={shoulder.y} x2={nock.x} y2={nock.y} strokeWidth="11" />
    </g>
  );
}

function Bow({ bow }) {
  const top = `${BOW.x - 18} ${BOW.y - 88}`;
  const bottom = `${BOW.x - 18} ${BOW.y + 88}`;
  return (
    <g>
      <path
        d={`M${top} Q${BOW.x + 34} ${BOW.y} ${bottom}`}
        fill="none"
        stroke="#b9803f"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d={`M${top} L${bow.nock.x} ${bow.nock.y} L${bottom}`} fill="none" stroke="#f3ecdc" strokeWidth="1.8" />
      <circle cx={BOW.x} cy={BOW.y} r="6" fill="#6b4a25" />
    </g>
  );
}

export default function Scene({ targetY, radius, stuck, bow, flight, trail }) {
  const restRot = (Math.atan2(bow.dir.y, bow.dir.x) * 180) / Math.PI;

  return (
    <svg viewBox={`0 0 ${SCENE.W} ${SCENE.H}`} role="img" aria-label="Archery range at dusk">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120c33" />
          <stop offset="0.45" stopColor="#2c1d6b" />
          <stop offset="0.75" stopColor="#6b3f8c" />
          <stop offset="0.92" stopColor="#e8866c" />
          <stop offset="1" stopColor="#ffb36b" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#ffbe6e" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffbe6e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24603f" />
          <stop offset="1" stopColor="#0f2e22" />
        </linearGradient>
      </defs>

      <rect width={SCENE.W} height={SCENE.H} fill="url(#sky)" />
      <g fill="#fff">
        {STARS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 ? 1.2 : 1.8} opacity="0.85" />
        ))}
      </g>
      <circle cx={SUN.x} cy={SUN.y} r={SUN.r * 3.4} fill="url(#sunGlow)" />
      <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="#ffe2a6" />

      <Cloud x={170} y={70} />
      <Cloud x={560} y={112} s={1.25} />
      <Cloud x={820} y={44} s={0.8} />
      <Birds />

      <path d={BACK_MOUNTAINS} fill="#4b2f88" />
      <path d={FRONT_MOUNTAINS} fill="#2c1d63" />
      <path d={HILLS} fill="#1f1550" />
      {PINES.map((d, i) => (
        <path key={i} d={d} fill="#120b2b" />
      ))}
      <path d={GRASS} fill="url(#grass)" />

      <Target y={targetY} radius={radius} />
      {stuck.map((s) => (
        <Arrow key={s.id} x={TARGET.x + s.dx} y={targetY + s.dy} rot={s.rot} />
      ))}

      <Archer nock={bow.nock} />
      <Bow bow={bow} />
      {!flight && <Arrow x={bow.tip.x} y={bow.tip.y} rot={restRot} />}
      {flight && <Arrow x={flight.x} y={flight.y} rot={flight.rot} />}

      {trail.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2.6"
          fill="#fff3cf"
          opacity={Math.max(0.12, 0.9 - i * 0.025)}
        />
      ))}
    </svg>
  );
}
