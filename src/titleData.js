// ── Title (칭호) system ────────────────────────────────────────────────────

function abilVal(gs, key) {
  return gs.abilities?.[key]?.value ?? 0;
}

function totalAbil(gs) {
  return Object.values(gs.abilities ?? {}).reduce((s, a) => s + (a?.value ?? 0), 0);
}

// Ordered lowest → highest priority; getTitle auto-picks the last one that qualifies
// bonus keys:
//   fishTimeMult  — multiplier on fishing time (0.90 = 10% faster)
//   mineTimeMult  — multiplier on mining time
//   gatherTimeMult— multiplier on gather time
//   sellBonus     — additive bonus on all sell prices (0.05 = +5%)
//   fishSellBonus — additive bonus on fish-only sell price
//   offlineBonus  — additive bonus on offline gold mult (0.15 = +15%)
//   npcAffinityMult — multiplier on NPC affinity gained (1.20 = +20%)
//   abilExpBonus  — additive bonus on all ability exp gained (0.05 = +5%)
export const TITLES = [
  {
    label: '신입',          color: '#aaaaaa',
    unlockDesc: '게임 시작',
    effectDesc: '없음',
    bonus: {},
    condition: () => true,
  },
  {
    label: '낚시 입문자',   color: '#88bbff',
    unlockDesc: '낚시 어빌리티 5+',
    effectDesc: '낚시 속도 +3%',
    bonus: { fishTimeMult: 0.97 },
    condition: (gs) => abilVal(gs, '낚시') >= 5,
  },
  {
    label: '낚시꾼',        color: '#66aaff',
    unlockDesc: '낚시 어빌리티 15+',
    effectDesc: '낚시 속도 +5%',
    bonus: { fishTimeMult: 0.95 },
    condition: (gs) => abilVal(gs, '낚시') >= 15,
  },
  {
    label: '광부',          color: '#ffaa44',
    unlockDesc: '채굴 어빌리티 15+',
    effectDesc: '채굴 속도 +5%',
    bonus: { mineTimeMult: 0.95 },
    condition: (gs) => abilVal(gs, '채굴') >= 15,
  },
  {
    label: '요리사',        color: '#ff8844',
    unlockDesc: '요리 어빌리티 15+',
    effectDesc: '판매가 +5%',
    bonus: { sellBonus: 0.05 },
    condition: (gs) => abilVal(gs, '요리') >= 15,
  },
  {
    label: '장사꾼',        color: '#ffcc44',
    unlockDesc: '화술 어빌리티 15+',
    effectDesc: '판매가 +5%',
    bonus: { sellBonus: 0.05 },
    condition: (gs) => abilVal(gs, '화술') >= 15,
  },
  {
    label: '모험가',        color: '#66ff88',
    unlockDesc: '총 어빌리티 합계 50+',
    effectDesc: '모든 경험치 획득 +5%',
    bonus: { abilExpBonus: 0.05 },
    condition: (gs) => totalAbil(gs) >= 50,
  },
  {
    label: '베테랑 낚시꾼', color: '#44aaff',
    unlockDesc: '낚시 어빌리티 40+',
    effectDesc: '낚시 속도 +8%',
    bonus: { fishTimeMult: 0.92 },
    condition: (gs) => abilVal(gs, '낚시') >= 40,
  },
  {
    label: '대장장이',      color: '#cc8833',
    unlockDesc: '강화 어빌리티 40+',
    effectDesc: '채굴 속도 +8%',
    bonus: { mineTimeMult: 0.92 },
    condition: (gs) => abilVal(gs, '강화') >= 40,
  },
  {
    label: '낚시 고수',     color: '#2277ff',
    unlockDesc: '낚시 어빌리티 60+',
    effectDesc: '낚시 속도 +12% · 판매가 +3%',
    bonus: { fishTimeMult: 0.88, sellBonus: 0.03 },
    condition: (gs) => abilVal(gs, '낚시') >= 60,
  },
  {
    label: '용사',          color: '#aa44ff',
    unlockDesc: '총 어빌리티 합계 150+',
    effectDesc: '판매가 +5% · 오프라인 수입 +10%',
    bonus: { sellBonus: 0.05, offlineBonus: 0.10 },
    condition: (gs) => totalAbil(gs) >= 150,
  },
  {
    label: '대부호',        color: '#ffd700',
    unlockDesc: '보유 골드 100,000G',
    effectDesc: '판매가 +8%',
    bonus: { sellBonus: 0.08 },
    condition: (gs) => (gs.money ?? 0) >= 100000,
  },
  {
    label: '낚시 명인',     color: '#0055ff',
    unlockDesc: '낚시 어빌리티 80+',
    effectDesc: '낚시 속도 +18% · 판매가 +5%',
    bonus: { fishTimeMult: 0.82, sellBonus: 0.05 },
    condition: (gs) => abilVal(gs, '낚시') >= 80,
  },
  {
    label: '전설의 용사',   color: '#ff44ff',
    unlockDesc: '총 어빌리티 합계 350+',
    effectDesc: '모든 경험치 +10% · 판매가 +5%',
    bonus: { abilExpBonus: 0.10, sellBonus: 0.05 },
    condition: (gs) => totalAbil(gs) >= 350,
  },
  {
    label: '박물학자',      color: '#44ffaa',
    unlockDesc: '어종 20종 수집',
    effectDesc: '채굴 속도 +5% · 채집 속도 +5%',
    bonus: { mineTimeMult: 0.95, gatherTimeMult: 0.95 },
    condition: (gs) => (gs.caughtSpecies?.length ?? 0) >= 20,
  },
  {
    label: '부호',          color: '#ffdd00',
    unlockDesc: '보유 골드 1,000,000G',
    effectDesc: '판매가 +12%',
    bonus: { sellBonus: 0.12 },
    condition: (gs) => (gs.money ?? 0) >= 1000000,
  },
  {
    label: '낚시의 신',     color: '#ff4444',
    unlockDesc: '낚시 어빌리티 99+',
    effectDesc: '낚시 속도 +25% · 판매가 +10%',
    bonus: { fishTimeMult: 0.75, sellBonus: 0.10 },
    condition: (gs) => abilVal(gs, '낚시') >= 99,
  },
  {
    label: '마을 친구',     color: '#ffaacc',
    unlockDesc: 'NPC 친밀도 50+ 이상 3명',
    effectDesc: 'NPC 친밀도 획득 +20%',
    bonus: { npcAffinityMult: 1.20 },
    condition: (gs) => Object.values(gs.npcAffinity ?? {}).filter(v => v >= 50).length >= 3,
  },
  {
    label: '광산 정복자',   color: '#bb8844',
    unlockDesc: '채굴 어빌리티 80+',
    effectDesc: '채굴 속도 +18%',
    bonus: { mineTimeMult: 0.82 },
    condition: (gs) => abilVal(gs, '채굴') >= 80,
  },
  {
    label: '세계 탐험가',   color: '#44ff88',
    unlockDesc: '탐험 구역 4곳 해금',
    effectDesc: '오프라인 수입 +15%',
    bonus: { offlineBonus: 0.15 },
    condition: (gs) => (gs.exploredZones ?? []).length >= 4,
  },
  {
    label: '전설 탐험가',   color: '#00ffcc',
    unlockDesc: '탐험 구역 5곳 해금',
    effectDesc: '오프라인 수입 +25%',
    bonus: { offlineBonus: 0.25 },
    condition: (gs) => (gs.exploredZones ?? []).length >= 5,
  },
  {
    label: '마을 영웅',     color: '#ff88ff',
    unlockDesc: 'NPC 친밀도 80+ 이상 5명',
    effectDesc: 'NPC 친밀도 획득 +30% · 판매가 +5%',
    bonus: { npcAffinityMult: 1.30, sellBonus: 0.05 },
    condition: (gs) => Object.values(gs.npcAffinity ?? {}).filter(v => v >= 80).length >= 5,
  },
  {
    label: '바다의 주인',   color: '#00ccff',
    unlockDesc: '어종 30종 수집',
    effectDesc: '물고기 판매가 +15%',
    bonus: { fishSellBonus: 0.15 },
    condition: (gs) => (gs.caughtSpecies?.length ?? 0) >= 30,
  },
  {
    label: '신화 소환사',   color: '#ff00ff',
    unlockDesc: '신화 물고기 10마리 포획',
    effectDesc: '낚시 속도 +10% · 판매가 +8%',
    bonus: { fishTimeMult: 0.90, sellBonus: 0.08 },
    condition: (gs) => (gs.achStats?.mythicCount ?? 0) >= 10,
  },
];

// Auto title: highest-priority qualifying title
function autoTitle(gs) {
  let best = TITLES[0];
  for (const t of TITLES) {
    if (t.condition(gs)) best = t;
  }
  return best;
}

// Returns the active title: equipped one (if still qualifies) or auto
export function getTitle(gs) {
  if (gs.equippedTitle) {
    const found = TITLES.find(t => t.label === gs.equippedTitle);
    if (found && found.condition(gs)) return found;
  }
  return autoTitle(gs);
}

// Returns the bonus object of the active title
export function getActiveTitleBonus(gs) {
  return getTitle(gs)?.bonus ?? {};
}
