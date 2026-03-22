// World decoration positions (tile coords)

// Farm plot grid: 3 cols × 2 rows within the farm zone (cols 30-38, rows 14-17)
export const FARM_PLOT_POSITIONS = [
  { tx: 31, ty: 14 }, { tx: 33, ty: 14 }, { tx: 35, ty: 14 },
  { tx: 31, ty: 16 }, { tx: 33, ty: 16 }, { tx: 35, ty: 16 },
];

export const TREE_POSITIONS = [
  // Left edge village
  { tx: 0.4, ty: 10.6 }, { tx: 0.4, ty: 14.2 },
  // Between buildings & path
  { tx: 10.2, ty: 10.8 }, { tx: 10.1, ty: 13.8 },
  // Forest zone — dense trees (cols 30-44, rows 0-18)
  { tx: 30.4, ty: 1.2 }, { tx: 32.1, ty: 0.6 }, { tx: 34.5, ty: 1.5 }, { tx: 36.2, ty: 0.4 },
  { tx: 38.8, ty: 1.1 }, { tx: 40.3, ty: 0.7 }, { tx: 42.6, ty: 1.4 }, { tx: 44.1, ty: 0.9 },
  { tx: 31.0, ty: 4.2 }, { tx: 33.5, ty: 3.6 }, { tx: 35.8, ty: 4.8 }, { tx: 37.4, ty: 3.2 },
  { tx: 39.2, ty: 4.5 }, { tx: 41.7, ty: 3.9 }, { tx: 43.3, ty: 4.1 },
  { tx: 30.6, ty: 7.8 }, { tx: 32.9, ty: 7.1 }, { tx: 34.2, ty: 8.4 }, { tx: 36.7, ty: 7.5 },
  { tx: 38.5, ty: 8.2 }, { tx: 40.8, ty: 7.3 }, { tx: 42.4, ty: 8.6 }, { tx: 44.0, ty: 7.9 },
  { tx: 31.3, ty: 11.5 }, { tx: 33.6, ty: 10.8 }, { tx: 35.1, ty: 12.1 }, { tx: 37.8, ty: 11.3 },
  { tx: 39.4, ty: 12.4 }, { tx: 41.2, ty: 11.0 }, { tx: 43.7, ty: 12.7 },
  { tx: 30.8, ty: 15.2 }, { tx: 33.1, ty: 14.6 }, { tx: 35.5, ty: 15.9 }, { tx: 37.2, ty: 14.4 },
  { tx: 39.9, ty: 15.6 }, { tx: 42.1, ty: 14.8 }, { tx: 44.3, ty: 15.3 },
];
