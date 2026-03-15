export const TILE_SIZE = 32;
export const MAP_W = 40;
export const MAP_H = 30;

export const TILE = { GRASS: 0, WATER: 1, STONE: 2, WOOD: 3, SAND: 4, BUILDING: 5, PATH: 6 };

export const TILE_COLOR = [
  '#4a7c3a', // GRASS
  '#1a5fa8', // WATER
  '#7a7070', // STONE
  '#8b6914', // WOOD
  '#c4a44a', // SAND
  '#5a3a28', // BUILDING
  '#9e8050', // PATH
];

export const WALKABLE = [true, false, true, true, true, false, true];

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
};

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
