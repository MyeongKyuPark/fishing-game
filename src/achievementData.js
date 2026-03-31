// Achievement system - tracks cumulative stats and grants rewards
export const ACHIEVEMENTS = [
  // Fishing
  { id: 'fish_10',      label: '첫 어획',      desc: '물고기 10마리 낚기',       icon: '🎣', type: 'fishCaught',    goal: 10,     reward: { money: 200 } },
  { id: 'fish_100',     label: '낚시 애호가',   desc: '물고기 100마리 낚기',      icon: '🐟', type: 'fishCaught',    goal: 100,    reward: { money: 1000 } },
  { id: 'fish_500',     label: '낚시 달인',     desc: '물고기 500마리 낚기',      icon: '🏆', type: 'fishCaught',    goal: 500,    reward: { money: 4000, baitInventory: { 황금미끼: 1 } } },
  { id: 'fish_2000',    label: '전설 낚시꾼',   desc: '물고기 2000마리 낚기',     icon: '👑', type: 'fishCaught',    goal: 2000,   reward: { money: 15000, baitInventory: { 신화미끼: 1 } } },
  // Rarity
  { id: 'legendary_1',  label: '전설의 손맛',   desc: '전설 물고기 1마리 낚기',   icon: '⭐', type: 'legendaryCount', goal: 1,      reward: { money: 1000 } },
  { id: 'legendary_10', label: '전설 헌터',     desc: '전설 물고기 10마리 낚기',  icon: '⭐', type: 'legendaryCount', goal: 10,     reward: { money: 5000 } },
  { id: 'mythic_1',     label: '신화의 증인',   desc: '신화 물고기 1마리 낚기',   icon: '🌟', type: 'mythicCount',    goal: 1,      reward: { money: 3000 } },
  { id: 'mythic_5',     label: '신화 수집가',   desc: '신화 물고기 5마리 낚기',   icon: '🌟', type: 'mythicCount',    goal: 5,      reward: { money: 12000 } },
  // Encyclopedia
  { id: 'species_5',    label: '생물 탐구',     desc: '5종 물고기 도감 등록',     icon: '📖', type: 'speciesCount',  goal: 5,      reward: { money: 500 } },
  { id: 'species_12',   label: '어류학자',      desc: '12종 물고기 도감 등록',    icon: '📖', type: 'speciesCount',  goal: 12,     reward: { money: 2000 } },
  { id: 'species_all',  label: '박물학자',      desc: '모든 물고기 도감 완성',    icon: '🌊', type: 'speciesCount',  goal: 30,     reward: { money: 8000 } },
  // Mining
  { id: 'ore_50',       label: '광부의 시작',   desc: '광석 50개 채굴',           icon: '⛏', type: 'oreMined',      goal: 50,     reward: { money: 500 } },
  { id: 'ore_300',      label: '숙련 광부',     desc: '광석 300개 채굴',          icon: '⛏', type: 'oreMined',      goal: 300,    reward: { money: 2500 } },
  { id: 'ore_1000',     label: '광산 왕',       desc: '광석 1000개 채굴',         icon: '💎', type: 'oreMined',      goal: 1000,   reward: { money: 8000, potionInventory: { 채굴포션: 2 } } },
  // Gathering
  { id: 'herb_30',      label: '약초 수집가',   desc: '허브 30개 채집',           icon: '🌿', type: 'herbGathered',  goal: 30,     reward: { money: 400 } },
  { id: 'herb_200',     label: '숙련 약초꾼',   desc: '허브 200개 채집',          icon: '🌿', type: 'herbGathered',  goal: 200,    reward: { money: 2500 } },
  // Wealth
  { id: 'money_10000',  label: '소부호',        desc: '골드 10,000G 보유',        icon: '💰', type: 'maxMoney',      goal: 10000,  reward: { money: 1000 } },
  { id: 'money_100000', label: '대부호',        desc: '골드 100,000G 보유',       icon: '💎', type: 'maxMoney',      goal: 100000, reward: { money: 8000 } },
  // Selling
  { id: 'sold_10000',   label: '행상인',        desc: '총 10,000G 판매',          icon: '💵', type: 'totalSold',     goal: 10000,  reward: { money: 1500 } },
  { id: 'sold_100000',  label: '상인왕',        desc: '총 100,000G 판매',         icon: '💵', type: 'totalSold',     goal: 100000, reward: { money: 7000 } },
  // Crafting
  { id: 'enhance_5',    label: '강화 입문',     desc: '장비 강화 5회 성공',       icon: '🔨', type: 'enhanceCount',  goal: 5,      reward: { money: 600 } },
  { id: 'enhance_30',   label: '단련의 장인',   desc: '장비 강화 30회 성공',      icon: '🔨', type: 'enhanceCount',  goal: 30,     reward: { money: 4000 } },
  { id: 'smelt_10',     label: '제련사',        desc: '광물 10회 제련',           icon: '🔥', type: 'smeltCount',    goal: 10,     reward: { money: 800 } },
  { id: 'cook_20',      label: '생선 요리사',   desc: '생선 20마리 조리',         icon: '🍳', type: 'cookCount',     goal: 20,     reward: { money: 1000 } },
  // Dish cooking
  { id: 'dish_5',       label: '요리 입문',     desc: '특별 요리 5개 만들기',     icon: '🍽', type: 'dishCooked',     goal: 5,      reward: { money: 600 } },
  { id: 'dish_30',      label: '셰프',          desc: '특별 요리 30개 만들기',    icon: '👨‍🍳', type: 'dishCooked',    goal: 30,     reward: { money: 3000 } },
  { id: 'dish_100',     label: '미슐랭 셰프',   desc: '특별 요리 100개 만들기',   icon: '⭐', type: 'dishCooked',     goal: 100,    reward: { money: 10000 } },
  // Farming
  { id: 'farm_10',      label: '새싹 농부',     desc: '작물 10개 수확',           icon: '🌱', type: 'cropsHarvested', goal: 10,     reward: { money: 500 } },
  { id: 'farm_50',      label: '숙련 농부',     desc: '작물 50개 수확',           icon: '🌾', type: 'cropsHarvested', goal: 50,     reward: { money: 2000 } },
  { id: 'farm_200',     label: '대지의 주인',   desc: '작물 200개 수확',          icon: '🏡', type: 'cropsHarvested', goal: 200,    reward: { money: 8000, potionInventory: { 채집강화포션: 2 } } },
  // Banking
  { id: 'bank_5000',    label: '저축 입문',     desc: '은행에 5,000G 예금',       icon: '🏦', type: 'totalDeposited', goal: 5000,   reward: { money: 500 } },
  { id: 'bank_50000',   label: '재산가',        desc: '은행에 50,000G 예금',      icon: '🏦', type: 'totalDeposited', goal: 50000,  reward: { money: 3000 } },
  { id: 'bank_500000',  label: '금융 왕',       desc: '은행에 500,000G 예금',     icon: '💳', type: 'totalDeposited', goal: 500000, reward: { money: 20000 } },
  // Login
  { id: 'login_7',      label: '성실한 어부',   desc: '7일 연속 접속',            icon: '📅', type: 'loginStreak',   goal: 7,      reward: { money: 2000 } },
  { id: 'login_30',     label: '낚시 마니아',   desc: '30일 연속 접속',           icon: '📅', type: 'loginStreak',   goal: 30,     reward: { money: 10000 } },
  // NPC Affinity
  { id: 'npc_first20',  label: '첫 인연',       desc: 'NPC 1명과 친밀도 20 달성', icon: '🤝', type: 'npcAt20',       goal: 1,      reward: { money: 300 } },
  { id: 'npc_three50',  label: '마을 친구',     desc: 'NPC 3명과 친밀도 50 달성', icon: '👫', type: 'npcAt50',       goal: 3,      reward: { money: 2000 } },
  { id: 'npc_all50',    label: '인기인',        desc: '모든 NPC와 친밀도 50 달성',icon: '🌟', type: 'npcAt50',       goal: 5,      reward: { money: 5000 } },
  { id: 'npc_first80',  label: '절친',          desc: 'NPC 1명과 친밀도 80 달성', icon: '💖', type: 'npcAt80',       goal: 1,      reward: { money: 3000 } },
  { id: 'npc_all80',    label: '마을 영웅',     desc: '모든 NPC와 친밀도 80 달성',icon: '👑', type: 'npcAt80',       goal: 5,      reward: { money: 20000 } },
  // Exploration
  { id: 'explore_1',    label: '탐험가',        desc: '탐험 구역 1곳 발견',       icon: '🗺', type: 'zonesFound',    goal: 1,      reward: { money: 1000 } },
  { id: 'explore_all',  label: '모험가',        desc: '모든 탐험 구역 발견',      icon: '🧭', type: 'zonesFound',    goal: 4,      reward: { money: 8000, potionInventory: { 희귀낚시포션: 1 } } },
  // Phase 8: Encyclopedia completions
  { id: 'herb_all',     label: '숲의 탐험가',   desc: '모든 허브 종류 채집',                  icon: '🌿', type: 'herbSpecies',   goal: 3,  reward: { money: 3000 } },
  { id: 'ore_all',      label: '광석 수집가',   desc: '모든 광석 종류 채굴',                  icon: '💎', type: 'oreSpecies',    goal: 4,  reward: { money: 2000 } },
  { id: 'dish_all',     label: '마스터 셰프',   desc: '모든 특별 요리 레시피 완성',            icon: '👨‍🍳', type: 'dishSpecies',  goal: 9,  reward: { money: 15000 } },
  { id: 'crop_all',     label: '대지의 개척자', desc: '모든 종류 작물 수확',                  icon: '🌱', type: 'cropSpecies',   goal: 9,  reward: { money: 10000 } },
  { id: 'potion_all',   label: '연금술사',      desc: '모든 포션 종류 제조',                  icon: '⚗️', type: 'potionSpecies', goal: 7,  reward: { money: 8000 } },
  // Phase 11: Zone-specific achievements
  { id: 'zone_herb_50',  label: '초원의 약초꾼', desc: '서쪽 초원에서 허브 50개 채집',          icon: '🌾', type: 'zoneHerbCount',     goal: 50,  reward: { money: 5000 } },
  { id: 'zone_ore_100',  label: '절벽의 광부',   desc: '동쪽 절벽에서 광석 100개 채굴',         icon: '⛏',  type: 'zoneOreCount',      goal: 100, reward: { money: 8000 } },
  { id: 'zone_rare_30',  label: '고원의 수집가',  desc: '북쪽 고원에서 희귀 자원 30개 수집',     icon: '🏔', type: 'zoneRareCount',     goal: 30,  reward: { money: 10000 } },
  { id: 'zone_deep_5',   label: '심해의 전설',   desc: '남쪽 심해에서 전설/신화급 5마리 포획',  icon: '🌊', type: 'zoneDeepFishCount', goal: 5,   reward: { money: 20000 } },
  // Phase 12
  { id: 'pet_evolve',    label: '진화의 증인',   desc: '펫 1마리 진화 완료',                    icon: '🌟', type: 'petEvolveCount',    goal: 1,   reward: { money: 10000 } },
  { id: 'festival_all',  label: '축제의 주인공', desc: '4계절 축제 기간 중 각 1회 이상 활동',   icon: '🎉', type: 'festivalParticipatedCount', goal: 4, reward: { money: 20000 } },
  { id: 'town_first',    label: '마을 일꾼',     desc: '마을 발전에 첫 기여',                   icon: '🏘', type: 'townContribCount',  goal: 1,   reward: { money: 2000 } },
  { id: 'town_100',      label: '마을 대부',     desc: '마을 발전 누적 기여 100회',             icon: '🏙', type: 'townContribCount',  goal: 100, reward: { money: 30000 } },
  { id: 'points_1000',   label: '포인트 수집가', desc: '누적 활동 포인트 1000pt 달성',          icon: '⭐', type: 'totalPointsEarned', goal: 1000, reward: { money: 15000 } },
  // Phase 13: New zone achievements
  { id: 'harbor_fish_30',  label: '항구의 어부',    desc: '항구 마을에서 물고기 30마리 낚기',     icon: '⚓', type: 'harborFishCount',  goal: 30,  reward: { money: 15000 } },
  { id: 'temple_ore_10',   label: '신전의 탐험가',  desc: '고대 신전에서 고대광석 10개 채굴',     icon: '🏺', type: 'templeOreCount',   goal: 10,  reward: { money: 20000 } },
  { id: 'snow_mastery',    label: '설산 정복자',    desc: '설산 정상에서 활동 (숙련도 exp 10 이상)', icon: '❄️', type: 'snowMasteryTime',  goal: 10,  reward: { money: 12000 } },
  // Phase 15-2: NPC 선물
  { id: 'gift_20',         label: '선물의 달인',    desc: 'NPC에게 선물 20회',                     icon: '💝', type: 'npcGiftTotal',    goal: 20,  reward: { money: 8000 } },
  { id: 'gift_fav_5',      label: '마음의 전달자',  desc: 'NPC 선호 아이템 선물 5회',              icon: '💕', type: 'npcGiftFavorite', goal: 5,   reward: { money: 15000 } },
  // Phase 15-4: 존별 낚시 미니게임
  { id: 'tidal_10',        label: '조류를 타는 자', desc: '조류 타이밍 게임 10회 성공',            icon: '🌊', type: 'tidalGameWins',   goal: 10,  reward: { money: 10000 } },
  { id: 'ice_hole_20',     label: '얼음 낚시 달인', desc: '얼음 구멍 선택 게임 20회 성공',         icon: '❄️', type: 'iceHoleGameWins',  goal: 20,  reward: { money: 12000 } },
  // Phase 15-5: 오두막 업그레이드
  { id: 'cottage_lv2',     label: '내 집 마련',     desc: '오두막 레벨 2 달성',                    icon: '🏠', type: 'cottageLevel',    goal: 2,   reward: { money: 5000 } },
  { id: 'cottage_lv4',     label: '꿈의 집',        desc: '오두막 레벨 4 달성',                    icon: '🏡', type: 'cottageLevel',    goal: 4,   reward: { money: 50000 } },
  // Phase 15-1: 월드 보스
  { id: 'boss_join_1',     label: '보스 참전자',    desc: '서버 공동 보스 처치 1회 참여',           icon: '⚔️', type: 'bossKills',       goal: 1,   reward: { money: 10000 } },
  { id: 'boss_top_3',      label: '보스 처치자',    desc: '서버 공동 보스 최고 기여 3회',           icon: '🏆', type: 'bossTopKills',    goal: 3,   reward: { money: 30000 } },
  // Phase 15-3: 프로필 공유
  { id: 'profile_share',   label: '기록의 증인',    desc: '프로필 카드 공유 1회',                   icon: '📋', type: 'profileShares',   goal: 1,   reward: { money: 3000 } },
  // Phase 16-1: 낚시 마스터리 특성 트리
  { id: 'mastery_perk_1',  label: '특성 개척자',    desc: '낚시 마스터리 페르크 1개 해금',          icon: '🌿', type: 'masteryPerkCount',  goal: 1,  reward: { money: 5000 } },
  { id: 'mastery_perk_12', label: '경지의 어부',    desc: '낚시 마스터리 페르크 12개 모두 해금',    icon: '⭐', type: 'masteryPerkCount',  goal: 12, reward: { money: 50000 } },
  // Phase 16-2: 장인 작업대
  { id: 'artisan_first',   label: '장인 작업대 개통', desc: '장인 레시피 첫 제작',                  icon: '🔨', type: 'artisanCraftCount',      goal: 1,  reward: { money: 5000 } },
  { id: 'artisan_set',     label: '세트의 완성',    desc: '장인 레시피 4가지 이상 제작',            icon: '💎', type: 'artisanUniqueCount',     goal: 4,  reward: { money: 30000 } },
  // Phase 16-3: 동적 날씨 이벤트
  { id: 'weather_all',     label: '날씨 관찰자',    desc: '모든 날씨 이벤트 종류 1회 경험',          icon: '🌈', type: 'weatherEventsExperienced', goal: 6,  reward: { money: 15000 } },
  // Phase 16-4: 친구 & 주간 목표
  { id: 'friend_3',        label: '사교적인 어부',  desc: '친구 3명 추가',                           icon: '👥', type: 'friendCount',              goal: 3,  reward: { money: 5000 } },
  { id: 'weekly_20',       label: '라이벌',         desc: '주간 목표 누적 20회 완료',                icon: '🎯', type: 'totalWeeklyGoalsCompleted', goal: 20, reward: { money: 20000 } },
  // Phase 16-5: 외곽 NPC S2 의뢰
  { id: 's2_quest_4',      label: '외곽 탐험가',       desc: '외곽 NPC S2 의뢰 4종 완수',                       icon: '🗺', type: 'npcQuestS2Count', goal: 4, reward: { money: 15000 } },
  { id: 's2_quest_8',      label: '진정한 타이드헤이버', desc: '외곽 NPC S2 의뢰 8종 모두 완수',                  icon: '🏆', type: 'npcQuestS2Count', goal: 8, reward: { money: 50000 } },
  { id: 's2_quest_full',   label: '전설의 낚시 마을',   desc: '모든 외곽 S2 의뢰 완수 + NPC 친밀도 10명 50 이상', icon: '🌟', type: 'npcQuestS2Full',  goal: 1, reward: { money: 80000 } },
];

/** Check which new achievements were just unlocked.
 *  Returns array of newly-completed achievement ids */
export function checkAchievements(stats, alreadyDone) {
  const newlyDone = [];
  for (const ach of ACHIEVEMENTS) {
    if (alreadyDone.includes(ach.id)) continue;
    const val = stats[ach.type] ?? 0;
    if (val >= ach.goal) newlyDone.push(ach.id);
  }
  return newlyDone;
}
