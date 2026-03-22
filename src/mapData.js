import { TILE, MAP_W, MAP_H, TILE_SIZE, ORES, HERBS, weightedPick } from './gameData';

function buildMap() {
  const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(TILE.GRASS));

  // ── Mine zone: cols 45-69, rows 0-22 ──────────────────────────────────────
  for (let r = 0; r <= 22; r++)
    for (let c = 45; c < MAP_W; c++)
      t[r][c] = TILE.STONE;

  // ── Shop building: cols 1-9, rows 1-10 ────────────────────────────────────
  for (let r = 1; r <= 10; r++)
    for (let c = 1; c <= 9; c++)
      t[r][c] = TILE.BUILDING;

  // Shop entrance path: rows 10-11, cols 4-5
  t[10][4] = TILE.PATH;
  t[10][5] = TILE.PATH;
  t[11][4] = TILE.PATH;
  t[11][5] = TILE.PATH;

  // ── Cooking building: cols 11-18, rows 2-9 ────────────────────────────────
  for (let r = 2; r <= 9; r++)
    for (let c = 11; c <= 18; c++)
      t[r][c] = TILE.BUILDING;

  // Cooking entrance path: rows 10-11, cols 13-14
  t[10][13] = TILE.PATH;
  t[10][14] = TILE.PATH;
  t[11][13] = TILE.PATH;
  t[11][14] = TILE.PATH;

  // ── INN building: cols 20-28, rows 1-9 ────────────────────────────────────
  for (let r = 1; r <= 9; r++)
    for (let c = 20; c <= 28; c++)
      t[r][c] = TILE.BUILDING;

  // INN entrance path: rows 10-11, cols 23-24
  t[10][23] = TILE.PATH;
  t[10][24] = TILE.PATH;
  t[11][23] = TILE.PATH;
  t[11][24] = TILE.PATH;

  // ── Main horizontal path: rows 12-13, cols 0-44 ────────────────────────────
  for (let c = 0; c <= 44; c++) {
    t[12][c] = TILE.PATH;
    t[13][c] = TILE.PATH;
  }

  // ── Vertical path: cols 13-14, rows 0-12 ──────────────────────────────────
  for (let r = 0; r <= 12; r++) {
    t[r][13] = TILE.PATH;
    t[r][14] = TILE.PATH;
  }

  // ── Forest zone: cols 30-44, rows 0-18 ────────────────────────────────────
  for (let r = 0; r <= 18; r++)
    for (let c = 30; c <= 44; c++)
      t[r][c] = TILE.FOREST;

  // Scatter a few stone rocks in forest
  const forestRocks = [
    [3,32],[5,35],[2,38],[8,31],[10,40],[6,44],[14,33],[16,37],[12,42],
  ];
  for (const [r, c] of forestRocks) {
    if (r >= 0 && r <= 18 && c >= 30 && c <= 44)
      t[r][c] = TILE.STONE;
  }

  // ── Farm zone: cols 30-38, rows 14-17 ─────────────────────────────────────
  // (between forest and beach, south of path)
  for (let r = 14; r <= 17; r++)
    for (let c = 30; c <= 38; c++)
      t[r][c] = TILE.GRASS; // keep as grass, farm plots drawn on top

  // ── Freshwater pond: cols 16-22, rows 15-17 ───────────────────────────────
  for (let r = 15; r <= 17; r++)
    for (let c = 16; c <= 22; c++)
      t[r][c] = TILE.WATER;

  // ── Golden pond: cols 36-40, rows 8-10 (hidden in forest) ─────────────────
  for (let r = 8; r <= 10; r++)
    for (let c = 36; c <= 40; c++)
      t[r][c] = TILE.WATER;

  // ── Bank building: cols 1-9, rows 14-17 ───────────────────────────────────
  // (south of main path, above sand — entrance at south face)
  for (let r = 14; r <= 17; r++)
    for (let c = 1; c <= 9; c++)
      t[r][c] = TILE.BUILDING;
  // Bank entrance path (row 17 bottom edge, not overwritten by sand at row 18+)
  t[17][4] = TILE.PATH;
  t[17][5] = TILE.PATH;

  // ── Guild Hall building: cols 11-19, rows 14-17 ────────────────────────────
  for (let r = 14; r <= 17; r++)
    for (let c = 11; c <= 19; c++)
      t[r][c] = TILE.BUILDING;
  // Guild hall entrance path
  t[17][14] = TILE.PATH;
  t[17][15] = TILE.PATH;

  // ── Cottage zone: cols 21-27, rows 14-17 ─────────────────────────────────
  for (let r = 14; r <= 17; r++)
    for (let c = 21; c <= 27; c++)
      t[r][c] = TILE.BUILDING;
  // Cottage entrance path
  t[17][23] = TILE.PATH;
  t[17][24] = TILE.PATH;

  // ── Sand beach: rows 18-20, cols 0-44 ─────────────────────────────────────
  for (let r = 18; r <= 20; r++)
    for (let c = 0; c <= 44; c++)
      t[r][c] = TILE.SAND;

  // ── Main dock: rows 21-22, cols 3-42 ──────────────────────────────────────
  for (let r = 21; r <= 22; r++)
    for (let c = 3; c <= 42; c++)
      t[r][c] = TILE.WOOD;

  // ── Deep sea pier: rows 23-26, cols 20-30 ─────────────────────────────────
  for (let r = 23; r <= 26; r++)
    for (let c = 20; c <= 30; c++)
      t[r][c] = TILE.WOOD;

  // ── Water: rows 27+ for cols 0-44 ─────────────────────────────────────────
  for (let r = 27; r < MAP_H; r++)
    for (let c = 0; c <= 44; c++)
      t[r][c] = TILE.WATER;

  // Also rows 23-26 outside the pier (cols 0-19 and 31-44) are water
  for (let r = 23; r <= 26; r++) {
    for (let c = 0; c < 20; c++) t[r][c] = TILE.WATER;
    for (let c = 31; c <= 44; c++) t[r][c] = TILE.WATER;
  }

  // ── Mine area water: rows 23+ for cols 45-69 ──────────────────────────────
  for (let r = 23; r < MAP_H; r++)
    for (let c = 45; c < MAP_W; c++)
      t[r][c] = TILE.WATER;

  return t;
}

export const MAP_TILES = buildMap();

export const FISHING_CHAIRS = [
  // Freshwater pond chairs (row 14, north edge of pond at cols 16-22)
  { tx: 16, ty: 14, zone: '민물' },
  { tx: 19, ty: 14, zone: '민물' },
  { tx: 22, ty: 14, zone: '민물' },
  // Main dock chairs (row 22) — river zone
  { tx: 5,  ty: 22, zone: '강' },
  { tx: 9,  ty: 22, zone: '강' },
  { tx: 13, ty: 22, zone: '강' },
  { tx: 17, ty: 22, zone: '강' },
  { tx: 21, ty: 22, zone: '강' },
  { tx: 25, ty: 22, zone: '강' },
  { tx: 29, ty: 22, zone: '강' },
  { tx: 33, ty: 22, zone: '강' },
  // Golden pond chairs (row 7, north edge of pond at cols 36-40)
  { tx: 37, ty: 7, zone: '황금연못' },
  { tx: 39, ty: 7, zone: '황금연못' },
  // Deep pier chairs (row 26) — sea fishing zone
  { tx: 22, ty: 26, seaFishing: true, zone: '바다' },
  { tx: 24, ty: 26, seaFishing: true, zone: '바다' },
  { tx: 26, ty: 26, seaFishing: true, zone: '바다' },
  { tx: 28, ty: 26, seaFishing: true, zone: '바다' },
];

export const CHAIR_RANGE = 3 * TILE_SIZE;

export const SHOP_TX = 5;
export const SHOP_TY = 12;
export const SHOP_RANGE = 4 * TILE_SIZE;

export const MINE_ZONE = { tx1: 45, ty1: 0, tx2: 69, ty2: 22 };
export const MINE_ENTRANCE = { tx: 47, ty: 8 };

export const COOKING_TX = 13;
export const COOKING_TY = 11;
export const COOKING_RANGE = 4 * TILE_SIZE;

export const INN_TX = 23;
export const INN_TY = 11;
export const INN_RANGE = 4 * TILE_SIZE;

export const FOREST_ZONE = { tx1: 30, ty1: 0, tx2: 44, ty2: 18 };

export const FARM_ZONE = { tx1: 30, ty1: 14, tx2: 38, ty2: 17 };
export const FARM_TX = 34;  // center of farm zone
export const FARM_TY = 15;
export const FARM_RANGE = 5 * TILE_SIZE;

export const PLAYER_START_X = 15 * TILE_SIZE + TILE_SIZE / 2;
export const PLAYER_START_Y = 14 * TILE_SIZE + TILE_SIZE / 2;

// Door triggers: walk near these to get an entry prompt
export const DOOR_TRIGGERS = [
  {
    id: 'shop',
    label: '🏪 상점 입장',
    wx: 4.5 * TILE_SIZE, wy: 11 * TILE_SIZE,
    range: 1.8 * TILE_SIZE,
    exitWx: 4.5 * TILE_SIZE, exitWy: 13 * TILE_SIZE,
  },
  {
    id: 'cooking',
    label: '🍳 주방 입장',
    wx: 13.5 * TILE_SIZE, wy: 10 * TILE_SIZE,
    range: 1.8 * TILE_SIZE,
    exitWx: 13.5 * TILE_SIZE, exitWy: 12 * TILE_SIZE,
  },
  {
    id: 'inn',
    label: '🏨 여관 입장',
    wx: 23.5 * TILE_SIZE, wy: 10 * TILE_SIZE,
    range: 1.8 * TILE_SIZE,
    exitWx: 23.5 * TILE_SIZE, exitWy: 12 * TILE_SIZE,
  },
  {
    id: 'mine',
    label: '⛏ 광산 입장',
    wx: 47.5 * TILE_SIZE, wy: 8.5 * TILE_SIZE,
    range: 2.2 * TILE_SIZE,
    exitWx: 47.5 * TILE_SIZE, exitWy: 11 * TILE_SIZE,
  },
  {
    id: 'bank',
    label: '🏦 은행 입장',
    wx: 4.5 * TILE_SIZE, wy: 18 * TILE_SIZE,
    range: 1.8 * TILE_SIZE,
    exitWx: 4.5 * TILE_SIZE, exitWy: 20 * TILE_SIZE,
  },
  {
    id: 'guild',
    label: '🏰 길드 회관 입장',
    wx: 14.5 * TILE_SIZE, wy: 18 * TILE_SIZE,
    range: 1.8 * TILE_SIZE,
    exitWx: 14.5 * TILE_SIZE, exitWy: 20 * TILE_SIZE,
  },
  {
    id: 'cottage',
    label: '🏠 내 오두막 입장',
    wx: 23.5 * TILE_SIZE, wy: 18 * TILE_SIZE,
    range: 1.8 * TILE_SIZE,
    exitWx: 23.5 * TILE_SIZE, exitWy: 20 * TILE_SIZE,
  },
];

export function isInMineZone(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return tx >= MINE_ZONE.tx1 && tx <= MINE_ZONE.tx2 && ty >= MINE_ZONE.ty1 && ty <= MINE_ZONE.ty2;
}

export function isInForestZone(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return tx >= FOREST_ZONE.tx1 && tx <= FOREST_ZONE.tx2 && ty >= FOREST_ZONE.ty1 && ty <= FOREST_ZONE.ty2;
}

export function nearInn(px, py) {
  const ix = INN_TX * TILE_SIZE + TILE_SIZE / 2;
  const iy = INN_TY * TILE_SIZE + TILE_SIZE / 2;
  return Math.hypot(px - ix, py - iy) <= INN_RANGE;
}

export function isOnWater(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return MAP_TILES[ty]?.[tx] === TILE.WATER;
}

export function nearestChair(px, py) {
  let nearest = null, minDist = Infinity;
  for (const chair of FISHING_CHAIRS) {
    const cx = chair.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = chair.ty * TILE_SIZE + TILE_SIZE / 2;
    const d = Math.hypot(px - cx, py - cy);
    if (d < minDist) { minDist = d; nearest = { ...chair, cx, cy, dist: d }; }
  }
  return nearest;
}

export function nearShop(px, py) {
  const sx = SHOP_TX * TILE_SIZE + TILE_SIZE / 2;
  const sy = SHOP_TY * TILE_SIZE + TILE_SIZE / 2;
  return Math.hypot(px - sx, py - sy) <= SHOP_RANGE;
}

export function nearCooking(px, py) {
  const cx = COOKING_TX * TILE_SIZE + TILE_SIZE / 2;
  const cy = COOKING_TY * TILE_SIZE + TILE_SIZE / 2;
  return Math.hypot(px - cx, py - cy) <= COOKING_RANGE;
}

export function nearFarm(px, py) {
  const fx = FARM_TX * TILE_SIZE + TILE_SIZE / 2;
  const fy = FARM_TY * TILE_SIZE + TILE_SIZE / 2;
  return Math.hypot(px - fx, py - fy) <= FARM_RANGE;
}

export function pickOre() {
  const entries = Object.entries(ORES).map(([k, v]) => ({ f: k, w: v.w }));
  return weightedPick(entries);
}

export function pickHerb() {
  const entries = Object.entries(HERBS).map(([k]) => ({ f: k, w: 1 }));
  // Weighted: 들풀 most common, 희귀허브 rarest
  const weights = { 들풀: 50, 버섯: 30, 희귀허브: 10 };
  const weighted = Object.entries(HERBS).map(([k]) => ({ f: k, w: weights[k] ?? 10 }));
  return weightedPick(weighted);
}

export function getFishingZone(px, py, marineGear, fishAbil) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  // Freshwater pond area (cols 16-22, rows 14-17)
  if (tx >= 15 && tx <= 23 && ty >= 14 && ty <= 18) return '민물';
  // Deep sea (on water with scuba + high ability)
  if (marineGear === '스쿠버다이빙세트' && fishAbil >= 50) return '심해';
  // Sea fishing area (deep pier)
  if (ty >= 23 && ty <= 26) return '바다';
  return '강'; // default river/dock
}
