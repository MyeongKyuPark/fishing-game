// ── Weather System ───────────────────────────────────────────────────────────

export const WEATHERS = [
  { id: 'clear',  icon: '☀️',  label: '맑음',  fishMult: 1.00, mineMult: 1.00, canFish: true,  abilMult: 1.0, skyColor: 'rgba(30,80,180,0.0)'  },
  { id: 'cloudy', icon: '⛅',  label: '흐림',  fishMult: 1.10, mineMult: 1.00, canFish: true,  abilMult: 1.0, skyColor: 'rgba(60,60,90,0.18)'   },
  { id: 'rain',   icon: '🌧️',  label: '비',    fishMult: 1.35, mineMult: 0.90, canFish: true,  abilMult: 1.2, skyColor: 'rgba(30,50,90,0.30)'   },
  { id: 'storm',  icon: '⛈️',  label: '폭풍',  fishMult: 0.00, mineMult: 0.80, canFish: false, abilMult: 0.5, skyColor: 'rgba(20,20,50,0.50)'   },
  { id: 'fog',    icon: '🌫️',  label: '안개',  fishMult: 0.80, mineMult: 0.75, canFish: true,  abilMult: 0.9, skyColor: 'rgba(180,180,200,0.22)' },
];

// Weighted distribution: clear 40%, cloudy 25%, rain 20%, storm 5%, fog 10%
const W = [40, 25, 20, 5, 10];

function hashNum(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic weather — same for all players in the same room, changes every 8 min */
export function getWeather(roomId, now = Date.now()) {
  const period = Math.floor(now / (8 * 60 * 1000));
  const hash = hashNum(String(roomId ?? 'default') + String(period));
  const total = W.reduce((a, b) => a + b, 0);
  let r = hash % total;
  for (let i = 0; i < W.length; i++) { r -= W[i]; if (r < 0) return WEATHERS[i]; }
  return WEATHERS[0];
}

/** ms until next weather change */
export function msUntilNextWeather(now = Date.now()) {
  const period = Math.floor(now / (8 * 60 * 1000));
  return (period + 1) * 8 * 60 * 1000 - now;
}
