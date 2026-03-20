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
    story: [
      '🌸 봄이 찾아왔습니다! 마을 전체에 벚꽃이 흩날리고 있어요.',
      '💬 민준: "봄이 오면 물고기들이 활발해져요! 지금이 낚시하기 딱 좋은 계절이죠."',
      '💬 수연: "봄 허브로 만든 요리는 정말 맛있어요. 벚꽃잎도 좋은 재료가 된답니다!"',
      '🎉 봄꽃 축제 시작: 물고기 판매가 +20%, 채집 속도 +15%, 봄 씨앗 판매 중!',
    ],
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
    story: [
      '☀️ 뜨거운 여름이 시작되었습니다! 바다 위 태양이 강렬하게 빛나고 있어요.',
      '💬 민준: "여름 낚시 대회 기간이에요! 희귀한 물고기들이 많이 나타날 거예요."',
      '💬 철수: "더운 날씨에 금광석이 더 잘 보인대요. 광산에도 기회가 넘쳐요!"',
      '🎉 여름 낚시 대회 시작: 희귀 물고기 +20%, 금광석 출현율 ×1.5, 여름 씨앗 판매 중!',
    ],
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
    story: [
      '🍂 가을이 왔습니다! 단풍이 물들고 수확의 계절이 시작되었어요.',
      '💬 수연: "가을 작물로 만든 음식은 특별히 맛있죠. 올해 풍작을 기원해요!"',
      '💬 미나: "여관에서 가을 축제 특별 휴식 이벤트를 준비했어요. 꼭 들러주세요~"',
      '🎉 풍년 축제 시작: 수확량 +50%, 작물 판매가 +30%, 가을 씨앗 판매 중!',
    ],
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
    story: [
      '❄️ 겨울이 찾아왔습니다! 마을에 눈이 소복이 쌓였어요.',
      '💬 미나: "추운 날씨에도 낚시를 즐기는 당신은 진정한 낚시꾼이에요! 여관에서 따뜻하게 쉬어가세요."',
      '💬 철수: "겨울 얼음 속 빙정초... 제련 재료로 쓸 수 있는 귀한 물건이에요!"',
      '🎉 겨울 빙어 낚시 시작: 낚시 속도 +10%, 체력 경험치 2배, 겨울 씨앗 판매 중!',
    ],
  },
];

/** Get current active season (null if none) */
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-indexed
  return SEASONS.find(s => s.months.includes(month)) ?? null;
}
