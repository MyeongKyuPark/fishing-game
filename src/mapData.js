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
  const mz = ZONE_MINE_ZONES[_activeZone];
  if (!mz) return false;
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return tx >= mz.tx1 && tx <= mz.tx2 && ty >= mz.ty1 && ty <= mz.ty2;
}

export function isInForestZone(px, py) {
  const fz = getActiveForest();
  if (!fz) return false;
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return tx >= fz.tx1 && tx <= fz.tx2 && ty >= fz.ty1 && ty <= fz.ty2;
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
  for (const chair of getActiveChairs()) {
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

// ── Multi-Zone World Map System ──────────────────────────────────────────────

function buildMapWest() {
  const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(TILE.GRASS));

  // Forest: cols 0-14, rows 0-20
  for (let r = 0; r <= 20; r++)
    for (let c = 0; c <= 14; c++)
      t[r][c] = TILE.FOREST;

  // River (north-south): cols 30-34
  for (let r = 0; r < MAP_H; r++)
    for (let c = 30; c <= 34; c++)
      t[r][c] = TILE.WATER;

  // Wooden bridge at rows 12-13 (path on sides, wood over river)
  for (let c = 27; c <= 37; c++) { t[12][c] = TILE.PATH; t[13][c] = TILE.PATH; }
  for (let c = 30; c <= 34; c++) { t[12][c] = TILE.WOOD; t[13][c] = TILE.WOOD; }

  // Meadow lake: cols 50-58, rows 7-13
  for (let r = 7; r <= 13; r++)
    for (let c = 50; c <= 58; c++)
      t[r][c] = TILE.WATER;

  // Horizontal path: row 14 across map
  for (let c = 0; c < MAP_W; c++) t[14][c] = TILE.PATH;

  // Sand beach: rows 18-20
  for (let r = 18; r <= 20; r++)
    for (let c = 0; c < MAP_W; c++)
      t[r][c] = TILE.SAND;

  // Main dock: rows 21-22, cols 5-65
  for (let r = 21; r <= 22; r++)
    for (let c = 5; c <= 65; c++)
      t[r][c] = TILE.WOOD;

  // Deep pier: rows 23-26, cols 35-45
  for (let r = 23; r <= 26; r++)
    for (let c = 35; c <= 45; c++)
      t[r][c] = TILE.WOOD;

  // Water: rows 27+
  for (let r = 27; r < MAP_H; r++)
    for (let c = 0; c < MAP_W; c++)
      t[r][c] = TILE.WATER;
  for (let r = 23; r <= 26; r++) {
    for (let c = 0; c < 35; c++) t[r][c] = TILE.WATER;
    for (let c = 46; c < MAP_W; c++) t[r][c] = TILE.WATER;
  }

  // River flows through beach/dock into sea
  for (let r = 18; r <= 26; r++)
    for (let c = 30; c <= 34; c++)
      t[r][c] = TILE.WATER;

  // Scattered rocks
  for (const [r, c] of [[4,20],[8,25],[11,42],[16,38],[3,55],[6,62],[10,67]])
    if (t[r]?.[c] === TILE.GRASS) t[r][c] = TILE.STONE;

  return t;
}

function buildMapEast() {
  const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(TILE.STONE));

  // Grassy valley: cols 15-44, rows 0-22
  for (let r = 0; r <= 22; r++)
    for (let c = 15; c <= 44; c++)
      t[r][c] = TILE.GRASS;

  // Main path: cols 27-29, rows 0-22
  for (let r = 0; r <= 22; r++)
    for (let c = 27; c <= 29; c++)
      t[r][c] = TILE.PATH;

  // Cave lake: cols 18-30, rows 7-16
  for (let r = 7; r <= 16; r++)
    for (let c = 18; c <= 30; c++)
      t[r][c] = TILE.WATER;

  // Forest patch: cols 48-63, rows 3-16
  for (let r = 3; r <= 16; r++)
    for (let c = 48; c <= 63; c++)
      t[r][c] = TILE.FOREST;

  // Sand beach: rows 18-20
  for (let r = 18; r <= 20; r++)
    for (let c = 0; c < MAP_W; c++)
      if (t[r][c] !== TILE.WATER) t[r][c] = TILE.SAND;

  // Coastal dock: rows 21-22, cols 10-60
  for (let r = 21; r <= 22; r++)
    for (let c = 10; c <= 60; c++)
      t[r][c] = TILE.WOOD;

  // Deep pier: rows 23-26, cols 28-38
  for (let r = 23; r <= 26; r++)
    for (let c = 28; c <= 38; c++)
      t[r][c] = TILE.WOOD;

  // Water: rows 27+
  for (let r = 27; r < MAP_H; r++)
    for (let c = 0; c < MAP_W; c++)
      t[r][c] = TILE.WATER;
  for (let r = 23; r <= 26; r++) {
    for (let c = 0; c < 28; c++) t[r][c] = TILE.WATER;
    for (let c = 39; c < MAP_W; c++) t[r][c] = TILE.WATER;
  }

  return t;
}

function buildMapNorth() {
  const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(TILE.GRASS));

  // Stone walls at corners/edges
  for (let r = 0; r <= 7; r++) {
    for (let c = 0; c <= 14; c++) t[r][c] = TILE.STONE;
    for (let c = 56; c < MAP_W; c++) t[r][c] = TILE.STONE;
  }
  for (let r = 42; r < MAP_H; r++) {
    for (let c = 0; c <= 9; c++) t[r][c] = TILE.STONE;
    for (let c = 60; c < MAP_W; c++) t[r][c] = TILE.STONE;
  }

  // Mountain forest: cols 50-65, rows 0-22
  for (let r = 0; r <= 22; r++)
    for (let c = 50; c <= 65; c++)
      t[r][c] = TILE.FOREST;

  // Alpine lake: cols 22-44, rows 25-38
  for (let r = 25; r <= 38; r++)
    for (let c = 22; c <= 44; c++)
      t[r][c] = TILE.WATER;

  // Path to lake: cols 32-34, rows 0-25
  for (let r = 0; r <= 25; r++)
    for (let c = 32; c <= 34; c++)
      t[r][c] = TILE.PATH;

  // Lakeside path: rows 24 and 39
  for (let c = 22; c <= 44; c++) { t[24][c] = TILE.PATH; t[39][c] = TILE.PATH; }

  // Stone outcroppings
  for (const [r, c] of [[12,5],[15,12],[10,48],[22,18],[40,30],[12,28],[18,42],[30,55]])
    if (t[r]?.[c] === TILE.GRASS) t[r][c] = TILE.STONE;

  // South edge sand (transition border with main map)
  for (let c = 0; c < MAP_W; c++)
    if (t[49]?.[c] === TILE.GRASS || t[49]?.[c] === TILE.PATH) t[49][c] = TILE.SAND;

  return t;
}

function buildMapSouth() {
  const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(TILE.WATER));

  // Tropical island: cols 22-48, rows 15-32
  for (let r = 15; r <= 32; r++)
    for (let c = 22; c <= 48; c++)
      t[r][c] = TILE.GRASS;

  // Sandy beaches around island
  for (let r = 13; r <= 34; r++)
    for (let c = 20; c <= 50; c++) {
      if (t[r][c] !== TILE.GRASS) {
        const isEdge = r === 13 || r === 14 || r === 33 || r === 34
          || c === 20 || c === 21 || c === 49 || c === 50;
        if (isEdge) t[r][c] = TILE.SAND;
      }
    }

  // Island forest: cols 25-36, rows 17-26
  for (let r = 17; r <= 26; r++)
    for (let c = 25; c <= 36; c++)
      t[r][c] = TILE.FOREST;

  // Island dock: rows 33-34, cols 32-38
  for (let r = 33; r <= 34; r++)
    for (let c = 32; c <= 38; c++)
      t[r][c] = TILE.WOOD;

  // Island path: cols 35-36, rows 15-33
  for (let r = 15; r <= 33; r++) { t[r][35] = TILE.PATH; t[r][36] = TILE.PATH; }

  // North approach dock (from main map south edge): rows 0-4, cols 32-40
  for (let r = 0; r <= 4; r++)
    for (let c = 32; c <= 40; c++)
      t[r][c] = TILE.WOOD;

  return t;
}

// ── Zone Metadata ─────────────────────────────────────────────────────────────

export const ZONE_TILES = {
  '마을':    MAP_TILES,
  '서쪽초원': buildMapWest(),
  '동쪽절벽': buildMapEast(),
  '북쪽고원': buildMapNorth(),
  '남쪽심해': buildMapSouth(),
};

export const ZONE_LABELS = {
  '마을':    '🏠 마을',
  '서쪽초원': '🌾 서쪽 초원',
  '동쪽절벽': '⛏ 동쪽 절벽',
  '북쪽고원': '🏔 북쪽 고원',
  '남쪽심해': '🌊 남쪽 심해',
};

export const ZONE_CONNECTIONS = {
  '마을':    { west: '서쪽초원', east: '동쪽절벽', north: '북쪽고원', south: '남쪽심해' },
  '서쪽초원': { east: '마을' },
  '동쪽절벽': { west: '마을' },
  '북쪽고원': { south: '마을' },
  '남쪽심해': { north: '마을' },
};

const ZONE_CHAIRS = {
  '마을': FISHING_CHAIRS,
  '서쪽초원': [
    // River fishing (north of bridge)
    { tx: 26, ty: 11, zone: '강' }, { tx: 28, ty: 11, zone: '강' },
    { tx: 35, ty: 11, zone: '강' }, { tx: 37, ty: 11, zone: '강' },
    // Meadow lake (north edge)
    { tx: 50, ty: 6, zone: '민물' }, { tx: 53, ty: 6, zone: '민물' },
    { tx: 56, ty: 6, zone: '민물' }, { tx: 58, ty: 6, zone: '민물' },
    // Main dock
    { tx: 10, ty: 22, zone: '강' }, { tx: 16, ty: 22, zone: '강' },
    { tx: 22, ty: 22, zone: '강' }, { tx: 28, ty: 22, zone: '강' },
    { tx: 40, ty: 22, zone: '강' }, { tx: 46, ty: 22, zone: '강' },
    { tx: 52, ty: 22, zone: '강' }, { tx: 58, ty: 22, zone: '강' },
    // Deep pier
    { tx: 37, ty: 26, seaFishing: true, zone: '바다' },
    { tx: 40, ty: 26, seaFishing: true, zone: '바다' },
    { tx: 43, ty: 26, seaFishing: true, zone: '바다' },
  ],
  '동쪽절벽': [
    // Cave lake (north edge at row 6)
    { tx: 20, ty: 6, zone: '민물' }, { tx: 24, ty: 6, zone: '민물' },
    { tx: 28, ty: 6, zone: '민물' },
    // Coastal dock
    { tx: 12, ty: 22, zone: '바다' }, { tx: 18, ty: 22, zone: '바다' },
    { tx: 24, ty: 22, zone: '바다' }, { tx: 30, ty: 22, zone: '바다' },
    { tx: 36, ty: 22, zone: '바다' }, { tx: 42, ty: 22, zone: '바다' },
    { tx: 48, ty: 22, zone: '바다' }, { tx: 54, ty: 22, zone: '바다' },
    // Deep pier
    { tx: 30, ty: 26, seaFishing: true, zone: '바다' },
    { tx: 34, ty: 26, seaFishing: true, zone: '바다' },
    { tx: 38, ty: 26, seaFishing: true, zone: '바다' },
  ],
  '북쪽고원': [
    // Alpine lake (lakeside path at row 24)
    { tx: 22, ty: 24, zone: '민물' }, { tx: 27, ty: 24, zone: '민물' },
    { tx: 32, ty: 24, zone: '민물' }, { tx: 37, ty: 24, zone: '민물' },
    { tx: 42, ty: 24, zone: '민물' }, { tx: 44, ty: 24, zone: '민물' },
  ],
  '남쪽심해': [
    // Island dock
    { tx: 32, ty: 34, zone: '바다' }, { tx: 35, ty: 34, zone: '바다' },
    { tx: 38, ty: 34, zone: '바다' },
    // North approach dock (deep sea)
    { tx: 33, ty: 4, seaFishing: true, zone: '바다' },
    { tx: 36, ty: 4, seaFishing: true, zone: '바다' },
    { tx: 39, ty: 4, seaFishing: true, zone: '바다' },
  ],
};

const ZONE_FOREST = {
  '마을':    FOREST_ZONE,
  '서쪽초원': { tx1: 0, ty1: 0, tx2: 14, ty2: 20 },
  '동쪽절벽': { tx1: 48, ty1: 3, tx2: 63, ty2: 16 },
  '북쪽고원': { tx1: 50, ty1: 0, tx2: 65, ty2: 22 },
  '남쪽심해': { tx1: 25, ty1: 17, tx2: 36, ty2: 26 },
};

// ── Zone Bonuses ─────────────────────────────────────────────────────────────
// Passive bonuses applied when the player is in each world zone
export const ZONE_BONUSES = {
  '마을':    {},
  '서쪽초원': { herbMult: 1.4, fishSellMult: 0.95 },          // lush meadow: +40% herb yield, -5% fish sell (no ocean)
  '동쪽절벽': { oreMult: 1.3, mineTimeReduction: 0.08 },       // mineral cliffs: +30% ore yield, -8% mining time
  '북쪽고원': { herbMult: 1.2, oreMult: 1.15, rarityBonus: 0.05 }, // highland: herb/ore/rarity bonus
  '남쪽심해': { fishSellMult: 1.25, rarityBonus: 0.08 },       // deep sea: +25% fish sell price, +8% rare chance
};

// ── Zone Mine Zones & Entrances ───────────────────────────────────────────────
// 동쪽절벽: left stone cliff (cols 0-13, rows 0-17)
// 북쪽고원: top-left stone corner (cols 0-14, rows 0-7)
const ZONE_MINE_ZONES = {
  '마을':    MINE_ZONE,
  '동쪽절벽': { tx1: 0, ty1: 0, tx2: 13, ty2: 17 },
  '북쪽고원': { tx1: 0, ty1: 0, tx2: 14, ty2: 7 },
};

const ZONE_MINE_ENTRANCES = {
  '마을':    MINE_ENTRANCE,
  '동쪽절벽': { tx: 13, ty: 10 },   // right edge of cliff stone zone
  '북쪽고원': { tx: 13, ty: 6 },    // bottom edge of highland stone zone
};

// ── Active Zone State (mutable module-level) ──────────────────────────────────
let _activeZone = '마을';

export function setActiveZone(zone) { _activeZone = zone; }
export function getActiveZone() { return _activeZone; }
export function getActiveChairs() { return ZONE_CHAIRS[_activeZone] ?? FISHING_CHAIRS; }
export function getActiveDoors() { return _activeZone === '마을' ? DOOR_TRIGGERS : []; }
export function getActiveForest() { return ZONE_FOREST[_activeZone] ?? null; }
export function getActiveMineEntrance() { return ZONE_MINE_ENTRANCES[_activeZone] ?? null; }

// Traveling NPCs in outer zones — tile positions for detection & rendering
export const ZONE_TRAVEL_NPCS = {
  '서쪽초원': { id: '행상인',    name: '행상인',      icon: '🧳', color: '#ddaa44', tx: 20, ty: 12 },
  '동쪽절벽': { id: '노련한광부', name: '노련한 광부',  icon: '🪨', color: '#aa8866', tx: 20, ty: 12 },
  '북쪽고원': { id: '산신령',    name: '산신령',      icon: '🌫', color: '#aaddff', tx: 20, ty: 10 },
  '남쪽심해': { id: '심해탐험가', name: '심해 탐험가',  icon: '🤿', color: '#4488ff', tx: 20, ty: 12 },
};

// Zone unlock requirements — checked in App.jsx to populate gameRef.current.unlockedZones
export const ZONE_UNLOCK_REQ = {
  '서쪽초원': null,  // always unlocked
  '동쪽절벽': { stat: 'oreMined', min: 10, desc: '광석 채굴 10회 이상 필요' },
  '북쪽고원': { stat: 'exploredZones', min: 2, desc: '탐험 구역 2곳 이상 완료 필요' },
  '남쪽심해': { marineGear: '스쿠버다이빙세트', desc: '스쿠버다이빙세트 장착 필요' },
};

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
