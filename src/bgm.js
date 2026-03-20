// Procedural BGM using Web Audio API
// Each track is a looping melody sequence with harmonics and rhythm

let _ctx = null;
let _masterGain = null;
let _currentTrack = null;
let _loopTimeout = null;
let _stopped = false;
let _volume = 0.22;

function getCtx() {
  if (_ctx) return _ctx;
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _masterGain = _ctx.createGain();
    _masterGain.gain.setValueAtTime(_volume, _ctx.currentTime);
    _masterGain.connect(_ctx.destination);
  } catch { return null; }
  return _ctx;
}

function resumeCtx(ctx) {
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

// Play a single note via oscillator
function playNote(ctx, dest, freq, startTime, duration, vol = 0.12, type = 'sine') {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gain.gain.setValueAtTime(vol, startTime + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch {}
}

// Note frequencies
const N = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 784.00, A5: 880.00, B5: 987.77,
  Fs4: 369.99, Gs4: 415.30, As4: 466.16, Fs5: 739.99,
};

// ── Track definitions ─────────────────────────────────────────────────────────
// Each track: { bpm, melody: [[freq, beats], ...], bass: [[freq, beats], ...], loopBeats }
// beats = duration in quarter notes

const TRACKS = {
  outdoor: {
    bpm: 76,
    // Peaceful G major pentatonic melody
    melody: [
      [N.G4, 1], [N.A4, 1], [N.B4, 2],
      [N.D5, 1], [N.B4, 1], [N.A4, 2],
      [N.G4, 1], [N.A4, 1], [N.G4, 1], [N.E4, 1],
      [N.D4, 2], [null, 2],
      [N.G4, 1], [N.B4, 1], [N.D5, 2],
      [N.E5, 1], [N.D5, 1], [N.B4, 2],
      [N.A4, 1], [N.G4, 1], [N.A4, 1], [N.B4, 1],
      [N.G4, 3], [null, 1],
    ],
    bass: [
      [N.G3, 2], [N.D3, 2],
      [N.A3, 2], [N.D3, 2],
      [N.C4, 2], [N.G3, 2],
      [N.D3, 3], [null, 1],
      [N.G3, 2], [N.D3, 2],
      [N.A3, 2], [N.E3, 2],
      [N.C4, 2], [N.B3, 2],
      [N.G3, 3], [null, 1],
    ],
    bassVol: 0.09, melVol: 0.11,
  },

  shop: {
    bpm: 108,
    // Bright C major, bouncy market theme
    melody: [
      [N.C5, 0.5], [N.E5, 0.5], [N.G5, 1],
      [N.E5, 0.5], [N.G5, 0.5], [N.A5, 1],
      [N.G5, 0.5], [N.F5, 0.5], [N.E5, 0.5], [N.D5, 0.5],
      [N.C5, 2],
      [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5], [N.D5, 0.5],
      [N.E5, 1], [N.C5, 1],
      [N.D5, 0.5], [N.E5, 0.5], [N.F5, 0.5], [N.E5, 0.5],
      [N.C5, 2],
    ],
    bass: [
      [N.C3, 1], [N.G3, 1],
      [N.F3, 1], [N.C4, 1],
      [N.A3, 1], [N.E3, 1],
      [N.G3, 1], [N.D3, 1],
      [N.C3, 1], [N.G3, 1],
      [N.A3, 1], [N.E3, 1],
      [N.F3, 1], [N.C3, 1],
      [N.G3, 1], [N.G3, 1],
    ],
    bassVol: 0.08, melVol: 0.10,
  },

  cooking: {
    bpm: 116,
    // F major, upbeat cheerful kitchen
    melody: [
      [N.F4, 0.5], [N.G4, 0.5], [N.A4, 0.5], [N.C5, 0.5],
      [N.A4, 0.5], [N.C5, 0.5], [N.D5, 1],
      [N.C5, 0.5], [N.A4, 0.5], [N.G4, 0.5], [N.F4, 0.5],
      [N.G4, 2],
      [N.A4, 0.5], [N.C5, 0.5], [N.D5, 0.5], [N.C5, 0.5],
      [N.A4, 0.5], [N.G4, 0.5], [N.F4, 1],
      [N.G4, 0.5], [N.A4, 0.5], [N.C5, 0.5], [N.A4, 0.5],
      [N.F4, 2],
    ],
    bass: [
      [N.F3, 1], [N.C3, 1],
      [N.D3, 1], [N.A3, 1],
      [N.G3, 1], [N.C3, 1],
      [N.F3, 2],
      [N.A3, 1], [N.F3, 1],
      [N.G3, 1], [N.C3, 1],
      [N.F3, 1], [N.G3, 1],
      [N.C4, 2],
    ],
    bassVol: 0.07, melVol: 0.10,
  },

  inn: {
    bpm: 58,
    // C major, cozy slow lullaby
    melody: [
      [N.C5, 1.5], [N.B4, 0.5], [N.A4, 1], [null, 1],
      [N.G4, 1.5], [N.A4, 0.5], [N.G4, 2],
      [N.E5, 1.5], [N.D5, 0.5], [N.C5, 1], [null, 1],
      [N.B4, 1.5], [N.A4, 0.5], [N.G4, 2],
      [N.A4, 1], [N.C5, 1], [N.B4, 2],
      [N.G4, 1], [N.A4, 1], [N.G4, 1], [N.E4, 1],
      [N.F4, 1.5], [N.G4, 0.5], [N.A4, 1], [null, 1],
      [N.G4, 3], [null, 1],
    ],
    bass: [
      [N.C3, 2], [N.G3, 2],
      [N.E3, 2], [N.C3, 2],
      [N.A3, 2], [N.E3, 2],
      [N.D3, 2], [N.G3, 2],
      [N.F3, 2], [N.C3, 2],
      [N.C3, 2], [N.G3, 2],
      [N.F3, 2], [N.C3, 2],
      [N.G3, 2], [N.G3, 2],
    ],
    bassVol: 0.08, melVol: 0.10,
  },

  mine: {
    bpm: 52,
    // A minor, dark mysterious cave
    melody: [
      [N.A4, 1.5], [N.G4, 0.5], [N.F4, 2],
      [N.E4, 1.5], [null, 0.5], [N.A4, 2],
      [N.G4, 1], [N.F4, 1], [N.E4, 1], [N.D4, 1],
      [N.A3, 3], [null, 1],
      [N.C5, 1.5], [N.B4, 0.5], [N.A4, 2],
      [N.G4, 1.5], [null, 0.5], [N.E4, 2],
      [N.F4, 1], [N.E4, 1], [N.D4, 1.5], [N.C4, 0.5],
      [N.A3, 3], [null, 1],
    ],
    bass: [
      [N.A3, 2], [N.E3, 2],
      [N.D3, 2], [N.A3, 2],
      [N.G3, 2], [N.E3, 2],
      [N.A3, 4],
      [N.F3, 2], [N.C3, 2],
      [N.E3, 2], [N.A3, 2],
      [N.D3, 2], [N.E3, 2],
      [N.A3, 4],
    ],
    bassVol: 0.10, melVol: 0.09,
    // Echo effect for cave
    echo: true,
  },

  // ── Seasonal outdoor variants ─────────────────────────────────────────────
  outdoor_spring: {
    bpm: 88,
    // D major, bright and flowing spring melody
    melody: [
      [N.D5, 0.5], [N.E5, 0.5], [N.Fs5, 1],
      [N.A5, 0.5], [N.Fs5, 0.5], [N.E5, 1],
      [N.D5, 1], [N.E5, 0.5], [N.D5, 0.5],
      [N.B4, 2],
      [N.E5, 0.5], [N.Fs5, 0.5], [N.A5, 1],
      [N.G5, 0.5], [N.Fs5, 0.5], [N.E5, 1],
      [N.D5, 0.5], [N.E5, 0.5], [N.Fs5, 0.5], [N.E5, 0.5],
      [N.D5, 2],
    ],
    bass: [
      [N.D3, 1], [N.A3, 1],
      [N.G3, 1], [N.D3, 1],
      [N.B3, 1], [N.Fs4, 1],
      [N.A3, 2],
      [N.D3, 1], [N.A3, 1],
      [N.E3, 1], [N.B3, 1],
      [N.G3, 1], [N.A3, 1],
      [N.D3, 2],
    ],
    bassVol: 0.08, melVol: 0.12,
  },

  outdoor_summer: {
    bpm: 100,
    // C major, upbeat energetic summer
    melody: [
      [N.C5, 0.5], [N.D5, 0.5], [N.E5, 0.5], [N.G5, 0.5],
      [N.E5, 1], [N.D5, 1],
      [N.G5, 0.5], [N.E5, 0.5], [N.D5, 0.5], [N.C5, 0.5],
      [N.D5, 2],
      [N.E5, 0.5], [N.G5, 0.5], [N.A5, 1],
      [N.G5, 0.5], [N.E5, 0.5], [N.D5, 1],
      [N.C5, 0.5], [N.D5, 0.5], [N.E5, 0.5], [N.D5, 0.5],
      [N.C5, 2],
    ],
    bass: [
      [N.C3, 1], [N.G3, 1],
      [N.A3, 1], [N.E3, 1],
      [N.F3, 1], [N.C3, 1],
      [N.G3, 2],
      [N.C3, 1], [N.G3, 1],
      [N.A3, 1], [N.F3, 1],
      [N.G3, 1], [N.C4, 1],
      [N.G3, 2],
    ],
    bassVol: 0.08, melVol: 0.12,
  },

  outdoor_fall: {
    bpm: 68,
    // E minor, warm melancholic autumn
    melody: [
      [N.E4, 1.5], [N.D4, 0.5], [N.B3, 2],
      [N.G4, 1], [N.Fs4, 1], [N.E4, 2],
      [N.A4, 1.5], [N.G4, 0.5], [N.E4, 2],
      [N.D4, 3], [null, 1],
      [N.B4, 1.5], [N.A4, 0.5], [N.G4, 2],
      [N.Fs4, 1], [N.E4, 1], [N.D4, 2],
      [N.G4, 1], [N.A4, 1], [N.B4, 1], [N.A4, 1],
      [N.E4, 3], [null, 1],
    ],
    bass: [
      [N.E3, 2], [N.B3, 2],
      [N.G3, 2], [N.D3, 2],
      [N.A3, 2], [N.E3, 2],
      [N.B3, 4],
      [N.E3, 2], [N.A3, 2],
      [N.D3, 2], [N.G3, 2],
      [N.C4, 2], [N.B3, 2],
      [N.E3, 4],
    ],
    bassVol: 0.09, melVol: 0.10,
  },

  outdoor_winter: {
    bpm: 54,
    // C major, quiet sparse winter
    melody: [
      [N.C5, 2], [null, 1], [N.E5, 1],
      [N.G5, 1.5], [N.F5, 0.5], [N.E5, 2],
      [N.D5, 2], [null, 2],
      [N.C5, 1], [N.E5, 1], [N.G5, 2],
      [N.A5, 1.5], [N.G5, 0.5], [N.E5, 2],
      [N.F5, 1], [N.E5, 1], [N.D5, 1], [null, 1],
      [N.G4, 1.5], [N.A4, 0.5], [N.C5, 2],
      [N.G4, 3], [null, 1],
    ],
    bass: [
      [N.C3, 2], [N.G3, 2],
      [N.E3, 2], [N.C3, 2],
      [N.G3, 4],
      [N.C3, 2], [N.E3, 2],
      [N.F3, 2], [N.C3, 2],
      [N.G3, 2], [N.D3, 2],
      [N.A3, 2], [N.E3, 2],
      [N.C3, 4],
    ],
    bassVol: 0.07, melVol: 0.09,
  },

  outdoor_rain: {
    bpm: 60,
    // F major, soft gentle rain
    melody: [
      [N.F4, 1], [N.A4, 1], [N.C5, 2],
      [N.D5, 1.5], [N.C5, 0.5], [N.A4, 2],
      [N.G4, 1], [N.A4, 1], [N.C5, 1], [N.A4, 1],
      [N.F4, 3], [null, 1],
      [N.A4, 1], [N.C5, 1], [N.D5, 2],
      [N.C5, 1.5], [N.A4, 0.5], [N.G4, 2],
      [N.F4, 1], [N.G4, 1], [N.A4, 1], [N.G4, 1],
      [N.F4, 3], [null, 1],
    ],
    bass: [
      [N.F3, 2], [N.C3, 2],
      [N.D3, 2], [N.A3, 2],
      [N.G3, 2], [N.C3, 2],
      [N.F3, 4],
      [N.A3, 2], [N.F3, 2],
      [N.G3, 2], [N.C3, 2],
      [N.D3, 2], [N.F3, 2],
      [N.C4, 4],
    ],
    bassVol: 0.07, melVol: 0.09,
  },
};

function scheduleTrack(trackId, startTime) {
  const ctx = _ctx;
  if (!ctx || _stopped) return 0;

  const track = TRACKS[trackId];
  if (!track) return 0;

  const beatDur = 60 / track.bpm;
  const dest = _masterGain;

  // Optional echo/delay for mine
  let melDest = dest;
  if (track.echo) {
    try {
      const delay = ctx.createDelay(0.5);
      delay.delayTime.setValueAtTime(0.28, startTime);
      const fbGain = ctx.createGain();
      fbGain.gain.setValueAtTime(0.35, startTime);
      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(0.45, startTime);
      delay.connect(fbGain);
      fbGain.connect(delay);
      delay.connect(wetGain);
      wetGain.connect(dest);
      // Create a chain: melody → delay input
      const echoInput = ctx.createGain();
      echoInput.gain.setValueAtTime(1, startTime);
      echoInput.connect(dest);
      echoInput.connect(delay);
      melDest = echoInput;
    } catch {}
  }

  // Schedule melody
  let t = startTime;
  for (const [freq, beats] of track.melody) {
    if (freq !== null) {
      playNote(ctx, melDest, freq, t, beats * beatDur * 0.85, track.melVol, 'sine');
    }
    t += beats * beatDur;
  }

  // Schedule bass
  t = startTime;
  for (const [freq, beats] of track.bass) {
    if (freq !== null) {
      playNote(ctx, dest, freq, t, beats * beatDur * 0.7, track.bassVol, 'triangle');
    }
    t += beats * beatDur;
  }

  // Total loop duration
  const totalBeats = track.melody.reduce((s, [, b]) => s + b, 0);
  return totalBeats * beatDur;
}

export function playBgm(trackId) {
  if (_currentTrack === trackId) return;
  stopBgm();
  _stopped = false;
  _currentTrack = trackId;

  const ctx = getCtx();
  if (!ctx) return;
  resumeCtx(ctx);

  function loop() {
    if (_stopped || _currentTrack !== trackId) return;
    const startTime = ctx.currentTime + 0.05;
    const duration = scheduleTrack(trackId, startTime);
    if (duration > 0) {
      _loopTimeout = setTimeout(loop, (duration - 0.15) * 1000);
    }
  }
  loop();
}

export function stopBgm() {
  _stopped = true;
  _currentTrack = null;
  if (_loopTimeout) {
    clearTimeout(_loopTimeout);
    _loopTimeout = null;
  }
  // Fade out master gain quickly
  if (_masterGain && _ctx) {
    try {
      const now = _ctx.currentTime;
      _masterGain.gain.cancelScheduledValues(now);
      _masterGain.gain.setValueAtTime(_masterGain.gain.value, now);
      _masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
      setTimeout(() => {
        if (_masterGain && _ctx) {
          _masterGain.gain.setValueAtTime(_volume, _ctx.currentTime);
        }
      }, 350);
    } catch {}
  }
}

export function setBgmVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (_masterGain && _ctx) {
    _masterGain.gain.setValueAtTime(_volume, _ctx.currentTime);
  }
}

export function getBgmVolume() {
  return _volume;
}
