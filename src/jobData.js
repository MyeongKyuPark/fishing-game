// ── Job Tree System (직업 트리) ──────────────────────────────────────────────
// Jobs are unlocked when the player reaches grade 1 in the relevant ability.
// Each player can select one job at a time.

export const JOBS = {
  낚시장인: {
    name: '낚시 장인',
    icon: '🎣',
    color: '#44aaff',
    desc: '낚시 전문가. 낚시 속도 +15%, 희귀 물고기 확률 +10%',
    req: { 낚시: 1 },             // { abilityName: minGrade }
    reqLabel: '낚시 어빌리티 그레이드 1 이상',
    bonus: {
      fishTimeMult: 0.85,         // 낚시 시간 ×0.85 (15% 빠름)
      rareBonus: 0.10,            // 희귀도 +10%
    },
    lore: '바다의 모든 물고기를 아는 전설적인 낚시꾼의 길.',
  },
  광부대가: {
    name: '광부 대가',
    icon: '⛏',
    color: '#ffaa44',
    desc: '채굴 전문가. 채굴 속도 +15%, 광석 대박 확률 ×2',
    req: { 채굴: 1 },
    reqLabel: '채굴 어빌리티 그레이드 1 이상',
    bonus: {
      mineTimeMult: 0.85,         // 채굴 시간 ×0.85
      windfallMult: 2.0,          // 대박 확률 배율
    },
    lore: '산의 심장을 이해하는 위대한 광부의 길.',
  },
  미식가: {
    name: '미식가',
    icon: '🍳',
    color: '#ff8844',
    desc: '요리 전문가. 요리 가격 배율 +0.5배, 요리 속도 +20%',
    req: { 요리: 1 },
    reqLabel: '요리 어빌리티 그레이드 1 이상',
    bonus: {
      cookPriceMult: 0.5,         // 요리 가격 추가 배율
      cookTimeMult: 0.80,         // 요리 시간 ×0.80
    },
    lore: '세상 최고의 요리를 만들어내는 미식가의 길.',
  },
  상인왕: {
    name: '상인 왕',
    icon: '💰',
    color: '#ffcc44',
    desc: '무역 전문가. 모든 판매가 +15%, 화술 어빌리티 경험치 +50%',
    req: { 화술: 1 },
    reqLabel: '화술 어빌리티 그레이드 1 이상',
    bonus: {
      sellBonus: 0.15,            // 판매가 +15%
      speechGainMult: 1.50,       // 화술 경험치 ×1.5
    },
    lore: '모든 거래에서 이익을 보는 전설적인 상인의 길.',
  },
};

/** Check which jobs the player can unlock */
export function getAvailableJobs(abilities) {
  return Object.entries(JOBS).filter(([, job]) =>
    Object.entries(job.req).every(([abilName, minGrade]) =>
      (abilities?.[abilName]?.grade ?? 0) >= minGrade
    )
  ).map(([key]) => key);
}
