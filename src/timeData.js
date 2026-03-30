// ── Day/Night Cycle System (Phase 15) ────────────────────────────────────────
// Time periods based on real wall-clock hour.

export const TIME_PERIODS = [
  {
    id: 'dawn',
    label: '새벽',
    icon: '🌅',
    hours: [5, 6, 7, 8],
    skyColor: 'rgba(255,140,80,0.12)',
    fishRareBonus: 0.12,   // +12% rare/legendary chance
    fishTimeBonus: -0.05,  // -5% fishing time (faster)
    sellBonus: 0,
    mineBonus: 0,
    desc: '고요한 새벽 — 희귀 어종이 수면 위로 올라온다',
  },
  {
    id: 'morning',
    label: '아침',
    icon: '☀️',
    hours: [9, 10, 11],
    skyColor: 'rgba(255,220,100,0.06)',
    fishRareBonus: 0,
    fishTimeBonus: 0,
    sellBonus: 0.05,       // +5% sell price
    mineBonus: 0,
    desc: '활기찬 아침 — 시장이 열려 판매가가 오른다',
  },
  {
    id: 'day',
    label: '낮',
    icon: '🌤',
    hours: [12, 13, 14, 15, 16],
    skyColor: 'rgba(0,0,0,0)',
    fishRareBonus: 0,
    fishTimeBonus: 0,
    sellBonus: 0,
    mineBonus: 0.08,       // +8% ore yield
    desc: '평온한 낮 — 채굴이 잘 된다',
  },
  {
    id: 'evening',
    label: '저녁',
    icon: '🌆',
    hours: [17, 18, 19],
    skyColor: 'rgba(160,80,180,0.14)',
    fishRareBonus: 0.18,   // +18% rare/legendary chance
    fishTimeBonus: 0.05,   // +5% fishing time (slightly slower, more tense)
    sellBonus: 0,
    mineBonus: 0,
    desc: '황혼 무렵 — 전설 어종이 자주 출몰한다',
  },
  {
    id: 'night',
    label: '밤',
    icon: '🌙',
    hours: [20, 21, 22, 23, 0, 1, 2, 3, 4],
    skyColor: 'rgba(10,15,50,0.42)',
    fishRareBonus: 0.15,   // +15% rare/legendary chance
    fishTimeBonus: 0.10,   // +10% fishing time (harder in the dark)
    sellBonus: 0,
    mineBonus: 0,
    nightFish: true,       // enables night-exclusive fish
    desc: '어두운 밤 — 밤에만 나타나는 신비한 어종',
  },
];

/** Get the current time period based on real wall clock */
export function getTimePeriod(now = Date.now()) {
  const hour = new Date(now).getHours();
  return TIME_PERIODS.find(p => p.hours.includes(hour)) ?? TIME_PERIODS[2]; // fallback to 'day'
}

/** ms until the next time period change */
export function msUntilNextTimePeriod(now = Date.now()) {
  const d = new Date(now);
  const hour = d.getHours();
  // Find which hours fall in the current period and next transition
  const period = getTimePeriod(now);
  const maxHour = Math.max(...period.hours);
  // Next transition is at maxHour + 1:00
  const next = new Date(d);
  next.setHours(maxHour + 1, 0, 0, 0);
  if (next <= d) next.setDate(next.getDate() + 1);
  return next - d;
}
