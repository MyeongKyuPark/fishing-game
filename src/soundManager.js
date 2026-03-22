import { isSfxEnabled } from './settingsManager';

let _ctx = null;

function getCtx() {
  if (_ctx) return _ctx;
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { return null; }
  return _ctx;
}

function resumeCtx(ctx) {
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function playFishCatch(rarity) {
  if (!isSfxEnabled('포획')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const pitchMap = { 흔함: 440, 보통: 550, 희귀: 660, 전설: 880, 신화: 1100 };
    const freq = pitchMap[rarity] ?? 440;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now); osc.stop(now + 0.35);
  } catch {}
}

export function playFishingStart() {
  if (!isSfxEnabled('낚시시작')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const now = ctx.currentTime;
    const bufSize = ctx.sampleRate * 0.3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buf;
    filter.type = 'lowpass'; filter.frequency.value = 800;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    src.start(now);
  } catch {}
}

export function playOreMined() {
  if (!isSfxEnabled('채굴')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now); osc.stop(now + 0.15);
  } catch {}
}

export function playCookComplete() {
  if (!isSfxEnabled('요리')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const now = ctx.currentTime;
    const bufSize = ctx.sampleRate * 0.4;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.exp(-i / (bufSize * 0.3));
      data[i] = (Math.random() * 2 - 1) * env * 0.6;
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buf;
    filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.5;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, now);
    src.start(now);
  } catch {}
}

export function playSellSound(amount) {
  if (!isSfxEnabled('판매')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const count = amount >= 2000 ? 4 : amount >= 500 ? 3 : amount >= 100 ? 2 : 1;
    const now = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const baseFreq = 700 + i * 150;
      const t = now + i * 0.1;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
    }
  } catch {}
}

export function playEnterRoom() {
  if (!isSfxEnabled('입장')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now); osc.stop(now + 0.3);
  } catch {}
}

export function playNpcInteract() {
  if (!isSfxEnabled('NPC')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const now = ctx.currentTime;
    const freqs = [523, 659];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = now + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
    });
  } catch {}
}

export function playLevelUp() {
  if (!isSfxEnabled('레벨업')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const now = ctx.currentTime;
    const freqs = [262, 330, 392, 523, 659, 784];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = now + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t); osc.stop(t + 0.12);
    });
  } catch {}
}

export function playSwimSplash() {
  if (!isSfxEnabled('수영')) return;
  try {
    const ctx = getCtx(); if (!ctx) return;
    resumeCtx(ctx);
    const now = ctx.currentTime;

    // Low-pitched white-noise burst (water splash body)
    const bufSize = Math.floor(ctx.sampleRate * 0.18);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buf;
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.4;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    src.start(now);

    // Short droplet high-freq ping
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain); oscGain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.09);
    oscGain.gain.setValueAtTime(0.07, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.start(now); osc.stop(now + 0.09);
  } catch {}
}
