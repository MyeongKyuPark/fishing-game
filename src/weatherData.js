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

/** Deterministic weather forecast — returns next n weather objects */
export function getWeatherForecast(roomId, n = 3, now = Date.now()) {
  const period = Math.floor(now / (8 * 60 * 1000));
  const total = W.reduce((a, b) => a + b, 0);
  const result = [];
  for (let i = 1; i <= n; i++) {
    const hash = hashNum(String(roomId ?? 'default') + String(period + i));
    let r = hash % total;
    let weather = WEATHERS[0];
    for (let j = 0; j < W.length; j++) { r -= W[j]; if (r < 0) { weather = WEATHERS[j]; break; } }
    result.push(weather);
  }
  return result;
}

// ── Dynamic Weather Events (Phase 16-3) ──────────────────────────────────────
export const WEATHER_EVENTS = {
  황금조류: {
    label: '황금 조류',   icon: '🌊✨', duration: 20 * 60 * 1000,
    desc: '황금빛 조류! 생선 판매가 +40% · 전설+ 확률 +15%',
    bonus: { fishSellBonus: 0.40, rareBonus: 0.15 },
    color: '#ffd700',
  },
  대폭풍: {
    label: '대폭풍',      icon: '⛈🌪', duration: 15 * 60 * 1000,
    desc: '거센 폭풍! 채굴 속도 +10% · 폭풍광석 드롭 +15%',
    bonus: { mineTimeMult: 0.90, stormOreBonus: 0.15 },
    color: '#8888ff',
  },
  마법안개: {
    label: '마법 안개',   icon: '🌫✨', duration: 25 * 60 * 1000,
    desc: '신비한 안개! 신화급 확률 +20%',
    bonus: { mythicBonus: 0.20 },
    color: '#cc88ff',
  },
  풍요의비: {
    label: '풍요의 비',   icon: '🌧🌿', duration: 30 * 60 * 1000,
    desc: '풍요로운 비! 허브 채집 +50%',
    bonus: { herbGatherBonus: 0.50 },
    color: '#44ff88',
  },
  서리바람: {
    label: '서리 바람',   icon: '❄🌬', duration: 20 * 60 * 1000,
    desc: '서리 바람! 설산 어종 +30%',
    bonus: { snowZoneFishMult: 1.30 },
    color: '#aaddff',
  },
  축복의햇살: {
    label: '축복의 햇살', icon: '☀💫', duration: 30 * 60 * 1000,
    desc: '축복의 햇살! 모든 활동 경험치 +30%',
    bonus: { abilExpBonus: 0.30 },
    color: '#ffff88',
  },
};
