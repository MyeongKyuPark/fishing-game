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

export const FISH = {
  붕어:       { minSz: 10, maxSz: 35,  price: 20,  rarity: '흔함' },
  잉어:       { minSz: 20, maxSz: 60,  price: 40,  rarity: '흔함' },
  미꾸라지:   { minSz: 5,  maxSz: 20,  price: 15,  rarity: '흔함' },
  메기:       { minSz: 15, maxSz: 50,  price: 35,  rarity: '흔함' },
  배스:       { minSz: 25, maxSz: 55,  price: 70,  rarity: '보통' },
  송어:       { minSz: 30, maxSz: 70,  price: 90,  rarity: '보통' },
  강꼬치고기: { minSz: 40, maxSz: 90,  price: 120, rarity: '보통' },
  연어:       { minSz: 50, maxSz: 100, price: 150, rarity: '희귀' },
  황금붕어:   { minSz: 10, maxSz: 30,  price: 300, rarity: '희귀' },
  참치:       { minSz: 80, maxSz: 200, price: 400, rarity: '희귀' },
  황새치:     { minSz: 100, maxSz: 250, price: 600, rarity: '전설' },
  용고기:     { minSz: 50, maxSz: 150, price: 1000, rarity: '전설' },
  고대어:     { minSz: 30, maxSz: 80,  price: 2000, rarity: '신화' },
};

export const RODS = {
  초급낚시대: {
    name: '초급 낚시대', price: 0, color: '#8b6914',
    catchTimeRange: [8000, 15000],
    table: [
      { f: '붕어', w: 40 }, { f: '잉어', w: 30 },
      { f: '미꾸라지', w: 20 }, { f: '메기', w: 10 },
    ],
  },
  중급낚시대: {
    name: '중급 낚시대', price: 500, color: '#c0c0c0',
    upgradeMats: { 철광석: 3, 구리광석: 2 },
    catchTimeRange: [6000, 12000],
    table: [
      { f: '배스', w: 25 }, { f: '송어', w: 25 }, { f: '강꼬치고기', w: 20 },
      { f: '황금붕어', w: 10 }, { f: '붕어', w: 10 }, { f: '잉어', w: 10 },
    ],
  },
  고급낚시대: {
    name: '고급 낚시대', price: 2000, color: '#ffd700',
    upgradeMats: { 철광석: 5, 수정: 3 },
    catchTimeRange: [4000, 9000],
    table: [
      { f: '참치', w: 20 }, { f: '황새치', w: 15 }, { f: '용고기', w: 8 },
      { f: '고대어', w: 2 }, { f: '연어', w: 25 }, { f: '황금붕어', w: 15 },
      { f: '배스', w: 10 }, { f: '송어', w: 5 },
    ],
  },
};

export const ORES = {
  철광석:   { price: 30,  color: '#808080', mineRange: [5000, 10000],  w: 50 },
  구리광석: { price: 50,  color: '#b87333', mineRange: [7000, 14000],  w: 30 },
  수정:     { price: 100, color: '#a8d8ea', mineRange: [12000, 22000], w: 20 },
};

export function weightedPick(table) {
  const total = table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of table) { r -= e.w; if (r <= 0) return e.f; }
  return table[table.length - 1].f;
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
