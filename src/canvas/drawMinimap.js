import { TILE_SIZE, MAP_W, MAP_H } from '../gameData';
import { FISHING_CHAIRS } from '../mapData';

export function drawMinimap(ctx, W, H, camX, camY, playerX, playerY, otherPlayers) {
  const MW = 100, MH = 75;
  const MX = W - MW - 6, MY = 6;
  const sx = MW / (MAP_W * TILE_SIZE);
  const sy = MH / (MAP_H * TILE_SIZE);

  const fill = (color, tx1, ty1, tw, th) => {
    ctx.fillStyle = color;
    ctx.fillRect(MX + tx1 * TILE_SIZE * sx, MY + ty1 * TILE_SIZE * sy, tw * TILE_SIZE * sx + 0.5, th * TILE_SIZE * sy + 0.5);
  };

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(MX - 1, MY - 1, MW + 2, MH + 2);

  fill('rgba(50,100,40,0.95)',  0,  0, 30, 18);
  fill('rgba(28,72,22,0.95)',  30,  0, 15, 19);
  fill('rgba(80,70,65,0.95)',  45,  0, 25, 23);
  fill('rgba(180,155,60,0.9)',  0, 18, 45,  3);
  fill('rgba(110,80,15,0.95)',  3, 21, 40,  2);
  fill('rgba(110,80,15,0.95)', 20, 23, 11,  4);
  fill('rgba(20,70,180,0.95)',  0, 27, 45, 23);
  fill('rgba(20,70,180,0.95)', 45, 23, 25, 27);
  fill('rgba(130,105,65,0.9)',  0, 12, 45,  2);
  fill('rgba(60,35,20,0.95)',   1,  1,  9, 10);
  fill('rgba(70,25,10,0.95)',  11,  2,  8,  8);
  fill('rgba(60,35,20,0.95)',  20,  1,  9,  9);

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    MX + camX * sx, MY + camY * sy,
    Math.min(W * sx, MW), Math.min(H * sy, MH)
  );

  for (const op of (otherPlayers ?? [])) {
    ctx.fillStyle = '#00eeee';
    ctx.beginPath();
    ctx.arc(MX + op.x * sx, MY + op.y * sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffff44';
  ctx.beginPath();
  ctx.arc(MX + playerX * sx, MY + playerY * sy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(MX, MY, MW, MH);

  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('🗺', MX + MW - 2, MY + MH - 2);
}

export function drawFullMap(ctx, W, H, playerX, playerY, otherPlayers, nickname) {
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

  fill('rgba(50,100,40,0.95)',   0,  0, 30, 18);
  fill('rgba(28,72,22,0.95)',   30,  0, 15, 19);
  fill('rgba(80,70,65,0.95)',   45,  0, 25, 23);
  fill('rgba(180,155,60,0.9)',   0, 18, 45,  3);
  fill('rgba(110,80,15,0.95)',   3, 21, 40,  2);
  fill('rgba(110,80,15,0.95)',  20, 23, 11,  4);
  fill('rgba(20,70,180,0.95)',   0, 27, 45, 23);
  fill('rgba(20,70,180,0.95)',  45, 23, 25, 27);
  fill('rgba(130,105,65,0.9)',   0, 12, 45,  2);
  fill('rgba(60,35,20,0.95)',    1,  1,  9, 10);
  fill('rgba(70,25,10,0.95)',   11,  2,  8,  8);
  fill('rgba(60,35,20,0.95)',   20,  1,  9,  9);

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(OX, OY, MAP_W * TILE_SIZE * sc, MAP_H * TILE_SIZE * sc);

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

  for (const c of FISHING_CHAIRS) {
    ctx.fillStyle = '#c8a060';
    ctx.beginPath();
    ctx.arc(OX + (c.tx + 0.5) * TILE_SIZE * sc, OY + (c.ty + 0.5) * TILE_SIZE * sc, Math.max(3, sc * 6), 0, Math.PI * 2);
    ctx.fill();
  }

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

  ctx.font = 'bold 16px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('🗺 전체 지도', W / 2, OY - 14);

  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('클릭하여 닫기', W / 2, OY + MAP_H * TILE_SIZE * sc + 20);
}
