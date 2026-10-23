let ctx = null;
let enabled = true;

export function setSound(on) {
  enabled = on;
}

function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = ctx || new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq, freq2 = freq, dur = 0.12, type = 'sine', vol = 0.1, delay = 0 }) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(freq2, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function play(fn) {
  if (!enabled) return;
  try {
    fn();
  } catch {
    // Audio not supported or blocked. Ignore.
  }
}

export const sfx = {
  shoot: () => play(() => tone({ freq: 520, freq2: 160, dur: 0.18, type: 'triangle', vol: 0.12 })),
  hit: (ring) => play(() => tone({ freq: 240 + ring * 35, freq2: 120, dur: 0.12, type: 'square', vol: 0.05 })),
  miss: () => play(() => tone({ freq: 180, freq2: 70, dur: 0.22, type: 'sine', vol: 0.1 })),
  bullseye: () =>
    play(() =>
      [660, 880, 1320].forEach((f, i) =>
        tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.08, delay: i * 0.08 })
      )
    ),
  win: () =>
    play(() =>
      [523, 659, 784, 1046].forEach((f, i) =>
        tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.09, delay: i * 0.12 })
      )
    ),
  fail: () =>
    play(() =>
      [392, 330, 262].forEach((f, i) =>
        tone({ freq: f, freq2: f * 0.98, dur: 0.25, type: 'sawtooth', vol: 0.04, delay: i * 0.16 })
      )
    ),
  unlock: () =>
    play(() =>
      [784, 988].forEach((f, i) =>
        tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.09, delay: i * 0.1 })
      )
    ),
};
