// ── Character Stats System ─────────────────────────────────────────────────
// STR/DEX/INT/VIT/LUK — increase automatically via actions, affect game numbers

export const STAT_DEFS = {
  str: { name: '힘',   icon: '⚒️', color: '#e05050', desc: '채굴 속도 단축',           gainDesc: '광석 채굴 시 증가' },
  dex: { name: '민첩', icon: '🎣', color: '#4090e0', desc: '낚시 속도 단축',           gainDesc: '낚시 시 증가 (희귀할수록 더 증가)' },
  int: { name: '지능', icon: '📚', color: '#9b59b6', desc: '판매가 향상',             gainDesc: '아이템 판매 시 증가' },
  vit: { name: '활력', icon: '💚', color: '#27ae60', desc: '모든 활동 속도 단축',       gainDesc: '낚시·채굴·채집 시 증가' },
  luk: { name: '행운', icon: '🍀', color: '#e67e22', desc: '희귀 아이템 확률·판매가 향상', gainDesc: '희귀 이상 획득 시 증가' },
};

// Level formula: level = floor(sqrt(xp / 8)) + 1
// Level 1 at 0xp, 2 at 8xp, 3 at 32xp, 5 at 128xp, 10 at 648xp, 20 at 2888xp
export function getStatLevel(xp) {
  return Math.floor(Math.sqrt((xp ?? 0) / 8)) + 1;
}

export function getStatProgress(xp) {
  const level = getStatLevel(xp ?? 0);
  const prevXP = Math.pow(level - 1, 2) * 8;
  const nextXP = Math.pow(level, 2) * 8;
  return { level, current: (xp ?? 0) - prevXP, needed: nextXP - prevXP };
}

// Character level: floor(sqrt(charXP / 40)) + 1
// Level 2 at 40xp, 5 at 640xp, 10 at 3640xp, 20 at 15640xp
export function getCharLevel(charXP) {
  return Math.floor(Math.sqrt((charXP ?? 0) / 40)) + 1;
}

export function getCharProgress(charXP) {
  const level = getCharLevel(charXP ?? 0);
  const prevXP = Math.pow(level - 1, 2) * 40;
  const nextXP = Math.pow(level, 2) * 40;
  return { level, current: (charXP ?? 0) - prevXP, needed: nextXP - prevXP };
}

// Stat bonuses applied to game calculations
export function getStatBonuses(stats = {}, charXP = 0) {
  const str = getStatLevel(stats.str ?? 0);
  const dex = getStatLevel(stats.dex ?? 0);
  const int_ = getStatLevel(stats.int ?? 0);
  const vit = getStatLevel(stats.vit ?? 0);
  const luk = getStatLevel(stats.luk ?? 0);
  return {
    mineTimeMult:  Math.max(0.4, 1 - (str - 1) * 0.006),   // STR: -0.6% mine time/level (cap 60%)
    fishTimeMult:  Math.max(0.4, 1 - (dex - 1) * 0.006),   // DEX: -0.6% fish time/level
    sellMult:      1 + (int_ - 1) * 0.005,                  // INT: +0.5% sell price/level
    actTimeMult:   Math.max(0.7, 1 - (vit - 1) * 0.004),   // VIT: -0.4% all activity/level
    lukRareMult:   1 + (luk - 1) * 0.006,                   // LUK: rare item weight +0.6%/level
    lukSellMult:   1 + (luk - 1) * 0.002,                   // LUK: +0.2% sell price/level
  };
}

export const RARE_ORE_KEYS = ['수정', '금광석', '고대광석', '빙정광석'];
export const RARE_FISH_RARITIES = ['희귀', '전설', '신화'];
