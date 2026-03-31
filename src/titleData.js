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
  {
    label: '초원의 바람',   color: '#88dd88',
    unlockDesc: '초원 채집 50회',
    effectDesc: '없음',
    bonus: {},
    condition: (gs) => (gs.achStats?.zoneHerbCount ?? 0) >= 50,
  },
  {
    label: '심해의 지배자', color: '#4488ff',
    unlockDesc: '심해 물고기 5마리',
    effectDesc: '없음',
    bonus: {},
    condition: (gs) => (gs.achStats?.zoneDeepFishCount ?? 0) >= 5,
  },
  {
    label: '타이드헤이븐의 전설', color: '#ffd700',
    unlockDesc: '챕터 5 스토리 완료',
    effectDesc: '판매가 +10% · 오프라인 수입 +10%',
    bonus: { sellBonus: 0.10, offlineBonus: 0.10 },
    condition: (gs) => gs.seenChapter5 === true,
  },
  {
    label: '새벽의 낚시꾼', color: '#aaddff',
    unlockDesc: '프레스티지 1회 이상',
    effectDesc: '낚시 속도 +5% · 판매가 +5%',
    bonus: { fishTimeMult: 0.95, sellBonus: 0.05 },
    condition: (gs) => (gs.prestigeCount ?? 0) >= 1,
  },
  {
    label: '전설의 어부',   color: '#ffcc00',
    unlockDesc: '프레스티지 3회 이상',
    effectDesc: '낚시 속도 +10% · 판매가 +10%',
    bonus: { fishTimeMult: 0.90, sellBonus: 0.10 },
    condition: (gs) => (gs.prestigeCount ?? 0) >= 3,
  },
  {
    label: '불멸의 어부',   color: '#ff88ff',
    unlockDesc: '프레스티지 5회 이상',
    effectDesc: '낚시 속도 +15% · 판매가 +15%',
    bonus: { fishTimeMult: 0.85, sellBonus: 0.15 },
    condition: (gs) => (gs.prestigeCount ?? 0) >= 5,
  },
  // Phase 12-4: 전문 직업 칭호
  {
    label: '전문 낚시사', color: '#44aaff',
    unlockDesc: '전문 직업: 낚시사 선택',
    effectDesc: '낚시 속도 +8% · 낚시 판매가 +10%',
    bonus: {},
    condition: (gs) => gs.jobClass === '낚시사',
  },
  {
    label: '전문 광부', color: '#ffaa44',
    unlockDesc: '전문 직업: 광부 선택',
    effectDesc: '채굴 속도 +8% · 광석 대박 +8%',
    bonus: {},
    condition: (gs) => gs.jobClass === '광부',
  },
  {
    label: '전문 요리사', color: '#ff8844',
    unlockDesc: '전문 직업: 요리사 선택',
    effectDesc: '요리 시간 -20% · 요리 판매가 +15%',
    bonus: {},
    condition: (gs) => gs.jobClass === '요리사',
  },
  // Phase 12-5: 포인트 상점 칭호
  {
    label: '포인트의 달인', color: '#ffdd44',
    unlockDesc: '활동 포인트 상점에서 특별 칭호 구매',
    effectDesc: '판매가 +5%',
    bonus: { sellBonus: 0.05 },
    condition: (gs) => (gs.ownedPointTitles ?? []).includes('포인트의달인'),
  },
  // Phase 13: New zone titles
  {
    label: '항구의 왕',    color: '#44ddaa',
    unlockDesc: '항구 마을 물고기 판매 누적 100,000G',
    effectDesc: '생선 판매가 +12%',
    bonus: { fishSellBonus: 0.12 },
    condition: (gs) => (gs.harborFishSellTotal ?? 0) >= 100000,
  },
  {
    label: '유적의 수호자', color: '#cc9944',
    unlockDesc: '고대 신전 방문 + 고대잉어 포획',
    effectDesc: '채굴 속도 +10% · 판매가 +5%',
    bonus: { mineTimeMult: 0.90, sellBonus: 0.05 },
    condition: (gs) => (gs.visitedZones ?? []).includes('고대신전') && (gs.caughtSpecies ?? []).includes('고대잉어'),
  },
  {
    label: '설산의 은둔자', color: '#aaddff',
    unlockDesc: '설산 정상 숙련도 Lv3 달성',
    effectDesc: '오프라인 수입 +20% · 채굴 속도 +8%',
    bonus: { offlineBonus: 0.20, mineTimeMult: 0.92 },
    condition: (gs) => {
      const exp = gs.zoneMastery?.['설산정상'] ?? 0;
      let lv = 0;
      for (const t of [10, 30, 60, 100, 150]) if (exp >= t) lv++;
      return lv >= 3;
    },
  },
  // Phase 15 titles
  {
    label: '타이드헤이븐의 친구', color: '#ff99cc',
    unlockDesc: '모든 NPC 친밀도 80 이상 달성',
    effectDesc: '친밀도 획득 +40% · 판매가 +8%',
    bonus: { sellBonus: 0.08, affinityGainMult: 1.4 },
    condition: (gs) => {
      const aff = gs.npcAffinity ?? {};
      return Object.values(aff).filter(v => v >= 80).length >= 9;
    },
  },
  {
    label: '타이드헤이븐의 집주인', color: '#ffcc44',
    unlockDesc: '오두막 레벨 4 달성',
    effectDesc: '오프라인 수입 추가 +10%',
    bonus: { offlineBonus: 0.10 },
    condition: (gs) => (gs.cottageLevel ?? 1) >= 4,
  },
  // Phase 16-4: 친구 칭호
  {
    label: '타이드헤이븐의 라이벌', color: '#ff88aa',
    unlockDesc: '주간 목표 누적 20회 완료',
    effectDesc: '경험치 획득 +5% · 판매가 +5%',
    bonus: { abilExpBonus: 0.05, sellBonus: 0.05 },
    condition: (gs) => (gs.achStats?.totalWeeklyGoalsCompleted ?? 0) >= 20,
  },
  // Phase 16-3: 날씨 이벤트 칭호
  {
    label: '날씨의 마법사',  color: '#aaffee',
    unlockDesc: '모든 날씨 이벤트 종류 경험 + 황금조류·마법안개·풍요의비 경험',
    effectDesc: '경험치 획득 +8% · 판매가 +5%',
    bonus: { abilExpBonus: 0.08, sellBonus: 0.05 },
    condition: (gs) => (gs.achStats?.weatherEventsExperienced ?? 0) >= 6,
  },
  // Phase 16-2: 장인 작업대 칭호
  {
    label: '타이드헤이븐의 장인', color: '#ffcc88',
    unlockDesc: '장인 레시피 8가지 모두 1회 이상 제작',
    effectDesc: '판매가 +6% · 채굴 속도 +6%',
    bonus: { sellBonus: 0.06, mineTimeMult: 0.94 },
    condition: (gs) => (gs.achStats?.artisanUniqueCount ?? 0) >= 8,
  },
  // Phase 16-1: 낚시 마스터리 칭호
  {
    label: '경지의 어부',    color: '#88ffcc',
    unlockDesc: '낚시 마스터리 페르크 12개 모두 해금',
    effectDesc: '낚시 속도 +5% · 생선 판매가 +5% · 심해 희귀도 +5%',
    bonus: { fishTimeMult: 0.95, fishSellBonus: 0.05, deepRarityBonus: 0.05 },
    condition: (gs) => Object.values(gs.masteryPerks ?? {}).filter(Boolean).length >= 12,
  },
  // Phase 15-1: 보스 칭호
  {
    label: '용사의 귀환',    color: '#ff6644',
    unlockDesc: '서버 공동 보스 최고 기여 3회',
    effectDesc: '판매가 +10% · 낚시 속도 +5%',
    bonus: { sellBonus: 0.10, fishTimeMult: 0.95 },
    condition: (gs) => (gs.achStats?.bossTopKills ?? 0) >= 3,
  },
  // Phase 16-5: 외곽 NPC S2 칭호
  {
    label: '타이드헤이븐의 수호자', color: '#88ddff',
    unlockDesc: '외곽 NPC S2 의뢰 4종 완수 + NPC 친밀도 5명 50 이상',
    effectDesc: '낚시 속도 +4% · NPC 친밀도 획득 +15%',
    bonus: { fishTimeMult: 0.96, npcAffinityMult: 1.15 },
    condition: (gs) => {
      const outer = ['행상인','노련한광부','산신령','심해탐험가','어시장상인','선장','유물학자','설인'];
      const s2Count = outer.filter(k => {
        const step = gs.npcQuestStep?.[k] ?? 0;
        return step >= 2;
      }).length;
      return s2Count >= 4 && (gs.achStats?.npcAt50 ?? 0) >= 5;
    },
  },
  {
    label: '전설의 어촌 영웅',   color: '#ffdd55',
    unlockDesc: '외곽 NPC S2 의뢰 8종 모두 완수',
    effectDesc: '판매가 +8% · 낚시 속도 +5% · NPC 친밀도 획득 +20%',
    bonus: { sellBonus: 0.08, fishTimeMult: 0.95, npcAffinityMult: 1.20 },
    condition: (gs) => {
      const outer = ['행상인','노련한광부','산신령','심해탐험가','어시장상인','선장','유물학자','설인'];
      return outer.every(k => (gs.npcQuestStep?.[k] ?? 0) >= 2);
    },
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
