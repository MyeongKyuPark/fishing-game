import { useEffect, useRef } from 'react';
import { TILE_SIZE, MAP_W, MAP_H, TILE, RODS, ORES, HERBS, randInt } from './gameData';
import { playSwimSplash } from './soundManager';
import { getSettings } from './settingsManager';
import {
  CHAIR_RANGE, PLAYER_START_X, PLAYER_START_Y, pickOre, pickHerb,
  COOKING_TX, COOKING_TY,
  ZONE_CONNECTIONS, ZONE_TILES, ZONE_LABELS, ZONE_TRAVEL_NPCS,
  setActiveZone, getActiveZone, getActiveChairs, getActiveDoors,
  getActiveForest, getActiveMineEntrance,
} from './mapData';

import { PW, PH, MAX_SPEED, FRICTION, ACCEL } from './game/constants';
import { FARM_PLOT_POSITIONS, TREE_POSITIONS } from './game/decorationData';

import {
  getTile, canWalk, setActiveTiles,
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
  nickname, title, titleColor,
  otherPlayersRef, onPlayerInspect, onEnterRoom, onNearDoorChange, onNearActionChange,
  hairColor, bodyColor, skinColor, gender,
  spotDecos, onZoneTransition, onCancelReturn, onZoneBlocked, onZoneNpcInteract,
}) {
  const canvasRef = useRef(null);
  const cbRef = useRef({ onFishCaught, onOreMined, onHerbGathered, onActivityChange });
  const showFullMapRef = useRef(false);
  const weatherParticlesRef = useRef([]);
  const minimapBoundsRef = useRef({ x: 0, y: 0, w: 100, h: 75 });
  const otherPlayerScreenPosRef = useRef([]);
  const onPlayerInspectRef = useRef(onPlayerInspect);
  const onEnterRoomRef = useRef(onEnterRoom);
  const onNearDoorChangeRef = useRef(onNearDoorChange);
  const onNearActionChangeRef = useRef(onNearActionChange);
  const onZoneTransitionRef = useRef(onZoneTransition);
  const onCancelReturnRef = useRef(onCancelReturn);
  const onZoneBlockedRef = useRef(onZoneBlocked);
  const onZoneNpcInteractRef = useRef(onZoneNpcInteract);
  const nearZoneNpcRef = useRef(null);
  const nearDoorRef = useRef(null);
  const nearActionZoneRef = useRef(null);
  const zoneCooldownRef = useRef(false);
  const zoneLabelRef = useRef(null); // { text, expiry }
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
  useEffect(() => { onNearActionChangeRef.current = onNearActionChange; });
  useEffect(() => { onZoneTransitionRef.current = onZoneTransition; });
  useEffect(() => { onCancelReturnRef.current = onCancelReturn; });
  useEffect(() => { onZoneBlockedRef.current = onZoneBlocked; });
  useEffect(() => { onZoneNpcInteractRef.current = onZoneNpcInteract; });
  useEffect(() => { hairColorRef.current = hairColor ?? '#5a3010'; }, [hairColor]);
  useEffect(() => { bodyColorRef.current = bodyColor ?? '#5a7aaa'; }, [bodyColor]);
  useEffect(() => { skinColorRef.current = skinColor ?? '#f6cc88'; }, [skinColor]);
  useEffect(() => { genderRef.current = gender ?? 'male'; }, [gender]);

  useEffect(() => {
    cbRef.current = { onFishCaught, onOreMined, onHerbGathered, onActivityChange };
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
      if (e.key === ' ') {
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          if (gameRef.current) gameRef.current.keys[' '] = true;
        }
      }
      if (e.key === 'Enter') {
        if (document.activeElement?.tagName !== 'INPUT') {
          if (gameRef.current) gameRef.current.keys['Enter'] = true;
          if (nearDoorRef.current) onEnterRoomRef.current?.(nearDoorRef.current.id);
        }
      }
      if ((e.key === 'f' || e.key === 'F') && nearZoneNpcRef.current) {
        if (document.activeElement?.tagName !== 'INPUT') {
          onZoneNpcInteractRef.current?.(nearZoneNpcRef.current.id);
        }
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
    let isVisible = !document.hidden;

    function onVisibilityChange() {
      isVisible = !document.hidden;
      if (isVisible) {
        if (rafId) return; // already running — guard against double scheduling
        lastT = performance.now();
        rafId = requestAnimationFrame(loop);
      } else {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = undefined;
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    function loop(ts) {
      if (!isVisible) { rafId = undefined; return; }
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
            const spd = ACCEL * dt / 16;
            player.vx += (dx / dist) * spd;
            player.vy += (dy / dist) * spd;
            if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
            else player.facing = dy > 0 ? 'down' : 'up';
          }
        }
        const spd = ACCEL * dt / 16;
        const moving = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown || g.clickTarget;
        if (moving) onCancelReturnRef.current?.();
        if (keys.ArrowLeft)  { player.vx -= spd; player.facing = 'left';  g.clickTarget = null; }
        if (keys.ArrowRight) { player.vx += spd; player.facing = 'right'; g.clickTarget = null; }
        if (keys.ArrowUp)    { player.vy -= spd; player.facing = 'up';    g.clickTarget = null; }
        if (keys.ArrowDown)  { player.vy += spd; player.facing = 'down';  g.clickTarget = null; }

        player.vx = Math.max(-maxSpd, Math.min(maxSpd, player.vx));
        player.vy = Math.max(-maxSpd, Math.min(maxSpd, player.vy));

        const hasMarine = !!(gameRef.current?.marineGear);
        const nx = player.x + player.vx;
        const ny = player.y + player.vy;

        // ── Zone edge transition ───────────────────────────────────────────
        if (!zoneCooldownRef.current && player.state === 'idle') {
          const currentZone = gameRef.current?.worldZone ?? '마을';
          const conn = ZONE_CONNECTIONS[currentZone] ?? {};
          const tx = Math.floor(player.x / TILE_SIZE);
          const ty = Math.floor(player.y / TILE_SIZE);
          let transDir = null;
          if (player.vx < -0.1 && tx <= 0 && conn.west)           transDir = 'west';
          else if (player.vx > 0.1 && tx >= MAP_W - 2 && conn.east)  transDir = 'east';
          else if (player.vy < -0.1 && ty <= 0 && conn.north)        transDir = 'north';
          else if (player.vy > 0.1 && ty >= MAP_H - 2 && conn.south) transDir = 'south';

          if (transDir) {
            const nextZone = conn[transDir];
            const unlocked = gameRef.current?.unlockedZones;
            if (unlocked && !unlocked.includes(nextZone)) {
              // Zone locked — bounce player back and notify
              player.vx = 0; player.vy = 0;
              zoneCooldownRef.current = true;
              setTimeout(() => { zoneCooldownRef.current = false; }, 1500);
              onZoneBlockedRef.current?.(nextZone);
            } else {
              setActiveZone(nextZone);
              setActiveTiles(ZONE_TILES[nextZone]);
              if (transDir === 'west')  player.x = (MAP_W - 3) * TILE_SIZE;
              else if (transDir === 'east')  player.x = 3 * TILE_SIZE;
              else if (transDir === 'north') player.y = (MAP_H - 3) * TILE_SIZE;
              else if (transDir === 'south') player.y = 3 * TILE_SIZE;
              player.vx = 0; player.vy = 0;
              g.clickTarget = null;
              zoneCooldownRef.current = true;
              setTimeout(() => { zoneCooldownRef.current = false; }, 2000);
              zoneLabelRef.current = { text: ZONE_LABELS[nextZone] ?? nextZone, expiry: Date.now() + 3000 };
              onZoneTransitionRef.current?.(nextZone, transDir);
            }
          }
        }

        if (canWalk(nx, player.y, hasMarine)) player.x = Math.max(PW / 2, Math.min((MAP_W - 1) * TILE_SIZE - PW / 2, nx)); else player.vx = 0;
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
          cbRef.current.onActivityChange(null);
        } else if (player.activityStart !== null) {
          {
            player.activityProgress = Math.min((ts - player.activityStart) / player.activityDuration, 1);

            if (player.activityProgress >= 1) {
              if (player.state === 'fishing') {
                cbRef.current.onFishCaught(player.currentRod);
                const fishMult = g.fishTimeMult ?? 1.0;
                const [mn, mx] = RODS[player.currentRod].catchTimeRange.map(t => Math.max(1000, Math.round(t * fishMult)));
                player.activityDuration = randInt(mn, mx);
                player.activityStart = ts;
                player.activityProgress = 0;
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
        for (const dt of getActiveDoors()) {
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

      // ── Action zone proximity ──
      {
        let zone = null;
        for (const c of getActiveChairs()) {
          const cx = c.tx * TILE_SIZE + TILE_SIZE / 2;
          const cy = c.ty * TILE_SIZE + TILE_SIZE / 2;
          if (Math.hypot(player.x - cx, player.y - cy) <= CHAIR_RANGE) {
            zone = 'fish';
            break;
          }
        }
        if (!zone) {
          const ptx = player.x / TILE_SIZE;
          const pty = player.y / TILE_SIZE;
          const fz = getActiveForest();
          if (fz && ptx >= fz.tx1 && ptx <= fz.tx2 && pty >= fz.ty1 && pty <= fz.ty2) {
            zone = 'gather';
          }
        }
        if (zone !== nearActionZoneRef.current) {
          nearActionZoneRef.current = zone;
          onNearActionChangeRef.current?.(zone);
        }
        g.nearActionZone = zone;
      }

      // ── Zone traveling NPC proximity ──
      {
        const activeZone = getActiveZone();
        const zoneNpc = ZONE_TRAVEL_NPCS[activeZone] ?? null;
        let nearNpc = null;
        if (zoneNpc) {
          const nx2 = zoneNpc.tx * TILE_SIZE + TILE_SIZE / 2;
          const ny2 = zoneNpc.ty * TILE_SIZE + TILE_SIZE / 2;
          if (Math.hypot(player.x - nx2, player.y - ny2) <= TILE_SIZE * 2.5) {
            nearNpc = zoneNpc;
          }
        }
        nearZoneNpcRef.current = nearNpc;
        g.nearZoneNpc = nearNpc;
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

      // Buildings & signs (town-specific)
      if (getActiveZone() === '마을') {
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
      }

      // Fishing chairs + spot decorations
      const localPlayer = gameRef.current?.player;
      const myDecos = spotDecosRef.current;
      for (const c of getActiveChairs()) {
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

      // Trees (town-specific, quality-aware)
      if (getActiveZone() === '마을') {
        const quality = getSettings().canvasQuality;
        for (let ti = 0; ti < TREE_POSITIONS.length; ti++) {
          if (quality === 'low' && ti % 2 === 1) continue;
          const tp = TREE_POSITIONS[ti];
          const twx = tp.tx * TILE_SIZE - camX;
          const twy = tp.ty * TILE_SIZE - camY;
          if (twx > -60 && twx < W + 60 && twy > -80 && twy < H + 20)
            drawTree(ctx, twx, twy);
        }
      }

      // Mine entrance (town-specific)
      {
        const mineEnt = getActiveMineEntrance();
        if (mineEnt) {
          const mx = mineEnt.tx * TILE_SIZE - camX;
          const my = mineEnt.ty * TILE_SIZE - camY;
          if (mx > -6 * TILE_SIZE && mx < W && my > -5 * TILE_SIZE && my < H)
            drawMineEntrance(ctx, mx, my);
        }
      }

      // Weather
      drawWeatherParticles(ctx, W, H, weatherParticlesRef, gameRef.current?.weather?.id);

      // Area labels (town-specific)
      if (getActiveZone() === '마을') {
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
      }

      // Farm crops (town-specific)
      if (getActiveZone() === '마을') {
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

      // Zone transition label
      if (zoneLabelRef.current && Date.now() < zoneLabelRef.current.expiry) {
        const progress = 1 - (zoneLabelRef.current.expiry - Date.now()) / 3000;
        const alpha = progress < 0.7 ? 1 : (1 - (progress - 0.7) / 0.3);
        const yOff = progress < 0.1 ? H / 2 + 20 * (1 - progress / 0.1) : H / 2;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 22px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(W / 2 - 120, yOff - 28, 240, 42);
        ctx.fillStyle = '#fff';
        ctx.fillText(zoneLabelRef.current.text, W / 2, yOff);
        ctx.restore();
      } else if (zoneLabelRef.current && Date.now() >= zoneLabelRef.current.expiry) {
        zoneLabelRef.current = null;
      }

      // Zone traveling NPC rendering
      {
        const activeZone = getActiveZone();
        const zoneNpc = ZONE_TRAVEL_NPCS[activeZone];
        if (zoneNpc) {
          const nx2 = zoneNpc.tx * TILE_SIZE + TILE_SIZE / 2 - camX;
          const ny2 = zoneNpc.ty * TILE_SIZE + TILE_SIZE / 2 - camY;
          if (nx2 > -40 && nx2 < W + 40 && ny2 > -60 && ny2 < H + 20) {
            const bob = Math.sin(performance.now() / 600) * 2;
            // Shadow
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(nx2, ny2 + 14, 12, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Body circle
            ctx.fillStyle = zoneNpc.color + '33';
            ctx.strokeStyle = zoneNpc.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(nx2, ny2 - 8 + bob, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Emoji icon
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(zoneNpc.icon, nx2, ny2 - 8 + bob);
            ctx.textBaseline = 'alphabetic';
            // Name label
            ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
            ctx.textAlign = 'center';
            const nameW = ctx.measureText(zoneNpc.name).width;
            ctx.fillStyle = 'rgba(20,20,40,0.75)';
            ctx.beginPath();
            ctx.roundRect(nx2 - nameW / 2 - 5, ny2 - 34 + bob, nameW + 10, 16, 4);
            ctx.fill();
            ctx.fillStyle = zoneNpc.color;
            ctx.fillText(zoneNpc.name, nx2, ny2 - 22 + bob);
            // Interact hint when near
            if (nearZoneNpcRef.current?.id === zoneNpc.id) {
              const hint = '[F] 대화하기';
              const hw = ctx.measureText(hint).width;
              const pulse = 0.8 + 0.2 * Math.sin(performance.now() / 300);
              ctx.globalAlpha = pulse;
              ctx.fillStyle = 'rgba(20,20,40,0.85)';
              ctx.beginPath();
              ctx.roundRect(nx2 - hw / 2 - 7, ny2 - 54 + bob, hw + 14, 18, 5);
              ctx.fill();
              ctx.strokeStyle = zoneNpc.color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(nx2 - hw / 2 - 7, ny2 - 54 + bob, hw + 14, 18, 5);
              ctx.stroke();
              ctx.fillStyle = '#fff';
              ctx.fillText(hint, nx2, ny2 - 41 + bob);
              ctx.globalAlpha = 1;
            }
            ctx.restore();
          }
        }
      }

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

      // Zone atmosphere overlays
      {
        const az = getActiveZone();
        const t = performance.now();
        if (az === '북쪽고원') {
          // Fog: wispy horizontal gradient drifting slowly
          const drift = (t / 8000) % 1;
          const fogGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
          fogGrad.addColorStop(0, 'rgba(220,230,255,0.38)');
          fogGrad.addColorStop(0.4, 'rgba(200,215,255,0.18)');
          fogGrad.addColorStop(1, 'rgba(200,215,255,0.0)');
          ctx.fillStyle = fogGrad;
          ctx.fillRect(0, 0, W, H);
          // Wispy fog bands
          ctx.save();
          ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t / 2400);
          for (let i = 0; i < 3; i++) {
            const bx = ((drift + i / 3) % 1) * W * 1.5 - W * 0.25;
            const by = H * (0.08 + i * 0.09);
            const bw = W * 0.7 + i * 40;
            const bh = 28 + i * 10;
            const bg = ctx.createRadialGradient(bx + bw / 2, by, 0, bx + bw / 2, by, bw / 1.5);
            bg.addColorStop(0, 'rgba(235,242,255,0.7)');
            bg.addColorStop(1, 'rgba(235,242,255,0)');
            ctx.fillStyle = bg;
            ctx.fillRect(bx, by - bh / 2, bw, bh);
          }
          ctx.restore();
        } else if (az === '남쪽심해') {
          // Blue tint + animated caustic shimmer
          const wave = 0.07 + 0.03 * Math.sin(t / 1800);
          ctx.fillStyle = `rgba(0,60,120,${wave.toFixed(3)})`;
          ctx.fillRect(0, 0, W, H);
          // Light caustic ripples along the top
          ctx.save();
          ctx.globalAlpha = 0.08 + 0.04 * Math.sin(t / 900);
          const cg = ctx.createLinearGradient(0, 0, 0, H * 0.3);
          cg.addColorStop(0, 'rgba(100,200,255,0.5)');
          cg.addColorStop(1, 'rgba(100,200,255,0)');
          ctx.fillStyle = cg;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }
      }

      ctx.restore();

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []); // intentional empty deps – all state accessed via refs

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
}
