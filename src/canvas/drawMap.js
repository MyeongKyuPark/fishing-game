import { TILE_SIZE, MAP_W, MAP_H, TILE, TILE_COLOR, WALKABLE } from '../gameData';
import { MAP_TILES, FISHING_CHAIRS, COOKING_TX, COOKING_TY, MINE_ENTRANCE } from '../mapData';
import { PW, PH } from '../game/constants';
import { FARM_PLOT_POSITIONS, TREE_POSITIONS } from '../game/decorationData';

export function getTile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return TILE.WATER;
  return MAP_TILES[ty][tx];
}

export function canWalk(x, y, hasMarine = false) {
  const hw = PW / 2 - 1, hh = PH / 2 - 1;
  const ok = (cx, cy) => {
    const tile = getTile(Math.floor(cx / TILE_SIZE), Math.floor(cy / TILE_SIZE));
    if (hasMarine && tile === TILE.WATER) return true;
    return WALKABLE[tile] ?? false;
  };
  return ok(x - hw, y - hh) && ok(x + hw, y - hh) && ok(x - hw, y + hh) && ok(x + hw, y + hh);
}

export function drawTile(ctx, tx, ty, sx, sy) {
  const t = getTile(tx, ty);
  const now = Date.now();

  if (t === TILE.GRASS) {
    const v = ((tx * 7 + ty * 13) % 8) / 8;
    const r = 52 + Math.floor(v * 14);
    const g = 105 + Math.floor(v * 28);
    const b = 38 + Math.floor(v * 12);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
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
    const waveY = sy + TILE_SIZE * 0.45 + Math.sin(now / 700 + tx * 0.5) * 4;
    ctx.fillStyle = 'rgba(160,220,255,0.10)';
    ctx.fillRect(sx + 2, waveY, TILE_SIZE - 4, 3);
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
    const v = ((tx * 5 + ty * 11) % 8) / 8;
    const r = 30 + Math.floor(v * 12);
    const g = 72 + Math.floor(v * 20);
    const b = 22 + Math.floor(v * 10);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    const seed = tx * 17 + ty * 31;
    if (seed % 5 === 0) {
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

export function drawShopBuilding(ctx, camX, camY) {
  const bx = 1 * TILE_SIZE - camX;
  const by = 1 * TILE_SIZE - camY;
  const bw = 9 * TILE_SIZE;
  const bh = 10 * TILE_SIZE;
  const cx = bx + bw / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(bx + 8, by + 8, bw, bh);

  ctx.fillStyle = '#f0e2c0';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#d9c9a0';
  ctx.fillRect(bx, by + bh * 0.45, bw, bh * 0.55);

  ctx.fillStyle = '#8b5e30';
  [0.44, 0.72].forEach(r => ctx.fillRect(bx, by + bh * r, bw, 7));
  ctx.fillStyle = '#7a5028';
  [0, 1/3, 2/3, 1].forEach(r => ctx.fillRect(bx + bw * r - (r > 0 ? 4 : 0), by, 8, bh));

  ctx.fillStyle = '#5c2a0e';
  ctx.beginPath();
  ctx.moveTo(bx - 14, by + 2);
  ctx.lineTo(cx, by - 75);
  ctx.lineTo(bx + bw + 14, by + 2);
  ctx.closePath();
  ctx.fill();
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
  ctx.fillStyle = '#c07828';
  ctx.fillRect(bx - 16, by - 3, bw + 32, 8);
  ctx.fillStyle = '#ffcc66';
  ctx.fillRect(bx - 16, by - 3, bw + 32, 3);

  const lw = { x: bx + 38, y: by + 55, w: 52, h: 44 };
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
  ctx.fillStyle = '#7a4a18'; ctx.fillRect(lw.x - 4, lw.y + lw.h, lw.w + 8, 12);
  [['#ff7090',4], ['#ffcc44',14], ['#ff90b0',24], ['#88ddaa',34], ['#aaccff',44]].forEach(([c, o]) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(lw.x + 4 + o, lw.y + lw.h + 5, 5, 0, Math.PI * 2); ctx.fill();
  });

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

  const dw = 50, dh = 65, dx = cx - dw / 2, dy = by + bh - dh;
  ctx.fillStyle = '#5a2a08'; ctx.fillRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#8b5020'; ctx.lineWidth = 3;
  ctx.strokeRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,200,100,0.2)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(dx + 6, dy + 8, dw - 12, dh * 0.4);
  ctx.strokeRect(dx + 6, dy + dh * 0.5, dw - 12, dh * 0.4);
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(dx + dw - 10, dy + dh / 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#cc9900'; ctx.lineWidth = 1; ctx.stroke();

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

export function drawBankBuilding(ctx, camX, camY) {
  const bx = 1 * TILE_SIZE - camX;
  const by = 14 * TILE_SIZE - camY;
  const bw = 9 * TILE_SIZE;
  const bh = 4 * TILE_SIZE;
  const cx = bx + bw / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(bx + 6, by + 6, bw, bh);

  ctx.fillStyle = '#c8d0d8';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#b8c0c8';
  ctx.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);

  ctx.strokeStyle = '#a8b0b8'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(bx, by + bh * i / 4); ctx.lineTo(bx + bw, by + bh * i / 4);
    ctx.stroke();
  }
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + bw * i / 5, by); ctx.lineTo(bx + bw * i / 5, by + bh);
    ctx.stroke();
  }

  const colPositions = [bx + 28, bx + bw / 2 - 14, bx + bw / 2 + 14, bx + bw - 44];
  for (const colX of colPositions) {
    ctx.fillStyle = '#d8dce4';
    ctx.fillRect(colX, by, 16, bh);
    ctx.fillStyle = '#eef0f4';
    ctx.fillRect(colX + 2, by, 4, bh);
    ctx.fillStyle = '#b0b8c0';
    ctx.fillRect(colX - 4, by, 24, 8);
    ctx.fillRect(colX - 4, by + bh - 8, 24, 8);
  }

  ctx.fillStyle = '#d8dce4';
  ctx.beginPath();
  ctx.moveTo(bx - 8, by);
  ctx.lineTo(cx, by - 44);
  ctx.lineTo(bx + bw + 8, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8b0b8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.moveTo(bx + 20, by - 2);
  ctx.lineTo(cx, by - 36);
  ctx.lineTo(bx + bw - 20, by - 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#b0b8c0';
  ctx.fillRect(bx - 8, by, bw + 16, 10);

  const dw = 52, dh = 52, dx = cx - dw / 2, dy = by + bh - dh;
  ctx.fillStyle = '#5a6a7a';
  ctx.fillRect(dx, dy, dw, dh);
  ctx.fillStyle = '#4a5a6a';
  ctx.beginPath();
  ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#8a9aaa'; ctx.lineWidth = 3;
  ctx.strokeRect(dx, dy, dw, dh);
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

export function drawChair(ctx, sx, sy, occupied) {
  const cx = sx + TILE_SIZE / 2;
  const col = occupied ? '#4a2008' : '#7a4a20';
  const back = occupied ? '#3a1408' : '#6a3a18';
  ctx.fillStyle = back;
  ctx.fillRect(sx + 4, sy + 16, 5, 14); ctx.fillRect(sx + TILE_SIZE - 9, sy + 16, 5, 14);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.roundRect(sx + 3, sy + 13, TILE_SIZE - 6, 10, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = back;
  ctx.beginPath(); ctx.roundRect(sx + 4, sy + 2, TILE_SIZE - 8, 12, 4); ctx.fill();
  ctx.fillStyle = occupied ? '#220808' : '#5a2a10';
  ctx.beginPath(); ctx.roundRect(sx + 7, sy + 4, TILE_SIZE - 14, 8, 3); ctx.fill();
  ctx.fillStyle = col;
  ctx.fillRect(sx + 1, sy + 11, 5, 5); ctx.fillRect(sx + TILE_SIZE - 6, sy + 11, 5, 5);

  if (occupied) {
    ctx.fillStyle = 'rgba(255,80,80,0.75)';
    ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('사용중', cx, sy + 1);
  }
}

export function drawSpotDecos(ctx, sx, sy, decos, nickname) {
  const cx = sx + TILE_SIZE / 2;

  // 파라솔
  if (decos.includes('파라솔')) {
    const px = cx, py = sy - 10;
    // Pole
    ctx.fillStyle = '#9a7a4a';
    ctx.fillRect(px - 2, py - 28, 4, 38);
    // Canopy
    ctx.beginPath();
    ctx.moveTo(px, py - 28);
    ctx.bezierCurveTo(px - 28, py - 38, px - 36, py - 20, px - 38, py - 10);
    ctx.lineTo(px + 38, py - 10);
    ctx.bezierCurveTo(px + 36, py - 20, px + 28, py - 38, px, py - 28);
    ctx.closePath();
    const paraGrad = ctx.createRadialGradient(px, py - 28, 2, px, py - 20, 38);
    paraGrad.addColorStop(0, 'rgba(255,80,80,0.95)');
    paraGrad.addColorStop(0.5, 'rgba(255,200,50,0.9)');
    paraGrad.addColorStop(1, 'rgba(255,80,80,0.85)');
    ctx.fillStyle = paraGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Stripe lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
    for (let angle = -70; angle <= 70; angle += 35) {
      const rad = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(px, py - 28);
      ctx.lineTo(px + Math.sin(rad) * 38, py - 10 + Math.cos(rad) * 2);
      ctx.stroke();
    }
  }

  // 이름표
  if (decos.includes('이름표') && nickname) {
    const label = nickname;
    ctx.font = 'bold 10px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    const lw = ctx.measureText(label).width + 10;
    const lx = cx, ly = sy + TILE_SIZE + 14;
    ctx.fillStyle = 'rgba(30,20,10,0.82)';
    ctx.beginPath(); ctx.roundRect(lx - lw / 2, ly - 10, lw, 14, 4); ctx.fill();
    ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffe8a0';
    ctx.fillText(label, lx, ly);
    // Post
    ctx.fillStyle = '#9a7a4a';
    ctx.fillRect(cx - 1, sy + TILE_SIZE, 2, 8);
  }

  // 낚시의자 (upgrade indicator — golden sheen on chair)
  if (decos.includes('낚시의자')) {
    ctx.strokeStyle = 'rgba(255,200,50,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(sx + 2, sy + 1, TILE_SIZE - 4, TILE_SIZE - 2, 4); ctx.stroke();
  }

  // 미끼통
  if (decos.includes('미끼통')) {
    const bx = sx + TILE_SIZE + 2, by = sy + TILE_SIZE - 12;
    ctx.fillStyle = '#3a4a5a';
    ctx.beginPath(); ctx.roundRect(bx, by, 12, 10, 2); ctx.fill();
    ctx.strokeStyle = '#5a8aaa'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(bx + 2, by - 3, 8, 3);
  }
}

export function drawFishingSign(ctx, sx, sy) {
  const boardW = 108, boardH = 58;
  const bx = sx - boardW / 2, by = sy - boardH - 10;

  ctx.fillStyle = '#7a5230';
  ctx.fillRect(sx - 5, by + boardH, 10, 30);
  ctx.fillStyle = '#6a4220';
  ctx.fillRect(sx - 3, by + boardH, 6, 30);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, boardW, boardH, 8); ctx.fill();

  ctx.fillStyle = '#2d6845';
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, boardH, 8); ctx.fill();
  ctx.strokeStyle = '#5aaa78'; ctx.lineWidth = 2.5; ctx.stroke();

  ctx.fillStyle = '#4ec87a';
  ctx.beginPath(); ctx.roundRect(bx, by, boardW, 6, [8, 8, 0, 0]); ctx.fill();

  ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8ffe8';
  ctx.fillText('🎣 낚시터', sx, by + 24);

  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx + 12, by + 30); ctx.lineTo(bx + boardW - 12, by + 30); ctx.stroke();

  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(200,255,210,0.75)';
  ctx.fillText('의자에 앉아 !낚시', sx, by + 43);
  ctx.fillText('방향키로 취소', sx, by + 55);
}

export function drawCrop(ctx, wx, wy, pct, isReady, seedKey) {
  const cx = wx + TILE_SIZE / 2;
  const cy = wy + TILE_SIZE / 2;
  const now = Date.now();

  ctx.fillStyle = '#8a5c2a';
  ctx.beginPath(); ctx.ellipse(cx, wy + TILE_SIZE - 5, 11, 6, 0, 0, Math.PI * 2); ctx.fill();

  if (pct < 0.1) {
    ctx.fillStyle = '#6aaa44';
    ctx.beginPath(); ctx.arc(cx, wy + TILE_SIZE - 10, 3, 0, Math.PI * 2); ctx.fill();
    return;
  }

  const h = Math.min(20, Math.round(pct * 20));
  const stemY = wy + TILE_SIZE - 8;

  ctx.strokeStyle = '#4a8a28';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, stemY); ctx.lineTo(cx, stemY - h); ctx.stroke();

  if (pct < 0.5) {
    ctx.fillStyle = '#5aaa38';
    ctx.beginPath(); ctx.ellipse(cx - 5, stemY - h * 0.5, 5, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 5, stemY - h * 0.7, 5, 3, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (!isReady) {
    ctx.fillStyle = '#48b030';
    ctx.beginPath(); ctx.ellipse(cx - 7, stemY - h * 0.6, 7, 4, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 7, stemY - h * 0.8, 7, 4, 0.5, 0, Math.PI * 2); ctx.fill();
    const budColor = seedKey === '황금씨앗' ? '#ffdd00' : seedKey === '약초씨앗' ? '#88ee44' : '#ff8844';
    ctx.fillStyle = budColor;
    ctx.beginPath(); ctx.arc(cx, stemY - h, 4, 0, Math.PI * 2); ctx.fill();
  } else {
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

    ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2.5;
    ctx.strokeText('수확!', cx, wy + 4);
    ctx.fillText('수확!', cx, wy + 4);
  }
}

export function drawGoldenPondSign(ctx, sx, sy) {
  const boardW = 104, boardH = 46;
  const bx = sx - boardW / 2, by = sy - boardH - 8;
  const now = Date.now();

  ctx.fillStyle = '#5a4010';
  ctx.fillRect(sx - 4, by + boardH, 8, 22);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.roundRect(bx + 3, by + 3, boardW, boardH, 7); ctx.fill();

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

export function drawFreshwaterSign(ctx, sx, sy) {
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

export function drawCookingBuilding(ctx, camX, camY) {
  const bx = COOKING_TX * TILE_SIZE - camX - 2 * TILE_SIZE;
  const by = COOKING_TY * TILE_SIZE - camY - 8 * TILE_SIZE;
  const bw = 8 * TILE_SIZE;
  const bh = 8 * TILE_SIZE;
  const cx = bx + bw / 2;
  const now = Date.now();

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(bx + 8, by + 8, bw, bh);

  ctx.fillStyle = '#8a5030';
  ctx.fillRect(bx + bw * 0.65 - 12, by - 45, 24, 55);
  ctx.fillStyle = '#6a3a20';
  ctx.fillRect(bx + bw * 0.65 - 14, by - 48, 28, 10);
  for (let i = 0; i < 3; i++) {
    const t = (now / 1200 + i * 0.33) % 1;
    const smokeX = bx + bw * 0.65 + Math.sin(t * 4) * 6;
    const smokeY = by - 48 - t * 40;
    const smokeR = 5 + t * 8;
    ctx.fillStyle = `rgba(200,190,180,${0.45 - t * 0.45})`;
    ctx.beginPath(); ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = '#e8c8a0';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#d4b080';
  ctx.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);

  ctx.fillStyle = '#7a4828';
  [0.49].forEach(r => ctx.fillRect(bx, by + bh * r, bw, 7));
  [0, 1/3, 2/3, 1].forEach(r => ctx.fillRect(bx + bw * r - (r > 0 ? 4 : 0), by, 8, bh));

  ctx.fillStyle = '#6a2808';
  ctx.beginPath();
  ctx.moveTo(bx - 12, by + 2);
  ctx.lineTo(cx, by - 62);
  ctx.lineTo(bx + bw + 12, by + 2);
  ctx.closePath(); ctx.fill();
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

  const dw = 44, dh = 58, dx = cx - dw/2, dy = by + bh - dh;
  ctx.fillStyle = '#4a1e08'; ctx.fillRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy, dw/2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#8b4414'; ctx.lineWidth = 3; ctx.strokeRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy, dw/2, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(dx + dw - 9, dy + dh/2, 3, 0, Math.PI*2); ctx.fill();

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

export function drawInnBuilding(ctx, camX, camY) {
  const bx = 20 * TILE_SIZE - camX;
  const by = 1 * TILE_SIZE - camY;
  const bw = 9 * TILE_SIZE;
  const bh = 9 * TILE_SIZE;
  const cx = bx + bw / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(bx + 8, by + 8, bw, bh);

  ctx.fillStyle = '#e8daf0';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#d4c4e0';
  ctx.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);

  ctx.fillStyle = '#6a4888';
  [0.48].forEach(r => ctx.fillRect(bx, by + bh * r, bw, 6));
  [0, 1/3, 2/3, 1].forEach(r => ctx.fillRect(bx + bw * r - (r > 0 ? 4 : 0), by, 7, bh));

  ctx.fillStyle = '#5a2878';
  ctx.beginPath();
  ctx.moveTo(bx - 12, by + 2);
  ctx.lineTo(cx, by - 58);
  ctx.lineTo(bx + bw + 12, by + 2);
  ctx.closePath(); ctx.fill();
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

  const dw = 44, dh = 56, dx = cx - dw/2, dy2 = by + bh - dh;
  ctx.fillStyle = '#4a1e6a'; ctx.fillRect(dx, dy2, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy2, dw/2, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#8844aa'; ctx.lineWidth = 3; ctx.strokeRect(dx, dy2, dw, dh);
  ctx.beginPath(); ctx.arc(dx + dw/2, dy2, dw/2, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(dx + dw - 9, dy2 + dh/2, 3, 0, Math.PI*2); ctx.fill();

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

export function drawMineEntrance(ctx, sx, sy) {
  const ex = sx + TILE_SIZE, ey = sy + TILE_SIZE;
  const ew = 4 * TILE_SIZE, eh = 3.5 * TILE_SIZE;
  const mx = ex + ew / 2;
  const now = Date.now();

  for (let i = 0; i < 3; i++) {
    const vy = ((i * 7) % 5) * 8;
    ctx.fillStyle = `rgb(${72 + i*8},${68 + i*6},${62 + i*6})`;
    ctx.fillRect(ex - 14, ey + vy + i * 22, 16, 24);
    ctx.fillRect(ex + ew, ey + vy + i * 22, 16, 24);
  }

  ctx.fillStyle = '#06060c';
  ctx.beginPath();
  ctx.moveTo(ex + 6, ey + eh);
  ctx.lineTo(ex + 6, ey + 22);
  ctx.quadraticCurveTo(mx, ey - 14, ex + ew - 6, ey + 22);
  ctx.lineTo(ex + ew - 6, ey + eh);
  ctx.closePath(); ctx.fill();

  const glow = ctx.createRadialGradient(mx, ey + eh * 0.4, 10, mx, ey + eh * 0.4, 60);
  glow.addColorStop(0, 'rgba(255,160,30,0.18)');
  glow.addColorStop(1, 'rgba(255,160,30,0)');
  ctx.fillStyle = glow; ctx.fill();

  ctx.strokeStyle = '#6a4020'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex, ey + eh);
  ctx.lineTo(ex, ey + 20);
  ctx.quadraticCurveTo(mx, ey - 18, ex + ew, ey + 20);
  ctx.lineTo(ex + ew, ey + eh);
  ctx.stroke();
  ctx.strokeStyle = '#4a2810'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ex + 7, ey + eh);
  ctx.lineTo(ex + 7, ey + 24);
  ctx.quadraticCurveTo(mx, ey - 8, ex + ew - 7, ey + 24);
  ctx.lineTo(ex + ew - 7, ey + eh);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = '#6a4020';
  ctx.fillRect(ex, ey + 12, ew, 10);
  ctx.fillStyle = '#4a2810';
  ctx.fillRect(ex, ey + 12, ew, 3);

  const lx = mx, ly = ey + 30;
  const flicker = Math.sin(now / 180) * 0.15 + 0.85;
  ctx.strokeStyle = '#8b6040'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(lx, ey + 12); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.fillStyle = `rgba(255,${Math.floor(140 * flicker)},20,${0.9 * flicker})`;
  ctx.beginPath(); ctx.arc(lx, ly + 8, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8b6040'; ctx.lineWidth = 1.5; ctx.stroke();
  const lg = ctx.createRadialGradient(lx, ly + 8, 2, lx, ly + 8, 22);
  lg.addColorStop(0, `rgba(255,160,30,${0.35 * flicker})`);
  lg.addColorStop(1, 'rgba(255,100,0,0)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly + 8, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(lx - 6, ly, 12, 4);

  const sw = 80, sh = 26, sgy = ey - 42;
  ctx.fillStyle = '#7a5020';
  ctx.beginPath(); ctx.roundRect(mx - sw/2, sgy, sw, sh, 5); ctx.fill();
  ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff8e0'; ctx.font = 'bold 12px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⛏ 광산', mx, sgy + sh * 0.72);
}

export function drawTree(ctx, wx, wy) {
  const now = Date.now();
  const sway = Math.sin(now / 2200 + wx * 0.01) * 2;
  const tx = wx, ty = wy;
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(tx, ty + 5, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5228';
  ctx.fillRect(tx - 5, ty - 16, 10, 22);
  ctx.fillStyle = '#9a6a38';
  ctx.fillRect(tx - 3, ty - 16, 4, 22);
  const canopies = [
    { ox: sway * 0.3,  oy: -30, r: 22, col: '#2d7a3e' },
    { ox: -10 + sway * 0.5, oy: -40, r: 16, col: '#388a4a' },
    { ox: 10 + sway * 0.6,  oy: -42, r: 17, col: '#3a9050' },
    { ox: sway,        oy: -50, r: 14, col: '#44aa5a' },
  ];
  canopies.forEach(({ ox, oy, r, col }) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(tx + ox, ty + oy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.arc(tx + ox - r * 0.2, ty + oy - r * 0.25, r * 0.45, 0, Math.PI * 2); ctx.fill();
  });
}

export function drawFlowerPatch(ctx, wx, wy, seed) {
  const colors = ['#ff7098', '#ffcc44', '#ff9ac8', '#88ddff', '#ccaaff', '#ffaa66'];
  for (let i = 0; i < 4; i++) {
    const angle = (seed * 137.5 + i * 90) * Math.PI / 180;
    const dist = 5 + (i * seed % 5);
    const fx = wx + Math.cos(angle) * dist;
    const fy = wy + Math.sin(angle) * dist;
    const col = colors[(seed + i) % colors.length];
    ctx.strokeStyle = '#4a9a30'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, fy + 5); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffc0';
    ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

export { FARM_PLOT_POSITIONS, TREE_POSITIONS };
