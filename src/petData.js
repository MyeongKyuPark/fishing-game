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
  봉황: {
    name: '봉황', icon: '🦅', rarity: '희귀',
    desc: '채집 속도 +20%',
    eggPrice: 5000, hatchMs: 45 * 60 * 1000,
    bonus: { gatherTimeMult: 0.80 },
  },
  황금두더지: {
    name: '황금 두더지', icon: '🦔', rarity: '희귀',
    desc: '채굴 속도 +25%, 광석 대박 +12%',
    eggPrice: 6000, hatchMs: 60 * 60 * 1000,
    bonus: { mineTimeMult: 0.75, windfallBonus: 0.12 },
  },
  별빛고양이: {
    name: '별빛 고양이', icon: '😸', rarity: '전설',
    desc: '판매 가격 +15%, 희귀 낚시 +8%',
    eggPrice: 15000, hatchMs: 120 * 60 * 1000,
    bonus: { sellBonus: 0.15, rareBonus: 0.08 },
  },
};

export const PET_RARITY_COLOR = { '보통': '#44aaff', '희귀': '#aa44ff', '전설': '#ffaa00', '신화': '#ff44ff' };

// Pet leveling: EXP thresholds to reach each level (index = target level - 2, i.e. threshold[0] = exp to reach Lv2)
export const PET_EXP_THRESHOLDS = [10, 30, 70, 150]; // Lv2, Lv3, Lv4, Lv5
export const PET_MAX_LEVEL = 5;
// Bonus effect multiplier at each level (1-indexed: level 1 = index 0)
export const PET_LEVEL_MULT = [1.0, 1.25, 1.5, 1.75, 2.0];

// ── Phase 12-1: 펫 진화 시스템 ────────────────────────────────────────────────
export const EVOLVED_PETS = {
  스타피시:      { base: '수달',  name: '스타피시',    icon: '⭐', rarity: '전설', desc: '낚시 속도 +28%, 희귀 낚시 +5%', bonus: { fishTimeMult: 0.72, rareBonus: 0.05 } },
  크리스탈두더지: { base: '두더지', name: '크리스탈 두더지', icon: '💎', rarity: '전설', desc: '채굴 속도 +28%, 광석 대박 +18%', bonus: { mineTimeMult: 0.72, windfallBonus: 0.18 } },
  문라이트캣:    { base: '고양이', name: '문라이트 캣',  icon: '🌙', rarity: '전설', desc: '판매가 +20%, 낚시 속도 +7%', bonus: { sellBonus: 0.20, fishTimeMult: 0.93 } },
  천룡:         { base: '아기용', name: '천룡',        icon: '🐉', rarity: '신화', desc: '어빌리티 경험치 +35%, 희귀 낚시 +10%, 판매가 +5%', bonus: { abilGainMult: 1.35, rareBonus: 0.10, sellBonus: 0.05 } },
  불사조:       { base: '봉황',   name: '불사조',      icon: '🦜', rarity: '신화', desc: '채집 속도 +30%, 허브 추가 획득 +25%', bonus: { gatherTimeMult: 0.70, herbYieldBonus: 0.25 } },
};

export const EVOLVE_REQUIREMENTS = {
  스타피시:      { basePet: '수달',  evolutionGem: 1, mythicOre: 5 },
  크리스탈두더지: { basePet: '두더지', evolutionGem: 1, mythicOre: 5 },
  문라이트캣:    { basePet: '고양이', evolutionGem: 1, mythicOre: 5 },
  천룡:         { basePet: '아기용', evolutionGem: 2, mythicOre: 8 },
  불사조:       { basePet: '봉황',   evolutionGem: 1, mythicOre: 5 },
};
