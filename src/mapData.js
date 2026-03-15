import { TILE, MAP_W, MAP_H, TILE_SIZE, ORES, weightedPick } from './gameData';

function buildMap() {
  const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(TILE.GRASS));

  // Mine zone: cols 27-39, rows 0-18
  for (let r = 0; r < 19; r++)
    for (let c = 27; c < MAP_W; c++)
      t[r][c] = TILE.STONE;

  // Shop building (not walkable): cols 1-9, rows 1-10
  for (let r = 1; r <= 10; r++)
    for (let c = 1; c <= 9; c++)
      t[r][c] = TILE.BUILDING;

  // Shop entrance path: row 11, cols 4-5
  t[11][4] = TILE.PATH;
  t[11][5] = TILE.PATH;

  // Cooking area building: cols 11-18, rows 2-9
  for (let r = 2; r <= 9; r++)
    for (let c = 11; c <= 18; c++)
      t[r][c] = TILE.BUILDING;

  // Cooking entrance path: row 10-11, cols 13-14
  t[10][13] = TILE.PATH;
  t[10][14] = TILE.PATH;
  t[11][13] = TILE.PATH;
  t[11][14] = TILE.PATH;

  // Main horizontal path: rows 12-13, cols 0-26
  for (let c = 0; c < 27; c++) {
    t[12][c] = TILE.PATH;
    t[13][c] = TILE.PATH;
  }

  // Sand beach: rows 17-18, cols 0-26
  for (let r = 17; r <= 18; r++)
    for (let c = 0; c < 27; c++)
      t[r][c] = TILE.SAND;

  // Dock: rows 19-20, cols 3-24
  for (let r = 19; r <= 20; r++)
    for (let c = 3; c <= 24; c++)
      t[r][c] = TILE.WOOD;

  // Water: rows 21+
  for (let r = 21; r < MAP_H; r++)
    for (let c = 0; c < MAP_W; c++)
      t[r][c] = TILE.WATER;

  // Mine side water at bottom
  for (let r = 19; r < MAP_H; r++)
    for (let c = 27; c < MAP_W; c++)
      t[r][c] = TILE.WATER;

  return t;
}

export const MAP_TILES = buildMap();

export const FISHING_CHAIRS = [
  { tx: 5,  ty: 20 },
  { tx: 9,  ty: 20 },
  { tx: 13, ty: 20 },
  { tx: 17, ty: 20 },
  { tx: 21, ty: 20 },
];

export const CHAIR_RANGE = 3 * TILE_SIZE;

export const SHOP_TX = 5;
export const SHOP_TY = 11;
export const SHOP_RANGE = 4 * TILE_SIZE;

export const MINE_ZONE = { tx1: 27, ty1: 0, tx2: 39, ty2: 18 };
export const MINE_ENTRANCE = { tx: 29, ty: 6 };

export const COOKING_TX = 13;
export const COOKING_TY = 11;
export const COOKING_RANGE = 4 * TILE_SIZE;

export const PLAYER_START_X = 15 * TILE_SIZE + TILE_SIZE / 2;
export const PLAYER_START_Y = 14 * TILE_SIZE + TILE_SIZE / 2;

export function isInMineZone(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return tx >= MINE_ZONE.tx1 && tx <= MINE_ZONE.tx2 && ty >= MINE_ZONE.ty1 && ty <= MINE_ZONE.ty2;
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

export function pickOre() {
  const entries = Object.entries(ORES).map(([k, v]) => ({ f: k, w: v.w }));
  return weightedPick(entries);
}
