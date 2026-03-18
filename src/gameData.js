export const TILE_SIZE = 32;
export const MAP_W = 70;
export const MAP_H = 50;

export const TILE = { GRASS: 0, WATER: 1, STONE: 2, WOOD: 3, SAND: 4, BUILDING: 5, PATH: 6, FOREST: 7 };

export const TILE_COLOR = [
  '#4a7c3a', // GRASS
  '#1a5fa8', // WATER
  '#7a7070', // STONE
  '#8b6914', // WOOD
  '#c4a44a', // SAND
  '#5a3a28', // BUILDING
  '#9e8050', // PATH
  '#2d5a1e', // FOREST
];

export const WALKABLE = [true, false, true, true, true, false, true, true];

// ── Fish ─────────────────────────────────────────────────────────────────────
export const FISH = {
  // Ability 0~9
  붕어:       { minSz: 10, maxSz: 35,  price: 20,   rarity: '흔함' },
  잉어:       { minSz: 20, maxSz: 60,  price: 40,   rarity: '흔함' },
  미꾸라지:   { minSz: 5,  maxSz: 20,  price: 15,   rarity: '흔함' },
  메기:       { minSz: 15, maxSz: 50,  price: 35,   rarity: '흔함' },
  // Ability 10~19
  멸치:       { minSz: 4,  maxSz: 14,  price: 18,   rarity: '흔함' },
  배스:       { minSz: 25, maxSz: 55,  price: 70,   rarity: '보통' },
  송어:       { minSz: 30, maxSz: 70,  price: 90,   rarity: '보통' },
  // Ability 20~29
  꽁치:       { minSz: 25, maxSz: 45,  price: 110,  rarity: '보통' },
  강꼬치고기: { minSz: 40, maxSz: 90,  price: 130,  rarity: '보통' },
  황다랑어:   { minSz: 60, maxSz: 180, price: 200,  rarity: '보통' },
  금눈돔:     { minSz: 20, maxSz: 55,  price: 280,  rarity: '희귀' },
  // Ability 30~39
  연어:       { minSz: 50, maxSz: 100, price: 300,  rarity: '희귀' },
  황금붕어:   { minSz: 10, maxSz: 30,  price: 380,  rarity: '희귀' },
  오징어:     { minSz: 15, maxSz: 50,  price: 260,  rarity: '희귀' },
  낙지:       { minSz: 10, maxSz: 40,  price: 320,  rarity: '희귀' },
  // Ability 40~49
  참치:       { minSz: 80, maxSz: 200, price: 500,  rarity: '희귀' },
  광어:       { minSz: 35, maxSz: 80,  price: 450,  rarity: '희귀' },
  감성돔:     { minSz: 30, maxSz: 70,  price: 650,  rarity: '전설' },
  // Ability 50~69
  우럭:       { minSz: 25, maxSz: 65,  price: 750,  rarity: '전설' },
  뱀장어:     { minSz: 45, maxSz: 110, price: 900,  rarity: '전설' },
  황새치:     { minSz: 100, maxSz: 250, price: 1000, rarity: '전설' },
  // Ability 70+
  용고기:     { minSz: 50, maxSz: 150, price: 1800, rarity: '신화' },
  고대어:     { minSz: 30, maxSz: 80,  price: 3000, rarity: '신화' },
};

// ── Ability-gated fish tables (낚시 ability determines available fish pool) ──
export const ABILITY_FISH = [
  { minAbil:  0, table: [{ f:'붕어',w:35},{f:'잉어',w:30},{f:'미꾸라지',w:25},{f:'메기',w:10}] },
  { minAbil: 10, table: [{ f:'붕어',w:18},{f:'잉어',w:18},{f:'멸치',w:22},{f:'배스',w:22},{f:'송어',w:20}] },
  { minAbil: 20, table: [{ f:'꽁치',w:25},{f:'강꼬치고기',w:22},{f:'황다랑어',w:20},{f:'금눈돔',w:18},{f:'배스',w:15}] },
  { minAbil: 30, table: [{ f:'연어',w:22},{f:'황금붕어',w:18},{f:'오징어',w:22},{f:'낙지',w:20},{f:'금눈돔',w:18}] },
  { minAbil: 40, table: [{ f:'참치',w:25},{f:'광어',w:28},{f:'감성돔',w:22},{f:'황금붕어',w:15},{f:'연어',w:10}] },
  { minAbil: 50, table: [{ f:'우럭',w:28},{f:'뱀장어',w:25},{f:'황새치',w:20},{f:'참치',w:15},{f:'감성돔',w:12}] },
  { minAbil: 70, table: [{ f:'황새치',w:22},{f:'용고기',w:25},{f:'고대어',w:20},{f:'우럭',w:18},{f:'뱀장어',w:15}] },
];

/** Get fish table matching current 낚시 ability value */
export function getAbilityFishTable(abilValue) {
  let table = ABILITY_FISH[0].table;
  for (const tier of ABILITY_FISH) {
    if (abilValue >= tier.minAbil) table = tier.table;
    else break;
  }
  return table;
}

// ── Rods (catch-time + bonus multiplier; fish pool driven by ability) ─────────
// reqEnhance: previous rod must reach this enhance level before buying next rod
export const RODS = {
  초급낚시대: {
    name: '초급 낚시대', price: 0, color: '#8b6914',
    catchTimeRange: [8000, 15000],
    timeMult: 1.00,   // base
  },
  중급낚시대: {
    name: '중급 낚시대', price: 500, color: '#c0c0c0',
    upgradeMats: { 철광석: 3, 구리광석: 2 },
    catchTimeRange: [6000, 12000],
    timeMult: 0.85,
    reqRod: '초급낚시대', reqEnhance: 50,
  },
  고급낚시대: {
    name: '고급 낚시대', price: 2000, color: '#ffd700',
    upgradeMats: { 철광석: 5, 수정: 3 },
    catchTimeRange: [4000, 9000],
    timeMult: 0.70,
    reqRod: '중급낚시대', reqEnhance: 50,
  },
};

// ── Rod enhancement (강화) ───────────────────────────────────────────────────
// Each rod can be enhanced 0~100.
// enhanceCost(level) = gold to enhance once; uses 강화 ability success rate.
export function rodEnhanceCost(enhLevel) { return 50 + enhLevel * 20; }
export function rodEnhanceMatsNeeded(enhLevel) {
  if (enhLevel < 30) return {};
  if (enhLevel < 60) return { 철광석: 1 };
  if (enhLevel < 80) return { 구리광석: 1 };
  return { 수정: 1 };
}
// Success rate decreases with level, boosted by 강화 ability
export function rodEnhanceSuccessRate(enhLevel, ganghwaAbil) {
  const base = Math.max(0.20, 1.0 - enhLevel * 0.008);
  const bonus = (ganghwaAbil ?? 0) * 0.003;
  return Math.min(0.98, base + bonus);
}
// Effect of enhancement: % reduction to catch time, % bonus to sell price
export function rodEnhanceEffect(enhLevel) {
  return { timeReduction: enhLevel * 0.004, priceBonus: enhLevel * 0.003 };
}

// ── Ores ─────────────────────────────────────────────────────────────────────
export const ORES = {
  철광석:   { price: 30,  color: '#808080', mineRange: [5000, 10000],  w: 50 },
  구리광석: { price: 50,  color: '#b87333', mineRange: [7000, 14000],  w: 30 },
  수정:     { price: 100, color: '#a8d8ea', mineRange: [12000, 22000], w: 20 },
  금광석:   { price: 350, color: '#ffd700', mineRange: [18000, 35000], w: 8  },
};

// ── Pickaxes ─────────────────────────────────────────────────────────────────
export const PICKAXES = {
  나무곡괭이: { name: '나무 곡괭이', price: 0,    timeMult: 1.00, color: '#8B6914', desc: '기본 채굴 도구' },
  철곡괭이:   { name: '철 곡괭이',   price: 300,  timeMult: 0.80, color: '#808080', desc: '채광 속도 +20%', upgradeMats: { 철광석: 5 } },
  금곡괭이:   { name: '금 곡괭이',   price: 1500, timeMult: 0.60, color: '#FFD700', desc: '채광 속도 +40%', upgradeMats: { 금광석: 3, 철광석: 3 } },
};

export function pickaxeEnhanceCost(enhLevel) { return 40 + enhLevel * 15; }
export function pickaxeEnhanceMatsNeeded(enhLevel) {
  if (enhLevel < 30) return {};
  if (enhLevel < 60) return { 철광석: 1 };
  if (enhLevel < 80) return { 구리광석: 1 };
  return { 수정: 1 };
}
export function pickaxeEnhanceSuccessRate(enhLevel, ganghwaAbil) {
  const base = Math.max(0.20, 1.0 - enhLevel * 0.008);
  const bonus = (ganghwaAbil ?? 0) * 0.003;
  return Math.min(0.98, base + bonus);
}
export function pickaxeEnhanceEffect(enhLevel) {
  return { timeReduction: enhLevel * 0.005 };
}

// ── Boots ────────────────────────────────────────────────────────────────────
export const BOOTS = {
  기본신발: { name: '기본 신발', price: 0,    speedBonus: 0,   color: '#aaaaaa' },
  빠른신발: { name: '빠른 신발', price: 400,  speedBonus: 1.5, color: '#66ccff' },
  질풍신발: { name: '질풍 신발', price: 1800, speedBonus: 3.2, color: '#ff9944', upgradeMats: { 수정: 3 } },
};

// ── Bait ─────────────────────────────────────────────────────────────────────
export const BAIT = {
  구리미끼: { name: '구리 미끼',    price: 250,  type: 'permanent', color: '#b87333',
    desc: '희귀 물고기 확률 상승', boost: { 보통: 1.4, 희귀: 1.8, 전설: 1.3, 신화: 1.1 } },
  황금미끼: { name: '황금 미끼',    price: 900,  type: 'permanent', color: '#ffd700',
    desc: '전설급 확률 대폭 상승', boost: { 보통: 1.6, 희귀: 2.5, 전설: 2.5, 신화: 1.8 } },
  전설미끼: { name: '전설 미끼 (1회)', price: 600,  type: 'once', color: '#aa44ff',
    desc: '1회용 – 전설 물고기 출현', boost: { 희귀: 2.0, 전설: 6.0, 신화: 3.0 } },
  신화미끼: { name: '신화 미끼 (1회)', price: 3000, type: 'once', color: '#ff44ff',
    desc: '1회용 – 신화 물고기 출현!', boost: { 전설: 4.0, 신화: 10.0 } },
};

// ── Cookware ─────────────────────────────────────────────────────────────────
export const COOKWARE = {
  기본프라이팬: { name: '기본 프라이팬', price: 200, mult: 2.0, color: '#888888',
    desc: '물고기 요리 → 가격 2배' },
  고급화로: { name: '고급 화로', price: 900, mult: 3.5, color: '#ff6633',
    desc: '물고기 요리 → 가격 3.5배', upgradeMats: { 철광석: 3 } },
};

// ── Marine Gear (해양 장비) ───────────────────────────────────────────────────
export const MARINE_GEAR = {
  스쿠버다이빙세트: {
    name: '스쿠버다이빙 세트',
    price: 3000,
    color: '#00aaff',
    desc: '바다에서 자유롭게 이동 및 낚시 가능 (전설+ 확률 +30%)',
    rareBoostRarities: ['희귀', '전설', '신화'],
    rareMult: 1.3,
  },
  보트: {
    name: '보트',
    price: 5000,
    color: '#cc6633',
    desc: '바다에서 빠르게 이동, 낚시 가능 (전설+ 확률 +50%)',
    upgradeMats: { 철광석: 5, 구리광석: 3 },
    rareBoostRarities: ['희귀', '전설', '신화'],
    rareMult: 1.5,
  },
};

// ── Herbs ─────────────────────────────────────────────────────────────────────
export const HERBS = {
  들풀:     { price: 25,  gatherRange: [3000,  6000],  color: '#88cc44' },
  버섯:     { price: 60,  gatherRange: [5000,  10000], color: '#cc8844' },
  희귀허브: { price: 180, gatherRange: [8000,  15000], color: '#cc44cc' },
};

// ── Gathering tools (채집 도구) ────────────────────────────────────────────────
export const GATHER_TOOLS = {
  맨손: { name: '맨손', price: 0, timeMult: 1.00, color: '#f6cc88', desc: '기본 채집' },
  나무바구니: { name: '나무 바구니', price: 150, timeMult: 0.85, color: '#8B6914', desc: '채집 속도 +15%' },
  허브낫: { name: '허브 낫', price: 600, timeMult: 0.65, color: '#66cc44', desc: '채집 속도 +35%', upgradeMats: { 철광석: 3 } },
  황금낫: { name: '황금 낫', price: 2000, timeMult: 0.45, color: '#FFD700', desc: '채집 속도 +55%', upgradeMats: { 금광석: 2, 수정: 2 } },
};

// ── Smelting recipes (제련) ────────────────────────────────────────────────────
// input: required ores, output: processed ore name, price, color, desc
export const SMELT_RECIPES = {
  정제철: {
    name: '정제철', color: '#b0b8c8', price: 200,
    input: { 철광석: 3 },
    desc: '철광석 3개 → 정제철 (장신구 제작 재료)',
  },
  청동괴: {
    name: '청동괴', color: '#d4a050', price: 380,
    input: { 철광석: 2, 구리광석: 2 },
    desc: '철+구리 합금 (장신구 재료)',
  },
  정제수정: {
    name: '정제수정', color: '#c0e8ff', price: 550,
    input: { 수정: 2 },
    desc: '수정 2개 → 정제수정 (고급 장신구)',
  },
  황금괴: {
    name: '황금괴', color: '#ffd700', price: 1200,
    input: { 금광석: 2 },
    desc: '금광석 2개 → 황금괴 (전설 장신구)',
  },
};

// ── Jewelry recipes (장신구 제작) ─────────────────────────────────────────────
// effect: passive stat bonus applied to gs.activeJewelry
export const JEWELRY_RECIPES = {
  철반지: {
    name: '철반지', icon: '💍', color: '#b0b8c8', price: 300,
    input: { 정제철: 2 },
    effect: { fishSpeed: 0.05 },   // +5% fishing speed
    desc: '낚시 속도 +5%',
    slot: 'ring',
  },
  청동목걸이: {
    name: '청동목걸이', icon: '📿', color: '#d4a050', price: 600,
    input: { 청동괴: 2 },
    effect: { mineSpeed: 0.05 },   // +5% mining speed
    desc: '채굴 속도 +5%',
    slot: 'necklace',
  },
  수정반지: {
    name: '수정반지', icon: '💍', color: '#c0e8ff', price: 1200,
    input: { 정제수정: 2 },
    effect: { fishSpeed: 0.12, sellBonus: 0.05 },
    desc: '낚시 속도 +12%, 판매가 +5%',
    slot: 'ring',
  },
  황금목걸이: {
    name: '황금목걸이', icon: '📿', color: '#ffd700', price: 2500,
    input: { 황금괴: 2 },
    effect: { fishSpeed: 0.10, mineSpeed: 0.10, sellBonus: 0.10 },
    desc: '낚시+채굴 속도 +10%, 판매가 +10%',
    slot: 'necklace',
  },
};

// ── Herb potions (포션 제작) ──────────────────────────────────────────────────
export const POTION_RECIPES = {
  이동속도포션: {
    name: '이동속도 포션', icon: '🧪', color: '#44ccff',
    input: { 들풀: 5 },
    effect: { speedBonus: 2.0, duration: 60000 },  // +2 speed for 60s
    desc: '60초간 이동속도 +2',
    price: 150,
  },
  낚시포션: {
    name: '낚시 포션', icon: '🧪', color: '#44ff88',
    input: { 버섯: 3, 들풀: 3 },
    effect: { fishSpeedBonus: 0.20, duration: 120000 },  // 20% faster fishing 120s
    desc: '120초간 낚시 속도 +20%',
    price: 350,
  },
  채굴포션: {
    name: '채굴 포션', icon: '🧪', color: '#ff9944',
    input: { 버섯: 4 },
    effect: { mineSpeedBonus: 0.20, duration: 120000 },
    desc: '120초간 채굴 속도 +20%',
    price: 300,
  },
  희귀낚시포션: {
    name: '희귀 낚시 포션', icon: '✨', color: '#cc44ff',
    input: { 희귀허브: 3, 버섯: 2 },
    effect: { rareBonus: 0.30, duration: 180000 },  // +30% rare fish chance 180s
    desc: '180초간 희귀 물고기 확률 +30%',
    price: 1200,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
export function weightedPick(table) {
  const total = table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of table) { r -= e.w; if (r <= 0) return e.f; }
  return table[table.length - 1].f;
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
