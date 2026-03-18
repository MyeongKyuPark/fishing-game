export const NPCS = {
  상인: {
    name: '상인 아저씨', icon: '🧑‍💼', color: '#ffcc44',
    desc: '마을 상점 운영. 친해질수록 할인 혜택!',
    thresholds: [
      { at: 20, label: '단골',    reward: '상품 5% 할인',        discountPct: 0.05 },
      { at: 50, label: '친구',    reward: '상품 10% 할인',       discountPct: 0.10 },
      { at: 80, label: '절친',    reward: '특별 미끼 매일 지급', discountPct: 0.15 },
    ],
  },
  요리사: {
    name: '요리사 누나', icon: '👩‍🍳', color: '#ff8844',
    desc: '요리법을 가르쳐 줌. 친해질수록 요리 혜택!',
    thresholds: [
      { at: 20, label: '수강생',  reward: '요리 경험치 +20%' },
      { at: 50, label: '제자',    reward: '조리 시 추가 요리 확률 +15%' },
      { at: 80, label: '수제자',  reward: '전설 레시피 해금' },
    ],
  },
  여관주인: {
    name: '여관 주인', icon: '🏨', color: '#88ccff',
    desc: '여관 운영. 친해질수록 휴식/퀘스트 혜택!',
    thresholds: [
      { at: 20, label: '단골손님', reward: '휴식 시 체력 회복 +1' },
      { at: 50, label: 'VIP',     reward: '일일 퀘스트 +1개' },
      { at: 80, label: '특별손님', reward: '오프라인 수입 +50%' },
    ],
  },
};

export function getAffinityLevel(affinity, npcKey) {
  const npc = NPCS[npcKey];
  if (!npc) return null;
  const passed = npc.thresholds.filter(t => affinity >= t.at);
  return passed.length > 0 ? passed[passed.length - 1] : null;
}

export function getShopDiscount(affinityMap) {
  const affinity = affinityMap?.상인 ?? 0;
  if (affinity >= 80) return 0.15;
  if (affinity >= 50) return 0.10;
  if (affinity >= 20) return 0.05;
  return 0;
}
