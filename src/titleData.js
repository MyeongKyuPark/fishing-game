// ── Title (칭호) system ────────────────────────────────────────────────────

function abilVal(gs, key) {
  return gs.abilities?.[key]?.value ?? 0;
}

function totalAbil(gs) {
  return Object.values(gs.abilities ?? {}).reduce((s, a) => s + (a?.value ?? 0), 0);
}

// Ordered lowest → highest priority; getTitle picks the last one that qualifies
export const TITLES = [
  { label: '신입',          color: '#aaaaaa', condition: ()    => true },
  { label: '낚시 입문자',   color: '#88bbff', condition: (gs)  => abilVal(gs, '낚시') >= 5  },
  { label: '낚시꾼',        color: '#66aaff', condition: (gs)  => abilVal(gs, '낚시') >= 15 },
  { label: '광부',          color: '#ffaa44', condition: (gs)  => abilVal(gs, '채굴') >= 15 },
  { label: '요리사',        color: '#ff8844', condition: (gs)  => abilVal(gs, '요리') >= 15 },
  { label: '장사꾼',        color: '#ffcc44', condition: (gs)  => abilVal(gs, '화술') >= 15 },
  { label: '모험가',        color: '#66ff88', condition: (gs)  => totalAbil(gs) >= 50  },
  { label: '베테랑 낚시꾼', color: '#44aaff', condition: (gs)  => abilVal(gs, '낚시') >= 40 },
  { label: '대장장이',      color: '#cc8833', condition: (gs)  => abilVal(gs, '강화') >= 40 },
  { label: '낚시 고수',     color: '#2277ff', condition: (gs)  => abilVal(gs, '낚시') >= 60 },
  { label: '용사',          color: '#aa44ff', condition: (gs)  => totalAbil(gs) >= 150 },
  { label: '대부호',        color: '#ffd700', condition: (gs)  => (gs.money ?? 0) >= 100000 },
  { label: '낚시 명인',     color: '#0055ff', condition: (gs)  => abilVal(gs, '낚시') >= 80 },
  { label: '전설의 용사',   color: '#ff44ff', condition: (gs)  => totalAbil(gs) >= 350 },
  { label: '낚시의 신',     color: '#ff4444', condition: (gs)  => abilVal(gs, '낚시') >= 99 },
];

export function getTitle(gs) {
  let best = TITLES[0];
  for (const t of TITLES) {
    if (t.condition(gs)) best = t;
  }
  return best;
}
