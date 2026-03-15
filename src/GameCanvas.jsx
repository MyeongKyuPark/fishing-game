import { useEffect, useRef } from 'react';
import {
  TILE_SIZE, MAP_W, MAP_H, TILE, TILE_COLOR, WALKABLE, RODS, ORES, randInt,
} from './gameData';
import {
  MAP_TILES, FISHING_CHAIRS, MINE_ENTRANCE,
  PLAYER_START_X, PLAYER_START_Y, pickOre,
  COOKING_TX, COOKING_TY,
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

function drawChair(ctx, sx, sy, occupied) {
  ctx.fillStyle = occupied ? '#3a1a0a' : '#5a3a1a';
  ctx.fillRect(sx + 4, sy + 14, TILE_SIZE - 8, TILE_SIZE - 18);
  ctx.fillStyle = occupied ? '#2a0a00' : '#4a2a0a';
  ctx.fillRect(sx + 4, sy + 4, TILE_SIZE - 8, 12);
  ctx.fillStyle = occupied ? '#4a2a0a' : '#6a4a2a';
  ctx.fillRect(sx + 2, sy + 10, 4, 16);
  ctx.fillRect(sx + TILE_SIZE - 6, sy + 10, 4, 16);
  if (occupied) {
    ctx.fillStyle = 'rgba(255,80,80,0.7)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('사용중', sx + TILE_SIZE / 2, sy + 2);
  }
}

function drawFishingSign(ctx, sx, sy) {
  const boardW = 96, boardH = 52;
  const bx = sx - boardW / 2, by = sy - boardH - 12;

  // Post
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(sx - 4, by + boardH, 8, 28);

  // Board shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(bx + 3, by + 3, boardW, boardH);

  // Board body
  ctx.fillStyle = '#2a5a3a';
  ctx.fillRect(bx, by, boardW, boardH);
  ctx.strokeStyle = '#4a8a5a';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, boardW, boardH);

  // Top accent line
  ctx.fillStyle = '#4aaa6a';
  ctx.fillRect(bx, by, boardW, 5);

  // Title
  ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8f8e8';
  ctx.fillText('🎣 낚시터', sx, by + 22);

  // Sub text
  ctx.font = '10px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(200,240,200,0.8)';
  ctx.fillText('의자에 앉아 !낚시 입력', sx, by + 38);
  ctx.fillText('방향키로 취소', sx, by + 50);
}

function drawCookingBuilding(ctx, camX, camY) {
  const bx = COOKING_TX * TILE_SIZE - camX - 2 * TILE_SIZE;
  const by = COOKING_TY * TILE_SIZE - camY - 8 * TILE_SIZE;
  const bw = 8 * TILE_SIZE;
  const bh = 8 * TILE_SIZE;

  // Roof
  ctx.fillStyle = '#4a1a0a';
  ctx.fillRect(bx - 4, by - 6, bw + 8, 18);

  // Chimney smoke
  const smokeY = by - 24 + Math.sin(Date.now() / 700) * 3;
  ctx.fillStyle = 'rgba(200,200,200,0.35)';
  ctx.beginPath(); ctx.arc(bx + bw * 0.7, smokeY, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + bw * 0.7 - 6, smokeY - 12, 5, 0, Math.PI * 2); ctx.fill();

  // Windows
  ctx.fillStyle = '#ffcc88';
  ctx.fillRect(bx + 12, by + 28, 24, 18);
  ctx.fillRect(bx + bw - 36, by + 28, 24, 18);
  ctx.strokeStyle = '#5a2a10'; ctx.lineWidth = 2;
  ctx.strokeRect(bx + 12, by + 28, 24, 18);
  ctx.strokeRect(bx + bw - 36, by + 28, 24, 18);

  // Door
  ctx.fillStyle = '#2a0a00';
  ctx.fillRect(bx + 88, by + bh - 28, 40, 28);
  ctx.strokeStyle = '#8b4414'; ctx.lineWidth = 2;
  ctx.strokeRect(bx + 88, by + bh - 28, 40, 28);

  // Sign
  ctx.fillStyle = '#cc5500';
  ctx.fillRect(bx + bw / 2 - 40, by + 4, 80, 22);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍳 요리소', bx + bw / 2, by + 19);
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
  fill('rgba(50,100,40,0.95)',   0,  0, 27, 30);
  fill('rgba(80,70,65,0.95)',   27,  0, 13, 19);
  fill('rgba(180,155,60,0.9)',   0, 17, 27,  2);
  fill('rgba(110,80,15,0.95)',   3, 19, 22,  2);
  fill('rgba(20,70,180,0.95)',   0, 21, 27,  9);
  fill('rgba(20,70,180,0.95)',  27, 19, 13, 11);
  fill('rgba(130,105,65,0.9)',   0, 12, 27,  2);
  fill('rgba(60,35,20,0.95)',    1,  1,  9, 10);
  fill('rgba(70,25,10,0.95)',   11,  2,  8,  8);

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
  label('🎣 낚시터', 13, 20);
  label('⛏ 광산',   33,  9);

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
  fill('rgba(50,100,40,0.95)',  0,  0, 27, 30); // grass base
  fill('rgba(80,70,65,0.95)',  27,  0, 13, 19); // mine
  fill('rgba(180,155,60,0.9)',  0, 17, 27,  2); // sand
  fill('rgba(110,80,15,0.95)',  3, 19, 22,  2); // dock
  fill('rgba(20,70,180,0.95)',  0, 21, 27,  9); // water
  fill('rgba(20,70,180,0.95)', 27, 19, 13, 11); // mine water
  fill('rgba(130,105,65,0.9)',  0, 12, 27,  2); // main path
  fill('rgba(60,35,20,0.95)',   1,  1,  9, 10); // shop
  fill('rgba(70,25,10,0.95)',  11,  2,  8,  8); // cooking

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

function drawPlayer(ctx, px, py, player, nickname, title, titleColor) {
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

  // Title + Nickname below character
  if (nickname) {
    ctx.textAlign = 'center';
    // Title
    if (title && title !== '신입') {
      const titleY = py + PH / 2 + 13;
      ctx.font = '9px "Noto Sans KR", sans-serif';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 2.5;
      ctx.strokeText(`[${title}]`, px, titleY);
      ctx.fillStyle = titleColor ?? '#aaaaaa';
      ctx.fillText(`[${title}]`, px, titleY);
    }
    const nameY = py + PH / 2 + (title && title !== '신입' ? 23 : 14);
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(nickname, px, nameY);
    ctx.fillStyle = '#e8e8ff';
    ctx.fillText(nickname, px, nameY);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GameCanvas({ gameRef, onFishCaught, onOreMined, onActivityChange, nickname, title, titleColor, otherPlayersRef, onPlayerInspect }) {
  const canvasRef = useRef(null);
  const cbRef = useRef({ onFishCaught, onOreMined, onActivityChange });
  const showFullMapRef = useRef(false);
  const minimapBoundsRef = useRef({ x: 0, y: 0, w: 100, h: 75 });
  const otherPlayerScreenPosRef = useRef([]); // [{op, sx, sy}] updated each frame
  const onPlayerInspectRef = useRef(onPlayerInspect);
  useEffect(() => { onPlayerInspectRef.current = onPlayerInspect; });

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

      // Cooking building decoration
      const ckx = COOKING_TX * TILE_SIZE - camX, cky = COOKING_TY * TILE_SIZE - camY;
      if (ckx > -10 * TILE_SIZE && ckx < W + 2 * TILE_SIZE && cky > -10 * TILE_SIZE && cky < H)
        drawCookingBuilding(ctx, camX, camY);

      // Fishing area sign (tx=13, ty=17 — top of sand beach)
      {
        const sx = 13 * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = 17 * TILE_SIZE - camY;
        if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80)
          drawFishingSign(ctx, sx, sy);
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
      drawPlayer(ctx, player.x - camX, player.y - camY, player, nickname, title, titleColor);

      // Minimap
      const MM_W = 100, MM_H = 75;
      minimapBoundsRef.current = { x: W - MM_W - 6, y: 6, w: MM_W, h: MM_H };
      drawMinimap(ctx, W, H, camX, camY, player.x, player.y, others);

      // Full map overlay
      if (showFullMapRef.current) {
        drawFullMap(ctx, W, H, player.x, player.y, others, nickname);
      }

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
