// Visual effect renderers — each function reads/mutates effect state on gameState
// and draws to ctx. Pass W/H for screen dimensions, camX/camY for world offset.
import { getSettings } from '../settingsManager';

export function drawWeatherParticles(ctx, W, H, weatherParticlesRef, weatherId) {
  const wx = weatherId ?? 'clear';
  const parts = weatherParticlesRef.current;
  const quality = getSettings().canvasQuality;

  if (wx === 'rain' || wx === 'storm') {
    const baseSpawn = wx === 'storm' ? 4 : 2;
    const spawnCount = quality === 'low' ? Math.max(1, Math.floor(baseSpawn / 2)) : baseSpawn;
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
      if (p.y > H + 10) { parts[i] = parts[parts.length - 1]; parts.pop(); }
    }
    ctx.stroke();
    if (wx === 'storm' && Math.random() < 0.002) {
      ctx.fillStyle = 'rgba(200,220,255,0.18)';
      ctx.fillRect(0, 0, W, H);
    }
    // Cap particle count without reallocating
    if (parts.length > 300) parts.length = 300;
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

export function drawLevelUpEffect(ctx, W, H, gameState) {
  const lvEffect = gameState.levelUpEffect;
  if (!lvEffect) return;

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
    gameState.levelUpEffect = null;
  }
}

export function drawGradeUpEffect(ctx, W, H, gameState) {
  const gradeUpEff = gameState.gradeUpEffect;
  if (!gradeUpEff) return;

  gradeUpEff.age = (gradeUpEff.age ?? 0) + 1;

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
    gameState.gradeUpEffect = null;
    return;
  }

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

    ctx.font = 'bold 58px "Noto Sans KR", sans-serif';
    ctx.strokeStyle = gradeUpEff.color ?? '#66aaff';
    ctx.lineWidth = 4;
    ctx.strokeText('GRADE UP!', 0, -28);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('GRADE UP!', 0, -28);

    ctx.font = 'bold 30px "Noto Sans KR", sans-serif';
    ctx.fillStyle = gradeUpEff.color ?? '#66aaff';
    ctx.shadowBlur = 10;
    ctx.fillText(`${gradeUpEff.icon ?? ''} ${gradeUpEff.abilName ?? ''} → G${gradeUpEff.grade ?? '?'}`, 0, 20);

    ctx.font = '20px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffdd88';
    ctx.fillText(`✨ 희귀 보너스 +${(gradeUpEff.grade ?? 1) * 10}%`, 0, 60);

    ctx.restore();
  }
}

export function drawRareEffect(ctx, W, H, gameState, playerScreenX, playerScreenY) {
  const rareEff = gameState.rareEffect;
  if (!rareEff) return;

  rareEff.age = (rareEff.age ?? 0) + 1;

  if (rareEff.age === 1) {
    const px0 = playerScreenX;
    const py0 = playerScreenY - 30;
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
    gameState.rareEffect = null;
    return;
  }

  const rAlpha = t < 0.06 ? (t / 0.06) * 0.35 : Math.max(0, 0.35 * (1 - (t - 0.06) / 0.38));
  if (rAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = rAlpha;
    ctx.fillStyle = rareEff.color;
    ctx.fillRect(0, 0, W, H);
    const burstR = ctx.createRadialGradient(playerScreenX, playerScreenY - 30, 0, playerScreenX, playerScreenY - 30, Math.min(W, H) * 0.55);
    burstR.addColorStop(0, `rgba(255,255,255,${rAlpha * 1.6})`);
    burstR.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = burstR;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

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

export function drawFishParticles(ctx, gameState, camX, camY) {
  const fishParticles = gameState.fishParticles ?? [];
  gameState.fishParticles = fishParticles;
  for (let i = fishParticles.length - 1; i >= 0; i--) {
    const fp = fishParticles[i];
    fp.age = (fp.age ?? 0) + 1;
    fp.vy -= 0.4;
    fp.y += fp.vy;
    fp.x += fp.vx;
    const alpha = Math.max(0, 1 - fp.age / 40);
    if (alpha <= 0) { fishParticles[i] = fishParticles[fishParticles.length - 1]; fishParticles.pop(); continue; }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${Math.round(14 + fp.age * 0.3)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(fp.emoji, fp.x - camX, fp.y - camY);
    ctx.restore();
  }
}

export function drawTreasureEffect(ctx, W, H, gameState) {
  const treasureEff = gameState.treasureEffect;
  if (!treasureEff) return;

  treasureEff.age = (treasureEff.age ?? 0) + 1;
  const TDUR = 120;
  const tt = treasureEff.age / TDUR;
  if (tt >= 1) {
    gameState.treasureEffect = null;
    return;
  }

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

export function drawQuestCompleteEffect(ctx, W, H, gameState) {
  const questEff = gameState.questCompleteEffect;
  if (!questEff) return;

  questEff.age = (questEff.age ?? 0) + 1;
  const QDUR = 100;
  const qt = questEff.age / QDUR;
  if (qt >= 1) {
    gameState.questCompleteEffect = null;
    return;
  }

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

export function drawScreenShake(ctx, gameState) {
  const shk = gameState.shakeEffect;
  if (!shk) return { shakeX: 0, shakeY: 0 };
  shk.age = (shk.age ?? 0) + 1;
  const amt = Math.max(0, shk.intensity * (1 - shk.age / 20));
  if (amt > 0) {
    return {
      shakeX: (Math.random() - 0.5) * 2 * amt,
      shakeY: (Math.random() - 0.5) * 2 * amt,
    };
  }
  gameState.shakeEffect = null;
  return { shakeX: 0, shakeY: 0 };
}
