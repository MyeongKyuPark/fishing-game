import { PH } from '../game/constants';

export function drawPlayer(ctx, px, py, player, nickname, title, titleColor, hairColor, bodyColor, skinColor, gender, marineGear = null, equippedItems = {}) {
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

  // ── 5. 직업별 아우라 (shadow 아래에 먼저 그림) ──────────────────────────────
  if (title) {
    const auraMap = {
      '전설 낚시꾼': 'rgba(255,215,0,',
      '마스터 광부': 'rgba(255,136,68,',
      '대상인':      'rgba(170,68,255,',
    };
    const auraBase = auraMap[title];
    if (auraBase) {
      const pulse = 0.38 + 0.18 * Math.sin(now / 700);
      const aura = ctx.createRadialGradient(px, py - 4, 0, px, py - 4, 30);
      aura.addColorStop(0,   `${auraBase}${pulse})`);
      aura.addColorStop(0.55, `${auraBase}${(pulse * 0.35).toFixed(3)})`);
      aura.addColorStop(1,   `${auraBase}0)`);
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(px, py - 4, 30, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── 1. 그림자 (RadialGradient) ────────────────────────────────────────────
  const shadowGrad = ctx.createRadialGradient(px, py + 14, 0, px, py + 14, 16);
  shadowGrad.addColorStop(0,   'rgba(0,0,0,0.28)');
  shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
  shadowGrad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const defaultBodyColor = bodyColor ?? '#5a7aaa';
  let bodyCol, bodyColDark;
  if (isScuba) {
    bodyCol = '#1a3a6a';
    bodyColDark = '#08152a';
  } else {
    bodyCol = state === 'fishing' ? '#4a9a60' : state === 'mining' ? '#c47840' : defaultBodyColor;
    bodyColDark = state === 'fishing' ? '#2e7040' : state === 'mining' ? '#8a4e20' : '#3a5280';
  }

  // ── 2. 걷기 bobbing ──────────────────────────────────────────────────────
  const isMoving = (player.vx !== undefined) ? (Math.abs(player.vx) + Math.abs(player.vy) > 0.2) : false;
  const bodyBob = isMoving ? Math.sin(now / 150) * 1.5 : 0;

  // O2 tank (scuba, bobs with body)
  if (isScuba) {
    ctx.fillStyle = '#778899';
    ctx.beginPath(); ctx.roundRect(px - 15, py - 7 + bodyBob, 6, 13, 3); ctx.fill();
    ctx.fillStyle = '#99aabb';
    ctx.beginPath(); ctx.roundRect(px - 14, py - 6 + bodyBob, 4, 5, 2); ctx.fill();
    ctx.fillStyle = '#555566';
    ctx.beginPath(); ctx.roundRect(px - 13, py - 9 + bodyBob, 3, 3, 1); ctx.fill();
  }

  // Legs & feet (grounded — no bob)
  const legSwing = isMoving ? Math.sin(now / 130) * 4 : 0;
  if (isScuba) {
    ctx.fillStyle = '#000077';
    ctx.beginPath(); ctx.ellipse(px - 5, py + 14 + legSwing, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 5, py + 14 - legSwing, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0000aa';
    ctx.beginPath(); ctx.ellipse(px - 10, py + 14 + legSwing, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 10, py + 14 - legSwing, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    const bootColors = { '기본신발': '#3a2810', '빠른신발': '#4488cc', '질풍신발': '#cc6622' };
    const bootCol = bootColors[boots] ?? '#3a2810';
    ctx.fillStyle = bootCol;
    ctx.beginPath(); ctx.ellipse(px - 5, py + 14 + legSwing, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 5, py + 14 - legSwing, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    if (boots === '질풍신발' && isMoving) {
      ctx.strokeStyle = 'rgba(255,200,80,0.65)'; ctx.lineWidth = 1.2;
      for (let li = 0; li < 3; li++) {
        const lx = px - 14 + li * 5;
        ctx.beginPath(); ctx.moveTo(lx, py + 16); ctx.lineTo(lx - 6, py + 14); ctx.stroke();
      }
    }
  }
  ctx.fillStyle = isScuba ? '#0a1a4a' : '#4a5070';
  ctx.beginPath(); ctx.roundRect(px - 8, py + 4, 6, 11 + legSwing * 0.5, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(px + 2, py + 4, 6, 11 - legSwing * 0.5, 3); ctx.fill();

  // Body (bobs with bodyBob)
  ctx.fillStyle = bodyCol;
  ctx.beginPath(); ctx.roundRect(px - 9, py - 6 + bodyBob, 18, 12, 4); ctx.fill();
  ctx.fillStyle = isScuba ? 'rgba(100,180,255,0.18)' : 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.roundRect(px - 7, py - 4 + bodyBob, 7, 6, 3); ctx.fill();
  ctx.fillStyle = bodyColDark;
  ctx.beginPath(); ctx.roundRect(px - 9, py + 2 + bodyBob, 18, 4, [0, 0, 4, 4]); ctx.fill();
  if (isScuba) {
    ctx.fillStyle = '#0066cc';
    ctx.beginPath(); ctx.roundRect(px - 9, py - 1 + bodyBob, 18, 3, 0); ctx.fill();
  }

  if (necklace && !isScuba) {
    const necklaceColors = {
      '철반지': null, '청동목걸이': '#cc9944', '수정반지': null, '황금목걸이': '#ffd700',
    };
    const neckCol = necklaceColors[necklace];
    if (neckCol) {
      ctx.strokeStyle = neckCol; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py - 5 + bodyBob, 7, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.fillStyle = necklace === '황금목걸이' ? '#ffd700' : '#88ccff';
      ctx.beginPath(); ctx.arc(px, py + 2 + bodyBob, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(px - 0.8, py + 1 + bodyBob, 1, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Arms (bob with body)
  if (state !== 'fishing' && state !== 'mining') {
    ctx.fillStyle = isScuba ? '#1a3a6a' : bodyCol;
    ctx.beginPath(); ctx.roundRect(px - 14, py - 4 + bodyBob, 5, 10, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(px + 9, py - 4 + bodyBob, 5, 10, 3); ctx.fill();
    ctx.fillStyle = isScuba ? '#000077' : '#f6cc88';
    ctx.beginPath(); ctx.arc(px - 12, py + 7 + bodyBob, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 12, py + 7 + bodyBob, 3.5, 0, Math.PI * 2); ctx.fill();
    if (ring && !isScuba) {
      const ringColors = { '철반지': '#aaaaaa', '수정반지': '#66aaff', '청동목걸이': null, '황금목걸이': null };
      const ringCol = ringColors[ring];
      if (ringCol) {
        ctx.fillStyle = ringCol;
        ctx.beginPath(); ctx.arc(px + 12, py + 7 + bodyBob, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(px + 13, py + 6 + bodyBob, 1.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Head (bobs with bodyBob)
  const headY = py - 14 + bodyBob;
  const skin = skinColor ?? '#f6cc88';
  const isFemale = gender === 'female';
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(px, headY, 12, 0, Math.PI * 2); ctx.fill();
  if (!isScuba) {
    ctx.fillStyle = 'rgba(255,120,120,0.38)';
    ctx.beginPath(); ctx.ellipse(px - 8, headY + 3, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 8, headY + 3, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
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
  ctx.fillStyle = 'rgba(255,200,120,0.18)';
  ctx.beginPath(); ctx.arc(px - 3, headY - 8, 5, 0, Math.PI * 2); ctx.fill();

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

  if (isScuba) {
    ctx.fillStyle = 'rgba(60,140,255,0.55)';
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 5, 22, 11, 6); ctx.fill();
    ctx.strokeStyle = '#1a2255';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 5, 22, 11, 6); ctx.stroke();
    ctx.fillStyle = 'rgba(200,235,255,0.45)';
    ctx.beginPath(); ctx.roundRect(px - 9, headY - 3, 6, 4, 3); ctx.fill();
    ctx.strokeStyle = '#1a2255'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px - 11, headY + 1); ctx.lineTo(px - 14, headY + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 11, headY + 1); ctx.lineTo(px + 14, headY + 1); ctx.stroke();
    ctx.fillStyle = '#99aabb';
    ctx.beginPath(); ctx.roundRect(px - 4, headY + 5, 8, 4, 2); ctx.fill();
  }

  if (isBoat) {
    ctx.fillStyle = '#1a2a50';
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 22, 22, 10, [4, 4, 0, 0]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(px - 14, headY - 13, 28, 4, 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(px - 11, headY - 14, 22, 2, 0); ctx.fill();
    ctx.font = 'bold 7px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('⚓', px, headY - 16);
  }

  if (state === 'fishing' || state === 'bite') {
    const t = now / 1000;

    if (isSea && isScuba) {
      const armX = px + 10, armY = py;
      const rodEndX = armX + 3;
      const rodEndY = py + 26 + Math.sin(t * 1.2) * 2;

      ctx.fillStyle = '#1a3a6a';
      ctx.beginPath(); ctx.roundRect(px + 9, py - 2, 5, 14, 3); ctx.fill();
      ctx.fillStyle = '#000077';
      ctx.beginPath(); ctx.arc(px + 12, py + 13, 3.5, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#7a5020'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(armX, armY);
      ctx.quadraticCurveTo(armX + 5, py + 14, rodEndX, rodEndY);
      ctx.stroke();
      ctx.fillStyle = '#c89040';
      ctx.beginPath(); ctx.arc(rodEndX, rodEndY, 2, 0, Math.PI * 2); ctx.fill();

      const hookY = rodEndY + 20 + Math.sin(t * 0.8) * 3;
      ctx.strokeStyle = 'rgba(200,220,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rodEndX, rodEndY); ctx.lineTo(rodEndX + 1, hookY); ctx.stroke();
      ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(rodEndX + 1, hookY + 3, 3, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      for (let b = 0; b < 3; b++) {
        const bAge = ((now / 700 + b * 0.33) % 1);
        const bx = rodEndX - 3 + b * 3 + Math.sin(bAge * Math.PI * 2) * 2;
        const by = hookY - bAge * 28;
        ctx.fillStyle = `rgba(150,220,255,${0.6 - bAge * 0.5})`;
        ctx.beginPath(); ctx.arc(bx, by, 1.8 * (1 - bAge * 0.4), 0, Math.PI * 2); ctx.fill();
      }

    } else if (isSea && isBoat) {
      const leanX = 5 + Math.sin(t * 0.5) * 1.5;
      const rodBaseX = px + leanX, rodBaseY = py - PH / 2 + 12;
      const tipBob = Math.sin(t * 1.1) * 3;
      const rodTipX = rodBaseX + 34 + tipBob * 0.4;
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

      // ── 4. 찌 물결 3개, 두께 1.5px, 간격 넓게 ──
      const ringPeriod2 = isBite2 ? 600 : 2200;
      for (let ri = 0; ri < 3; ri++) {
        const off = (ringPeriod2 / 3) * ri;
        const rT = ((now + off) % ringPeriod2) / ringPeriod2;
        if (rT > 0.1) {
          ctx.strokeStyle = isBite2
            ? `rgba(255,100,100,${Math.max(0, 0.5 - rT * 0.5)})`
            : `rgba(100,180,255,${Math.max(0, 0.5 - rT * 0.5)})`;
          ctx.lineWidth = 1.5;
          const rRadius = rT * (isBite2 ? 32 : 22);
          ctx.beginPath(); ctx.ellipse(floatX, floatY + 1, rRadius, rRadius * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const biteFlash2 = isBite2 && Math.floor(now / 120) % 2 === 0;
      ctx.fillStyle = biteFlash2 ? '#ffdd00' : '#ff3333';
      ctx.beginPath(); ctx.ellipse(floatX, floatY, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(floatX, floatY - 2.5, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    } else {
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
        ? Math.sin(t * 18) * 7 + Math.sin(t * 11) * 4
        : Math.sin(t * 1.6) * 3 + Math.sin(t * 2.9) * 1.2;
      const floatX = rodTipX + 8;
      const floatY = py + 26 + floatBob;

      ctx.strokeStyle = 'rgba(220,220,220,0.65)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      ctx.quadraticCurveTo(rodTipX + 12, rodTipY + 18, floatX, floatY);
      ctx.stroke();

      // ── 4. 찌 물결 3개, 두께 1.5px, 간격 넓게 ──
      const ringPeriod = isBite ? 600 : 2200;
      for (let ri = 0; ri < 3; ri++) {
        const off = (ringPeriod / 3) * ri;
        const rT = ((now + off) % ringPeriod) / ringPeriod;
        if (rT > 0.1) {
          const rAlpha = Math.max(0, 0.5 - rT * 0.5);
          const rRadius = rT * (isBite ? 30 : 20);
          ctx.strokeStyle = isBite ? `rgba(255,100,100,${rAlpha})` : `rgba(100,180,255,${rAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(floatX, floatY + 1, rRadius, rRadius * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const biteFlash = isBite && Math.floor(now / 120) % 2 === 0;
      ctx.fillStyle = biteFlash ? '#ffdd00' : '#ff3333';
      ctx.beginPath(); ctx.ellipse(floatX, floatY, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(floatX, floatY - 2.5, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(floatX, floatY, 4, 5, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  if (state === 'mining') {
    const t = now / 1000;
    const cycle = (now % 550) / 550;
    let swingAngle;
    if (cycle < 0.45) {
      swingAngle = -1.3 * (cycle / 0.45);
    } else {
      swingAngle = -1.3 + 2.0 * ((cycle - 0.45) / 0.55);
    }
    const isImpact = cycle > 0.85;

    ctx.save();
    ctx.translate(px + 7, py - PH / 2 + 14);
    ctx.rotate(swingAngle);

    ctx.strokeStyle = '#7a4a10';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18);
    ctx.stroke();

    const pickaxeHeadColors = { '나무곡괭이': '#8a6a3a', '철곡괭이': '#8a8a8a', '금곡괭이': '#e8c830' };
    const pickaxeHeadCol = pickaxeHeadColors[pickaxeType] ?? '#8a8a8a';
    ctx.fillStyle = pickaxeHeadCol;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, 16);
    ctx.lineTo(-2, 12);
    ctx.lineTo(0, 18);
    ctx.lineTo(2, 12);
    ctx.lineTo(8, 14);
    ctx.lineTo(5, 19);
    ctx.lineTo(0, 18);
    ctx.lineTo(-5, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(220,220,220,0.45)';
    ctx.beginPath();
    ctx.moveTo(-5, 16); ctx.lineTo(-1, 13); ctx.lineTo(1, 16); ctx.lineTo(-3, 18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

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
      ctx.fillStyle = 'rgba(255,220,80,0.6)';
      ctx.beginPath();
      ctx.arc(px + 10, py + PH / 2 - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (state === 'gathering') {
    const toolIcons = { '맨손': null, '나무바구니': '🧺', '허브낫': '🌿', '황금낫': '✨' };
    const toolIcon = toolIcons[gatherTool];
    const bob = Math.sin(now / 400) * 4;
    ctx.fillStyle = bodyCol;
    ctx.beginPath(); ctx.roundRect(px - 14, py - 4, 5, 10 + bob * 0.5, 3); ctx.fill();
    ctx.fillStyle = '#f6cc88';
    ctx.beginPath(); ctx.arc(px - 12, py + 7 + bob, 3.5, 0, Math.PI * 2); ctx.fill();
    if (toolIcon) {
      ctx.font = '11px serif';
      ctx.textAlign = 'center';
      ctx.fillText(toolIcon, px - 18, py + 5 + bob);
    }
    for (let i = 0; i < 3; i++) {
      const age = ((now / 600 + i * 0.33) % 1);
      const sx2 = px - 22 + Math.sin(age * Math.PI * 2 + i) * 5;
      const sy2 = py + 5 - age * 14;
      const alpha = 0.7 - age * 0.6;
      ctx.fillStyle = `rgba(80,220,80,${alpha})`;
      ctx.beginPath(); ctx.arc(sx2, sy2, 2 - age, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (state !== 'idle') {
    const ringR = 18;
    const cx2 = px, cy2 = py - PH / 2 - ringR - 6;
    const progress = state === 'bite' ? (1 - (activityProgress || 0)) : (activityProgress || 0);
    const ringColor = state === 'bite' ? '#ff4444' : state === 'fishing' ? '#44aaff' : state === 'gathering' ? '#44cc44' : '#ffaa44';
    // Track circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx2, cy2, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx2, cy2, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Progress arc
    if (progress > 0) {
      ctx.beginPath();
      ctx.arc(cx2, cy2, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      // Glow
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Center icon
    ctx.font = '11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = state === 'bite' ? '🎣' : state === 'fishing' ? '🐟' : state === 'gathering' ? '🌿' : '⛏';
    ctx.fillText(icon, cx2, cy2);
    ctx.restore();
  }

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

  // ── 3. 이름표 말풍선 ──────────────────────────────────────────────────────
  if (nickname) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    const nameY = py - 30;
    const nameW = ctx.measureText(nickname).width;

    // Title box (above nickname)
    if (title) {
      ctx.font = '9px "Noto Sans KR", sans-serif';
      const titleText = `[${title}]`;
      const titleW = ctx.measureText(titleText).width;
      const titleY = nameY - 12;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(px - titleW / 2 - 4, titleY - 9, titleW + 8, 12, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 2.5;
      ctx.strokeText(titleText, px, titleY);
      ctx.fillStyle = titleColor ?? '#aaaaaa';
      ctx.fillText(titleText, px, titleY);
    }

    // Nickname box
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(px - nameW / 2 - 4, nameY - 10, nameW + 8, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#e8e8ff';
    ctx.fillText(nickname, px, nameY);
  }
}
