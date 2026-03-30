export const TILE_SIZE = 32;
export const MAP_W = 70;
export const MAP_H = 50;

export const TILE = { GRASS: 0, WATER: 1, STONE: 2, WOOD: 3, SAND: 4, BUILDING: 5, PATH: 6, FOREST: 7, SNOW: 8 };

export const TILE_COLOR = [
  '#4a7c3a', // GRASS
  '#1a5fa8', // WATER
  '#7a7070', // STONE
  '#8b6914', // WOOD
  '#c4a44a', // SAND
  '#5a3a28', // BUILDING
  '#9e8050', // PATH
  '#2d5a1e', // FOREST
  '#ddeeff', // SNOW
];

export const WALKABLE = [true, false, true, true, true, false, true, true, true];

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
  // Ability 10~19 (추가)
  피라미:     { minSz: 6,  maxSz: 18,  price: 12,   rarity: '흔함' },
  // Ability 20~29 (추가)
  도미:       { minSz: 30, maxSz: 65,  price: 160,  rarity: '보통' },
  // Ability 30~39 (추가)
  해마:       { minSz: 5,  maxSz: 20,  price: 420,  rarity: '희귀' },
  // Ability 40~49 (추가)
  전갱이:     { minSz: 20, maxSz: 50,  price: 480,  rarity: '희귀' },
  // Ability 50~59 (추가)
  부시리:     { minSz: 60, maxSz: 150, price: 820,  rarity: '전설' },
  // Ability 60~69 (추가)
  개복치:     { minSz: 80, maxSz: 300, price: 950,  rarity: '전설' },
  // Ability 70+ (추가)
  빙어:       { minSz: 8,  maxSz: 25,  price: 220,  rarity: '보통', reqSeason: '겨울얼음낚시' }, // 겨울 전용
  불사조고기: { minSz: 40, maxSz: 120, price: 5000, rarity: '신화' },
  // 심해 원정대 전용 초전설 어종 (파티 3명+ 심해 입장 시 출현)
  크라켄:     { minSz: 200, maxSz: 800, price: 50000, rarity: '신화', bossOnly: true },
  해룡:       { minSz: 150, maxSz: 600, price: 80000, rarity: '신화', bossOnly: true },
  // 계절 한정 어종 (봄/여름/가을/겨울 전용 — 해당 시즌 외 미등장)
  벚꽃붕어:   { minSz: 12, maxSz: 40,  price: 520,  rarity: '희귀', reqSeason: '봄꽃축제' },
  불꽃송어:   { minSz: 35, maxSz: 90,  price: 1100, rarity: '전설', reqSeason: '여름낚시대회' },
  단풍잉어:   { minSz: 22, maxSz: 65,  price: 640,  rarity: '희귀', reqSeason: '추수감사절' },
  빙어왕:     { minSz: 18, maxSz: 55,  price: 1150, rarity: '전설', reqSeason: '겨울얼음낚시' },
  // Phase 9-4: 10 new fish
  빛붕어:     { minSz: 10, maxSz: 40,  price: 275,  rarity: '흔함' },
  자갈치:     { minSz: 15, maxSz: 60,  price: 240,  rarity: '흔함' },
  무지개퍼치: { minSz: 12, maxSz: 45,  price: 300,  rarity: '흔함' },
  황금장어:   { minSz: 30, maxSz: 110, price: 750,  rarity: '보통' },
  삼치:       { minSz: 25, maxSz: 90,  price: 625,  rarity: '보통' },
  보석복어:   { minSz: 10, maxSz: 25,  price: 850,  rarity: '보통' },
  달빛가오리: { minSz: 60, maxSz: 240, price: 1000, rarity: '보통' },
  고대철갑상어: { minSz: 150, maxSz: 600, price: 2750, rarity: '희귀' },
  용아귀:     { minSz: 90, maxSz: 360, price: 3250, rarity: '희귀' },
  타이드헤이븐리바이어던: { minSz: 1500, maxSz: 6000, price: 20000, rarity: '신화' },
  // Phase 13: Zone-exclusive fish
  날치:       { minSz: 20, maxSz: 60,  price: 420,  rarity: '보통', reqZone: '항구마을' },
  심해문어:   { minSz: 40, maxSz: 120, price: 1800, rarity: '희귀', reqZone: '항구마을' },
  항구왕새우: { minSz: 25, maxSz: 80,  price: 4500, rarity: '전설', reqZone: '항구마을' },
  고대잉어:   { minSz: 60, maxSz: 200, price: 2200, rarity: '희귀', reqZone: '고대신전' },
  신전수호어: { minSz: 80, maxSz: 280, price: 6000, rarity: '전설', reqZone: '고대신전' },
  얼음빙어:   { minSz: 10, maxSz: 30,  price: 600,  rarity: '보통', reqZone: '설산정상' },
  설산용:     { minSz: 100, maxSz: 400, price: 8000, rarity: '전설', reqZone: '설산정상' },
  // Phase 15: Night-exclusive fish
  달빛장어:   { minSz: 50, maxSz: 180, price: 2400, rarity: '희귀', reqTimePeriod: 'night' },
  별빛도미:   { minSz: 30, maxSz: 100, price: 5500, rarity: '전설', reqTimePeriod: 'night' },
};

// ── Ability-gated fish tables (낚시 ability determines available fish pool) ──
export const ABILITY_FISH = [
  { minAbil:  0, table: [{ f:'붕어',w:30},{f:'잉어',w:25},{f:'미꾸라지',w:20},{f:'메기',w:10},{f:'빛붕어',w:8},{f:'자갈치',w:7}] },
  { minAbil: 10, table: [{ f:'붕어',w:14},{f:'잉어',w:14},{f:'멸치',w:18},{f:'배스',w:18},{f:'송어',w:16},{f:'피라미',w:8},{f:'빛붕어',w:6},{f:'자갈치',w:6}] },
  { minAbil: 20, table: [{ f:'꽁치',w:20},{f:'강꼬치고기',w:18},{f:'황다랑어',w:16},{f:'금눈돔',w:14},{f:'배스',w:8},{f:'도미',w:8},{f:'무지개퍼치',w:8},{f:'벚꽃붕어',w:10},{f:'단풍잉어',w:10}] },
  { minAbil: 30, table: [{ f:'연어',w:16},{f:'황금붕어',w:13},{f:'오징어',w:16},{f:'낙지',w:14},{f:'금눈돔',w:12},{f:'해마',w:8},{f:'황금장어',w:8},{f:'삼치',w:7},{f:'벚꽃붕어',w:10},{f:'단풍잉어',w:10}] },
  { minAbil: 40, table: [{ f:'참치',w:18},{f:'광어',w:20},{f:'감성돔',w:16},{f:'황금붕어',w:8},{f:'연어',w:6},{f:'전갱이',w:8},{f:'보석복어',w:8},{f:'달빛가오리',w:6},{f:'불꽃송어',w:10},{f:'빙어왕',w:10}] },
  { minAbil: 50, table: [{ f:'우럭',w:18},{f:'뱀장어',w:16},{f:'황새치',w:14},{f:'참치',w:10},{f:'감성돔',w:8},{f:'부시리',w:10},{f:'달빛가오리',w:8},{f:'달빛장어',w:6},{f:'불꽃송어',w:10},{f:'빙어왕',w:10}] },
  { minAbil: 60, table: [{ f:'고대철갑상어',w:10},{f:'용아귀',w:8},{f:'우럭',w:14},{f:'황새치',w:12},{f:'뱀장어',w:12},{f:'부시리',w:11},{f:'개복치',w:11},{f:'참치',w:16},{f:'빙어왕',w:10}] },
  { minAbil: 65, table: [{ f:'우럭',w:14},{f:'황새치',w:12},{f:'뱀장어',w:12},{f:'부시리',w:11},{f:'개복치',w:11},{f:'참치',w:16},{f:'고대철갑상어',w:12},{f:'용아귀',w:10},{f:'빙어왕',w:10}] },
  { minAbil: 70, table: [{ f:'황새치',w:16},{f:'용고기',w:20},{f:'고대어',w:16},{f:'우럭',w:10},{f:'뱀장어',w:8},{f:'불사조고기',w:7},{f:'개복치',w:7},{f:'타이드헤이븐리바이어던',w:5},{f:'빙어',w:8},{f:'별빛도미',w:6}] },
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
  // Phase 14: Legendary rod (crafted, not bought)
  전설낚시대: {
    name: '전설 낚시대', price: 0, color: '#ff44ff',
    catchTimeRange: [2500, 6000],
    timeMult: 0.50,
    sellBonus: 0.15,
    rarityBonus: 0.08,
    reqRod: '고급낚시대', reqEnhance: 80,
    craftMats: { 금광석: 5, 고대광석: 3, 빙정광석: 2 },
    craftFish: ['항구왕새우', '신전수호어', '설산용'],
    desc: '전설의 재료로 빚은 낚시대. 낚시 속도 +50%, 판매가 +15%, 희귀도 +8%',
    isCrafted: true,
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
  // Phase 13: Zone-exclusive ores
  고대광석: { price: 800, color: '#cc9944', mineRange: [20000, 40000], w: 3, reqZone: '고대신전' },
  빙정광석: { price: 500, color: '#aaddff', mineRange: [15000, 30000], w: 5, reqZone: '설산정상' },
};

// ── Pickaxes ─────────────────────────────────────────────────────────────────
export const PICKAXES = {
  나무곡괭이: { name: '나무 곡괭이', price: 0,    timeMult: 1.00, color: '#8B6914', desc: '기본 채굴 도구' },
  철곡괭이:   { name: '철 곡괭이',   price: 300,  timeMult: 0.80, color: '#808080', desc: '채광 속도 +20%', upgradeMats: { 철광석: 5 } },
  금곡괭이:   { name: '금 곡괭이',   price: 1500, timeMult: 0.60, color: '#FFD700', desc: '채광 속도 +40%', upgradeMats: { 금광석: 3, 철광석: 3 } },
  // Phase 14: Legendary pickaxe (crafted)
  전설곡괭이: { name: '전설 곡괭이', price: 0,    timeMult: 0.40, color: '#ff44ff', desc: '채광 속도 +60%, 대박 +10%',
    reqPickaxe: '금곡괭이', reqEnhance: 80,
    craftMats: { 금광석: 8, 고대광석: 5, 빙정광석: 3 },
    windfallBonus: 0.10,
    isCrafted: true,
  },
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
  활력포션: {
    name: '활력 포션', icon: '🥕', color: '#ff8844',
    cropInput: { 감자: 3, 당근: 2 },
    effect: { speedBonus: 1.5, fishSpeedBonus: 0.15, duration: 90000 },
    desc: '90초간 이동속도 +1.5, 낚시속도 +15%',
    price: 400,
  },
  채집강화포션: {
    name: '채집 강화 포션', icon: '🌿', color: '#44cc88',
    cropInput: { 밀: 4, 치유초: 2 },
    effect: { gatherSpeedBonus: 0.30, duration: 150000 },
    desc: '150초간 채집 속도 +30%',
    price: 600,
  },
  황금포션: {
    name: '황금 포션', icon: '✨', color: '#ffd700',
    cropInput: { 황금사과: 1 },
    effect: { rareBonus: 0.60, fishSpeedBonus: 0.20, duration: 120000 },
    desc: '120초간 희귀 물고기 +60%, 낚시속도 +20%',
    price: 3000,
  },
};

// ── Dish Recipes (요리 레시피) ─────────────────────────────────────────────────
// crops: { itemName: qty }, fish: { name } | { rarity } | null
export const DISH_RECIPES = {
  감자볶음:     { name: '감자 볶음',     icon: '🥔', crops: { 감자: 3 },                          price: 220,   desc: '감자 3개 → 구수한 볶음' },
  당근수프:     { name: '당근 수프',     icon: '🥕', crops: { 당근: 2 },                          price: 290,   desc: '당근 2개 → 따뜻한 수프' },
  밀빵:         { name: '밀빵',          icon: '🍞', crops: { 밀: 5 },                            price: 200,   desc: '밀 5개 → 갓 구운 빵' },
  생선구이:     { name: '생선 구이',     icon: '🐟', crops: { 감자: 1 }, fish: { rarity: '흔함' }, price: 520,   desc: '흔한 생선 + 감자 1개' },
  생선스튜:     { name: '생선 스튜',     icon: '🍲', crops: { 당근: 1, 밀: 1 }, fish: { rarity: '보통' }, price: 900,  desc: '보통 생선 + 당근·밀 각 1개' },
  연어스테이크: { name: '연어 스테이크', icon: '🍽', crops: { 당근: 2 }, fish: { name: '연어' },   price: 1800,  desc: '연어 + 당근 2개' },
  황금어볶음:   { name: '황금어 볶음',   icon: '✨', crops: { 치유초: 1 }, fish: { name: '황금붕어' }, price: 2500, desc: '황금붕어 + 치유초 1개' },
  용고기정식:   { name: '용고기 정식',   icon: '🐉', crops: { 황금사과: 1 }, fish: { name: '용고기' }, price: 10000, desc: '용고기 + 황금사과 1개' },
  신화의만찬:   { name: '신화의 만찬',   icon: '🌟', crops: { 황금사과: 2, 치유초: 2 }, fish: { rarity: '신화' }, price: 30000, desc: '신화 물고기 + 황금사과 2 + 치유초 2 (수제자 전용)', reqNpc: { 요리사: 80 } },
};

// ── Seeds & Crops (씨앗 / 작물) ──────────────────────────────────────────────
export const SEEDS = {
  감자씨앗:  { name: '감자 씨앗',   price: 80,   growMs: 5 * 60 * 1000,  yield: { item: '감자',    qty: [2, 4], sellPrice: 60  } },
  당근씨앗:  { name: '당근 씨앗',   price: 120,  growMs: 8 * 60 * 1000,  yield: { item: '당근',    qty: [2, 3], sellPrice: 90  } },
  밀씨앗:    { name: '밀 씨앗',     price: 60,   growMs: 3 * 60 * 1000,  yield: { item: '밀',      qty: [3, 6], sellPrice: 40  } },
  약초씨앗:  { name: '약초 씨앗',   price: 300,  growMs: 15 * 60 * 1000, yield: { item: '치유초',  qty: [1, 2], sellPrice: 350 } },
  황금씨앗:  { name: '황금 씨앗',   price: 1200, growMs: 30 * 60 * 1000, yield: { item: '황금사과', qty: [1, 2], sellPrice: 1500 } },
  // Seasonal seeds (특수 계절 씨앗)
  봄씨앗:    { name: '봄 씨앗',     price: 400,  growMs: 6 * 60 * 1000,  yield: { item: '벚꽃잎',  qty: [3, 6], sellPrice: 180 }, reqSeason: '봄꽃축제',    seasonDesc: '봄(3~4월)에만 심을 수 있습니다' },
  여름씨앗:  { name: '여름 씨앗',   price: 600,  growMs: 10 * 60 * 1000, yield: { item: '열대과일', qty: [2, 4], sellPrice: 320 }, reqSeason: '여름낚시대회', seasonDesc: '여름(6~8월)에만 심을 수 있습니다' },
  가을씨앗:  { name: '가을 씨앗',   price: 500,  growMs: 8 * 60 * 1000,  yield: { item: '단풍잎',  qty: [4, 7], sellPrice: 200 }, reqSeason: '추수감사절',  seasonDesc: '가을(9~11월)에만 심을 수 있습니다' },
  겨울씨앗:  { name: '겨울 씨앗',   price: 800,  growMs: 20 * 60 * 1000, yield: { item: '빙정초',  qty: [1, 3], sellPrice: 600 }, reqSeason: '겨울얼음낚시', seasonDesc: '겨울(12~2월)에만 심을 수 있습니다' },
};
export const MAX_FARM_PLOTS = 6;
export const FARM_EXPANSION_PRICE = 3000;  // 농장 확장권 가격
export const FARM_EXPANSION_SLOTS = 3;     // 확장당 추가 칸 수
export const FARM_MAX_EXPANSIONS = 3;      // 최대 확장 횟수 (최대 6+9=15칸)

// ── DIY 미끼 제작 (BAIT_RECIPES) ─────────────────────────────────────────────
// 허브 + 광석 조합으로 커스텀 미끼 제작
export const BAIT_RECIPES = {
  숲의미끼:   { name: '숲의 미끼',    icon: '🌿', input: { 버섯: 3, 구리광석: 2 },     effect: '+40% 희귀 확률 (1회용)', rareBonus: 0.40, oneTime: true, price: 0 },
  황금미끼2:  { name: '황금 미끼',    icon: '✨', input: { 들풀: 5, 금광석: 1 },       effect: '+25% 희귀 확률 (영구)', rareBonus: 0.25, oneTime: false, price: 0 },
  심해미끼:   { name: '심해 미끼',    icon: '🌊', input: { 희귀허브: 2, 수정: 2 },     effect: '심해 낚시 속도 +30% (1회용)', fishSpeedBonus: 0.30, seaOnly: true, oneTime: true, price: 0 },
  광산미끼:   { name: '광산 미끼',    icon: '⛏', input: { 들풀: 3, 철광석: 3 },       effect: '낚시 속도 +20% (1회용)', fishSpeedBonus: 0.20, oneTime: true, price: 0 },
};

// ── 납품 주문 풀 (Delivery Order Pool) ──────────────────────────────────────
export const DELIVERY_ORDER_POOL = [
  // 광석 납품
  { npc: '채굴사', item: '철광석',  itemType: 'ore',  qty: 5,  reward: { money: 300, affinity: 2 } },
  { npc: '채굴사', item: '구리광석',itemType: 'ore',  qty: 5,  reward: { money: 400, affinity: 2 } },
  { npc: '채굴사', item: '수정',    itemType: 'ore',  qty: 3,  reward: { money: 700, affinity: 3 } },
  { npc: '채굴사', item: '금광석',  itemType: 'ore',  qty: 2,  reward: { money: 1500, affinity: 4 } },
  // 허브 납품
  { npc: '요리사', item: '들풀',    itemType: 'herb', qty: 5,  reward: { money: 200, affinity: 1 } },
  { npc: '요리사', item: '버섯',    itemType: 'herb', qty: 3,  reward: { money: 350, affinity: 2 } },
  { npc: '요리사', item: '희귀허브',itemType: 'herb', qty: 2,  reward: { money: 800, affinity: 3 } },
  // 작물 납품
  { npc: '여관주인', item: '감자',  itemType: 'crop', qty: 5,  reward: { money: 300, affinity: 2 } },
  { npc: '여관주인', item: '당근',  itemType: 'crop', qty: 4,  reward: { money: 400, affinity: 2 } },
  { npc: '여관주인', item: '밀',    itemType: 'crop', qty: 8,  reward: { money: 350, affinity: 2 } },
  { npc: '여관주인', item: '치유초',itemType: 'crop', qty: 2,  reward: { money: 900, affinity: 3 } },
  // 제련 납품
  { npc: '상인', item: '정제철',    itemType: 'processed', qty: 2, reward: { money: 600, affinity: 2 } },
  { npc: '상인', item: '황금괴',    itemType: 'processed', qty: 1, reward: { money: 2000, affinity: 4 } },
];

// ── Zone-specific fish tables ────────────────────────────────────────────────
export const ZONE_FISH = {
  // 민물낚시터: freshwater pond (default, near dock)
  민물: [
    { f:'붕어', w:30 }, { f:'잉어', w:25 }, { f:'미꾸라지', w:20 },
    { f:'메기', w:15 }, { f:'황금붕어', w:10 },
  ],
  // 강낚시터: river (dock chairs, ability-gated standard pool)
  강: null,  // uses normal ability-gated table

  // 바다낚시터: sea (deep pier chairs, seaFishing=true)
  바다: [
    { f:'멸치', w:20 }, { f:'꽁치', w:18 }, { f:'황다랑어', w:15 },
    { f:'오징어', w:15 }, { f:'낙지', w:12 }, { f:'참치', w:12 },
    { f:'광어', w:8 },
  ],

  // 심해낚시터: deep sea (requires 스쿠버다이빙세트 + 낚시 50+)
  심해: [
    { f:'광어', w:20 }, { f:'참치', w:18 }, { f:'감성돔', w:15 },
    { f:'우럭', w:12 }, { f:'뱀장어', w:10 }, { f:'황새치', w:8 },
    { f:'용고기', w:7 }, { f:'고대어', w:5 },
  ],

  // 황금연못: golden pond (requires 낚시 ability grade 1+ OR 탐험 비밀낚시터)
  황금연못: [
    { f:'황금붕어', w:40 }, { f:'연어', w:25 }, { f:'금눈돔', w:20 },
    { f:'감성돔', w:10 }, { f:'용고기', w:5 },
  ],

  // ── World-zone specific tables ─────────────────────────────────────────────
  // 서쪽초원 river: clear stream fish, no sea fish
  '서쪽초원_강': [
    { f:'피라미', w:35 }, { f:'붕어', w:25 }, { f:'잉어', w:20 },
    { f:'미꾸라지', w:12 }, { f:'메기', w:5 }, { f:'황금붕어', w:3 },
  ],
  // 서쪽초원 meadow lake: freshwater with slightly better catch
  '서쪽초원_민물': [
    { f:'붕어', w:28 }, { f:'잉어', w:22 }, { f:'피라미', w:20 },
    { f:'메기', w:15 }, { f:'황금붕어', w:10 }, { f:'연어', w:5 },
  ],
  // 동쪽절벽 coastal: rough-water sea fish with rare cliff species
  '동쪽절벽_바다': [
    { f:'오징어', w:20 }, { f:'낙지', w:18 }, { f:'광어', w:15 },
    { f:'참치', w:12 }, { f:'해마', w:10 }, { f:'황새치', w:8 },
    { f:'전갱이', w:10 }, { f:'부시리', w:7 },
  ],
  // 동쪽절벽 cave lake: mineral-rich freshwater
  '동쪽절벽_민물': [
    { f:'잉어', w:30 }, { f:'메기', w:25 }, { f:'뱀장어', w:20 },
    { f:'우럭', w:15 }, { f:'감성돔', w:7 }, { f:'황금붕어', w:3 },
  ],
  // 북쪽고원 alpine lake: cold-water mountain fish
  '북쪽고원_민물': [
    { f:'빙어', w:35 }, { f:'연어', w:25 }, { f:'붕어', w:20 },
    { f:'피라미', w:12 }, { f:'황금붕어', w:5 }, { f:'금눈돔', w:3 },
  ],
  // 남쪽심해 open ocean: deep-sea rare fish, high-value
  '남쪽심해_바다': [
    { f:'광어', w:18 }, { f:'참치', w:15 }, { f:'개복치', w:12 },
    { f:'황새치', w:12 }, { f:'달빛가오리', w:10 }, { f:'보석복어', w:8 },
    { f:'용고기', w:8 }, { f:'고대어', w:7 }, { f:'고대철갑상어', w:5 },
    { f:'타이드헤이븐리바이어던', w:2 }, { f:'용아귀', w:3 },
  ],
  // Phase 13: New zone fish tables
  '항구마을': [
    { f:'날치', w:30 }, { f:'심해문어', w:15 }, { f:'항구왕새우', w:5 },
    { f:'황금장어', w:12 }, { f:'삼치', w:18 }, { f:'달빛가오리', w:10 }, { f:'보석복어', w:10 },
  ],
  '고대신전': [
    { f:'고대잉어', w:20 }, { f:'신전수호어', w:8 }, { f:'고대철갑상어', w:12 },
    { f:'황금붕어', w:20 }, { f:'뱀장어', w:18 }, { f:'황새치', w:12 }, { f:'용아귀', w:10 },
  ],
  '설산정상': [
    { f:'얼음빙어', w:35 }, { f:'설산용', w:6 }, { f:'빙어', w:25 },
    { f:'빙어왕', w:15 }, { f:'연어', w:12 }, { f:'황금붕어', w:7 },
  ],
};

export const FISHING_ZONES = {
  민물: { name: '민물 낚시터', icon: '🌊', desc: '기본 낚시터', reqAbil: 0, color: '#44aaff' },
  강:   { name: '강 낚시터',   icon: '🏞', desc: '능력치 기반 물고기 출현', reqAbil: 0, color: '#66ccff' },
  바다: { name: '바다 낚시터', icon: '⚓', desc: '바다 물고기, 판매가 ×1.5', reqAbil: 20, color: '#0088ff', seaBonus: 1.5 },
  심해: { name: '심해 낚시터', icon: '🐙', desc: '희귀 물고기만 출현 (스쿠버 필요)', reqAbil: 50, reqGear: '스쿠버다이빙세트', color: '#0044aa', seaBonus: 2.0 },
  황금연못: { name: '황금 연못', icon: '✨', desc: '황금 물고기 전용', reqGrade: 1, color: '#ffd700', seaBonus: 1.2 },
};

// ── Hats (모자 아이템) ────────────────────────────────────────────────────────
export const HATS = {
  밀짚모자: {
    name: '밀짚모자', icon: '🎩', price: 300, color: '#c8a84a',
    desc: '낚시 속도 +5%',
    bonus: { fishTimeMult: 0.95 },
  },
  낚시캡: {
    name: '낚시캡', icon: '🧢', price: 800, color: '#4488cc',
    desc: '낚시 속도 +10%, 희귀도 +5%',
    bonus: { fishTimeMult: 0.90, rareBonus: 0.05 },
    upgradeMats: { 철광석: 2 },
  },
  광부헬멧: {
    name: '광부 헬멧', icon: '⛑', price: 600, color: '#ffcc44',
    desc: '채굴 속도 +10%',
    bonus: { mineTimeMult: 0.90 },
    upgradeMats: { 철광석: 3 },
  },
  왕관: {
    name: '왕관', icon: '👑', price: 5000, color: '#ffd700',
    desc: '판매가 +10%, 낚시 속도 +5%',
    bonus: { sellBonus: 0.10, fishTimeMult: 0.95 },
    upgradeMats: { 황금괴: 2, 수정: 3 },
  },
};

// ── Fishing outfits (낚시복) ──────────────────────────────────────────────────
export const FISHING_OUTFITS = {
  기본낚시복: {
    name: '기본 낚시복', icon: '🎽', price: 0, color: '#aaaaaa',
    desc: '기본 의상',
    bonus: {},
  },
  어부의의상: {
    name: '어부의 의상', icon: '🧥', price: 1200, color: '#4488cc',
    desc: '낚시 속도 +8%, 낚시 어빌리티 경험치 +15%',
    bonus: { fishTimeMult: 0.92, fishAbilGain: 1.15 },
    upgradeMats: { 구리광석: 2 },
  },
  광부의작업복: {
    name: '광부 작업복', icon: '🦺', price: 1500, color: '#cc8844',
    desc: '채굴 속도 +10%, 대박 확률 +3%',
    bonus: { mineTimeMult: 0.90, windfallBonus: 0.03 },
    upgradeMats: { 철광석: 3 },
  },
  요리사유니폼: {
    name: '요리사 유니폼', icon: '👨‍🍳', price: 1800, color: '#ffffff',
    desc: '요리 배율 +0.3배, 요리 속도 +10%',
    bonus: { cookPriceMult: 0.30, cookTimeMult: 0.90 },
    upgradeMats: { 구리광석: 2, 들풀: 3 },
  },
  황금낚시복: {
    name: '황금 낚시복', icon: '✨', price: 8000, color: '#ffd700',
    desc: '낚시 속도 +15%, 희귀도 +10%, 판매가 +8%',
    bonus: { fishTimeMult: 0.85, rareBonus: 0.10, sellBonus: 0.08 },
    upgradeMats: { 황금괴: 3, 수정: 2 },
  },
};

// ── Tops (상의 아이템) ────────────────────────────────────────────────────────
export const TOPS = {
  기본상의: {
    name: '기본 상의', icon: '👕', price: 0, color: '#aaaaaa',
    desc: '기본 상의',
    bonus: {},
  },
  어부상의: {
    name: '어부 상의', icon: '🧥', price: 1000, color: '#4488cc',
    desc: '낚시 속도 +7%, 희귀도 +3%',
    bonus: { fishTimeMult: 0.93, rareBonus: 0.03 },
    upgradeMats: { 구리광석: 2 },
  },
  탐험가상의: {
    name: '탐험가 상의', icon: '🥋', price: 2500, color: '#886633',
    desc: '낚시 속도 +10%, 낚시 경험치 +10%',
    bonus: { fishTimeMult: 0.90, fishAbilGain: 1.10 },
    upgradeMats: { 철광석: 3 },
  },
  강철갑옷: {
    name: '강철 갑옷', icon: '🛡', price: 3500, color: '#778899',
    desc: '채굴 속도 +10%, 판매가 +5%',
    bonus: { mineTimeMult: 0.90, sellBonus: 0.05 },
    upgradeMats: { 정제철: 2 },
  },
  황금어부상의: {
    name: '황금 어부 상의', icon: '✨', price: 9000, color: '#ffd700',
    desc: '낚시 속도 +12%, 채굴 속도 +8%, 희귀도 +5%',
    bonus: { fishTimeMult: 0.88, mineTimeMult: 0.92, rareBonus: 0.05 },
    upgradeMats: { 황금괴: 2, 수정: 2 },
  },
};

// ── Bottoms (하의 아이템) ─────────────────────────────────────────────────────
export const BOTTOMS = {
  기본하의: {
    name: '기본 하의', icon: '👖', price: 0, color: '#aaaaaa',
    desc: '기본 하의',
    bonus: {},
  },
  낚시바지: {
    name: '낚시 바지', icon: '👖', price: 700, color: '#4488cc',
    desc: '낚시 속도 +5%',
    bonus: { fishTimeMult: 0.95 },
  },
  광부바지: {
    name: '광부 바지', icon: '🩱', price: 1200, color: '#cc8844',
    desc: '채굴 속도 +7%',
    bonus: { mineTimeMult: 0.93 },
    upgradeMats: { 철광석: 2 },
  },
  탐험가바지: {
    name: '탐험가 바지', icon: '🩲', price: 2800, color: '#336655',
    desc: '낚시 속도 +8%, 채굴 속도 +5%',
    bonus: { fishTimeMult: 0.92, mineTimeMult: 0.95 },
    upgradeMats: { 구리광석: 3 },
  },
  전설바지: {
    name: '전설 바지', icon: '💜', price: 7000, color: '#cc44ff',
    desc: '낚시 속도 +10%, 희귀도 +4%, 판매가 +6%',
    bonus: { fishTimeMult: 0.90, rareBonus: 0.04, sellBonus: 0.06 },
    upgradeMats: { 황금괴: 2, 수정: 2 },
  },
};

// ── Belts (벨트 아이템) ───────────────────────────────────────────────────────
export const BELTS = {
  가죽벨트: {
    name: '가죽 벨트', icon: '🪢', price: 400, color: '#8b6914',
    desc: '판매가 +5%',
    bonus: { sellBonus: 0.05 },
  },
  상인벨트: {
    name: '상인 벨트', icon: '💰', price: 1500, color: '#cc9933',
    desc: '판매가 +10%',
    bonus: { sellBonus: 0.10 },
    upgradeMats: { 구리광석: 2 },
  },
  낚시벨트: {
    name: '낚시 벨트', icon: '🎣', price: 2200, color: '#4488cc',
    desc: '낚시 속도 +5%, 희귀도 +3%',
    bonus: { fishTimeMult: 0.95, rareBonus: 0.03 },
    upgradeMats: { 구리광석: 2, 철광석: 1 },
  },
  황금벨트: {
    name: '황금 벨트', icon: '👑', price: 9000, color: '#ffd700',
    desc: '판매가 +15%, 희귀도 +5%',
    bonus: { sellBonus: 0.15, rareBonus: 0.05 },
    upgradeMats: { 황금괴: 3, 수정: 2 },
  },
};

// ── Rod skins (낚싯대 스킨) ───────────────────────────────────────────────────
export const ROD_SKINS = {
  기본스킨: { name: '기본 스킨', color: '#8b6914', desc: '기본 낚싯대 외형', price: 0 },
  황금스킨: { name: '황금 스킨', color: '#ffd700', desc: '황금빛 낚싯대 외형', price: 2000, upgradeMats: { 황금괴: 1 } },
  수정스킨: { name: '수정 스킨', color: '#88ccff', desc: '수정색 낚싯대 외형', price: 1500, upgradeMats: { 정제수정: 2 } },
  불꽃스킨: { name: '불꽃 스킨', color: '#ff4444', desc: '불꽃 낚싯대 외형', price: 3000, upgradeMats: { 폭풍석: 3 } },
  광부스킨: { name: '광부 스킨', color: '#cc7733', desc: '철수의 의뢰 보상 — 광부의 낚싯대', price: 0, questOnly: true },
  용의가호스킨: { name: '용의 가호 스킨', color: '#ff88ff', desc: '용고기를 5마리 잡으면 해금', price: 0, reqMythic: '용고기', reqCount: 5 },
  별빛낚싯대: { name: '별빛 낚싯대', icon: '✨', color: '#aaddff', price: 0 },
};

// ── Fishing spot decorations (낚시터 꾸미기) ──────────────────────────────────
export const SPOT_DECOS = {
  기본의자: { name: '기본 의자', icon: '🪑', price: 0, desc: '기본 낚시 의자' },
  파라솔: { name: '파라솔', icon: '⛱', price: 800, desc: '파라솔 설치 (낚시 속도 +3%, 폭풍 저항)', bonus: { fishTimeMult: 0.97 } },
  이름표: { name: '이름표', icon: '🪧', price: 300, desc: '자리에 이름표 설치 (닉네임 표시)' },
  낚시의자: { name: '낚시 의자', icon: '🎪', price: 1200, desc: '고급 낚시 의자 (낚시 속도 +5%)', bonus: { fishTimeMult: 0.95 }, upgradeMats: { 정제철: 2 } },
  미끼통: { name: '미끼통', icon: '🪣', price: 500, desc: '미끼 효율 +15%', bonus: { baitEfficiency: 1.15 } },
};

// ── Furniture (가구 — 개인 오두막 배치용) ────────────────────────────────────
export const FURNITURE = {
  나무침대:  { name: '나무 침대',   icon: '🛏', price: 800,  category: '가구', desc: '오프라인 수입 +10%',       bonus: { offlineMult: 1.10 }, size: [2, 1] },
  책상:      { name: '책상',        icon: '🪑', price: 600,  category: '가구', desc: '일일 퀘스트 +1개',          bonus: { questSlot: 1 },      size: [1, 1] },
  어항:      { name: '어항',        icon: '🐠', price: 1200, category: '가구', desc: '박제 물고기 전시 슬롯 +3',  bonus: { taxidermySlot: 3 },   size: [1, 1] },
  벽난로:    { name: '벽난로',      icon: '🔥', price: 1500, category: '가구', desc: '요리 속도 +8%',             bonus: { cookTimeMult: 0.92 }, size: [1, 1] },
  책장:      { name: '책장',        icon: '📚', price: 700,  category: '가구', desc: '탐험 어빌리티 요구치 -5',   bonus: { exploreReq: -5 },     size: [1, 2] },
  황금어항:  { name: '황금 어항',   icon: '🏆', price: 5000, category: '가구', desc: '박제 전시 슬롯 +6, 판매가 +5%', bonus: { taxidermySlot: 6, sellBonus: 0.05 }, size: [2, 1], upgradeMats: { 황금괴: 2 } },
  수정테이블:{ name: '수정 테이블', icon: '💎', price: 3000, category: '가구', desc: '강화 성공률 +5%',           bonus: { enhanceBonus: 0.05 }, size: [2, 1], upgradeMats: { 정제수정: 3 } },
  화분:      { name: '화분',        icon: '🪴', price: 300,  category: '장식', desc: '집 꾸미기 — 채집 속도 +3%', bonus: { gatherTimeMult: 0.97 }, size: [1, 1] },
  액자:      { name: '액자',        icon: '🖼', price: 200,  category: '장식', desc: '집 꾸미기 — 업적 패 전시',   bonus: {},                     size: [1, 1] },
  항아리:    { name: '항아리',      icon: '🏺', price: 250,  category: '장식', desc: '집 꾸미기 — 분위기 소품',    bonus: {},                     size: [1, 1] },
};

// ── Season Pass Rewards (Phase 9-3) ──────────────────────────────────────────
export const SEASON_PASS_REWARDS = [
  { tier: 1,  reward: '황금 미끼 ×3',          type: 'item',     item: '황금미끼',        qty: 3 },
  { tier: 2,  reward: '골드 500G',             type: 'gold',     amount: 500 },
  { tier: 3,  reward: '낚시 포션 ×2',          type: 'item',     item: '낚시포션',        qty: 2 },
  { tier: 4,  reward: '골드 1000G',            type: 'gold',     amount: 1000 },
  { tier: 5,  reward: '밀짚모자 스킨',          type: 'cosmetic', item: 'strawHatSkin' },
  { tier: 6,  reward: '신화 미끼 ×1',          type: 'item',     item: '신화미끼',        qty: 1 },
  { tier: 7,  reward: '골드 2000G',            type: 'gold',     amount: 2000 },
  { tier: 8,  reward: '채굴 포션 ×2',          type: 'item',     item: '채굴포션',        qty: 2 },
  { tier: 9,  reward: '시즌 전용 낚시복 스킨', type: 'cosmetic', item: 'seasonFishingSuit' },
  { tier: 10, reward: '골드 5000G + 시즌 칭호', type: 'special',  amount: 5000 },
];

// ── Phase 12-5: 활동 포인트 상점 ─────────────────────────────────────────────
export const POINT_SHOP_ITEMS = {
  전설미끼:        { name: '전설 미끼',        icon: '🎣', cost: 50,   desc: '전설 어종 확률 대폭 증가',               itemType: 'bait',      itemKey: '전설미끼',    qty: 1 },
  진화석:          { name: '진화석',           icon: '💎', cost: 200,  desc: '펫 진화에 필요한 귀한 돌',               itemType: 'special',   itemKey: 'evolutionGem', qty: 1 },
  신화광석:        { name: '신화 광석',         icon: '🪨', cost: 150,  desc: '펫 진화 재료',                          itemType: 'special',   itemKey: 'mythicOre',   qty: 1 },
  별빛낚싯대스킨:  { name: '별빛 낚싯대 스킨',  icon: '✨', cost: 300,  desc: '낚싯대에 별빛 스킨 적용',               itemType: 'rodSkin',   itemKey: '별빛낚싯대',  qty: 1 },
  황금어항가구:    { name: '황금 어항 가구',    icon: '🐠', cost: 500,  desc: '오두막 특별 가구 — 판매가 +3%',         itemType: 'furniture', itemKey: '황금어항',    qty: 1 },
  경험치포션:      { name: '경험치 포션',       icon: '⚗️', cost: 80,   desc: '모든 어빌리티 +5',                      itemType: 'consumable', itemKey: 'expPotion',  qty: 1 },
  포인트파라솔:    { name: '포인트 파라솔',     icon: '⛱', cost: 120,  desc: '낚시터 파라솔 장식 (코스메틱)',          itemType: 'spotDeco',  itemKey: '포인트파라솔', qty: 1 },
  포인트달인칭호:  { name: '포인트의 달인 칭호', icon: '🏆', cost: 1000, desc: '특별 칭호 영구 획득',                   itemType: 'title',     itemKey: '포인트의달인', qty: 1 },
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
