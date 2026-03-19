import { useEffect, useRef } from 'react';
import {
  TILE_SIZE, MAP_W, MAP_H, TILE, TILE_COLOR, WALKABLE, RODS, ORES, HERBS, randInt, SEEDS,
} from './gameData';
import { playSwimSplash } from './soundManager';
import {
  MAP_TILES, FISHING_CHAIRS, MINE_ENTRANCE,
  PLAYER_START_X, PLAYER_START_Y, pickOre, pickHerb,
  COOKING_TX, COOKING_TY, DOOR_TRIGGERS,
} from './mapData';

const PW = 18;
const PH = 26;
const MAX_SPEED = 3.5;
const FRICTION = 0.80;
const ACCEL = 0.5;

// ── Pure draw helpers (outside component, no React deps) ──────────────────────

function getTile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return TILE.WATER;
  return MAP_TILES[ty][tx];
}

function canWalk(x, y, hasMarine = false) {
  const hw = PW / 2 - 1, hh = PH / 2 - 1;
  const ok = (cx, cy) => {
    const tile = getTile(Math.floor(cx / TILE_SIZE), Math.floor(cy / TILE_SIZE));
    if (hasMarine && tile === TILE.WATER) return true; // marine gear allows water
    return WALKABLE[tile] ?? false;
  };
  return ok(x - hw, y - hh) && ok(x + hw, y - hh) && ok(x - hw, y + hh) && ok(x + hw, y + hh);
}

function drawTile(ctx, tx, ty, sx, sy) {
  const t = getTile(tx, ty);
  const now = Date.now();

  if (t === TILE.GRASS) {
    const v = ((tx * 7 + ty * 13) % 8) / 8;
    const r = 52 + Math.floor(v * 14);
    const g = 105 + Math.floor(v * 28);
    const b = 38 + Math.floor(v * 12);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Subtle grass tufts
    if ((tx * 3 + ty * 7) % 6 === 0) {
      ctx.fillStyle = `rgba(70,145,50,0.45)`;
      const gx = sx + ((tx * 11) % 20) + 4, gy = sy + ((ty * 13) % 16) + 7;
      ctx.fillRect(gx, gy, 2, 7); ctx.fillRect(gx + 4, gy + 2, 2, 5);
    }
  } else if (t === TILE.WATER) {
    const wave1 = Math.sin(now / 900 + tx * 0.6 + ty * 0.4);
    const b = 155 + Math.floor(wave1 * 18);
    ctx.fillStyle = `rgb(18,72,${b})`;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Horizontal shimmer band
    const waveY = sy + TILE_SIZE * 0.45 + Math.sin(now / 700 + tx * 0.5) * 4;
    ctx.fillStyle = 'rgba(160,220,255,0.10)';
    ctx.fillRect(sx + 2, waveY, TILE_SIZE - 4, 3);
    // Sparkle
    if (((Math.floor(now / 450) + tx * 3 + ty * 5)) % 9 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.40)';
      ctx.beginPath();
      ctx.arc(sx + (tx * 9 % 22) + 5, sy + (ty * 11 % 18) + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (t === TILE.PATH) {
    ctx.fillStyle = '#c8aa72';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    const stW = TILE_SIZE / 2, offX = (ty % 2 === 0) ? 0 : stW / 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 1;
    for (let i = -1; i <= 2; i++) ctx.strokeRect(sx + offX + i * stW, sy, stW, TILE_SIZE);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(sx + 3, sy + 2, TILE_SIZE - 6, 3);
  } else if (t === TILE.SAND) {
    const v = ((tx * 5 + ty * 9) % 6) / 6;
    ctx.fillStyle = `rgb(${198 + Math.floor(v * 22)},${168 + Math.floor(v * 18)},${88 + Math.floor(v * 22)})`;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
  } else if (t === TILE.STONE) {
    const v = ((tx * 11 + ty * 7) % 6) / 6;
    ctx.fillStyle = `rgb(${98 + Math.floor(v * 22)},${92 + Math.floor(v * 20)},${88 + Math.floor(v * 18)})`;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
  } else if (t === TILE.WOOD) {
    ctx.fillStyle = '#a07840';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy + TILE_SIZE / 3); ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE / 3);
    ctx.moveTo(sx, sy + TILE_SIZE * 2 / 3); ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE * 2 / 3);
    ctx.stroke();
  } else if (t === TILE.FOREST) {
    // Dark green forest floor
    const v = ((tx * 5 + ty * 11) % 8) / 8;
    const r = 30 + Math.floor(v * 12);
    const g = 72 + Math.floor(v * 20);
    const b = 22 + Math.floor(v * 10);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Occasional small tree / bush indicator
    const seed = tx * 17 + ty * 31;
    if (seed % 5 === 0) {
      // Small circular canopy
      const cx2 = sx + (seed % 20) + 6;
      const cy2 = sy + ((seed >> 2) % 16) + 6;
      ctx.fillStyle = `rgba(28,68,18,0.70)`;
      ctx.beginPath(); ctx.arc(cx2, cy2, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(50,100,30,0.50)`;
      ctx.beginPath(); ctx.arc(cx2 - 3, cy2 - 2, 5, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    ctx.fillStyle = TILE_COLOR[t] ?? '#333';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
  }
}

function drawShopBuilding(ctx, camX, camY) {
  const bx = 1 * TILE_SIZE - camX;
  const by = 1 * TILE_SIZE - camY;
  const bw = 9 * TILE_SIZE;
  const bh = 10 * TILE_SIZE;
  const cx = bx + bw / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(bx + 8, by + 8, bw, bh);

  // Wall — warm cream with wood panelling
  ctx.fillStyle = '#f0e2c0';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#d9c9a0';
  ctx.fillRect(bx, by + bh * 0.45, bw, bh * 0.55); // lower half slightly darker

  // Horizontal timber beams
  ctx.fillStyle = '#8b5e30';
  [0.44, 0.72].forEach(r => ctx.fillRect(bx, by + bh * r, bw, 7));
  // Vertical timber posts
  ctx.fillStyle = '#7a5028';
  [0, 1/3, 2/3, 1].forEach(r => ctx.fillRect(bx + bw * r - (r > 0 ? 4 : 0), by, 8, bh));

  // ── Roof ──
  ctx.fillStyle = '#5c2a0e';
  ctx.beginPath();
  ctx.moveTo(bx - 14, by + 2);
  ctx.lineTo(cx, by - 75);
  ctx.lineTo(bx + bw + 14, by + 2);
  ctx.closePath();
  ctx.fill();
  // Roof shingles
  for (let row = 0; row < 5; row++) {
    const t = row / 5;
    const rowY = by - 75 + row * 15 + t * 2;
    const half = (bw / 2 + 14) * t + 6;
    const count = Math.ceil(half * 2 / 16);
    ctx.fillStyle = row % 2 === 0 ? '#4a2008' : '#3e1a06';
    for (let c = 0; c < count; c++) {
      const sx2 = cx - half + c * 16 + (row % 2 ? 8 : 0);
      ctx.fillRect(sx2, rowY, 14, 14);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.8;
      ctx.strokeRect(sx2, rowY, 14, 14);
    }
  }
  // Roof ridge cap
  ctx.fillStyle = '#c07828';
  ctx.fillRect(bx - 16, by - 3, bw + 32, 8);
  ctx.fillStyle = '#ffcc66';
  ctx.fillRect(bx - 16, by - 3, bw + 32, 3);

  // ── Left window ──
  const lw = { x: bx + 38, y: by + 55, w: 52, h: 44 };
  // Glow
  const gl = ctx.createRadialGradient(lw.x + lw.w/2, lw.y + lw.h/2, 4, lw.x + lw.w/2, lw.y + lw.h/2, 40);
  gl.addColorStop(0, 'rgba(255,210,80,0.35)'); gl.addColorStop(1, 'rgba(255,210,80,0)');
  ctx.fillStyle = gl; ctx.fillRect(lw.x - 10, lw.y - 10, lw.w + 20, lw.h + 20);
  ctx.fillStyle = '#ffe89a'; ctx.fillRect(lw.x, lw.y, lw.w, lw.h);
  ctx.strokeStyle = '#7a4a18'; ctx.lineWidth = 4; ctx.strokeRect(lw.x, lw.y, lw.w, lw.h);
  ctx.strokeStyle = '#8b5e30'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lw.x + lw.w/2, lw.y); ctx.lineTo(lw.x + lw.w/2, lw.y + lw.h);
  ctx.moveTo(lw.x, lw.y + lw.h/2); ctx.lineTo(lw.x + lw.w, lw.y + lw.h/2);
  ctx.stroke();
  // Flower box
  ctx.fillStyle = '#7a4a18'; ctx.fillRect(lw.x - 4, lw.y + lw.h, lw.w + 8, 12);
  [['#ff7090',4], ['#ffcc44',14], ['#ff90b0',24], ['#88ddaa',34], ['#aaccff',44]].forEach(([c, o]) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(lw.x + 4 + o, lw.y + lw.h + 5, 5, 0, Math.PI * 2); ctx.fill();
  });

  // ── Right window ──
  const rw = { x: bx + bw - 90, y: by + 55, w: 52, h: 44 };
  const gr = ctx.createRadialGradient(rw.x + rw.w/2, rw.y + rw.h/2, 4, rw.x + rw.w/2, rw.y + rw.h/2, 40);
  gr.addColorStop(0, 'rgba(255,210,80,0.35)'); gr.addColorStop(1, 'rgba(255,210,80,0)');
  ctx.fillStyle = gr; ctx.fillRect(rw.x - 10, rw.y - 10, rw.w + 20, rw.h + 20);
  ctx.fillStyle = '#ffe89a'; ctx.fillRect(rw.x, rw.y, rw.w, rw.h);
  ctx.strokeStyle = '#7a4a18'; ctx.lineWidth = 4; ctx.strokeRect(rw.x, rw.y, rw.w, rw.h);
  ctx.strokeStyle = '#8b5e30'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rw.x + rw.w/2, rw.y); ctx.lineTo(rw.x + rw.w/2, rw.y + rw.h);
  ctx.moveTo(rw.x, rw.y + rw.h/2); ctx.lineTo(rw.x + rw.w, rw.y + rw.h/2);
  ctx.stroke();
  ctx.fillStyle = '#7a4a18'; ctx.fillRect(rw.x - 4, rw.y + rw.h, rw.w + 8, 12);
  [['#88aaff',4], ['#ff7090',14], ['#ffcc44',24], ['#ff90b0',34], ['#aaffcc',44]].forEach(([c, o]) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(rw.x + 4 + o, rw.y + rw.h + 5, 5, 0, Math.PI * 2); ctx.fill();
  });

  // ── Door ──
  const dw = 50, dh = 65, dx = cx - dw / 2, dy = by + bh - dh;
  ctx.fillStyle = '#5a2a08'; ctx.fillRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#8b5020'; ctx.lineWidth = 3;
  ctx.strokeRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0); ctx.stroke();
  // Door panels
  ctx.strokeStyle = 'rgba(255,200,100,0.2)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(dx + 6, dy + 8, dw - 12, dh * 0.4);
  ctx.strokeRect(dx + 6, dy + dh * 0.5, dw - 12, dh * 0.4);
  // Knob
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(dx + dw - 10, dy + dh / 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#cc9900'; ctx.lineWidth = 1; ctx.stroke();

  // ── Hanging sign ──
  const sw = 110, sh = 32, sy2 = by - 28 - sh;
  ctx.strokeStyle = '#8b5e30'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - sw/2 + 12, by - 48); ctx.lineTo(cx - sw/2 + 12, sy2 + sh);
  ctx.moveTo(cx + sw/2 - 12, by - 48); ctx.lineTo(cx + sw/2 - 12, sy2 + sh);
  ctx.stroke();
  ctx.fillStyle = '#c47828';
  ctx.beginPath(); ctx.roundRect(cx - sw/2, sy2, sw, sh, 7); ctx.fill();
  ctx.strokeStyle = '#8b5020'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#fff8e8'; ctx.font = 'bold 14px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🏪 상점', cx, sy2 + sh * 0.68);
}

function drawBankBuilding(ctx, camX, camY) {
  const bx = 1 * TILE_SIZE - camX;
  const by = 14 * TILE_SIZE - camY;
  const bw = 9 * TILE_SIZE;
  const bh = 4 * TILE_SIZE;
  const cx = bx + bw / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(bx + 6, by + 6, bw, bh);

  // Main wall — stone grey-blue
  ctx.fillStyle = '#c8d0d8';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#b8c0c8';
  ctx.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);

  // Horizontal stone lines
  ctx.strokeStyle = '#a8b0b8'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(bx, by + bh * i / 4); ctx.lineTo(bx + bw, by + bh * i / 4);
    ctx.stroke();
  }
  // Vertical stone lines
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + bw * i / 5, by); ctx.lineTo(bx + bw * i / 5, by + bh);
    ctx.stroke();
  }

  // ── Columns ──
  const colPositions = [bx + 28, bx + bw / 2 - 14, bx + bw / 2 + 14, bx + bw - 44];
  for (const colX of colPositions) {
    // Column base
    ctx.fillStyle = '#d8dce4';
    ctx.fillRect(colX, by, 16, bh);
    // Column highlight
    ctx.fillStyle = '#eef0f4';
    ctx.fillRect(colX + 2, by, 4, bh);
    // Capital and base
    ctx.fillStyle = '#b0b8c0';
    ctx.fillRect(colX - 4, by, 24, 8);
    ctx.fillRect(colX - 4, by + bh - 8, 24, 8);
  }

  // ── Pediment (triangular top) ──
  ctx.fillStyle = '#d8dce4';
  ctx.beginPath();
  ctx.moveTo(bx - 8, by);
  ctx.lineTo(cx, by - 44);
  ctx.lineTo(bx + bw + 8, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8b0b8'; ctx.lineWidth = 2; ctx.stroke();
  // Pediment inner triangle
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.moveTo(bx + 20, by - 2);
  ctx.lineTo(cx, by - 36);
  ctx.lineTo(bx + bw - 20, by - 2);
  ctx.closePath();
  ctx.fill();

  // ── Entablature ──
  ctx.fillStyle = '#b0b8c0';
  ctx.fillRect(bx - 8, by, bw + 16, 10);

  // ── Vault door ──
  const dw = 52, dh = 52, dx = cx - dw / 2, dy = by + bh - dh;
  ctx.fillStyle = '#5a6a7a';
  ctx.fillRect(dx, dy, dw, dh);
  // Vault arch
  ctx.fillStyle = '#4a5a6a';
  ctx.beginPath();
  ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0);
  ctx.fill();
  // Vault door frame
  ctx.strokeStyle = '#8a9aaa'; ctx.lineWidth = 3;
  ctx.strokeRect(dx, dy, dw, dh);
  // Vault wheel (decorative)
  ctx.strokeStyle = '#aabbcc'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(dx + dw / 2, dy + dh * 0.6, 12, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(dx + dw / 2, dy + dh * 0.6);
    ctx.lineTo(dx + dw / 2 + Math.cos(a) * 12, dy + dh * 0.6 + Math.sin(a) * 12);
    ctx.stroke();
  }
  ctx.fillStyle = '#88aacc'; ctx.beginPath(); ctx.arc(dx + dw / 2, dy + dh * 0.6, 4, 0, Math.PI * 2); ctx.fill();

  // ── Left window ──
  const lw = { x: bx + 18, y: by + bh * 0.18, w: 44, h: 38 };
  ctx.fillStyle = '#aaddff'; ctx.fillRect(lw.x, lw.y, lw.w, lw.h);
  const gwl = ctx.createRadialGradient(lw.x + lw.w/2, lw.y + lw.h/2, 2, lw.x + lw.w/2, lw.y + lw.h/2, 28);
  gwl.addColorStop(0, 'rgba(180,230,255,0.5)'); gwl.addColorStop(1, 'rgba(100,180,255,0)');
  ctx.fillStyle = gwl; ctx.fillRect(lw.x - 8, lw.y - 8, lw.w + 16, lw.h + 16);
  ctx.strokeStyle = '#6688aa'; ctx.lineWidth = 3; ctx.strokeRect(lw.x, lw.y, lw.w, lw.h);
  ctx.strokeStyle = '#7799bb'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lw.x + lw.w/2, lw.y); ctx.lineTo(lw.x + lw.w/2, lw.y + lw.h);
  ctx.moveTo(lw.x, lw.y + lw.h/2); ctx.lineTo(lw.x + lw.w, lw.y + lw.h/2);
  ctx.stroke();

  // ── Right window ──
  const rw = { x: bx + bw - 18 - 44, y: by + bh * 0.18, w: 44, h: 38 };
  ctx.fillStyle = '#aaddff'; ctx.fillRect(rw.x, rw.y, rw.w, rw.h);
  const gwr = ctx.createRadialGradient(rw.x + rw.w/2, rw.y + rw.h/2, 2, rw.x + rw.w/2, rw.y + rw.h/2, 28);
  gwr.addColorStop(0, 'rgba(180,230,255,0.5)'); gwr.addColorStop(1, 'rgba(100,180,255,0)');
  ctx.fillStyle = gwr; ctx.fillRect(rw.x - 8, rw.y - 8, rw.w + 16, rw.h + 16);
  ctx.strokeStyle = '#6688aa'; ctx.lineWidth = 3; ctx.strokeRect(rw.x, rw.y, rw.w, rw.h);
  ctx.strokeStyle = '#7799bb'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rw.x + rw.w/2, rw.y); ctx.lineTo(rw.x + rw.w/2, rw.y + rw.h);
  ctx.moveTo(rw.x, rw.y + rw.h/2); ctx.lineTo(rw.x + rw.w, rw.y + rw.h/2);
  ctx.stroke();

  // ── Hanging sign ──
  const sw = 100, sh = 28, sy2 = by - 52;
  ctx.strokeStyle = '#6688aa'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 30, by - 6); ctx.lineTo(cx - 30, sy2 + sh);
  ctx.moveTo(cx + 30, by - 6); ctx.lineTo(cx + 30, sy2 + sh);
  ctx.stroke();
  ctx.fillStyle = '#4466aa';
  ctx.beginPath(); ctx.roundRect(cx - sw/2, sy2, sw, sh, 6); ctx.fill();
  ctx.strokeStyle = '#2244aa'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🏦 은행', cx, sy2 + sh * 0.70);
}

function drawChair(ctx, sx, sy, occupied) {
  const cx = sx + TILE_SIZE / 2;
  const col = occupied ? '#4a2008' : '#7a4a20';
  const back = occupied ? '#3a1408' : '#6a3a18';
  // Legs
  ctx.fillStyle = back;
  ctx.fillRect(sx + 4, sy + 16, 5, 14); ctx.fillRect(sx + TILE_SIZE - 9, sy + 16, 5, 14);
  // Seat
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.roundRect(sx + 3, sy + 13, TILE_SIZE - 6, 10, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.stroke();
  // Backrest
  ctx.fillStyle = back;
  ctx.beginPath(); ctx.roundRect(sx + 4, sy + 2, TILE_SIZE - 8, 12, 4); ctx.fill();
  // Backrest cushion
  ctx.fillStyle = occupied ? '#220808' : '#5a2a10';
  ctx.beginPath(); ctx.roundRect(sx + 7, sy + 4, TILE_SIZE - 14, 8, 3); ctx.fill();
  // Armrests
  ctx.fillStyle = col;
  ctx.fillRect(sx + 1, sy + 11, 5, 5); ctx.fillRect(sx + TILE_SIZE - 6, sy + 11, 5, 5);

  if (occupied) {
    ctx.fillStyle = 'rgba(255,80,80,0.75)';
    ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('사용중', cx, sy + 1);
  }
}

function drawFishingSign(ctx, sx, sy) {
  const boardW = 108, boardH = 58;
  const bx = sx - boardW / 2, by = sy - boardH - 10;

  // Post (rounded wood)
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(sx - 5, by + boardH, 10, 30);
  ctx.fillStyle = '#6a4220';
  ctx.fillRect(sx - 3, by + boardH, 6, 30);

  // Board shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, boardW, boardH, 8); ctx.fill();

  // Board body — teal green cottage style
  ctx.fillStyle = '#2d6845';
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, boardH, 8); ctx.fill();
  ctx.strokeStyle = '#5aaa78'; ctx.lineWidth = 2.5; ctx.stroke();

  // Top accent stripe
  ctx.fillStyle = '#4ec87a';
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, 6, [8, 8, 0, 0]); ctx.fill();

  // Title
  ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8ffe8';
  ctx.fillText('🎣 낚시터', sx, by + 24);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx + 12, by + 30); ctx.lineTo(bx + boardW - 12, by + 30); ctx.stroke();

  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(200,255,210,0.75)';
  ctx.fillText('의자에 앉아 !낚시', sx, by + 43);
  ctx.fillText('방향키로 취소', sx, by + 55);
}

// Farm plot grid: 3 cols × 2 rows within the farm zone (cols 30-38, rows 14-17)
const FARM_PLOT_POSITIONS = [
  { tx: 31, ty: 14 }, { tx: 33, ty: 14 }, { tx: 35, ty: 14 },
  { tx: 31, ty: 16 }, { tx: 33, ty: 16 }, { tx: 35, ty: 16 },
];

function drawCrop(ctx, wx, wy, pct, isReady, seedKey) {
  const cx = wx + TILE_SIZE / 2;
  const cy = wy + TILE_SIZE / 2;
  const now = Date.now();

  // Soil patch
  ctx.fillStyle = '#8a5c2a';
  ctx.beginPath(); ctx.ellipse(cx, wy + TILE_SIZE - 5, 11, 6, 0, 0, Math.PI * 2); ctx.fill();

  if (pct < 0.1) {
    // Just planted — tiny bump
    ctx.fillStyle = '#6aaa44';
    ctx.beginPath(); ctx.arc(cx, wy + TILE_SIZE - 10, 3, 0, Math.PI * 2); ctx.fill();
    return;
  }

  const h = Math.min(20, Math.round(pct * 20));
  const stemY = wy + TILE_SIZE - 8;

  // Stem
  ctx.strokeStyle = '#4a8a28';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, stemY); ctx.lineTo(cx, stemY - h); ctx.stroke();

  if (pct < 0.5) {
    // Small leaves
    ctx.fillStyle = '#5aaa38';
    ctx.beginPath(); ctx.ellipse(cx - 5, stemY - h * 0.5, 5, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 5, stemY - h * 0.7, 5, 3, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (!isReady) {
    // Grown leaves
    ctx.fillStyle = '#48b030';
    ctx.beginPath(); ctx.ellipse(cx - 7, stemY - h * 0.6, 7, 4, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 7, stemY - h * 0.8, 7, 4, 0.5, 0, Math.PI * 2); ctx.fill();
    // Small bud
    const budColor = seedKey === '황금씨앗' ? '#ffdd00' : seedKey === '약초씨앗' ? '#88ee44' : '#ff8844';
    ctx.fillStyle = budColor;
    ctx.beginPath(); ctx.arc(cx, stemY - h, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    // Ready — full bloom + golden glow
    const pulse = 0.85 + 0.15 * Math.sin(now / 400);
    const glow = ctx.createRadialGradient(cx, stemY - h, 0, cx, stemY - h, 14 * pulse);
    glow.addColorStop(0, 'rgba(255,240,80,0.5)'); glow.addColorStop(1, 'rgba(255,240,80,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, stemY - h, 14 * pulse, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#44cc22';
    ctx.beginPath(); ctx.ellipse(cx - 8, stemY - h * 0.65, 8, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 8, stemY - h * 0.85, 8, 5, 0.5, 0, Math.PI * 2); ctx.fill();

    const fruitColor = seedKey === '황금씨앗' ? '#ffdd00' : seedKey === '약초씨앗' ? '#88ee44' : seedKey === '당근씨앗' ? '#ff7722' : seedKey === '밀씨앗' ? '#ddb84a' : '#cc4444';
    ctx.fillStyle = fruitColor;
    ctx.beginPath(); ctx.arc(cx, stemY - h, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

    // "수확!" label
    ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2.5;
    ctx.strokeText('수확!', cx, wy + 4);
    ctx.fillText('수확!', cx, wy + 4);
  }
}

function drawGoldenPondSign(ctx, sx, sy) {
  const boardW = 104, boardH = 46;
  const bx = sx - boardW / 2, by = sy - boardH - 8;
  const now = Date.now();

  ctx.fillStyle = '#5a4010';
  ctx.fillRect(sx - 4, by + boardH, 8, 22);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.roundRect(bx + 3, by + 3, boardW, boardH, 7); ctx.fill();

  // Glowing golden background
  const pulse = 0.8 + 0.2 * Math.sin(now / 600);
  const grad = ctx.createLinearGradient(bx, by, bx + boardW, by + boardH);
  grad.addColorStop(0, `rgba(180,120,0,${pulse})`);
  grad.addColorStop(0.5, `rgba(220,160,0,${pulse})`);
  grad.addColorStop(1, `rgba(180,120,0,${pulse})`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, boardH, 7); ctx.fill();
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.stroke();

  ctx.fillStyle = '#fff8cc';
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, 5, [7, 7, 0, 0]); ctx.fill();

  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff8cc';
  ctx.fillText('✨ 황금 연못', sx, by + 20);

  ctx.strokeStyle = 'rgba(255,255,200,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx + 10, by + 26); ctx.lineTo(bx + boardW - 10, by + 26); ctx.stroke();

  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(255,248,160,0.8)';
  ctx.fillText('낚시 G1↑ 또는 비밀낚시터 탐험 필요', sx, by + 38);
}

function drawFreshwaterSign(ctx, sx, sy) {
  const boardW = 96, boardH = 46;
  const bx = sx - boardW / 2, by = sy - boardH - 8;

  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(sx - 4, by + boardH, 8, 24);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.roundRect(bx + 3, by + 3, boardW, boardH, 7); ctx.fill();

  ctx.fillStyle = '#1a5a88';
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, boardH, 7); ctx.fill();
  ctx.strokeStyle = '#44aadd'; ctx.lineWidth = 2; ctx.stroke();

  ctx.fillStyle = '#66ccff';
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, 5, [7, 7, 0, 0]); ctx.fill();

  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e0f8ff';
  ctx.fillText('🌊 민물 낚시터', sx, by + 20);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx + 10, by + 26); ctx.lineTo(bx + boardW - 10, by + 26); ctx.stroke();

  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(180,240,255,0.75)';
  ctx.fillText('의자에 앉아 !낚시', sx, by + 38);
}

function drawCookingBuilding(ctx, camX, camY) {
  const bx = COOKING_TX * TILE_SIZE - camX - 2 * TILE_SIZE;
  const by = COOKING_TY * TILE_SIZE - camY - 8 * TILE_SIZE;
  const bw = 8 * TILE_SIZE;
  const bh = 8 * TILE_SIZE;
  const cx = bx + bw / 2;
  const now = Date.now();

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(bx + 8, by + 8, bw, bh);

  // ── Chimney (behind roof) ──
  ctx.fillStyle = '#8a5030';
  ctx.fillRect(bx + bw * 0.65 - 12, by - 45, 24, 55);
  ctx.fillStyle = '#6a3a20';
  ctx.fillRect(bx + bw * 0.65 - 14, by - 48, 28, 10);
  // Chimney smoke puffs
  for (let i = 0; i < 3; i++) {
    const t = (now / 1200 + i * 0.33) % 1;
    const smokeX = bx + bw * 0.65 + Math.sin(t * 4) * 6;
    const smokeY = by - 48 - t * 40;
    const smokeR = 5 + t * 8;
    ctx.fillStyle = `rgba(200,190,180,${0.45 - t * 0.45})`;
    ctx.beginPath(); ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2); ctx.fill();
  }

  // Wall — warm terracotta
  ctx.fillStyle = '#e8c8a0';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#d4b080';
  ctx.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);

  // Timber frame
  ctx.fillStyle = '#7a4828';
  [0.49].forEach(r => ctx.fillRect(bx, by + bh * r, bw, 7));
  [0, 1/3, 2/3, 1].forEach(r => ctx.fillRect(bx + bw * r - (r > 0 ? 4 : 0), by, 8, bh));

  // ── Roof ──
  ctx.fillStyle = '#6a2808';
  ctx.beginPath();
  ctx.moveTo(bx - 12, by + 2);
  ctx.lineTo(cx, by - 62);
  ctx.lineTo(bx + bw + 12, by + 2);
  ctx.closePath(); ctx.fill();
  // Shingles
  for (let row = 0; row < 4; row++) {
    const t = row / 4;
    const rowY = by - 62 + row * 16;
    const half = (bw / 2 + 12) * t + 5;
    ctx.fillStyle = row % 2 === 0 ? '#581e06' : '#4c1604';
    for (let c = 0; c < Math.ceil(half * 2 / 16); c++) {
      const sx2 = cx - half + c * 16 + (row % 2 ? 8 : 0);
      ctx.fillRect(sx2, rowY, 14, 14);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.8;
      ctx.strokeRect(sx2, rowY, 14, 14);
    }
  }
  ctx.fillStyle = '#d0641e';
  ctx.fillRect(bx - 14, by - 3, bw + 28, 8);
  ctx.fillStyle = '#ffaa55';
  ctx.fillRect(bx - 14, by - 3, bw + 28, 3);

  // ── Windows (warmer orange glow — fire inside) ──
  const winColor = `rgba(255,${160 + Math.floor(Math.sin(now / 400) * 20)},40,0.9)`;
  [{ x: bx + 18, y: by + 38 }, { x: bx + bw - 50, y: by + 38 }].forEach(w => {
    const gw = ctx.createRadialGradient(w.x + 16, w.y + 12, 2, w.x + 16, w.y + 12, 32);
    gw.addColorStop(0, 'rgba(255,160,40,0.4)'); gw.addColorStop(1, 'rgba(255,100,20,0)');
    ctx.fillStyle = gw; ctx.fillRect(w.x - 8, w.y - 8, 50, 44);
    ctx.fillStyle = winColor; ctx.fillRect(w.x, w.y, 32, 28);
    ctx.strokeStyle = '#7a3818'; ctx.lineWidth = 3; ctx.strokeRect(w.x, w.y, 32, 28);
    ctx.strokeStyle = '#8b5020'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w.x + 16, w.y); ctx.lineTo(w.x + 16, w.y + 28);
    ctx.moveTo(w.x, w.y + 14); ctx.lineTo(w.x + 32, w.y + 14);
    ctx.stroke();
  });

  // ── Door ──
  const dw = 44, dh = 58, dx = cx - dw/2, dy = by + bh - dh;
  ctx.fillStyle = '#4a1e08'; ctx.fillRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy, dw/2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#8b4414'; ctx.lineWidth = 3; ctx.strokeRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy, dw/2, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(dx + dw - 9, dy + dh/2, 3, 0, Math.PI*2); ctx.fill();

  // ── Sign ──
  const sw = 100, sh = 30;
  ctx.strokeStyle = '#8b5e30'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - sw/2 + 10, by - 42); ctx.lineTo(cx - sw/2 + 10, by - 24 - sh);
  ctx.moveTo(cx + sw/2 - 10, by - 42); ctx.lineTo(cx + sw/2 - 10, by - 24 - sh);
  ctx.stroke();
  ctx.fillStyle = '#cc5510';
  ctx.beginPath(); ctx.roundRect(cx - sw/2, by - 24 - sh, sw, sh, 6); ctx.fill();
  ctx.strokeStyle = '#8b3a08'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#fff8e8'; ctx.font = 'bold 13px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🍳 요리소', cx, by - 24 - sh + sh * 0.68);
}

function drawInnBuilding(ctx, camX, camY) {
  const bx = 20 * TILE_SIZE - camX;
  const by = 1 * TILE_SIZE - camY;
  const bw = 9 * TILE_SIZE;
  const bh = 9 * TILE_SIZE;
  const cx = bx + bw / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(bx + 8, by + 8, bw, bh);

  // Wall — soft lavender
  ctx.fillStyle = '#e8daf0';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#d4c4e0';
  ctx.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);

  // Timber frame
  ctx.fillStyle = '#6a4888';
  [0.48].forEach(r => ctx.fillRect(bx, by + bh * r, bw, 6));
  [0, 1/3, 2/3, 1].forEach(r => ctx.fillRect(bx + bw * r - (r > 0 ? 4 : 0), by, 7, bh));

  // Roof
  ctx.fillStyle = '#5a2878';
  ctx.beginPath();
  ctx.moveTo(bx - 12, by + 2);
  ctx.lineTo(cx, by - 58);
  ctx.lineTo(bx + bw + 12, by + 2);
  ctx.closePath(); ctx.fill();
  // Shingles
  for (let row = 0; row < 4; row++) {
    const t = row / 4;
    const rowY = by - 58 + row * 15;
    const half = (bw / 2 + 12) * t + 5;
    ctx.fillStyle = row % 2 === 0 ? '#481a68' : '#3e1260';
    for (let c = 0; c < Math.ceil(half * 2 / 16); c++) {
      const sx2 = cx - half + c * 16 + (row % 2 ? 8 : 0);
      ctx.fillRect(sx2, rowY, 14, 13);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.7;
      ctx.strokeRect(sx2, rowY, 14, 13);
    }
  }
  ctx.fillStyle = '#9955cc';
  ctx.fillRect(bx - 14, by - 3, bw + 28, 7);
  ctx.fillStyle = '#ddaaff';
  ctx.fillRect(bx - 14, by - 3, bw + 28, 3);

  // Windows
  const now = Date.now();
  const winColor = `rgba(255,240,${180 + Math.floor(Math.sin(now / 600) * 15)},0.9)`;
  [{ x: bx + 18, y: by + 35 }, { x: bx + bw - 50, y: by + 35 }].forEach(w => {
    const gw = ctx.createRadialGradient(w.x + 16, w.y + 14, 2, w.x + 16, w.y + 14, 30);
    gw.addColorStop(0, 'rgba(255,230,100,0.38)'); gw.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = gw; ctx.fillRect(w.x - 8, w.y - 8, 48, 42);
    ctx.fillStyle = winColor; ctx.fillRect(w.x, w.y, 32, 26);
    ctx.strokeStyle = '#6a3888'; ctx.lineWidth = 3; ctx.strokeRect(w.x, w.y, 32, 26);
    ctx.strokeStyle = '#8855aa'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w.x + 16, w.y); ctx.lineTo(w.x + 16, w.y + 26);
    ctx.moveTo(w.x, w.y + 13); ctx.lineTo(w.x + 32, w.y + 13);
    ctx.stroke();
  });

  // Door
  const dw = 44, dh = 56, dx = cx - dw/2, dy2 = by + bh - dh;
  ctx.fillStyle = '#4a1e6a'; ctx.fillRect(dx, dy2, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy2, dw/2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#8844aa'; ctx.lineWidth = 3; ctx.strokeRect(dx, dy2, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy2, dw/2, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(dx + dw - 9, dy2 + dh/2, 3, 0, Math.PI*2); ctx.fill();

  // Sign
  const sw = 100, sh = 30;
  ctx.strokeStyle = '#8855aa'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - sw/2 + 10, by - 38); ctx.lineTo(cx - sw/2 + 10, by - 22 - sh);
  ctx.moveTo(cx + sw/2 - 10, by - 38); ctx.lineTo(cx + sw/2 - 10, by - 22 - sh);
  ctx.stroke();
  ctx.fillStyle = '#7744aa';
  ctx.beginPath(); ctx.roundRect(cx - sw/2, by - 22 - sh, sw, sh, 6); ctx.fill();
  ctx.strokeStyle = '#5522aa'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#fff8ff'; ctx.font = 'bold 13px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🏨 여관', cx, by - 22 - sh + sh * 0.68);
}

function drawFullMap(ctx, W, H, playerX, playerY, otherPlayers, nickname) {
  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(0, 0, W, H);

  const pad = 48;
  const scaleX = (W - pad * 2) / (MAP_W * TILE_SIZE);
  const scaleY = (H - pad * 2) / (MAP_H * TILE_SIZE);
  const sc = Math.min(scaleX, scaleY);
  const OX = Math.round((W - MAP_W * TILE_SIZE * sc) / 2);
  const OY = Math.round((H - MAP_H * TILE_SIZE * sc) / 2);

  const fill = (color, tx1, ty1, tw, th) => {
    ctx.fillStyle = color;
    ctx.fillRect(OX + tx1 * TILE_SIZE * sc, OY + ty1 * TILE_SIZE * sc,
      tw * TILE_SIZE * sc + 0.5, th * TILE_SIZE * sc + 0.5);
  };

  // Zones
  fill('rgba(50,100,40,0.95)',   0,  0, 30, 18);  // grass village
  fill('rgba(28,72,22,0.95)',   30,  0, 15, 19);  // forest
  fill('rgba(80,70,65,0.95)',   45,  0, 25, 23);  // mine
  fill('rgba(180,155,60,0.9)',   0, 18, 45,  3);  // sand beach
  fill('rgba(110,80,15,0.95)',   3, 21, 40,  2);  // dock
  fill('rgba(110,80,15,0.95)',  20, 23, 11,  4);  // deep pier
  fill('rgba(20,70,180,0.95)',   0, 27, 45, 23);  // water
  fill('rgba(20,70,180,0.95)',  45, 23, 25, 27);  // mine water
  fill('rgba(130,105,65,0.9)',   0, 12, 45,  2);  // main path
  fill('rgba(60,35,20,0.95)',    1,  1,  9, 10);  // shop
  fill('rgba(70,25,10,0.95)',   11,  2,  8,  8);  // cooking
  fill('rgba(60,35,20,0.95)',   20,  1,  9,  9);  // inn

  // Map border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(OX, OY, MAP_W * TILE_SIZE * sc, MAP_H * TILE_SIZE * sc);

  // Zone labels
  ctx.font = `bold ${Math.max(10, Math.round(sc * 28))}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  const label = (text, tx, ty) => {
    const lx = OX + tx * TILE_SIZE * sc;
    const ly = OY + ty * TILE_SIZE * sc;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(text, lx, ly);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(text, lx, ly);
  };
  label('🏪 상점',    5,  6);
  label('🍳 요리소', 15,  6);
  label('🏨 여관',   25,  6);
  label('🏦 은행',    5, 17);
  label('🌊 민물',   19, 17);
  label('🌱 농장',   34, 17);
  label('✨ 황금연못', 38, 10);
  label('🌲 숲',     37,  9);
  label('🎣 낚시터', 20, 25);
  label('⛏ 광산',   57, 11);

  // Chairs dots
  for (const c of FISHING_CHAIRS) {
    ctx.fillStyle = '#c8a060';
    ctx.beginPath();
    ctx.arc(OX + (c.tx + 0.5) * TILE_SIZE * sc, OY + (c.ty + 0.5) * TILE_SIZE * sc, Math.max(3, sc * 6), 0, Math.PI * 2);
    ctx.fill();
  }

  // Other players
  for (const op of (otherPlayers ?? [])) {
    const px = OX + op.x * sc, py = OY + op.y * sc;
    ctx.fillStyle = '#00eeee';
    ctx.beginPath();
    ctx.arc(px, py, Math.max(4, sc * 8), 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold ${Math.max(9, Math.round(sc * 22))}px "Noto Sans KR", sans-serif`;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 2;
    ctx.strokeText(op.nickname, px, py - Math.max(6, sc * 12));
    ctx.fillStyle = '#00eeee';
    ctx.fillText(op.nickname, px, py - Math.max(6, sc * 12));
  }

  // Self
  const spx = OX + playerX * sc, spy = OY + playerY * sc;
  ctx.fillStyle = '#ffff44';
  ctx.beginPath();
  ctx.arc(spx, spy, Math.max(5, sc * 10), 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `bold ${Math.max(9, Math.round(sc * 22))}px "Noto Sans KR", sans-serif`;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 2;
  ctx.strokeText(nickname ?? '나', spx, spy - Math.max(8, sc * 14));
  ctx.fillStyle = '#ffff44';
  ctx.fillText(nickname ?? '나', spx, spy - Math.max(8, sc * 14));

  // Title
  ctx.font = 'bold 16px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('🗺 전체 지도', W / 2, OY - 14);

  // Close hint
  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('클릭하여 닫기', W / 2, OY + MAP_H * TILE_SIZE * sc + 20);
}

function drawMinimap(ctx, W, H, camX, camY, playerX, playerY, otherPlayers) {
  const MW = 100, MH = 75;
  const MX = W - MW - 6, MY = 6;
  const sx = MW / (MAP_W * TILE_SIZE);
  const sy = MH / (MAP_H * TILE_SIZE);

  const fill = (color, tx1, ty1, tw, th) => {
    ctx.fillStyle = color;
    ctx.fillRect(MX + tx1 * TILE_SIZE * sx, MY + ty1 * TILE_SIZE * sy, tw * TILE_SIZE * sx + 0.5, th * TILE_SIZE * sy + 0.5);
  };

  // Shadow border
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(MX - 1, MY - 1, MW + 2, MH + 2);

  // Zones
  fill('rgba(50,100,40,0.95)',  0,  0, 30, 18); // grass village
  fill('rgba(28,72,22,0.95)',  30,  0, 15, 19); // forest
  fill('rgba(80,70,65,0.95)',  45,  0, 25, 23); // mine
  fill('rgba(180,155,60,0.9)',  0, 18, 45,  3); // sand
  fill('rgba(110,80,15,0.95)',  3, 21, 40,  2); // dock
  fill('rgba(110,80,15,0.95)', 20, 23, 11,  4); // deep pier
  fill('rgba(20,70,180,0.95)',  0, 27, 45, 23); // water
  fill('rgba(20,70,180,0.95)', 45, 23, 25, 27); // mine water
  fill('rgba(130,105,65,0.9)',  0, 12, 45,  2); // main path
  fill('rgba(60,35,20,0.95)',   1,  1,  9, 10); // shop
  fill('rgba(70,25,10,0.95)',  11,  2,  8,  8); // cooking
  fill('rgba(60,35,20,0.95)',  20,  1,  9,  9); // inn

  // Viewport box
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    MX + camX * sx, MY + camY * sy,
    Math.min(W * sx, MW), Math.min(H * sy, MH)
  );

  // Other players
  for (const op of (otherPlayers ?? [])) {
    ctx.fillStyle = '#00eeee';
    ctx.beginPath();
    ctx.arc(MX + op.x * sx, MY + op.y * sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Self
  ctx.fillStyle = '#ffff44';
  ctx.beginPath();
  ctx.arc(MX + playerX * sx, MY + playerY * sy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(MX, MY, MW, MH);

  // Click hint
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('🗺', MX + MW - 2, MY + MH - 2);
}

function drawMineEntrance(ctx, sx, sy) {
  const ex = sx + TILE_SIZE, ey = sy + TILE_SIZE;
  const ew = 4 * TILE_SIZE, eh = 3.5 * TILE_SIZE;
  const mx = ex + ew / 2;
  const now = Date.now();

  // Rock walls on sides
  for (let i = 0; i < 3; i++) {
    const vy = ((i * 7) % 5) * 8;
    ctx.fillStyle = `rgb(${72 + i*8},${68 + i*6},${62 + i*6})`;
    ctx.fillRect(ex - 14, ey + vy + i * 22, 16, 24);
    ctx.fillRect(ex + ew, ey + vy + i * 22, 16, 24);
  }

  // Cave interior (deep dark)
  ctx.fillStyle = '#06060c';
  ctx.beginPath();
  ctx.moveTo(ex + 6, ey + eh);
  ctx.lineTo(ex + 6, ey + 22);
  ctx.quadraticCurveTo(mx, ey - 14, ex + ew - 6, ey + 22);
  ctx.lineTo(ex + ew - 6, ey + eh);
  ctx.closePath(); ctx.fill();

  // Inner glow (dim lantern light from inside)
  const glow = ctx.createRadialGradient(mx, ey + eh * 0.4, 10, mx, ey + eh * 0.4, 60);
  glow.addColorStop(0, 'rgba(255,160,30,0.18)');
  glow.addColorStop(1, 'rgba(255,160,30,0)');
  ctx.fillStyle = glow; ctx.fill();

  // Wooden arch frame
  ctx.strokeStyle = '#6a4020'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex, ey + eh);
  ctx.lineTo(ex, ey + 20);
  ctx.quadraticCurveTo(mx, ey - 18, ex + ew, ey + 20);
  ctx.lineTo(ex + ew, ey + eh);
  ctx.stroke();
  // Inner arch edge
  ctx.strokeStyle = '#4a2810'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ex + 7, ey + eh);
  ctx.lineTo(ex + 7, ey + 24);
  ctx.quadraticCurveTo(mx, ey - 8, ex + ew - 7, ey + 24);
  ctx.lineTo(ex + ew - 7, ey + eh);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Cross beam
  ctx.fillStyle = '#6a4020';
  ctx.fillRect(ex, ey + 12, ew, 10);
  ctx.fillStyle = '#4a2810';
  ctx.fillRect(ex, ey + 12, ew, 3);

  // Hanging lantern
  const lx = mx, ly = ey + 30;
  const flicker = Math.sin(now / 180) * 0.15 + 0.85;
  // Rope
  ctx.strokeStyle = '#8b6040'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(lx, ey + 12); ctx.lineTo(lx, ly); ctx.stroke();
  // Lantern body
  ctx.fillStyle = `rgba(255,${Math.floor(140 * flicker)},20,${0.9 * flicker})`;
  ctx.beginPath(); ctx.arc(lx, ly + 8, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8b6040'; ctx.lineWidth = 1.5; ctx.stroke();
  // Lantern glow
  const lg = ctx.createRadialGradient(lx, ly + 8, 2, lx, ly + 8, 22);
  lg.addColorStop(0, `rgba(255,160,30,${0.35 * flicker})`);
  lg.addColorStop(1, 'rgba(255,100,0,0)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly + 8, 22, 0, Math.PI * 2); ctx.fill();
  // Cap
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(lx - 6, ly, 12, 4);

  // Pickaxe icon on sign
  const sw = 80, sh = 26, sgy = ey - 42;
  ctx.fillStyle = '#7a5020';
  ctx.beginPath(); ctx.roundRect(mx - sw/2, sgy, sw, sh, 5); ctx.fill();
  ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff8e0'; ctx.font = 'bold 12px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⛏ 광산', mx, sgy + sh * 0.72);
}

// ── Decoration positions (world tile coords) ──────────────────────────────────
const TREE_POSITIONS = [
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

function drawTree(ctx, wx, wy) {
  const now = Date.now();
  const sway = Math.sin(now / 2200 + wx * 0.01) * 2;
  const tx = wx, ty = wy;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(tx, ty + 5, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Trunk
  ctx.fillStyle = '#7a5228';
  ctx.fillRect(tx - 5, ty - 16, 10, 22);
  ctx.fillStyle = '#9a6a38';
  ctx.fillRect(tx - 3, ty - 16, 4, 22);
  // Canopy layers (back → front)
  const canopies = [
    { ox: sway * 0.3,  oy: -30, r: 22, col: '#2d7a3e' },
    { ox: -10 + sway * 0.5, oy: -40, r: 16, col: '#388a4a' },
    { ox: 10 + sway * 0.6,  oy: -42, r: 17, col: '#3a9050' },
    { ox: sway,        oy: -50, r: 14, col: '#44aa5a' },
  ];
  canopies.forEach(({ ox, oy, r, col }) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(tx + ox, ty + oy, r, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.arc(tx + ox - r * 0.2, ty + oy - r * 0.25, r * 0.45, 0, Math.PI * 2); ctx.fill();
  });
}

function drawFlowerPatch(ctx, wx, wy, seed) {
  const colors = ['#ff7098', '#ffcc44', '#ff9ac8', '#88ddff', '#ccaaff', '#ffaa66'];
  for (let i = 0; i < 4; i++) {
    const angle = (seed * 137.5 + i * 90) * Math.PI / 180;
    const dist = 5 + (i * seed % 5);
    const fx = wx + Math.cos(angle) * dist;
    const fy = wy + Math.sin(angle) * dist;
    const col = colors[(seed + i) % colors.length];
    // Stem
    ctx.strokeStyle = '#4a9a30'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, fy + 5); ctx.lineTo(fx, fy); ctx.stroke();
    // Petals
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffc0';
    ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPlayer(ctx, px, py, player, nickname, title, titleColor, hairColor, bodyColor, skinColor, gender, marineGear = null, equippedItems = {}) {
  const { facing, state, activityProgress } = player;
  const isScuba = marineGear === '스쿠버다이빙세트';
  const isBoat = marineGear === '보트';
  const boots = equippedItems.boots ?? '기본신발';
  const ring = equippedItems.ring;
  const necklace = equippedItems.necklace;
  const gatherTool = equippedItems.gatherTool ?? '맨손';
  const pickaxeType = equippedItems.pickaxe ?? '나무곡괭이';
  const isSea = !!(player.seaFishing && marineGear);
  const now = Date.now();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Chibi body ──
  const defaultBodyColor = bodyColor ?? '#5a7aaa';
  let bodyCol, bodyColDark;
  if (isScuba) {
    bodyCol = '#1a3a6a';      // wetsuit dark blue
    bodyColDark = '#08152a';
  } else {
    bodyCol = state === 'fishing' ? '#4a9a60' : state === 'mining' ? '#c47840' : defaultBodyColor;
    bodyColDark = state === 'fishing' ? '#2e7040' : state === 'mining' ? '#8a4e20' : '#3a5280';
  }

  // Scuba O2 tank (draw before body so it appears behind)
  if (isScuba) {
    ctx.fillStyle = '#778899';
    ctx.beginPath(); ctx.roundRect(px - 15, py - 7, 6, 13, 3); ctx.fill();
    ctx.fillStyle = '#99aabb';
    ctx.beginPath(); ctx.roundRect(px - 14, py - 6, 4, 5, 2); ctx.fill();
    ctx.fillStyle = '#555566';
    ctx.beginPath(); ctx.roundRect(px - 13, py - 9, 3, 3, 1); ctx.fill(); // valve
  }

  // Walking legs
  const isMoving = (player.vx !== undefined) ? (Math.abs(player.vx) + Math.abs(player.vy) > 0.2) : false;
  const legSwing = isMoving ? Math.sin(now / 130) * 4 : 0;
  // Shoes / Flippers
  if (isScuba) {
    // Dark blue flippers (wider)
    ctx.fillStyle = '#000077';
    ctx.beginPath(); ctx.ellipse(px - 5, py + 14 + legSwing, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 5, py + 14 - legSwing, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0000aa';
    ctx.beginPath(); ctx.ellipse(px - 10, py + 14 + legSwing, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 10, py + 14 - legSwing, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // Boot color by type
    const bootColors = {
      '기본신발': '#3a2810',
      '빠른신발': '#4488cc',
      '질풍신발': '#cc6622',
    };
    const bootCol = bootColors[boots] ?? '#3a2810';
    ctx.fillStyle = bootCol;
    ctx.beginPath(); ctx.ellipse(px - 5, py + 14 + legSwing, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 5, py + 14 - legSwing, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    // 질풍신발 speed lines
    if (boots === '질풍신발' && isMoving) {
      ctx.strokeStyle = 'rgba(255,200,80,0.65)'; ctx.lineWidth = 1.2;
      for (let li = 0; li < 3; li++) {
        const lx = px - 14 + li * 5;
        ctx.beginPath(); ctx.moveTo(lx, py + 16); ctx.lineTo(lx - 6, py + 14); ctx.stroke();
      }
    }
  }
  // Legs
  ctx.fillStyle = isScuba ? '#0a1a4a' : '#4a5070';
  ctx.beginPath(); ctx.roundRect(px - 8, py + 4, 6, 11 + legSwing * 0.5, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(px + 2, py + 4, 6, 11 - legSwing * 0.5, 3); ctx.fill();

  // Body
  ctx.fillStyle = bodyCol;
  ctx.beginPath(); ctx.roundRect(px - 9, py - 6, 18, 12, 4); ctx.fill();
  // Body highlight
  ctx.fillStyle = isScuba ? 'rgba(100,180,255,0.18)' : 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.roundRect(px - 7, py - 4, 7, 6, 3); ctx.fill();
  // Body shadow
  ctx.fillStyle = bodyColDark;
  ctx.beginPath(); ctx.roundRect(px - 9, py + 2, 18, 4, [0, 0, 4, 4]); ctx.fill();
  // Wetsuit accent stripe
  if (isScuba) {
    ctx.fillStyle = '#0066cc';
    ctx.beginPath(); ctx.roundRect(px - 9, py - 1, 18, 3, 0); ctx.fill();
  }

  // Necklace (drawn over body, below head)
  if (necklace && !isScuba) {
    const necklaceColors = {
      '철반지': null, '청동목걸이': '#cc9944', '수정반지': null, '황금목걸이': '#ffd700',
    };
    const neckCol = necklaceColors[necklace];
    if (neckCol) {
      ctx.strokeStyle = neckCol; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py - 5, 7, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      // Pendant gem
      ctx.fillStyle = necklace === '황금목걸이' ? '#ffd700' : '#88ccff';
      ctx.beginPath(); ctx.arc(px, py + 2, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(px - 0.8, py + 1, 1, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Arms (base, overdrawn by fishing/mining)
  if (state !== 'fishing' && state !== 'mining') {
    ctx.fillStyle = isScuba ? '#1a3a6a' : bodyCol;
    ctx.beginPath(); ctx.roundRect(px - 14, py - 4, 5, 10, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(px + 9, py - 4, 5, 10, 3); ctx.fill();
    ctx.fillStyle = isScuba ? '#000077' : '#f6cc88'; // gloves vs hands
    ctx.beginPath(); ctx.arc(px - 12, py + 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 12, py + 7, 3.5, 0, Math.PI * 2); ctx.fill();
    // Ring sparkle on right hand
    if (ring && !isScuba) {
      const ringColors = { '철반지': '#aaaaaa', '수정반지': '#66aaff', '청동목걸이': null, '황금목걸이': null };
      const ringCol = ringColors[ring];
      if (ringCol) {
        ctx.fillStyle = ringCol;
        ctx.beginPath(); ctx.arc(px + 12, py + 7, 3.5, 0, Math.PI * 2); ctx.fill();
        // Sparkle
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(px + 13, py + 6, 1.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // ── Chibi head ──
  const headY = py - 14;
  const skin = skinColor ?? '#f6cc88';
  const isFemale = gender === 'female';
  // Head
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(px, headY, 12, 0, Math.PI * 2); ctx.fill();
  // Cheek blush (hidden under mask)
  if (!isScuba) {
    ctx.fillStyle = 'rgba(255,120,120,0.38)';
    ctx.beginPath(); ctx.ellipse(px - 8, headY + 3, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 8, headY + 3, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Hair
  const hc = hairColor ?? '#5a3010';
  ctx.fillStyle = hc;
  ctx.beginPath(); ctx.arc(px, headY, 12, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(px - 5, headY - 4, 7, Math.PI, Math.PI * 1.8); ctx.fill();
  ctx.beginPath(); ctx.arc(px + 5, headY - 4, 7, Math.PI * 1.2, 0); ctx.fill();
  if (isFemale && !isScuba && !isBoat) {
    ctx.beginPath(); ctx.arc(px - 14, headY + 2, 5, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 14, headY + 2, 5, Math.PI * 1.5, Math.PI * 0.5); ctx.fill();
    ctx.fillStyle = '#ff88aa';
    ctx.beginPath(); ctx.ellipse(px + 10, headY - 12, 5, 3, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 10, headY - 12, 5, 3, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffaabb';
    ctx.beginPath(); ctx.arc(px + 10, headY - 12, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // Hair highlight
  ctx.fillStyle = 'rgba(255,200,120,0.18)';
  ctx.beginPath(); ctx.arc(px - 3, headY - 8, 5, 0, Math.PI * 2); ctx.fill();

  // Eyes (hidden behind scuba mask)
  if (!isScuba) {
    const ey = headY + 1;
    ctx.fillStyle = '#1a1a1a';
    if (facing === 'up') {
      ctx.beginPath(); ctx.arc(px - 4, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 4, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
    } else if (facing === 'down') {
      ctx.lineWidth = 2; ctx.strokeStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(px - 4, ey + 1, 2.5, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 4, ey + 1, 2.5, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(px - 3, ey - 0.5, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 5, ey - 0.5, 1, 0, Math.PI * 2); ctx.fill();
    } else if (facing === 'right') {
      ctx.beginPath(); ctx.arc(px + 4, ey, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(px + 5.2, ey - 1, 1, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(px - 4, ey, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(px - 2.8, ey - 1, 1, 0, Math.PI * 2); ctx.fill();
    }
    if (facing !== 'up') {
      ctx.strokeStyle = '#9a4820'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(px, headY + 5, 3.5, 0.1, Math.PI - 0.1); ctx.stroke();
    }
  }

  // Scuba diving mask
  if (isScuba) {
    ctx.fillStyle = 'rgba(60,140,255,0.55)';
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 5, 22, 11, 6); ctx.fill();
    ctx.strokeStyle = '#1a2255';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 5, 22, 11, 6); ctx.stroke();
    // Lens reflection
    ctx.fillStyle = 'rgba(200,235,255,0.45)';
    ctx.beginPath(); ctx.roundRect(px - 9, headY - 3, 6, 4, 3); ctx.fill();
    // Mask strap
    ctx.strokeStyle = '#1a2255'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px - 11, headY + 1); ctx.lineTo(px - 14, headY + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 11, headY + 1); ctx.lineTo(px + 14, headY + 1); ctx.stroke();
    // Regulator mouthpiece
    ctx.fillStyle = '#99aabb';
    ctx.beginPath(); ctx.roundRect(px - 4, headY + 5, 8, 4, 2); ctx.fill();
  }

  // Captain hat for boat
  if (isBoat) {
    ctx.fillStyle = '#1a2a50';
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 22, 22, 10, [4, 4, 0, 0]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(px - 14, headY - 13, 28, 4, 2); ctx.fill(); // brim
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 14, 22, 2, 0); ctx.fill(); // white band
    ctx.font = 'bold 7px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('⚓', px, headY - 16); // anchor emblem
  }

  // ── Fishing animation ──
  if (state === 'fishing' || state === 'bite') {
    const t = now / 1000;

    if (isSea && isScuba) {
      // Scuba: rod points downward, line sinks into sea
      const armX = px + 10, armY = py;
      const rodEndX = armX + 3;
      const rodEndY = py + 26 + Math.sin(t * 1.2) * 2;

      // Arm reaching down
      ctx.fillStyle = '#1a3a6a';
      ctx.beginPath(); ctx.roundRect(px + 9, py - 2, 5, 14, 3); ctx.fill();
      ctx.fillStyle = '#000077';
      ctx.beginPath(); ctx.arc(px + 12, py + 13, 3.5, 0, Math.PI * 2); ctx.fill();

      // Rod angled down
      ctx.strokeStyle = '#7a5020'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(armX, armY);
      ctx.quadraticCurveTo(armX + 5, py + 14, rodEndX, rodEndY);
      ctx.stroke();
      ctx.fillStyle = '#c89040';
      ctx.beginPath(); ctx.arc(rodEndX, rodEndY, 2, 0, Math.PI * 2); ctx.fill();

      // Line going straight down
      const hookY = rodEndY + 20 + Math.sin(t * 0.8) * 3;
      ctx.strokeStyle = 'rgba(200,220,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rodEndX, rodEndY); ctx.lineTo(rodEndX + 1, hookY); ctx.stroke();
      // Hook
      ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(rodEndX + 1, hookY + 3, 3, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      // Rising bubbles
      for (let b = 0; b < 3; b++) {
        const bAge = ((now / 700 + b * 0.33) % 1);
        const bx = rodEndX - 3 + b * 3 + Math.sin(bAge * Math.PI * 2) * 2;
        const by = hookY - bAge * 28;
        ctx.fillStyle = `rgba(150,220,255,${0.6 - bAge * 0.5})`;
        ctx.beginPath(); ctx.arc(bx, by, 1.8 * (1 - bAge * 0.4), 0, Math.PI * 2); ctx.fill();
      }

    } else if (isSea && isBoat) {
      // Boat: longer side cast rod, float farther out
      const leanX = 5 + Math.sin(t * 0.5) * 1.5;
      const rodBaseX = px + leanX, rodBaseY = py - PH / 2 + 12;
      const tipBob = Math.sin(t * 1.1) * 3;
      const rodTipX = rodBaseX + 34 + tipBob * 0.4; // longer reach
      const rodTipY = rodBaseY - 20 + tipBob;

      ctx.strokeStyle = '#5a3810'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rodBaseX, rodBaseY);
      ctx.quadraticCurveTo(rodBaseX + 18, rodBaseY - 12, rodTipX, rodTipY);
      ctx.stroke();
      ctx.fillStyle = '#c89040';
      ctx.beginPath(); ctx.arc(rodTipX, rodTipY, 2.5, 0, Math.PI * 2); ctx.fill();

      const isBite2 = state === 'bite';
      const floatBob = isBite2
        ? Math.sin(t * 18) * 7 + Math.sin(t * 11) * 4
        : Math.sin(t * 1.6) * 3 + Math.sin(t * 2.9) * 1.2;
      const floatX = rodTipX + 10;
      const floatY = py + 24 + floatBob;

      ctx.strokeStyle = 'rgba(220,220,220,0.65)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      ctx.quadraticCurveTo(rodTipX + 14, rodTipY + 18, floatX, floatY);
      ctx.stroke();

      const ringPeriod2 = isBite2 ? 600 : 2200;
      for (const off of [0, ringPeriod2 / 2]) {
        const rT = ((now + off) % ringPeriod2) / ringPeriod2;
        if (rT > 0.1) {
          ctx.strokeStyle = isBite2 ? `rgba(255,100,100,${Math.max(0, 0.5 - rT * 0.5)})` : `rgba(100,180,255,${Math.max(0, 0.5 - rT * 0.5)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(floatX, floatY + 1, rT * (isBite2 ? 22 : 14), rT * 5, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const biteFlash2 = isBite2 && Math.floor(now / 120) % 2 === 0;
      ctx.fillStyle = biteFlash2 ? '#ffdd00' : '#ff3333';
      ctx.beginPath(); ctx.ellipse(floatX, floatY, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(floatX, floatY - 2.5, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    } else {
      // Normal fishing animation
      const leanX = 5 + Math.sin(t * 0.5) * 1.5;
      const rodBaseX = px + leanX, rodBaseY = py - PH / 2 + 12;
      const tipBob = Math.sin(t * 1.1) * 3;
      const rodTipX = rodBaseX + 28 + tipBob * 0.4;
      const rodTipY = rodBaseY - 18 + tipBob;

      ctx.strokeStyle = '#7a5020'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rodBaseX, rodBaseY);
      ctx.quadraticCurveTo(rodBaseX + 16, rodBaseY - 10, rodTipX, rodTipY);
      ctx.stroke();
      ctx.fillStyle = '#c89040';
      ctx.beginPath(); ctx.arc(rodTipX, rodTipY, 2, 0, Math.PI * 2); ctx.fill();

      const isBite = state === 'bite';
      const floatBob = isBite
        ? Math.sin(t * 18) * 7 + Math.sin(t * 11) * 4  // frantic splashing
        : Math.sin(t * 1.6) * 3 + Math.sin(t * 2.9) * 1.2;
      const floatX = rodTipX + 8;
      const floatY = py + 26 + floatBob;

      ctx.strokeStyle = 'rgba(220,220,220,0.65)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      ctx.quadraticCurveTo(rodTipX + 12, rodTipY + 18, floatX, floatY);
      ctx.stroke();

      // Ripple rings (larger and faster during bite)
      const ringPeriod = isBite ? 600 : 2200;
      for (const off of [0, ringPeriod / 2]) {
        const rT = ((now + off) % ringPeriod) / ringPeriod;
        if (rT > 0.1) {
          const rAlpha = Math.max(0, 0.5 - rT * 0.5);
          const rRadius = rT * (isBite ? 22 : 14);
          ctx.strokeStyle = isBite ? `rgba(255,100,100,${rAlpha})` : `rgba(100,180,255,${rAlpha})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(floatX, floatY + 1, rRadius, rRadius * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      // Float body — flash yellow/red during bite
      const biteFlash = isBite && Math.floor(now / 120) % 2 === 0;
      ctx.fillStyle = biteFlash ? '#ffdd00' : '#ff3333';
      ctx.beginPath(); ctx.ellipse(floatX, floatY, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(floatX, floatY - 2.5, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(floatX, floatY, 4, 5, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ── Mining animation ──
  if (state === 'mining') {
    const t = now / 1000;
    // Full swing cycle ~0.55s
    const cycle = (now % 550) / 550;
    // Raise arm 0→0.45, slam down 0.45→1.0
    let swingAngle;
    if (cycle < 0.45) {
      // Raise: 0 → -1.3 rad
      swingAngle = -1.3 * (cycle / 0.45);
    } else {
      // Slam: -1.3 → +0.7 rad  (overshoot)
      swingAngle = -1.3 + 2.0 * ((cycle - 0.45) / 0.55);
    }
    const isImpact = cycle > 0.85;

    ctx.save();
    ctx.translate(px + 7, py - PH / 2 + 14);
    ctx.rotate(swingAngle);

    // Handle
    ctx.strokeStyle = '#7a4a10';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18);
    ctx.stroke();

    // Pickaxe head color by type
    const pickaxeHeadColors = { '나무곡괭이': '#8a6a3a', '철곡괭이': '#8a8a8a', '금곡괭이': '#e8c830' };
    const pickaxeHeadCol = pickaxeHeadColors[pickaxeType] ?? '#8a8a8a';
    // Pickaxe head (wedge shape)
    ctx.fillStyle = pickaxeHeadCol;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, 16);   // left spike
    ctx.lineTo(-2, 12);
    ctx.lineTo(0, 18);    // center
    ctx.lineTo(2, 12);
    ctx.lineTo(8, 14);    // right blunt
    ctx.lineTo(5, 19);
    ctx.lineTo(0, 18);
    ctx.lineTo(-5, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Metal sheen on head
    ctx.fillStyle = 'rgba(220,220,220,0.45)';
    ctx.beginPath();
    ctx.moveTo(-5, 16); ctx.lineTo(-1, 13); ctx.lineTo(1, 16); ctx.lineTo(-3, 18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Impact sparks when slam hits
    if (isImpact) {
      const sparkCount = 5;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (-0.3 + i * 0.25) + Math.sin(t * 8 + i) * 0.2;
        const len = 4 + (i % 3) * 3;
        const sx = px + 10 + Math.cos(angle) * 4;
        const sy = py + PH / 2 - 2 + Math.sin(angle) * 4;
        const sparkAlpha = 0.4 + ((cycle - 0.85) / 0.15) * 0.6;
        ctx.strokeStyle = `rgba(255,${180 + i * 10},50,${sparkAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        ctx.stroke();
      }
      // Impact flash dot
      ctx.fillStyle = 'rgba(255,220,80,0.6)';
      ctx.beginPath();
      ctx.arc(px + 10, py + PH / 2 - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Gathering animation ──
  if (state === 'gathering') {
    const t = now / 1000;
    const toolIcons = { '맨손': null, '나무바구니': '🧺', '허브낫': '🌿', '황금낫': '✨' };
    const toolIcon = toolIcons[gatherTool];
    // Arm reach left-right bob
    const bob = Math.sin(now / 400) * 4;
    ctx.fillStyle = bodyCol;
    ctx.beginPath(); ctx.roundRect(px - 14, py - 4, 5, 10 + bob * 0.5, 3); ctx.fill();
    ctx.fillStyle = '#f6cc88';
    ctx.beginPath(); ctx.arc(px - 12, py + 7 + bob, 3.5, 0, Math.PI * 2); ctx.fill();
    // Tool icon or herb indicator
    if (toolIcon) {
      ctx.font = '11px serif';
      ctx.textAlign = 'center';
      ctx.fillText(toolIcon, px - 18, py + 5 + bob);
    }
    // Herb sparkles
    for (let i = 0; i < 3; i++) {
      const age = ((now / 600 + i * 0.33) % 1);
      const sx2 = px - 22 + Math.sin(age * Math.PI * 2 + i) * 5;
      const sy2 = py + 5 - age * 14;
      const alpha = 0.7 - age * 0.6;
      ctx.fillStyle = `rgba(80,220,80,${alpha})`;
      ctx.beginPath(); ctx.arc(sx2, sy2, 2 - age, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Progress bar
  if (state !== 'idle') {
    const bw = 44, bh = 6;
    const bx = px - bw / 2, by2 = py - PH / 2 - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx, by2, bw, bh);
    const barColor = state === 'bite' ? '#ff4444' : state === 'fishing' ? '#44aaff' : state === 'gathering' ? '#44cc44' : '#ffaa44';
    // Bite bar depletes (show remaining time, not elapsed)
    const barFill = state === 'bite' ? (1 - (activityProgress || 0)) : (activityProgress || 0);
    ctx.fillStyle = barColor;
    ctx.fillRect(bx, by2, bw * barFill, bh);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by2, bw, bh);
  }

  // Float text
  if (player.floatText) {
    const { text, age, color } = player.floatText;
    const alpha = Math.max(0, 1 - age / 100);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const ty2 = py - PH / 2 - 22 - age * 0.35;
    ctx.strokeText(text, px, ty2);
    ctx.fillStyle = color ?? '#fff';
    ctx.fillText(text, px, ty2);
    ctx.restore();
    player.floatText.age++;
    if (player.floatText.age > 100) player.floatText = null;
  }

  // Title + Nickname above character head
  if (nickname) {
    ctx.textAlign = 'center';
    // Nickname just above head
    const nameY = py - 30;
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(nickname, px, nameY);
    ctx.fillStyle = '#e8e8ff';
    ctx.fillText(nickname, px, nameY);
    // Title above nickname
    if (title) {
      const titleY = nameY - 12;
      ctx.font = '9px "Noto Sans KR", sans-serif';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 2.5;
      ctx.strokeText(`[${title}]`, px, titleY);
      ctx.fillStyle = titleColor ?? '#aaaaaa';
      ctx.fillText(`[${title}]`, px, titleY);
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GameCanvas({ gameRef, onFishCaught, onOreMined, onHerbGathered, onActivityChange, onFishBite, onFishEscaped, nickname, title, titleColor, otherPlayersRef, onPlayerInspect, onEnterRoom, onNearDoorChange, hairColor, bodyColor, skinColor, gender }) {
  const canvasRef = useRef(null);
  const cbRef = useRef({ onFishCaught, onOreMined, onHerbGathered, onActivityChange, onFishBite, onFishEscaped });
  const showFullMapRef = useRef(false);
  const weatherParticlesRef = useRef([]);
  const minimapBoundsRef = useRef({ x: 0, y: 0, w: 100, h: 75 });
  const otherPlayerScreenPosRef = useRef([]); // [{op, sx, sy}] updated each frame
  const onPlayerInspectRef = useRef(onPlayerInspect);
  const onEnterRoomRef = useRef(onEnterRoom);
  const onNearDoorChangeRef = useRef(onNearDoorChange);
  const nearDoorRef = useRef(null);
  const lastSplashRef = useRef(0);
  const hairColorRef = useRef(hairColor ?? '#5a3010');
  const bodyColorRef = useRef(bodyColor ?? '#5a7aaa');
  const skinColorRef = useRef(skinColor ?? '#f6cc88');
  const genderRef = useRef(gender ?? 'male');
  useEffect(() => { onPlayerInspectRef.current = onPlayerInspect; });
  useEffect(() => { onEnterRoomRef.current = onEnterRoom; });
  useEffect(() => { onNearDoorChangeRef.current = onNearDoorChange; });
  useEffect(() => { hairColorRef.current = hairColor ?? '#5a3010'; }, [hairColor]);
  useEffect(() => { bodyColorRef.current = bodyColor ?? '#5a7aaa'; }, [bodyColor]);
  useEffect(() => { skinColorRef.current = skinColor ?? '#f6cc88'; }, [skinColor]);
  useEffect(() => { genderRef.current = gender ?? 'male'; }, [gender]);

  // Always keep callbacks fresh
  useEffect(() => {
    cbRef.current = { onFishCaught, onOreMined, onHerbGathered, onActivityChange, onFishBite, onFishEscaped };
  });

  // Init player state
  useEffect(() => {
    gameRef.current = {
      player: {
        x: PLAYER_START_X, y: PLAYER_START_Y,
        vx: 0, vy: 0,
        facing: 'down',
        state: 'idle',
        activityStart: null,
        activityDuration: null,
        activityProgress: 0,
        currentRod: '초급낚시대',
        currentOre: null,
        currentHerb: null,
        seaFishing: false,
        floatText: null,
      },
      keys: {},
    };
  }, []);

  // Click: toggle full map; dblclick: inspect player
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        cx: (e.clientX - rect.left) * (canvas.width / rect.width),
        cy: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    const onClick = (e) => {
      const { cx, cy } = getCanvasPos(e);
      const mb = minimapBoundsRef.current;
      if (showFullMapRef.current) {
        showFullMapRef.current = false;
      } else if (cx >= mb.x && cx <= mb.x + mb.w && cy >= mb.y && cy <= mb.y + mb.h) {
        showFullMapRef.current = true;
      }
    };

    const onDblClick = (e) => {
      const { cx, cy } = getCanvasPos(e);
      // Find closest other player within 32px
      let best = null, bestDist = 32;
      for (const { op, sx, sy } of otherPlayerScreenPosRef.current) {
        const d = Math.hypot(cx - sx, cy - sy);
        if (d < bestDist) { bestDist = d; best = op; }
      }
      if (best) onPlayerInspectRef.current?.(best);
    };

    // Single click → move player to that world position
    const onClickMove = (e) => {
      if (showFullMapRef.current) return; // handled by onClick
      const { cx, cy } = getCanvasPos(e);
      const mb = minimapBoundsRef.current;
      if (cx >= mb.x && cx <= mb.x + mb.w && cy >= mb.y && cy <= mb.y + mb.h) return;
      const g = gameRef.current;
      if (!g?.player || g.player.state !== 'idle') return;
      // Convert screen → world using current camera
      const canvas2 = canvasRef.current;
      const W = canvas2.width, H = canvas2.height;
      const maxCX = Math.max(0, MAP_W * TILE_SIZE - W);
      const maxCY = Math.max(0, MAP_H * TILE_SIZE - H);
      const camX = Math.round(Math.max(0, Math.min(g.player.x - W / 2, maxCX)));
      const camY = Math.round(Math.max(0, Math.min(g.player.y - H / 2, maxCY)));
      g.clickTarget = { x: cx + camX, y: cy + camY };
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('click', onClickMove);
    canvas.addEventListener('dblclick', onDblClick);
    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('click', onClickMove);
      canvas.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  // Key events
  useEffect(() => {
    const down = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (document.activeElement?.tagName === 'INPUT') return;
        e.preventDefault();
        if (gameRef.current) gameRef.current.keys[e.key] = true;
      }
      if (e.key === ' ' && gameRef.current?.player?.state === 'bite') {
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          gameRef.current.reelIn = true;
        }
      }
      if (e.key === 'Enter' && nearDoorRef.current) {
        onEnterRoomRef.current?.(nearDoorRef.current.id);
      }
    };
    const up = (e) => { if (gameRef.current) delete gameRef.current.keys[e.key]; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [gameRef]);

  // Game loop
  useEffect(() => {
    let rafId;
    let lastT = performance.now();

    function loop(ts) {
      const dt = Math.min(ts - lastT, 50);
      lastT = ts;

      const canvas = canvasRef.current;
      const g = gameRef.current;
      if (!canvas || !g || !g.player) { rafId = requestAnimationFrame(loop); return; }

      // Sync canvas buffer to its CSS display size every frame
      const pw = canvas.offsetWidth || window.innerWidth;
      const ph = canvas.offsetHeight || window.innerHeight;
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      if (canvas.width === 0 || canvas.height === 0) { rafId = requestAnimationFrame(loop); return; }

      const ctx = canvas.getContext('2d');
      const { player, keys } = g;
      const W = canvas.width, H = canvas.height;
      const maxSpd = MAX_SPEED + (g.speedBonus ?? 0);

      // ── Physics ──
      if (player.state === 'idle') {
        // Click-to-move target
        if (g.clickTarget) {
          const dx = g.clickTarget.x - player.x;
          const dy = g.clickTarget.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 4) {
            g.clickTarget = null;
            player.vx = 0; player.vy = 0;
          } else {
            const spd = MAX_SPEED + (g.speedBonus ?? 0);
            player.vx = (dx / dist) * spd;
            player.vy = (dy / dist) * spd;
            if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
            else player.facing = dy > 0 ? 'down' : 'up';
          }
        }
        // Arrow keys cancel click-to-move
        const spd = ACCEL * dt / 16;
        if (keys.ArrowLeft)  { player.vx -= spd; player.facing = 'left';  g.clickTarget = null; }
        if (keys.ArrowRight) { player.vx += spd; player.facing = 'right'; g.clickTarget = null; }
        if (keys.ArrowUp)    { player.vy -= spd; player.facing = 'up';    g.clickTarget = null; }
        if (keys.ArrowDown)  { player.vy += spd; player.facing = 'down';  g.clickTarget = null; }

        player.vx = Math.max(-maxSpd, Math.min(maxSpd, player.vx));
        player.vy = Math.max(-maxSpd, Math.min(maxSpd, player.vy));

        const hasMarine = !!(gameRef.current?.marineGear);
        const nx = player.x + player.vx;
        if (canWalk(nx, player.y, hasMarine)) player.x = Math.max(PW / 2, Math.min((MAP_W - 1) * TILE_SIZE - PW / 2, nx)); else player.vx = 0;
        const ny = player.y + player.vy;
        if (canWalk(player.x, ny, hasMarine)) player.y = Math.max(PH / 2, Math.min((MAP_H - 1) * TILE_SIZE - PH / 2, ny)); else player.vy = 0;

        player.vx *= FRICTION;
        player.vy *= FRICTION;
        if (Math.abs(player.vx) < 0.05) player.vx = 0;
        if (Math.abs(player.vy) < 0.05) player.vy = 0;

        // Splash sound when moving on water
        const isMoving = Math.abs(player.vx) > 0.5 || Math.abs(player.vy) > 0.5;
        const onWaterTile = getTile(Math.floor(player.x / TILE_SIZE), Math.floor(player.y / TILE_SIZE)) === TILE.WATER;
        if (isMoving && onWaterTile && hasMarine) {
          const now2 = performance.now();
          const interval = gameRef.current?.marineGear === '보트' ? 520 : 380;
          if (now2 - lastSplashRef.current > interval) {
            lastSplashRef.current = now2;
            playSwimSplash();
          }
        }

      } else {
        // Cancel on movement key
        if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) {
          player.state = 'idle';
          player.activityStart = null;
          player.activityProgress = 0;
          g.reelIn = false;
          cbRef.current.onActivityChange(null);
        } else if (player.activityStart !== null) {
          // Bite state: check for reel-in before updating progress
          if (player.state === 'bite' && (g.reelIn)) {
            g.reelIn = false;
            cbRef.current.onFishCaught(player.currentRod);
            const fishMult = g.fishTimeMult ?? 1.0;
            const [mn, mx] = RODS[player.currentRod].catchTimeRange.map(t => Math.max(1000, Math.round(t * fishMult)));
            player.activityDuration = randInt(mn, mx);
            player.activityStart = ts;
            player.activityProgress = 0;
            player.state = 'fishing';
            cbRef.current.onActivityChange('fishing');
          } else {
            player.activityProgress = Math.min((ts - player.activityStart) / player.activityDuration, 1);

            if (player.activityProgress >= 1) {
              if (player.state === 'fishing') {
                // Transition to bite state — player must react
                player.state = 'bite';
                player.activityDuration = 2500;
                cbRef.current.onFishBite?.();
                cbRef.current.onActivityChange('bite');
              } else if (player.state === 'bite') {
                // Bite window expired — fish escaped
                g.reelIn = false;
                cbRef.current.onFishEscaped?.();
                const fishMult = g.fishTimeMult ?? 1.0;
                const [mn, mx] = RODS[player.currentRod].catchTimeRange.map(t => Math.max(1000, Math.round(t * fishMult)));
                player.activityDuration = randInt(mn, mx);
                player.state = 'fishing';
                cbRef.current.onActivityChange('fishing');
              } else if (player.state === 'mining') {
                cbRef.current.onOreMined(player.currentOre);
                player.currentOre = pickOre();
                const mineMult = g.mineTimeMult ?? 1.0;
                const [mn, mx] = ORES[player.currentOre].mineRange.map(t => Math.max(800, Math.round(t * mineMult)));
                player.activityDuration = randInt(mn, mx);
              } else if (player.state === 'gathering') {
                cbRef.current.onHerbGathered?.(player.currentHerb);
                player.currentHerb = pickHerb?.() ?? player.currentHerb;
                const herbData = HERBS?.[player.currentHerb];
                if (herbData) {
                  const gatherMult = g.gatherTimeMult ?? 1.0;
                  const [mn, mx] = herbData.gatherRange.map(t => Math.max(800, Math.round(t * gatherMult)));
                  player.activityDuration = randInt(mn, mx);
                }
              }
              player.activityStart = ts;
              player.activityProgress = 0;
            }
          }
        }
      }

      // ── Door proximity ──
      {
        let closestDoor = null;
        for (const dt of DOOR_TRIGGERS) {
          if (Math.hypot(player.x - dt.wx, player.y - dt.wy) <= dt.range) {
            closestDoor = dt;
            break;
          }
        }
        if (closestDoor?.id !== nearDoorRef.current?.id) {
          nearDoorRef.current = closestDoor;
          onNearDoorChangeRef.current?.(closestDoor ? closestDoor.id : null);
          // Auto-enter when player walks into door range
          if (closestDoor && player.state === 'idle') {
            onEnterRoomRef.current?.(closestDoor.id);
          }
        }
        // Expose to gameRef for mobile button
        g.nearDoor = closestDoor?.id ?? null;
        g.enterRoom = () => {
          if (nearDoorRef.current) onEnterRoomRef.current?.(nearDoorRef.current.id);
        };
      }

      // ── Camera ──
      const maxCX = Math.max(0, MAP_W * TILE_SIZE - W);
      const maxCY = Math.max(0, MAP_H * TILE_SIZE - H);
      const camX = Math.round(Math.max(0, Math.min(player.x - W / 2, maxCX)));
      const camY = Math.round(Math.max(0, Math.min(player.y - H / 2, maxCY)));

      // ── Render ──
      ctx.clearRect(0, 0, W, H);

      // Screen shake
      let shakeX = 0, shakeY = 0;
      const shk = gameRef.current?.shakeEffect;
      if (shk) {
        shk.age = (shk.age ?? 0) + 1;
        const amt = Math.max(0, shk.intensity * (1 - shk.age / 20));
        if (amt > 0) {
          shakeX = (Math.random() - 0.5) * 2 * amt;
          shakeY = (Math.random() - 0.5) * 2 * amt;
        } else {
          gameRef.current.shakeEffect = null;
        }
      }
      ctx.save();
      ctx.translate(shakeX, shakeY);

      const stx = Math.max(0, Math.floor(camX / TILE_SIZE));
      const sty = Math.max(0, Math.floor(camY / TILE_SIZE));
      const etx = Math.min(MAP_W, Math.ceil((camX + W) / TILE_SIZE));
      const ety = Math.min(MAP_H, Math.ceil((camY + H) / TILE_SIZE));

      for (let ty = sty; ty < ety; ty++)
        for (let tx = stx; tx < etx; tx++)
          drawTile(ctx, tx, ty, tx * TILE_SIZE - camX, ty * TILE_SIZE - camY);

      // Scattered flowers on grass
      for (let ty2 = sty; ty2 < ety; ty2++) {
        for (let tx2 = stx; tx2 < etx; tx2++) {
          const seed = tx2 * 31 + ty2 * 17;
          if (getTile(tx2, ty2) === TILE.GRASS && seed % 11 === 0) {
            const fx = tx2 * TILE_SIZE - camX + (seed % 24) + 4;
            const fy = ty2 * TILE_SIZE - camY + ((seed >> 3) % 18) + 5;
            drawFlowerPatch(ctx, fx, fy, seed);
          }
        }
      }

      // Shop building decoration
      const bsx = 1 * TILE_SIZE - camX, bsy = 1 * TILE_SIZE - camY;
      if (bsx < W && bsx + 10 * TILE_SIZE > 0 && bsy < H && bsy + 11 * TILE_SIZE > 0)
        drawShopBuilding(ctx, camX, camY);

      // Cooking building decoration
      const ckx = COOKING_TX * TILE_SIZE - camX, cky = COOKING_TY * TILE_SIZE - camY;
      if (ckx > -10 * TILE_SIZE && ckx < W + 2 * TILE_SIZE && cky > -10 * TILE_SIZE && cky < H)
        drawCookingBuilding(ctx, camX, camY);

      // Inn building decoration
      const innbx = 20 * TILE_SIZE - camX, innby = 1 * TILE_SIZE - camY;
      if (innbx > -12 * TILE_SIZE && innbx < W + 2 * TILE_SIZE && innby > -10 * TILE_SIZE && innby < H)
        drawInnBuilding(ctx, camX, camY);

      // Fishing area sign (tx=13, ty=18 — top of sand beach)
      {
        const sx = 13 * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = 18 * TILE_SIZE - camY;
        if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80)
          drawFishingSign(ctx, sx, sy);
      }

      // Bank building decoration
      {
        const bbx = 1 * TILE_SIZE - camX, bby = 14 * TILE_SIZE - camY;
        if (bbx < W + 2 * TILE_SIZE && bbx + 9 * TILE_SIZE > 0 && bby < H + TILE_SIZE && bby + 4 * TILE_SIZE > 0)
          drawBankBuilding(ctx, camX, camY);
      }

      // Freshwater pond sign (north edge of pond)
      {
        const sx = 19 * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = 15 * TILE_SIZE - camY;
        if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80)
          drawFreshwaterSign(ctx, sx, sy);
      }

      // Golden pond sign (inside forest, north of pond)
      {
        const sx = 38 * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = 8 * TILE_SIZE - camY;
        if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80)
          drawGoldenPondSign(ctx, sx, sy);
      }

      // Fishing chairs (mark occupied ones)
      for (const c of FISHING_CHAIRS) {
        const cx = c.tx * TILE_SIZE + TILE_SIZE / 2;
        const cy = c.ty * TILE_SIZE + TILE_SIZE / 2;
        const occupied = (otherPlayersRef?.current ?? []).some(op =>
          op.state === 'fishing' && Math.hypot(op.x - cx, op.y - cy) < 2 * TILE_SIZE
        );
        const sx = c.tx * TILE_SIZE - camX, sy = c.ty * TILE_SIZE - camY;
        if (sx > -TILE_SIZE && sx < W && sy > -TILE_SIZE && sy < H)
          drawChair(ctx, sx, sy, occupied);
      }

      // Trees
      for (const tp of TREE_POSITIONS) {
        const twx = tp.tx * TILE_SIZE - camX;
        const twy = tp.ty * TILE_SIZE - camY;
        if (twx > -60 && twx < W + 60 && twy > -80 && twy < H + 20)
          drawTree(ctx, twx, twy);
      }

      // Mine entrance
      const mx = MINE_ENTRANCE.tx * TILE_SIZE - camX;
      const my = MINE_ENTRANCE.ty * TILE_SIZE - camY;
      if (mx > -6 * TILE_SIZE && mx < W && my > -5 * TILE_SIZE && my < H)
        drawMineEntrance(ctx, mx, my);

      // ── Weather particles ──
      {
        const wx = gameRef.current?.weather?.id ?? 'clear';
        const parts = weatherParticlesRef.current;

        if (wx === 'rain' || wx === 'storm') {
          const spawnCount = wx === 'storm' ? 4 : 2;
          for (let i = 0; i < spawnCount; i++) {
            parts.push({ x: Math.random() * W, y: -10, vx: wx === 'storm' ? -2.5 : -1.2, vy: wx === 'storm' ? 14 : 9 });
          }
          ctx.strokeStyle = wx === 'storm' ? 'rgba(140,180,255,0.65)' : 'rgba(120,160,255,0.45)';
          ctx.lineWidth = wx === 'storm' ? 1.5 : 1;
          ctx.beginPath();
          for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
            p.x += p.vx; p.y += p.vy;
            if (p.y > H + 10) parts.splice(i, 1);
          }
          ctx.stroke();
          if (wx === 'storm' && Math.random() < 0.002) {
            ctx.fillStyle = 'rgba(200,220,255,0.18)';
            ctx.fillRect(0, 0, W, H);
          }
          if (parts.length > 300) parts.splice(0, parts.length - 300);
        } else if (wx === 'fog') {
          weatherParticlesRef.current = [];
          const t2 = performance.now() / 3000;
          const alpha = 0.18 + 0.08 * Math.sin(t2);
          ctx.fillStyle = `rgba(200,210,220,${alpha})`;
          ctx.fillRect(0, 0, W, H);
          const alpha2 = 0.10 + 0.06 * Math.sin(t2 * 1.4 + 1);
          ctx.fillStyle = `rgba(180,195,210,${alpha2})`;
          ctx.fillRect(0, H * 0.3, W, H * 0.4);
        } else {
          weatherParticlesRef.current = [];
        }
      }

      // Area labels
      ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      const fl = [14 * TILE_SIZE - camX, 16 * TILE_SIZE - camY];
      if (fl[0] > 0 && fl[0] < W && fl[1] > 0 && fl[1] < H)
        ctx.fillText('↓ 낚시터', fl[0], fl[1]);
      const ml = [34 * TILE_SIZE - camX, 1 * TILE_SIZE - camY];
      if (ml[0] > 0 && ml[0] < W && ml[1] > 0 && ml[1] < H)
        ctx.fillText('광산 지역', ml[0], ml[1]);
      const fml = [34 * TILE_SIZE - camX, 16 * TILE_SIZE - camY];
      if (fml[0] > 0 && fml[0] < W && fml[1] > 0 && fml[1] < H)
        ctx.fillText('🌱 농장', fml[0], fml[1]);

      // Farm crop visuals
      {
        const now2 = Date.now();
        const farmPlots = gameRef.current?.farmPlots ?? [];
        farmPlots.forEach((plot, i) => {
          if (i >= FARM_PLOT_POSITIONS.length) return;
          const pos = FARM_PLOT_POSITIONS[i];
          const wx = pos.tx * TILE_SIZE - camX;
          const wy = pos.ty * TILE_SIZE - camY;
          if (wx < -TILE_SIZE * 2 || wx > W + TILE_SIZE || wy < -TILE_SIZE * 2 || wy > H + TILE_SIZE) return;
          const elapsed = now2 - plot.plantedAt;
          const total = plot.harvestAt - plot.plantedAt;
          const pct = Math.min(1, elapsed / total);
          const isReady = now2 >= plot.harvestAt;
          drawCrop(ctx, wx, wy, pct, isReady, plot.seed);
        });
      }

      // Level-up screen flash effect (milestones 25/50/75)
      const lvEffect = gameRef.current?.levelUpEffect;
      if (lvEffect) {
        lvEffect.age = (lvEffect.age ?? 0) + 1;
        const alpha = Math.max(0, 0.5 - lvEffect.age * 0.02);
        if (alpha > 0) {
          ctx.fillStyle = `rgba(255,230,100,${alpha})`;
          ctx.fillRect(0, 0, W, H);
          const cx2 = W / 2, cy2 = H / 2;
          const burst = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, Math.min(W, H) * 0.4);
          burst.addColorStop(0, `rgba(255,255,100,${alpha * 0.8})`);
          burst.addColorStop(1, `rgba(255,200,0,0)`);
          ctx.fillStyle = burst;
          ctx.fillRect(0, 0, W, H);
          // Show "MAX!" text when ability reaches 100
          if (lvEffect.type === 'max' && alpha > 0.15) {
            const textA = Math.min(1, alpha * 4);
            ctx.save();
            ctx.globalAlpha = textA;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 12;
            ctx.font = 'bold 36px "Noto Sans KR", sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(`${lvEffect.icon ?? '🌟'} ${lvEffect.abilName ?? ''} MAX!`, W / 2, H / 2 - 10);
            ctx.font = '18px "Noto Sans KR", sans-serif';
            ctx.fillStyle = '#ffee88';
            ctx.fillText('스킬창에서 그레이드업 가능!', W / 2, H / 2 + 22);
            ctx.restore();
          }
        } else {
          gameRef.current.levelUpEffect = null;
        }
      }

      // Grade-up full-screen celebration effect
      const gradeUpEff = gameRef.current?.gradeUpEffect;
      if (gradeUpEff) {
        gradeUpEff.age = (gradeUpEff.age ?? 0) + 1;

        // Initialize particles on first frame
        if (gradeUpEff.age === 1) {
          const cx0 = W / 2, cy0 = H / 2;
          gradeUpEff.particles = Array.from({ length: 90 }, (_, i) => {
            const angle = (Math.PI * 2 * i) / 90 + (Math.random() - 0.5) * 0.25;
            const speed = 4 + Math.random() * 11;
            return {
              x: cx0, y: cy0,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 3,
              size: 6 + Math.random() * 10,
              color: Math.random() < 0.55 ? (gradeUpEff.color ?? '#66aaff') : '#ffffff',
              isStar: Math.random() < 0.5,
              rot: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.18,
              lifespan: 90 + Math.floor(Math.random() * 70),
              age: 0,
            };
          });
        }

        const DURATION = 180;
        const t = gradeUpEff.age / DURATION;

        if (t >= 1) {
          gameRef.current.gradeUpEffect = null;
        } else {
          // Colored overlay flash
          const overlayA = t < 0.08 ? (t / 0.08) * 0.45 : Math.max(0, 0.45 * (1 - (t - 0.08) / 0.45));
          if (overlayA > 0) {
            ctx.save();
            ctx.globalAlpha = overlayA;
            ctx.fillStyle = gradeUpEff.color ?? '#66aaff';
            ctx.fillRect(0, 0, W, H);
            const burstG = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.55);
            burstG.addColorStop(0, `rgba(255,255,255,${overlayA * 1.8})`);
            burstG.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = 1;
            ctx.fillStyle = burstG;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
          }

          // Particles
          for (const p of gradeUpEff.particles ?? []) {
            p.age++;
            p.vx *= 0.97;
            p.vy = p.vy * 0.97 + 0.13;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.rotSpeed;
            const pA = Math.max(0, 1 - p.age / p.lifespan);
            if (pA <= 0) continue;
            ctx.save();
            ctx.globalAlpha = pA;
            ctx.fillStyle = p.color;
            if (p.isStar) {
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rot);
              ctx.beginPath();
              const s = p.size, inner = s * 0.42;
              for (let j = 0; j < 10; j++) {
                const r = j % 2 === 0 ? s : inner;
                const a = (j * Math.PI) / 5 - Math.PI / 2;
                if (j === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
              }
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // Text animation
          const textA = t < 0.12 ? t / 0.12 : t > 0.72 ? Math.max(0, 1 - (t - 0.72) / 0.28) : 1;
          if (textA > 0) {
            const scale = t < 0.18 ? 0.25 + (t / 0.18) * 0.9 : t < 0.24 ? 1.15 - ((t - 0.18) / 0.06) * 0.15 : 1.0;
            ctx.save();
            ctx.globalAlpha = textA;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur = 18;
            ctx.translate(W / 2, H / 2);
            ctx.scale(scale, scale);

            // "GRADE UP!" title
            ctx.font = 'bold 58px "Noto Sans KR", sans-serif';
            ctx.strokeStyle = gradeUpEff.color ?? '#66aaff';
            ctx.lineWidth = 4;
            ctx.strokeText('GRADE UP!', 0, -28);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('GRADE UP!', 0, -28);

            // Ability + grade
            ctx.font = 'bold 30px "Noto Sans KR", sans-serif';
            ctx.fillStyle = gradeUpEff.color ?? '#66aaff';
            ctx.shadowBlur = 10;
            ctx.fillText(`${gradeUpEff.icon ?? ''} ${gradeUpEff.abilName ?? ''} → G${gradeUpEff.grade ?? '?'}`, 0, 20);

            // Bonus text
            ctx.font = '20px "Noto Sans KR", sans-serif';
            ctx.fillStyle = '#ffdd88';
            ctx.fillText(`✨ 희귀 보너스 +${(gradeUpEff.grade ?? 1) * 10}%`, 0, 60);

            ctx.restore();
          }
        }
      }

      // Rare fish screen effect (전설/신화)
      const rareEff = gameRef.current?.rareEffect;
      if (rareEff) {
        rareEff.age = (rareEff.age ?? 0) + 1;

        // Initialize on first frame
        if (rareEff.age === 1) {
          const px0 = player.x - camX;
          const py0 = player.y - camY - 30;
          const isMythic = rareEff.rarity === '신화';
          const count = isMythic ? 80 : 55;
          const palettes = {
            신화: ['#ff44ff', '#ff88ff', '#ffaaff', '#ffffff', '#ff00aa', '#cc44ff'],
            전설: ['#ffaa00', '#ffcc44', '#ffee88', '#ffffff', '#ff8800', '#ffe066'],
          };
          const pal = palettes[rareEff.rarity] ?? palettes['전설'];
          rareEff.particles = Array.from({ length: count }, (_, i) => {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
            const speed = 3 + Math.random() * (isMythic ? 14 : 10);
            return {
              x: px0, y: py0,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 2,
              size: 4 + Math.random() * 9,
              color: pal[Math.floor(Math.random() * pal.length)],
              isStar: Math.random() < 0.4,
              rot: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.15,
              lifespan: 60 + Math.floor(Math.random() * 60),
              age: 0,
            };
          });
          rareEff.rings = Array.from({ length: isMythic ? 4 : 3 }, (_, i) => ({
            x: px0, y: py0, r: 0,
            maxR: 80 + i * 55,
            delay: i * 7,
          }));
        }

        const DURATION = rareEff.rarity === '신화' ? 210 : 160;
        const t = rareEff.age / DURATION;

        if (t >= 1) {
          gameRef.current.rareEffect = null;
        } else {
          // Overlay flash
          const rAlpha = t < 0.06 ? (t / 0.06) * 0.35 : Math.max(0, 0.35 * (1 - (t - 0.06) / 0.38));
          if (rAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = rAlpha;
            ctx.fillStyle = rareEff.color;
            ctx.fillRect(0, 0, W, H);
            const px1 = player.x - camX, py1 = player.y - camY - 30;
            const burstR = ctx.createRadialGradient(px1, py1, 0, px1, py1, Math.min(W, H) * 0.55);
            burstR.addColorStop(0, `rgba(255,255,255,${rAlpha * 1.6})`);
            burstR.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = 1;
            ctx.fillStyle = burstR;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
          }

          // Expanding pulse rings
          for (const ring of rareEff.rings ?? []) {
            if (rareEff.age < ring.delay) continue;
            const rAge = rareEff.age - ring.delay;
            ring.r = Math.min(ring.maxR, rAge * 5.5);
            const ringA = Math.max(0, 1 - ring.r / ring.maxR) * 0.65;
            if (ringA <= 0) continue;
            ctx.save();
            ctx.globalAlpha = ringA;
            ctx.strokeStyle = rareEff.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Particles
          for (const p of rareEff.particles ?? []) {
            p.age++;
            p.vx *= 0.96;
            p.vy = p.vy * 0.96 + 0.14;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.rotSpeed;
            const pA = Math.max(0, 1 - p.age / p.lifespan);
            if (pA <= 0) continue;
            ctx.save();
            ctx.globalAlpha = pA;
            ctx.fillStyle = p.color;
            if (p.isStar) {
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rot);
              ctx.beginPath();
              const s = p.size, inner = s * 0.42;
              for (let j = 0; j < 10; j++) {
                const r2 = j % 2 === 0 ? s : inner;
                const a2 = (j * Math.PI) / 5 - Math.PI / 2;
                if (j === 0) ctx.moveTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
                else ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
              }
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // Fish name + rarity text
          const textA = t < 0.1 ? t / 0.1 : t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.35) : 1;
          if (textA > 0) {
            const scale = t < 0.15 ? 0.2 + (t / 0.15) * 0.9 : t < 0.22 ? 1.1 - ((t - 0.15) / 0.07) * 0.1 : 1.0;
            const label = rareEff.rarity === '신화' ? '🌟 신화어 출현!' : '⭐ 전설어!';
            ctx.save();
            ctx.globalAlpha = textA;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur = 16;
            ctx.translate(W / 2, H * 0.3);
            ctx.scale(scale, scale);

            ctx.font = 'bold 44px "Noto Sans KR", sans-serif';
            ctx.strokeStyle = rareEff.rarity === '신화' ? '#aa00aa' : '#aa6600';
            ctx.lineWidth = 3;
            ctx.strokeText(label, 0, -22);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, 0, -22);

            ctx.font = 'bold 28px "Noto Sans KR", sans-serif';
            ctx.fillStyle = rareEff.color;
            ctx.shadowBlur = 10;
            ctx.fillText(`${rareEff.fishName ?? ''} ${rareEff.size ?? ''}cm`, 0, 18);

            ctx.restore();
          }
        }
      }

      // Fish jump particles (rare+)
      const fishParticles = gameRef.current?.fishParticles ?? [];
      gameRef.current.fishParticles = fishParticles;
      for (let i = fishParticles.length - 1; i >= 0; i--) {
        const fp = fishParticles[i];
        fp.age = (fp.age ?? 0) + 1;
        fp.vy -= 0.4; // gravity
        fp.y += fp.vy;
        fp.x += fp.vx;
        const alpha = Math.max(0, 1 - fp.age / 40);
        if (alpha <= 0) { fishParticles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `${Math.round(14 + fp.age * 0.3)}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(fp.emoji, fp.x - camX, fp.y - camY);
        ctx.restore();
      }

      // Treasure chest discovery effect
      const treasureEff = gameRef.current?.treasureEffect;
      if (treasureEff) {
        treasureEff.age = (treasureEff.age ?? 0) + 1;
        const TDUR = 120;
        const tt = treasureEff.age / TDUR;
        if (tt >= 1) {
          gameRef.current.treasureEffect = null;
        } else {
          const tA = tt < 0.1 ? tt / 0.1 : tt > 0.6 ? Math.max(0, 1 - (tt - 0.6) / 0.4) : 1;
          if (tA > 0) {
            const tScale = tt < 0.15 ? 0.3 + (tt / 0.15) * 0.8 : tt < 0.2 ? 1.1 - ((tt - 0.15) / 0.05) * 0.1 : 1.0;
            ctx.save();
            ctx.globalAlpha = tA * 0.28;
            ctx.fillStyle = '#ffdd00';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = tA;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 14;
            ctx.translate(W / 2, H * 0.35);
            ctx.scale(tScale, tScale);
            ctx.font = 'bold 40px serif';
            ctx.fillText('💰 보물상자 발견!', 0, -10);
            ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
            ctx.fillStyle = '#ffee88';
            ctx.fillText(`+${(treasureEff.amount ?? 0).toLocaleString()}G`, 0, 30);
            ctx.restore();
          }
        }
      }

      // Quest complete effect
      const questEff = gameRef.current?.questCompleteEffect;
      if (questEff) {
        questEff.age = (questEff.age ?? 0) + 1;
        const QDUR = 100;
        const qt = questEff.age / QDUR;
        if (qt >= 1) {
          gameRef.current.questCompleteEffect = null;
        } else {
          const qA = qt < 0.12 ? qt / 0.12 : qt > 0.65 ? Math.max(0, 1 - (qt - 0.65) / 0.35) : 1;
          if (qA > 0) {
            const qScale = qt < 0.18 ? 0.3 + (qt / 0.18) * 0.8 : 1.0;
            ctx.save();
            ctx.globalAlpha = qA * 0.22;
            ctx.fillStyle = '#44ff88';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = qA;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 12;
            ctx.translate(W / 2, H * 0.35);
            ctx.scale(qScale, qScale);
            ctx.font = 'bold 36px "Noto Sans KR", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('🎉 퀘스트 완료!', 0, 0);
            ctx.restore();
          }
        }
      }

      // Marine gear: water ripples + boat hull (drawn BEFORE player)
      const marineGearKey = gameRef.current?.marineGear ?? null;
      if (marineGearKey) {
        const psx = player.x - camX, psy = player.y - camY;
        const tile = getTile(Math.floor(player.x / TILE_SIZE), Math.floor(player.y / TILE_SIZE));
        if (tile === TILE.WATER) {
          ctx.save();
          // Boat hull drawn beneath player
          if (marineGearKey === '보트') {
            ctx.fillStyle = '#7a4010';
            ctx.beginPath(); ctx.moveTo(psx - 18, psy + 12); ctx.lineTo(psx + 18, psy + 12);
            ctx.lineTo(psx + 22, psy + 20); ctx.lineTo(psx - 22, psy + 20); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#cc6633';
            ctx.beginPath(); ctx.roundRect(psx - 18, psy + 8, 36, 6, 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.roundRect(psx - 16, psy + 9, 32, 2, 1); ctx.fill();
          }
          // Water ripple rings
          const rAge = (performance.now() / 400) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(100,200,255,0.4)';
          ctx.lineWidth = 1.5;
          for (let ri = 0; ri < 2; ri++) {
            const rr = 14 + ri * 10 + Math.sin(rAge + ri) * 3;
            ctx.beginPath();
            ctx.ellipse(psx, psy + 16, rr, rr * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Other players
      const others = otherPlayersRef?.current ?? [];
      const screenPositions = [];
      for (const op of others) {
        const sx = op.x - camX, sy = op.y - camY;
        screenPositions.push({ op, sx, sy });
        drawPlayer(ctx, sx, sy, {
          facing: op.facing ?? 'down',
          state: op.state ?? 'idle',
          activityProgress: 0,
          floatText: null,
        }, op.nickname, op.title, op.titleColor);
      }
      otherPlayerScreenPosRef.current = screenPositions;

      // My player (on top)
      drawPlayer(ctx, player.x - camX, player.y - camY, player, nickname, title, titleColor, hairColorRef.current, bodyColorRef.current, skinColorRef.current, genderRef.current, marineGearKey, gameRef.current?.equippedItems ?? {});

      // Door entry prompt
      if (nearDoorRef.current) {
        const door = nearDoorRef.current;
        const psx = player.x - camX, psy = player.y - camY;
        const label = `${door.label} (Enter)`;
        ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
        const tw = ctx.measureText(label).width;
        const bx = psx - tw / 2 - 8, by = psy - 68;
        const pulse = 0.85 + 0.15 * Math.sin(performance.now() / 300);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = 'rgba(20,20,40,0.82)';
        ctx.beginPath(); ctx.roundRect(bx, by, tw + 16, 22, 5); ctx.fill();
        ctx.strokeStyle = '#88ccff';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(bx, by, tw + 16, 22, 5); ctx.stroke();
        ctx.fillStyle = '#cceeff';
        ctx.fillText(label, psx, by + 15);
        ctx.globalAlpha = 1;
      }

      // Minimap
      const MM_W = 100, MM_H = 75;
      minimapBoundsRef.current = { x: W - MM_W - 6, y: 6, w: MM_W, h: MM_H };
      drawMinimap(ctx, W, H, camX, camY, player.x, player.y, others);

      // Full map overlay
      if (showFullMapRef.current) {
        drawFullMap(ctx, W, H, player.x, player.y, others, nickname);
      }

      ctx.restore();

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []); // intentional empty deps – all state accessed via refs

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
}
