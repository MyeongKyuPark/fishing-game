export const PETS = {
  수달: {
    name: '수달', icon: '🦦', rarity: '보통',
    desc: '낚시 속도 +15%',
    eggPrice: 2000, hatchMs: 20 * 60 * 1000,
    bonus: { fishTimeMult: 0.85 },
  },
  두더지: {
    name: '두더지', icon: '🦔', rarity: '보통',
    desc: '채굴 속도 +15%, 광석 대박 +10%',
    eggPrice: 2500, hatchMs: 20 * 60 * 1000,
    bonus: { mineTimeMult: 0.85, windfallBonus: 0.10 },
  },
  고양이: {
    name: '고양이', icon: '🐱', rarity: '희귀',
    desc: '판매 가격 +10%',
    eggPrice: 3500, hatchMs: 30 * 60 * 1000,
    bonus: { sellBonus: 0.10 },
  },
  아기용: {
    name: '아기 용', icon: '🐲', rarity: '전설',
    desc: '어빌리티 경험치 +20%, 희귀 낚시 +5%',
    eggPrice: 8000, hatchMs: 60 * 60 * 1000,
    bonus: { abilGainMult: 1.20, rareBonus: 0.05 },
  },
};

export const PET_RARITY_COLOR = { '보통': '#44aaff', '희귀': '#aa44ff', '전설': '#ffaa00' };

// Pet leveling: EXP thresholds to reach each level (index = target level - 2, i.e. threshold[0] = exp to reach Lv2)
export const PET_EXP_THRESHOLDS = [10, 30, 70, 150]; // Lv2, Lv3, Lv4, Lv5
export const PET_MAX_LEVEL = 5;
// Bonus effect multiplier at each level (1-indexed: level 1 = index 0)
export const PET_LEVEL_MULT = [1.0, 1.25, 1.5, 1.75, 2.0];
