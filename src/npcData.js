export const NPCS = {
  상인: {
    name: '상인 아저씨', icon: '🧑‍💼', color: '#ffcc44',
    desc: '마을 상점 운영. 친해질수록 할인 혜택!',
    thresholds: [
      { at: 20, label: '단골',    reward: '상품 5% 할인',        discountPct: 0.05 },
      { at: 50, label: '친구',    reward: '상품 10% 할인',       discountPct: 0.10 },
      { at: 80, label: '절친',    reward: '특별 미끼 매일 지급', discountPct: 0.15 },
    ],
    giftPrefs: { liked: ['금광석', '수정'], favoriteItem: '고대광석', likedGain: 5, favoriteGain: 15 },
  },
  요리사: {
    name: '요리사 누나', icon: '👩‍🍳', color: '#ff8844',
    desc: '요리법을 가르쳐 줌. 친해질수록 요리 혜택!',
    thresholds: [
      { at: 20, label: '수강생',  reward: '요리 경험치 +20%' },
      { at: 50, label: '제자',    reward: '조리 시 추가 요리 확률 +15%' },
      { at: 80, label: '수제자',  reward: '전설 레시피 해금' },
    ],
    giftPrefs: { liked: ['희귀허브', '버섯'], favoriteItem: '황금씨앗', likedGain: 6, favoriteGain: 18 },
  },
  여관주인: {
    name: '여관 주인', icon: '🏨', color: '#88ccff',
    desc: '여관 운영. 친해질수록 휴식/퀘스트 혜택!',
    thresholds: [
      { at: 20, label: '단골손님', reward: '휴식 시 체력 회복 +1' },
      { at: 50, label: 'VIP',     reward: '일일 퀘스트 +1개' },
      { at: 80, label: '특별손님', reward: '오프라인 수입 +50%' },
    ],
    giftPrefs: { liked: ['들풀', '희귀허브'], favoriteItem: '버섯', likedGain: 4, favoriteGain: 12 },
  },
  채굴사: {
    name: '철수 (채굴사)', icon: '⛏', color: '#aaccee',
    desc: '광산 베테랑. 친해질수록 채굴 혜택!',
    thresholds: [
      { at: 20, label: '광부 견습', reward: '채굴 속도 +8%' },
      { at: 50, label: '광부 동료', reward: '광석 대박 확률 +5%' },
      { at: 80, label: '광산 친구', reward: '5층 채굴 능력치 제한 해제 + 특수 광석 확률↑' },
    ],
    giftPrefs: { liked: ['철광석', '구리광석'], favoriteItem: '빙정광석', likedGain: 5, favoriteGain: 15 },
  },
  은행원: {
    name: '은행원', icon: '🏦', color: '#66ddbb',
    desc: '은행 담당자. 친해질수록 금융 혜택!',
    thresholds: [
      { at: 20, label: '일반 고객', reward: '은행 이자율 +0.5%/시간' },
      { at: 50, label: '우대 고객', reward: '이자율 추가 +0.5% (총 +1%)' },
      { at: 80, label: 'VIP 고객',  reward: '오프라인 수입 최대 2배 증폭' },
    ],
    giftPrefs: { liked: ['수정', '금광석'], favoriteItem: '황금장어', likedGain: 5, favoriteGain: 15 },
  },
  행상인: {
    name: '행상인', icon: '🧳', color: '#ddaa44',
    desc: '서쪽 초원을 누비는 여행 상인. 허브·씨앗·소모품을 판매한다.',
    thresholds: [],
    giftPrefs: { liked: ['들풀', '버섯'], favoriteItem: '희귀허브', likedGain: 3, favoriteGain: 10 },
  },
  노련한광부: {
    name: '노련한 광부', icon: '🪨', color: '#aa8866',
    desc: '동쪽 절벽의 베테랑 광부. 광석 감정과 곡괭이 수리를 해준다.',
    thresholds: [],
    giftPrefs: { liked: ['구리광석', '수정'], favoriteItem: '고대광석', likedGain: 5, favoriteGain: 15 },
  },
  산신령: {
    name: '산신령', icon: '🌫', color: '#aaddff',
    desc: '북쪽 고원의 신령. 하루 한 번 낚시·채굴·판매 중 하나를 강화하는 버프를 내려준다.',
    thresholds: [],
    giftPrefs: { liked: ['수정', '금광석'], favoriteItem: '빙정광석', likedGain: 6, favoriteGain: 20 },
  },
  심해탐험가: {
    name: '심해 탐험가', icon: '🤿', color: '#4488ff',
    desc: '남쪽 심해를 탐험하는 모험가. 희귀 물고기를 보여주면 특별 보상을 준다.',
    thresholds: [],
    giftPrefs: { liked: ['심해문어', '날치'], favoriteItem: '타이드헤이븐리바이어던', likedGain: 5, favoriteGain: 20 },
  },
  // Phase 13: New zone NPCs
  어시장상인: {
    name: '어시장 상인', icon: '🐟', color: '#44ddaa',
    desc: '항구 마을의 어시장을 운영. 생선을 비싸게 사들인다.',
    thresholds: [],
    giftPrefs: { liked: ['날치', '자갈치'], favoriteItem: '항구왕새우', likedGain: 8, favoriteGain: 20 },
  },
  선장: {
    name: '선장', icon: '⚓', color: '#4466cc',
    desc: '항구 마을의 베테랑 선장. 오랜 항해 이야기를 들려준다.',
    thresholds: [],
    giftPrefs: { liked: ['심해문어', '달빛가오리'], favoriteItem: '타이드헤이븐리바이어던', likedGain: 10, favoriteGain: 30 },
  },
  유물학자: {
    name: '유물학자', icon: '🏺', color: '#cc9944',
    desc: '고대 신전을 연구하는 학자. 고대 광석을 감정해 준다.',
    thresholds: [],
    giftPrefs: { liked: ['고대광석'], favoriteItem: '신전수호어', likedGain: 8, favoriteGain: 24 },
  },
  설인: {
    name: '설인', icon: '❄️', color: '#aaddff',
    desc: '설산 정상에 사는 신비로운 존재. 따뜻한 음료로 체력을 회복시켜 준다.',
    thresholds: [],
    giftPrefs: { liked: ['얼음빙어', '빙정광석'], favoriteItem: '설산용', likedGain: 8, favoriteGain: 24 },
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
