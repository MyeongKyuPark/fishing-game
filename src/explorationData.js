export const EXPLORE_ZONES = [
  {
    id: '비밀낚시터',
    name: '비밀 낚시터',
    icon: '🏞',
    desc: '숨겨진 낚시터. 희귀 물고기가 2배로 출현!',
    reqAbil: { 낚시: 40 },
    reqLabel: '낚시 숙련도 40 이상',
    benefit: '희귀 낚시 가중치 ×2',
    fishBoost: { 희귀: 2.0, 전설: 1.5, 신화: 1.3 },
  },
  {
    id: '심층광맥',
    name: '심층 광맥',
    icon: '💎',
    desc: '깊은 곳의 광맥. 수정과 금광석 확률 상승!',
    reqAbil: { 채굴: 35 },
    reqLabel: '채굴 숙련도 35 이상',
    benefit: '금광석/수정 채굴 확률 +30%',
    oreBoost: { 수정: 1.8, 금광석: 2.0 },
  },
  {
    id: '신비의숲',
    name: '신비의 숲',
    icon: '🌲',
    desc: '깊은 숲속. 희귀 허브와 특수 재료 발견!',
    reqAbil: { 채집: 25 },
    reqLabel: '채집 숙련도 25 이상',
    benefit: '희귀 허브 2배 획득 확률',
    herbBoost: 2.0,
  },
  {
    id: '고대유적',
    name: '고대 유적',
    icon: '🏛',
    desc: '전설의 유적. 전설/신화 물고기만 출현하는 비밀 낚시터!',
    reqAbil: { 낚시: 70, 체력: 50 },
    reqLabel: '낚시 70 + 체력 50 이상',
    benefit: '전설/신화어 전용 낚시',
    fishBoost: { 전설: 3.0, 신화: 3.0 },
  },
];

export function checkZoneUnlock(abilities, exploredZones) {
  // Returns newly unlockable zone ids
  return EXPLORE_ZONES.filter(z => {
    if (exploredZones.includes(z.id)) return false;
    return Object.entries(z.reqAbil).every(([abil, req]) => (abilities?.[abil]?.value ?? 0) >= req);
  });
}
