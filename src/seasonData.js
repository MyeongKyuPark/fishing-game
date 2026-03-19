// Seasonal events driven by real-world date (month/day)
// Active season modifies fish prices, ore rates, herb rates, etc.

export const SEASONS = [
  {
    id: '봄꽃축제',
    name: '봄꽃 축제',
    icon: '🌸',
    months: [3, 4],             // March–April
    desc: '봄 물고기들이 활발히 활동! 판매가 +20%, 채집 속도 +15%',
    fishPriceBonus: 0.20,
    gatherSpeedBonus: 0.15,
    color: '#ffaacc',
  },
  {
    id: '여름낚시대회',
    name: '여름 낚시 대회',
    icon: '☀️',
    months: [6, 7, 8],
    desc: '여름 특수! 희귀 물고기 출현 +20%, 전설 광석 확률 상승',
    rareFishBonus: 0.20,
    oreBoostKey: '금광석',
    oreBoostMult: 1.5,
    color: '#ffcc44',
  },
  {
    id: '추수감사절',
    name: '풍년 축제',
    icon: '🍂',
    months: [9, 10, 11],
    desc: '가을 풍작! 수확량 +50%, 작물 판매가 +30%',
    cropYieldBonus: 0.50,
    cropPriceBonus: 0.30,
    color: '#cc7733',
  },
  {
    id: '겨울얼음낚시',
    name: '겨울 빙어 낚시',
    icon: '❄️',
    months: [12, 1, 2],
    desc: '겨울 특수 물고기 출현! 낚시 속도 +10%, 체력 어빌리티 획득 2배',
    fishSpeedBonus: 0.10,
    staminaGainMult: 2.0,
    color: '#88ccff',
  },
];

/** Get current active season (null if none) */
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-indexed
  return SEASONS.find(s => s.months.includes(month)) ?? null;
}
