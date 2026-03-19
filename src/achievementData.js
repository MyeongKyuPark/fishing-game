// Achievement system - tracks cumulative stats and grants rewards
export const ACHIEVEMENTS = [
  // Fishing
  { id: 'fish_10',      label: '첫 어획',      desc: '물고기 10마리 낚기',       icon: '🎣', type: 'fishCaught',    goal: 10,     reward: { money: 200 } },
  { id: 'fish_100',     label: '낚시 애호가',   desc: '물고기 100마리 낚기',      icon: '🐟', type: 'fishCaught',    goal: 100,    reward: { money: 1000 } },
  { id: 'fish_500',     label: '낚시 달인',     desc: '물고기 500마리 낚기',      icon: '🏆', type: 'fishCaught',    goal: 500,    reward: { money: 4000 } },
  { id: 'fish_2000',    label: '전설 낚시꾼',   desc: '물고기 2000마리 낚기',     icon: '👑', type: 'fishCaught',    goal: 2000,   reward: { money: 15000 } },
  // Rarity
  { id: 'legendary_1',  label: '전설의 손맛',   desc: '전설 물고기 1마리 낚기',   icon: '⭐', type: 'legendaryCount', goal: 1,      reward: { money: 1000 } },
  { id: 'legendary_10', label: '전설 헌터',     desc: '전설 물고기 10마리 낚기',  icon: '⭐', type: 'legendaryCount', goal: 10,     reward: { money: 5000 } },
  { id: 'mythic_1',     label: '신화의 증인',   desc: '신화 물고기 1마리 낚기',   icon: '🌟', type: 'mythicCount',    goal: 1,      reward: { money: 3000 } },
  { id: 'mythic_5',     label: '신화 수집가',   desc: '신화 물고기 5마리 낚기',   icon: '🌟', type: 'mythicCount',    goal: 5,      reward: { money: 12000 } },
  // Encyclopedia
  { id: 'species_5',    label: '생물 탐구',     desc: '5종 물고기 도감 등록',     icon: '📖', type: 'speciesCount',  goal: 5,      reward: { money: 500 } },
  { id: 'species_12',   label: '어류학자',      desc: '12종 물고기 도감 등록',    icon: '📖', type: 'speciesCount',  goal: 12,     reward: { money: 2000 } },
  { id: 'species_all',  label: '박물학자',      desc: '모든 물고기 도감 완성',    icon: '🌊', type: 'speciesCount',  goal: 23,     reward: { money: 8000 } },
  // Mining
  { id: 'ore_50',       label: '광부의 시작',   desc: '광석 50개 채굴',           icon: '⛏', type: 'oreMined',      goal: 50,     reward: { money: 500 } },
  { id: 'ore_300',      label: '숙련 광부',     desc: '광석 300개 채굴',          icon: '⛏', type: 'oreMined',      goal: 300,    reward: { money: 2500 } },
  { id: 'ore_1000',     label: '광산 왕',       desc: '광석 1000개 채굴',         icon: '💎', type: 'oreMined',      goal: 1000,   reward: { money: 8000 } },
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
  // Farming
  { id: 'farm_10',      label: '새싹 농부',     desc: '작물 10개 수확',           icon: '🌱', type: 'cropsHarvested', goal: 10,     reward: { money: 500 } },
  { id: 'farm_50',      label: '숙련 농부',     desc: '작물 50개 수확',           icon: '🌾', type: 'cropsHarvested', goal: 50,     reward: { money: 2000 } },
  { id: 'farm_200',     label: '대지의 주인',   desc: '작물 200개 수확',          icon: '🏡', type: 'cropsHarvested', goal: 200,    reward: { money: 8000 } },
  // Banking
  { id: 'bank_5000',    label: '저축 입문',     desc: '은행에 5,000G 예금',       icon: '🏦', type: 'totalDeposited', goal: 5000,   reward: { money: 500 } },
  { id: 'bank_50000',   label: '재산가',        desc: '은행에 50,000G 예금',      icon: '🏦', type: 'totalDeposited', goal: 50000,  reward: { money: 3000 } },
  { id: 'bank_500000',  label: '금융 왕',       desc: '은행에 500,000G 예금',     icon: '💳', type: 'totalDeposited', goal: 500000, reward: { money: 20000 } },
  // Login
  { id: 'login_7',      label: '성실한 어부',   desc: '7일 연속 접속',            icon: '📅', type: 'loginStreak',   goal: 7,      reward: { money: 2000 } },
  { id: 'login_30',     label: '낚시 마니아',   desc: '30일 연속 접속',           icon: '📅', type: 'loginStreak',   goal: 30,     reward: { money: 10000 } },
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
