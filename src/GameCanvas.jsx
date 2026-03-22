import { useEffect, useRef } from 'react';
import { TILE_SIZE, MAP_W, MAP_H, TILE, RODS, ORES, HERBS, randInt } from './gameData';
import { playSwimSplash } from './soundManager';
import { getSettings } from './settingsManager';
import {
  FISHING_CHAIRS, MINE_ENTRANCE,
  PLAYER_START_X, PLAYER_START_Y, pickOre, pickHerb,
  COOKING_TX, COOKING_TY, DOOR_TRIGGERS,
} from './mapData';

import { PW, PH, MAX_SPEED, FRICTION, ACCEL } from './game/constants';
import { FARM_PLOT_POSITIONS, TREE_POSITIONS } from './game/decorationData';

import {
  getTile, canWalk,
  drawTile, drawFlowerPatch, drawTree, drawChair, drawSpotDecos,
  drawShopBuilding, drawBankBuilding, drawCookingBuilding, drawInnBuilding,
  drawFishingSign, drawGoldenPondSign, drawFreshwaterSign,
  drawCrop, drawMineEntrance,
} from './canvas/drawMap';

import { drawPlayer } from './canvas/drawPlayer';
import { drawMinimap, drawFullMap } from './canvas/drawMinimap';
import {
  drawWeatherParticles, drawLevelUpEffect, drawGradeUpEffect,
  drawRareEffect, drawFishParticles, drawTreasureEffect,
  drawQuestCompleteEffect, drawScreenShake,
} from './canvas/drawEffects';

export default function GameCanvas({
  gameRef, onFishCaught, onOreMined, onHerbGathered, onActivityChange,
  onFishBite, onFishEscaped, nickname, title, titleColor,
  otherPlayersRef, onPlayerInspect, onEnterRoom, onNearDoorChange,
  hairColor, bodyColor, skinColor, gender,
  spotDecos,
}) {
  const canvasRef = useRef(null);
  const cbRef = useRef({ onFishCaught, onOreMined, onHerbGathered, onActivityChange, onFishBite, onFishEscaped });
  const showFullMapRef = useRef(false);
  const weatherParticlesRef = useRef([]);
  const minimapBoundsRef = useRef({ x: 0, y: 0, w: 100, h: 75 });
  const otherPlayerScreenPosRef = useRef([]);
  const onPlayerInspectRef = useRef(onPlayerInspect);
  const onEnterRoomRef = useRef(onEnterRoom);
  const onNearDoorChangeRef = useRef(onNearDoorChange);
  const nearDoorRef = useRef(null);
  const lastSplashRef = useRef(0);
  const hairColorRef = useRef(hairColor ?? '#5a3010');
  const bodyColorRef = useRef(bodyColor ?? '#5a7aaa');
  const skinColorRef = useRef(skinColor ?? '#f6cc88');
  const genderRef = useRef(gender ?? 'male');
  const spotDecosRef = useRef(spotDecos ?? []);

  useEffect(() => { spotDecosRef.current = spotDecos ?? []; }, [spotDecos]);
  useEffect(() => { onPlayerInspectRef.current = onPlayerInspect; });
  useEffect(() => { onEnterRoomRef.current = onEnterRoom; });
  useEffect(() => { onNearDoorChangeRef.current = onNearDoorChange; });
  useEffect(() => { hairColorRef.current = hairColor ?? '#5a3010'; }, [hairColor]);
  useEffect(() => { bodyColorRef.current = bodyColor ?? '#5a7aaa'; }, [bodyColor]);
  useEffect(() => { skinColorRef.current = skinColor ?? '#f6cc88'; }, [skinColor]);
  useEffect(() => { genderRef.current = gender ?? 'male'; }, [gender]);

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

  // Click events: toggle full map, click-to-move, double-click inspect
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
      let best = null, bestDist = 32;
      for (const { op, sx, sy } of otherPlayerScreenPosRef.current) {
        const d = Math.hypot(cx - sx, cy - sy);
        if (d < bestDist) { bestDist = d; best = op; }
      }
      if (best) onPlayerInspectRef.current?.(best);
    };

    const onClickMove = (e) => {
      if (showFullMapRef.current) return;
      const { cx, cy } = getCanvasPos(e);
      const mb = minimapBoundsRef.current;
      if (cx >= mb.x && cx <= mb.x + mb.w && cy >= mb.y && cy <= mb.y + mb.h) return;
      const g = gameRef.current;
      if (!g?.player || g.player.state !== 'idle') return;
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

  // Keyboard events
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

  // Main game loop
  useEffect(() => {
    let rafId;
    let lastT = performance.now();

    function loop(ts) {
      const dt = Math.min(ts - lastT, 50);
      lastT = ts;

      const canvas = canvasRef.current;
      const g = gameRef.current;
      if (!canvas || !g || !g.player) { rafId = requestAnimationFrame(loop); return; }

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
        if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) {
          player.state = 'idle';
          player.activityStart = null;
          player.activityProgress = 0;
          g.reelIn = false;
          cbRef.current.onActivityChange(null);
        } else if (player.activityStart !== null) {
          if (player.state === 'bite' && g.reelIn) {
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
                player.state = 'bite';
                player.activityDuration = 2500;
                cbRef.current.onFishBite?.();
                cbRef.current.onActivityChange('bite');
              } else if (player.state === 'bite') {
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
          if (closestDoor && player.state === 'idle') {
            onEnterRoomRef.current?.(closestDoor.id);
          }
        }
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

      const { shakeX, shakeY } = drawScreenShake(ctx, gameRef.current);
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

      // Buildings
      const bsx = 1 * TILE_SIZE - camX, bsy = 1 * TILE_SIZE - camY;
      if (bsx < W && bsx + 10 * TILE_SIZE > 0 && bsy < H && bsy + 11 * TILE_SIZE > 0)
        drawShopBuilding(ctx, camX, camY);

      const ckx = COOKING_TX * TILE_SIZE - camX, cky = COOKING_TY * TILE_SIZE - camY;
      if (ckx > -10 * TILE_SIZE && ckx < W + 2 * TILE_SIZE && cky > -10 * TILE_SIZE && cky < H)
        drawCookingBuilding(ctx, camX, camY);

      const innbx = 20 * TILE_SIZE - camX, innby = 1 * TILE_SIZE - camY;
      if (innbx > -12 * TILE_SIZE && innbx < W + 2 * TILE_SIZE && innby > -10 * TILE_SIZE && innby < H)
        drawInnBuilding(ctx, camX, camY);

      {
        const sx = 13 * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = 18 * TILE_SIZE - camY;
        if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80)
          drawFishingSign(ctx, sx, sy);
      }

      {
        const bbx = 1 * TILE_SIZE - camX, bby = 14 * TILE_SIZE - camY;
        if (bbx < W + 2 * TILE_SIZE && bbx + 9 * TILE_SIZE > 0 && bby < H + TILE_SIZE && bby + 4 * TILE_SIZE > 0)
          drawBankBuilding(ctx, camX, camY);
      }

      {
        const sx = 19 * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = 15 * TILE_SIZE - camY;
        if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80)
          drawFreshwaterSign(ctx, sx, sy);
      }

      {
        const sx = 38 * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = 8 * TILE_SIZE - camY;
        if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80)
          drawGoldenPondSign(ctx, sx, sy);
      }

      // Fishing chairs + spot decorations
      const localPlayer = gameRef.current?.player;
      const myDecos = spotDecosRef.current;
      for (const c of FISHING_CHAIRS) {
        const cx = c.tx * TILE_SIZE + TILE_SIZE / 2;
        const cy = c.ty * TILE_SIZE + TILE_SIZE / 2;
        const occupied = (otherPlayersRef?.current ?? []).some(op =>
          op.state === 'fishing' && Math.hypot(op.x - cx, op.y - cy) < 2 * TILE_SIZE
        );
        const sx = c.tx * TILE_SIZE - camX, sy = c.ty * TILE_SIZE - camY;
        if (sx > -TILE_SIZE && sx < W && sy > -TILE_SIZE && sy < H) {
          drawChair(ctx, sx, sy, occupied);
          // Render spot decos when local player is fishing at this chair
          const isMyChair = localPlayer?.state === 'fishing' && Math.hypot(localPlayer.x - cx, localPlayer.y - cy) < 2 * TILE_SIZE;
          if (isMyChair && myDecos.length > 0) {
            drawSpotDecos(ctx, sx, sy, myDecos, nickname);
          }
        }
      }

      // Trees (quality-aware: skip every other tree in low quality mode)
      const quality = getSettings().canvasQuality;
      for (let ti = 0; ti < TREE_POSITIONS.length; ti++) {
        if (quality === 'low' && ti % 2 === 1) continue;
        const tp = TREE_POSITIONS[ti];
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

      // Weather
      drawWeatherParticles(ctx, W, H, weatherParticlesRef, gameRef.current?.weather?.id);

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

      // Farm crops
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

      // Visual effects
      drawLevelUpEffect(ctx, W, H, gameRef.current);
      drawGradeUpEffect(ctx, W, H, gameRef.current);
      drawRareEffect(ctx, W, H, gameRef.current, player.x - camX, player.y - camY);
      drawFishParticles(ctx, gameRef.current, camX, camY);
      drawTreasureEffect(ctx, W, H, gameRef.current);
      drawQuestCompleteEffect(ctx, W, H, gameRef.current);

      // Marine gear: water ripples + boat hull (before player)
      const marineGearKey = gameRef.current?.marineGear ?? null;
      if (marineGearKey) {
        const psx = player.x - camX, psy = player.y - camY;
        const tile = getTile(Math.floor(player.x / TILE_SIZE), Math.floor(player.y / TILE_SIZE));
        if (tile === TILE.WATER) {
          ctx.save();
          if (marineGearKey === '보트') {
            ctx.fillStyle = '#7a4010';
            ctx.beginPath(); ctx.moveTo(psx - 18, psy + 12); ctx.lineTo(psx + 18, psy + 12);
            ctx.lineTo(psx + 22, psy + 20); ctx.lineTo(psx - 22, psy + 20); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#cc6633';
            ctx.beginPath(); ctx.roundRect(psx - 18, psy + 8, 36, 6, 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.roundRect(psx - 16, psy + 9, 32, 2, 1); ctx.fill();
          }
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

      // My player
      drawPlayer(
        ctx, player.x - camX, player.y - camY, player,
        nickname, title, titleColor,
        hairColorRef.current, bodyColorRef.current, skinColorRef.current, genderRef.current,
        marineGearKey, gameRef.current?.equippedItems ?? {},
      );

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
