// World decoration positions (tile coords)

// Farm plot grid: 3 cols × 2 rows within the farm clearing (cols 3-10, rows 22-27)
export const FARM_PLOT_POSITIONS = [
  { tx: 4, ty: 23 }, { tx: 6, ty: 23 }, { tx: 8, ty: 23 },
  { tx: 4, ty: 25 }, { tx: 6, ty: 25 }, { tx: 8, ty: 25 },
];

export const TREE_POSITIONS = [
  // West forest zone (cols 0-11, rows 0-30) — dense trees, skip farm clearing rows 22-27
  { tx: 0.4, ty: 1.5 }, { tx: 1.8, ty: 0.8 }, { tx: 3.2, ty: 1.6 },
  { tx: 5.1, ty: 0.4 }, { tx: 7.3, ty: 1.2 }, { tx: 9.0, ty: 0.7 }, { tx: 10.5, ty: 1.9 },
  { tx: 0.6, ty: 4.5 }, { tx: 2.4, ty: 5.2 }, { tx: 4.8, ty: 4.0 },
  { tx: 6.5, ty: 5.8 }, { tx: 8.3, ty: 4.7 }, { tx: 10.1, ty: 5.1 },
  { tx: 0.3, ty: 13.8 }, { tx: 2.1, ty: 14.4 }, { tx: 4.4, ty: 13.5 },
  { tx: 6.2, ty: 14.6 }, { tx: 8.7, ty: 13.8 }, { tx: 10.4, ty: 14.2 },
  { tx: 0.7, ty: 17.2 }, { tx: 2.6, ty: 18.0 }, { tx: 4.4, ty: 17.5 },
  { tx: 7.1, ty: 18.3 }, { tx: 9.3, ty: 17.8 }, { tx: 10.8, ty: 18.6 },
  { tx: 0.5, ty: 28.4 }, { tx: 2.8, ty: 29.2 }, { tx: 5.2, ty: 28.0 },
  { tx: 7.6, ty: 29.5 }, { tx: 9.6, ty: 28.3 }, { tx: 11.0, ty: 29.8 },
  // Cottage garden area — trees framing the home zone
  { tx: 14.5, ty: 1.5 }, { tx: 16.2, ty: 0.8 }, { tx: 18.0, ty: 2.3 },
  { tx: 22.5, ty: 0.4 }, { tx: 24.2, ty: 1.8 },
  { tx: 46.5, ty: 1.2 }, { tx: 48.1, ty: 0.6 }, { tx: 50.4, ty: 1.5 },
  { tx: 52.2, ty: 0.9 }, { tx: 54.0, ty: 1.4 },
];
