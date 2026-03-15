import { useEffect, useRef } from 'react';
import {
  TILE_SIZE, MAP_W, MAP_H, TILE, TILE_COLOR, WALKABLE, RODS, ORES, randInt,
} from './gameData';
import {
  MAP_TILES, FISHING_CHAIRS, MINE_ENTRANCE,
  PLAYER_START_X, PLAYER_START_Y, pickOre,
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

function canWalk(x, y) {
  const hw = PW / 2 - 1, hh = PH / 2 - 1;
  const ok = (cx, cy) => {
    const tile = getTile(Math.floor(cx / TILE_SIZE), Math.floor(cy / TILE_SIZE));
    return WALKABLE[tile] ?? false;
  };
  return ok(x - hw, y - hh) && ok(x + hw, y - hh) && ok(x - hw, y + hh) && ok(x + hw, y + hh);
}

function drawTile(ctx, tx, ty, sx, sy) {
  const t = getTile(tx, ty);
  ctx.fillStyle = TILE_COLOR[t] ?? '#333';
  ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

  if (t === TILE.WATER) {
    const wave = Math.floor(Date.now() / 600) % 2;
    if ((tx + ty + wave) % 3 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(sx + 4, sy + TILE_SIZE / 2 - 1, TILE_SIZE - 8, 2);
    }
  }
  if (t === TILE.GRASS) {
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
  }
  if (t === TILE.STONE) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
  }
  if (t === TILE.WOOD) {
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy + TILE_SIZE / 2);
    ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE / 2);
    ctx.stroke();
  }
}

function drawShopBuilding(ctx, camX, camY) {
  const bx = 1 * TILE_SIZE - camX;
  const by = 1 * TILE_SIZE - camY;
  const bw = 9 * TILE_SIZE;
  const bh = 10 * TILE_SIZE;

  // Roof
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(bx - 4, by - 6, bw + 8, 18);

  // Windows
  ctx.fillStyle = '#88aacc';
  ctx.fillRect(bx + 16, by + 34, 28, 22);
  ctx.fillRect(bx + bw - 44, by + 34, 28, 22);
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 16, by + 34, 28, 22);
  ctx.strokeRect(bx + bw - 44, by + 34, 28, 22);

  // Door
  ctx.fillStyle = '#2a1508';
  ctx.fillRect(bx + 100, by + bh - 28, 44, 28);
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 100, by + bh - 28, 44, 28);

  // Sign
  ctx.fillStyle = '#c8860a';
  ctx.fillRect(bx + bw / 2 - 38, by + 6, 76, 22);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏪  상  점', bx + bw / 2, by + 21);
}

function drawChair(ctx, sx, sy) {
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(sx + 4, sy + 14, TILE_SIZE - 8, TILE_SIZE - 18);
  ctx.fillStyle = '#4a2a0a';
  ctx.fillRect(sx + 4, sy + 4, TILE_SIZE - 8, 12);
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(sx + 2, sy + 10, 4, 16);
  ctx.fillRect(sx + TILE_SIZE - 6, sy + 10, 4, 16);
}

function drawMineEntrance(ctx, sx, sy) {
  // Cave arch
  const ex = sx + TILE_SIZE, ey = sy + TILE_SIZE;
  const ew = 4 * TILE_SIZE, eh = 3.5 * TILE_SIZE;
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.moveTo(ex, ey + eh);
  ctx.lineTo(ex, ey + 20);
  ctx.quadraticCurveTo(ex + ew / 2, ey - 16, ex + ew, ey + 20);
  ctx.lineTo(ex + ew, ey + eh);
  ctx.closePath();
  ctx.fill();

  // Wooden frame
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ex, ey + eh);
  ctx.lineTo(ex, ey + 20);
  ctx.quadraticCurveTo(ex + ew / 2, ey - 16, ex + ew, ey + 20);
  ctx.lineTo(ex + ew, ey + eh);
  ctx.stroke();

  // Sign
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(ex + ew / 2 - 32, ey - 32, 64, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⛏ 광 산', ex + ew / 2, ey - 18);
}

function drawPlayer(ctx, px, py, player, nickname) {
  const { facing, state, activityProgress } = player;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(px, py + PH / 2 + 2, PW / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyCol = state === 'fishing' ? '#2a6a3a' : state === 'mining' ? '#7a4a2a' : '#3a5a8a';
  ctx.fillStyle = bodyCol;
  ctx.fillRect(px - PW / 2, py - PH / 2 + 10, PW, PH - 10);

  // Head
  ctx.fillStyle = '#f4c17a';
  ctx.beginPath();
  ctx.arc(px, py - PH / 2 + 8, 9, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(px - 9, py - PH / 2, 18, 5);

  // Eyes
  ctx.fillStyle = '#222';
  const ey = py - PH / 2 + 8;
  if (facing === 'right')      { ctx.fillRect(px + 2, ey - 1, 3, 2); }
  else if (facing === 'left')  { ctx.fillRect(px - 5, ey - 1, 3, 2); }
  else if (facing === 'up')    { ctx.fillRect(px - 4, ey - 2, 2, 2); ctx.fillRect(px + 2, ey - 2, 2, 2); }
  else                         { ctx.fillRect(px - 4, ey,     2, 2); ctx.fillRect(px + 2, ey,     2, 2); }

  // Fishing rod
  if (state === 'fishing') {
    const bob = Math.sin(Date.now() / 900) * 4;
    ctx.strokeStyle = '#5a3a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 8, py - PH / 2 + 10);
    ctx.lineTo(px + 22 + bob, py + 10 + bob * 0.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(210,210,210,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 22 + bob, py + 10 + bob * 0.5);
    ctx.lineTo(px + 24 + bob, py + 22);
    ctx.stroke();
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(px + 24 + bob, py + 22 + Math.sin(Date.now() / 500) * 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pickaxe
  if (state === 'mining') {
    const swing = Math.sin(Date.now() / 180) * 0.9;
    ctx.save();
    ctx.translate(px + 8, py - PH / 2 + 12);
    ctx.rotate(swing);
    ctx.strokeStyle = '#909090';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 12);
    ctx.stroke();
    ctx.fillStyle = '#707070';
    ctx.fillRect(11, 8, 7, 6);
    ctx.restore();
  }

  // Progress bar
  if (state !== 'idle') {
    const bw = 44, bh = 6;
    const bx = px - bw / 2, by2 = py - PH / 2 - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx, by2, bw, bh);
    ctx.fillStyle = state === 'fishing' ? '#44aaff' : '#ffaa44';
    ctx.fillRect(bx, by2, bw * (activityProgress || 0), bh);
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

  // Nickname below character
  if (nickname) {
    const nameY = py + PH / 2 + 14;
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(nickname, px, nameY);
    ctx.fillStyle = '#e8e8ff';
    ctx.fillText(nickname, px, nameY);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GameCanvas({ gameRef, onFishCaught, onOreMined, onActivityChange, nickname }) {
  const canvasRef = useRef(null);
  const cbRef = useRef({ onFishCaught, onOreMined, onActivityChange });

  // Always keep callbacks fresh
  useEffect(() => {
    cbRef.current = { onFishCaught, onOreMined, onActivityChange };
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
        floatText: null,
      },
      keys: {},
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

      // ── Physics ──
      if (player.state === 'idle') {
        const spd = ACCEL * dt / 16;
        if (keys.ArrowLeft)  { player.vx -= spd; player.facing = 'left'; }
        if (keys.ArrowRight) { player.vx += spd; player.facing = 'right'; }
        if (keys.ArrowUp)    { player.vy -= spd; player.facing = 'up'; }
        if (keys.ArrowDown)  { player.vy += spd; player.facing = 'down'; }

        player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));
        player.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vy));

        const nx = player.x + player.vx;
        if (canWalk(nx, player.y)) player.x = nx; else player.vx = 0;
        const ny = player.y + player.vy;
        if (canWalk(player.x, ny)) player.y = ny; else player.vy = 0;

        player.vx *= FRICTION;
        player.vy *= FRICTION;
        if (Math.abs(player.vx) < 0.05) player.vx = 0;
        if (Math.abs(player.vy) < 0.05) player.vy = 0;

      } else {
        // Cancel on movement key
        if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) {
          player.state = 'idle';
          player.activityStart = null;
          player.activityProgress = 0;
          cbRef.current.onActivityChange(null);
        } else if (player.activityStart !== null) {
          player.activityProgress = Math.min((ts - player.activityStart) / player.activityDuration, 1);

          if (player.activityProgress >= 1) {
            if (player.state === 'fishing') {
              cbRef.current.onFishCaught(player.currentRod);
              const [mn, mx] = RODS[player.currentRod].catchTimeRange;
              player.activityDuration = randInt(mn, mx);
            } else if (player.state === 'mining') {
              cbRef.current.onOreMined(player.currentOre);
              player.currentOre = pickOre();
              const [mn, mx] = ORES[player.currentOre].mineRange;
              player.activityDuration = randInt(mn, mx);
            }
            player.activityStart = ts;
            player.activityProgress = 0;
          }
        }
      }

      // ── Camera ──
      const maxCX = Math.max(0, MAP_W * TILE_SIZE - W);
      const maxCY = Math.max(0, MAP_H * TILE_SIZE - H);
      const camX = Math.round(Math.max(0, Math.min(player.x - W / 2, maxCX)));
      const camY = Math.round(Math.max(0, Math.min(player.y - H / 2, maxCY)));

      // ── Render ──
      ctx.clearRect(0, 0, W, H);

      const stx = Math.max(0, Math.floor(camX / TILE_SIZE));
      const sty = Math.max(0, Math.floor(camY / TILE_SIZE));
      const etx = Math.min(MAP_W, Math.ceil((camX + W) / TILE_SIZE));
      const ety = Math.min(MAP_H, Math.ceil((camY + H) / TILE_SIZE));

      for (let ty = sty; ty < ety; ty++)
        for (let tx = stx; tx < etx; tx++)
          drawTile(ctx, tx, ty, tx * TILE_SIZE - camX, ty * TILE_SIZE - camY);

      // Shop building decoration
      const bsx = 1 * TILE_SIZE - camX, bsy = 1 * TILE_SIZE - camY;
      if (bsx < W && bsx + 10 * TILE_SIZE > 0 && bsy < H && bsy + 11 * TILE_SIZE > 0)
        drawShopBuilding(ctx, camX, camY);

      // Fishing chairs
      for (const c of FISHING_CHAIRS) {
        const sx = c.tx * TILE_SIZE - camX, sy = c.ty * TILE_SIZE - camY;
        if (sx > -TILE_SIZE && sx < W && sy > -TILE_SIZE && sy < H)
          drawChair(ctx, sx, sy);
      }

      // Mine entrance
      const mx = MINE_ENTRANCE.tx * TILE_SIZE - camX;
      const my = MINE_ENTRANCE.ty * TILE_SIZE - camY;
      if (mx > -6 * TILE_SIZE && mx < W && my > -5 * TILE_SIZE && my < H)
        drawMineEntrance(ctx, mx, my);

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

      // Player
      drawPlayer(ctx, player.x - camX, player.y - camY, player, nickname);

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
