// ── Title (칭호) system ────────────────────────────────────────────────────

function totalSkillLv(gs) {
  return Object.values(gs.skills ?? {}).reduce((s, sk) => s + (sk?.lv ?? 1), 0);
}

// Ordered lowest → highest priority; getTitle picks the last one that qualifies
export const TITLES = [
  { label: '신입',          color: '#aaaaaa', condition: ()   => true },
  { label: '낚시 입문자',   color: '#88bbff', condition: (gs) => (gs.skills?.낚시?.lv ?? 1) >= 5  },
  { label: '낚시꾼',        color: '#66aaff', condition: (gs) => (gs.skills?.낚시?.lv ?? 1) >= 10 },
  { label: '광부',          color: '#ffaa44', condition: (gs) => (gs.skills?.채굴?.lv ?? 1) >= 10 },
  { label: '요리사',        color: '#ff8844', condition: (gs) => (gs.skills?.요리?.lv ?? 1) >= 10 },
  { label: '장사꾼',        color: '#ffcc44', condition: (gs) => (gs.skills?.화술?.lv ?? 1) >= 10 },
  { label: '모험가',        color: '#66ff88', condition: (gs) => totalSkillLv(gs) >= 30 },
  { label: '베테랑 낚시꾼', color: '#44aaff', condition: (gs) => (gs.skills?.낚시?.lv ?? 1) >= 25 },
  { label: '대장장이',      color: '#cc8833', condition: (gs) => (gs.skills?.채굴?.lv ?? 1) >= 30 },
  { label: '낚시 고수',     color: '#2277ff', condition: (gs) => (gs.skills?.낚시?.lv ?? 1) >= 40 },
  { label: '용사',          color: '#aa44ff', condition: (gs) => totalSkillLv(gs) >= 70 },
  { label: '대부호',        color: '#ffd700', condition: (gs) => (gs.money ?? 0) >= 100000 },
  { label: '낚시 명인',     color: '#0055ff', condition: (gs) => (gs.skills?.낚시?.lv ?? 1) >= 60 },
  { label: '전설의 용사',   color: '#ff44ff', condition: (gs) => totalSkillLv(gs) >= 150 },
  { label: '낚시의 신',     color: '#ff4444', condition: (gs) => (gs.skills?.낚시?.lv ?? 1) >= 99 },
];

export function getTitle(gs) {
  let best = TITLES[0];
  for (const t of TITLES) {
    if (t.condition(gs)) best = t;
  }
  return best;
}
