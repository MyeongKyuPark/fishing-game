import { useEffect, useRef } from 'react';

const TS = 32;

// ── Room definitions ──────────────────────────────────────────────────────────
// Tile chars: W=wall F=floor S=shelf C=counter R=rug T=table K=stove O=ore D=door
const ROOMS = {
  shop: {
    label: '🏪 상점',
    w: 12, h: 10,
    tiles: [
      ['W','W','W','W','W','W','W','W','W','W','W','W'],
      ['W','S','S','S','S','S','S','S','S','S','S','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','C','C','C','C','C','C','C','C','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','R','R','R','R','R','R','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','W','W','W','W','D','W','W','W','W','W','W'],
    ],
    floor: '#c4935a', wall: '#8b6545', rug: '#c44444',
    npcs: [
      { tx: 5, ty: 2, name: '민준', bodyColor: '#e8aa66', hairColor: '#3a2010',
        dialog: '어서오세요! 낚시장비라면\n저한테 맡기세요~', facing: 'down' },
    ],
    exitTx: 5, exitTy: 9,
    entryTx: 5, entryTy: 7,
  },
  cooking: {
    label: '🍳 주방',
    w: 12, h: 10,
    tiles: [
      ['W','W','W','W','W','W','W','W','W','W','W','W'],
      ['W','K','K','K','F','F','K','K','K','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','T','T','F','F','T','T','F','F','F','W'],
      ['W','F','T','T','F','F','T','T','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','W','W','W','W','D','W','W','W','W','W','W'],
    ],
    floor: '#d4956a', wall: '#9b6045', stove: '#6a6a6a', table: '#a0724a',
    npcs: [
      { tx: 4, ty: 2, name: '수연', bodyColor: '#ff8866', hairColor: '#2a1000',
        dialog: '오늘은 어떤 요리를\n만들어볼까요? 😊', facing: 'down' },
    ],
    exitTx: 5, exitTy: 9,
    entryTx: 5, entryTy: 7,
  },
  inn: {
    label: '🏨 여관',
    w: 12, h: 10,
    tiles: [
      ['W','W','W','W','W','W','W','W','W','W','W','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','B','B','F','F','B','B','F','F','F','W'],
      ['W','F','B','B','F','F','B','B','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','R','R','R','R','R','R','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','W','W','W','W','D','W','W','W','W','W','W'],
    ],
    floor: '#c8a878', wall: '#7a5a3a', rug: '#4444aa',
    npcs: [
      { tx: 5, ty: 2, name: '미나', bodyColor: '#ff99cc', hairColor: '#4a2000',
        dialog: '어서오세요! 쉬고 싶으시면\n말씀해주세요~ 🌙', facing: 'down' },
    ],
    exitTx: 5, exitTy: 9,
    entryTx: 5, entryTy: 7,
  },
  mine: {
    label: '⛏ 광산 내부',
    w: 12, h: 10,
    tiles: [
      ['W','W','W','W','W','W','W','W','W','W','W','W'],
      ['W','O','O','F','F','O','O','F','F','O','O','W'],
      ['W','O','F','F','F','F','F','F','F','F','O','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','O','O','F','F','F','O','O','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','O','F','F','F','F','O','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','W','W','W','W','D','W','W','W','W','W','W'],
    ],
    floor: '#5a5a6a', wall: '#3a3a4a', ore: '#8855cc',
    npcs: [
      { tx: 4, ty: 3, name: '철수', bodyColor: '#8899bb', hairColor: '#222222',
        dialog: '이 광산엔 귀한 광석이\n많답니다! 조심하세요', facing: 'right' },
    ],
    exitTx: 5, exitTy: 9,
    entryTx: 5, entryTy: 7,
  },
  bank: {
    label: '🏦 은행',
    w: 12, h: 10,
    tiles: [
      ['W','W','W','W','W','W','W','W','W','W','W','W'],
      ['W','S','S','S','S','S','S','S','S','S','S','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','C','C','C','C','C','C','C','C','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','R','R','R','R','R','R','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','F','F','F','F','F','F','F','F','F','F','W'],
      ['W','W','W','W','W','D','W','W','W','W','W','W'],
    ],
    floor: '#c8b88a', wall: '#7a6a45', rug: '#4488aa',
    npcs: [
      { tx: 5, ty: 2, name: '은행원', bodyColor: '#5588cc', hairColor: '#2a1800',
        dialog: '어서오세요! 예금으로\n이자를 받아보세요~', facing: 'down' },
    ],
    exitTx: 5, exitTy: 9,
    entryTx: 5, entryTy: 7,
  },
};

function isWalkable(tile) {
  return ['F', 'R', 'D'].includes(tile);
}

// ── Tile drawing ──────────────────────────────────────────────────────────────
function drawRoomTile(ctx, tile, x, y, room, now) {
  switch (tile) {
    case 'W': {
      ctx.fillStyle = room.wall ?? '#4a4a4a';
      ctx.fillRect(x, y, TS, TS);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1;
      const s = (Math.floor(x / TS) * 3 + Math.floor(y / TS) * 7) % 4;
      ctx.beginPath();
      if (s === 0) {
        ctx.moveTo(x, y + TS * 0.45); ctx.lineTo(x + TS * 0.55, y + TS * 0.45);
        ctx.moveTo(x + TS * 0.55, y + TS * 0.75); ctx.lineTo(x + TS, y + TS * 0.75);
      } else if (s === 1) {
        ctx.moveTo(x + TS * 0.3, y); ctx.lineTo(x + TS * 0.3, y + TS * 0.5);
      }
      ctx.stroke();
      break;
    }
    case 'F': {
      ctx.fillStyle = room.floor ?? '#c4935a';
      ctx.fillRect(x, y, TS, TS);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + TS * 0.5); ctx.lineTo(x + TS, y + TS * 0.5);
      ctx.moveTo(x + TS * 0.5, y); ctx.lineTo(x + TS * 0.5, y + TS * 0.5);
      ctx.stroke();
      break;
    }
    case 'R': {
      ctx.fillStyle = room.floor ?? '#c4935a';
      ctx.fillRect(x, y, TS, TS);
      const rc = room.rug ?? '#c44444';
      ctx.fillStyle = rc + '99';
      ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
      ctx.strokeStyle = rc;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 3, y + 3, TS - 6, TS - 6);
      break;
    }
    case 'S': {
      ctx.fillStyle = room.floor ?? '#c4935a';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#7a5030';
      ctx.fillRect(x + 1, y + 2, TS - 2, 8);
      ctx.fillRect(x + 1, y + TS * 0.45, TS - 2, 8);
      // Items on shelf
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath(); ctx.arc(x + TS * 0.25, y + 7, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#44ccff';
      ctx.beginPath(); ctx.arc(x + TS * 0.55, y + 7, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6644';
      ctx.beginPath(); ctx.arc(x + TS * 0.8, y + 6, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'C': {
      ctx.fillStyle = '#a0724a';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, y, TS, TS * 0.22);
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);
      break;
    }
    case 'T': {
      ctx.fillStyle = room.floor ?? '#c4935a';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = room.table ?? '#a0724a';
      ctx.fillRect(x + 3, y + 3, TS - 6, TS - 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3.5, y + 3.5, TS - 7, TS - 7);
      break;
    }
    case 'B': {
      ctx.fillStyle = room.floor ?? '#c8a878';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#e8c8b0';  // bed frame
      ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
      ctx.fillStyle = '#ffffff';  // pillow
      ctx.beginPath(); ctx.roundRect(x + 4, y + 4, TS - 8, 8, 2); ctx.fill();
      ctx.fillStyle = '#f0d8e8';  // blanket
      ctx.fillRect(x + 2, y + 12, TS - 4, TS - 14);
      break;
    }
    case 'K': {
      ctx.fillStyle = room.floor ?? '#c4935a';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = room.stove ?? '#6a6a6a';
      ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
      const glow = Math.sin(now / 350 + x * 0.1) > 0;
      ctx.fillStyle = glow ? '#ff7733' : '#cc4422';
      ctx.beginPath(); ctx.arc(x + TS / 2, y + TS * 0.58, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = glow ? '#ffcc00' : '#ff8800';
      ctx.beginPath(); ctx.arc(x + TS / 2, y + TS * 0.58, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'O': {
      ctx.fillStyle = room.wall ?? '#3a3a4a';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = room.ore ?? '#8855cc';
      const si = (Math.floor(x / TS) + Math.floor(y / TS) * 3) % 3;
      ctx.beginPath();
      if (si === 0) ctx.arc(x + TS * 0.4, y + TS * 0.5, 8, 0, Math.PI * 2);
      else if (si === 1) ctx.arc(x + TS * 0.62, y + TS * 0.42, 7, 0, Math.PI * 2);
      else ctx.arc(x + TS * 0.5, y + TS * 0.6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath(); ctx.arc(x + TS * 0.38, y + TS * 0.42, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'D': {
      ctx.fillStyle = room.floor ?? '#c4935a';
      ctx.fillRect(x, y, TS, TS);
      // Door frame
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x + 5, y + 6, TS - 10, TS - 6);
      ctx.beginPath(); ctx.arc(x + TS / 2, y + TS * 0.55, (TS - 10) / 2, Math.PI, 0); ctx.fill();
      // Panel lines
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 7, y + 14, TS - 14, 10);
      // Handle
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath(); ctx.arc(x + TS * 0.62, y + TS * 0.76, 2.5, 0, Math.PI * 2); ctx.fill();
      // Exit arrow
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↓', x + TS / 2, y + TS * 0.52);
      break;
    }
    default:
      ctx.fillStyle = '#888';
      ctx.fillRect(x, y, TS, TS);
  }
}

// ── NPC drawing ───────────────────────────────────────────────────────────────
function drawIndoorNPC(ctx, sx, sy, npc, speaking, now) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 5, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = npc.bodyColor;
  ctx.beginPath(); ctx.roundRect(sx - 6, sy - 18, 12, 13, 3); ctx.fill();

  // Head
  ctx.fillStyle = '#f6cc88';
  ctx.beginPath(); ctx.arc(sx, sy - 24, 9, 0, Math.PI * 2); ctx.fill();

  // Hair
  ctx.fillStyle = npc.hairColor;
  ctx.beginPath(); ctx.arc(sx, sy - 28, 9, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(sx - 8, sy - 23, 4.5, Math.PI * 1.15, Math.PI * 0.35); ctx.fill();

  // Eyes
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(sx - 3, sy - 24, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 3, sy - 24, 1.5, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(sx, sy - 21, 3, 0.1, Math.PI - 0.1); ctx.stroke();

  // Name tag
  ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  const nw = ctx.measureText(npc.name).width;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.roundRect(sx - nw / 2 - 4, sy - 42, nw + 8, 13, 3); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(npc.name, sx, sy - 32);

  // Speech bubble
  if (speaking) {
    const lines = npc.dialog.split('\n');
    ctx.font = '10px "Noto Sans KR", sans-serif';
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const bw = maxW + 18;
    const bh = lines.length * 14 + 10;
    const bx = sx - bw / 2;
    const by = sy - 50 - bh;

    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill(); ctx.stroke();
    // Tail
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.beginPath();
    ctx.moveTo(sx - 4, by + bh); ctx.lineTo(sx + 4, by + bh); ctx.lineTo(sx, by + bh + 7);
    ctx.closePath(); ctx.fill();
    // Text
    ctx.fillStyle = '#333';
    lines.forEach((line, i) => {
      ctx.fillText(line, sx, by + 16 + i * 14);
    });
  }
}

// ── Player drawing (indoor) ───────────────────────────────────────────────────
function drawIndoorPlayer(ctx, sx, sy, facing, nickname, hairColor, bodyColor, skinColor, gender, marineGear = null, equippedItems = {}) {
  const isScuba = marineGear === '스쿠버다이빙세트';
  const isBoat  = marineGear === '보트';
  const boots = equippedItems.boots ?? '기본신발';
  const ring = equippedItems.ring ?? null;
  const necklace = equippedItems.necklace ?? null;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 5, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Scuba O2 tank (behind body)
  if (isScuba) {
    ctx.fillStyle = '#778899';
    ctx.beginPath(); ctx.roundRect(sx - 12, sy - 19, 5, 11, 3); ctx.fill();
    ctx.fillStyle = '#555566';
    ctx.beginPath(); ctx.roundRect(sx - 11, sy - 22, 3, 3, 1); ctx.fill();
  }

  // Body
  const bodyCol = isScuba ? '#1a3a6a' : (bodyColor ?? '#5a7aaa');
  ctx.fillStyle = bodyCol;
  ctx.beginPath(); ctx.roundRect(sx - 7, sy - 18, 14, 13, 3); ctx.fill();
  ctx.fillStyle = isScuba ? 'rgba(100,180,255,0.18)' : 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.roundRect(sx - 5, sy - 16, 6, 6, 2); ctx.fill();
  if (isScuba) { // wetsuit stripe
    ctx.fillStyle = '#0066cc';
    ctx.beginPath(); ctx.roundRect(sx - 7, sy - 12, 14, 3, 0); ctx.fill();
  }

  // Legs + shoes/flippers
  ctx.fillStyle = isScuba ? '#0a1a4a' : '#4a5070';
  ctx.beginPath(); ctx.roundRect(sx - 7, sy - 6, 5, 12, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(sx + 2, sy - 6, 5, 12, 2); ctx.fill();
  if (isScuba) {
    ctx.fillStyle = '#000077';
    ctx.beginPath(); ctx.ellipse(sx - 4, sy + 7, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 4, sy + 7, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    const bootColors = { '기본신발': '#3a2810', '빠른신발': '#4488cc', '질풍신발': '#cc6622' };
    const bootCol = bootColors[boots] ?? '#3a2810';
    ctx.fillStyle = bootCol;
    ctx.beginPath(); ctx.ellipse(sx - 4, sy + 7, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 4, sy + 7, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Necklace
  if (necklace && !isScuba) {
    const necklaceColors = { '청동목걸이': '#cc9944', '황금목걸이': '#ffd700' };
    const neckCol = necklaceColors[necklace];
    if (neckCol) {
      ctx.strokeStyle = neckCol; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy - 16, 6, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      ctx.fillStyle = necklace === '황금목걸이' ? '#ffd700' : '#88ccff';
      ctx.beginPath(); ctx.arc(sx, sy - 10, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(sx - 0.6, sy - 10.8, 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Arms + ring
  if (!isScuba) {
    ctx.fillStyle = bodyColor ?? '#5a7aaa';
    ctx.beginPath(); ctx.roundRect(sx - 11, sy - 16, 4, 9, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(sx + 7, sy - 16, 4, 9, 2); ctx.fill();
    ctx.fillStyle = skinColor ?? '#f6cc88';
    ctx.beginPath(); ctx.arc(sx - 9, sy - 7, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 9, sy - 7, 3, 0, Math.PI * 2); ctx.fill();
    // Ring on right hand
    if (ring) {
      const ringColors = { '철반지': '#aaaaaa', '수정반지': '#66aaff' };
      const ringCol = ringColors[ring];
      if (ringCol) {
        ctx.fillStyle = ringCol;
        ctx.beginPath(); ctx.arc(sx + 9, sy - 7, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(sx + 9.8, sy - 7.8, 1, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Head
  const skin = skinColor ?? '#f6cc88';
  const isFemale = gender === 'female';
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(sx, sy - 24, 10, 0, Math.PI * 2); ctx.fill();

  // Blush (hidden under scuba mask)
  if (!isScuba) {
    ctx.fillStyle = 'rgba(255,120,120,0.35)';
    ctx.beginPath(); ctx.ellipse(sx - 7, sy - 21, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 7, sy - 21, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Hair
  const hc = hairColor ?? '#5a3010';
  ctx.fillStyle = hc;
  ctx.beginPath(); ctx.arc(sx, sy - 28, 10, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(sx - 9, sy - 23, 5, Math.PI * 1.1, Math.PI * 0.4); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 9, sy - 23, 5, Math.PI * 0.6, Math.PI * 1.9); ctx.fill();
  if (isFemale && !isScuba && !isBoat) {
    ctx.beginPath(); ctx.arc(sx - 12, sy - 22, 4, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 12, sy - 22, 4, Math.PI * 1.5, Math.PI * 0.5); ctx.fill();
    ctx.fillStyle = '#ff88aa';
    ctx.beginPath(); ctx.ellipse(sx + 9, sy - 33, 4, 2.5, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 9, sy - 33, 4, 2.5, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffaabb';
    ctx.beginPath(); ctx.arc(sx + 9, sy - 33, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Eyes (hidden behind scuba mask)
  if (!isScuba) {
    ctx.fillStyle = '#333';
    if (facing === 'up') {
      ctx.beginPath(); ctx.arc(sx - 3, sy - 25, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 3, sy - 25, 1.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(sx - 3, sy - 24, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 3, sy - 24, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx - 2.5, sy - 24.5, 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Scuba mask
  if (isScuba) {
    ctx.fillStyle = 'rgba(60,140,255,0.55)';
    ctx.beginPath(); ctx.roundRect(sx - 9, sy - 28, 18, 9, 5); ctx.fill();
    ctx.strokeStyle = '#1a2255'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(sx - 9, sy - 28, 18, 9, 5); ctx.stroke();
    ctx.fillStyle = 'rgba(200,235,255,0.45)';
    ctx.beginPath(); ctx.roundRect(sx - 7, sy - 26, 5, 3, 2); ctx.fill();
    ctx.strokeStyle = '#1a2255'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx - 9, sy - 24); ctx.lineTo(sx - 12, sy - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 9, sy - 24); ctx.lineTo(sx + 12, sy - 24); ctx.stroke();
    ctx.fillStyle = '#99aabb';
    ctx.beginPath(); ctx.roundRect(sx - 3, sy - 20, 6, 3, 1); ctx.fill();
  }

  // Captain hat
  if (isBoat) {
    ctx.fillStyle = '#1a2a50';
    ctx.beginPath(); ctx.roundRect(sx - 9, sy - 38, 18, 8, [3, 3, 0, 0]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(sx - 12, sy - 31, 24, 3, 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(sx - 9, sy - 32, 18, 1.5, 0); ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 6px serif'; ctx.textAlign = 'center';
    ctx.fillText('⚓', sx, sy - 34);
  }

  // Nickname
  ctx.font = 'bold 10px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 3;
  ctx.strokeText(nickname, sx, sy - 44);
  ctx.fillStyle = '#e8e8ff';
  ctx.fillText(nickname, sx, sy - 44);
}

// ── Lantern glow for mine ─────────────────────────────────────────────────────
function drawMineLanterns(ctx, offX, offY, now) {
  const positions = [
    { tx: 2, ty: 1.5 }, { tx: 9, ty: 1.5 },
    { tx: 2, ty: 5.5 }, { tx: 9, ty: 5.5 },
  ];
  for (const p of positions) {
    const lx = offX + (p.tx + 0.5) * TS;
    const ly = offY + p.ty * TS;
    const flicker = 0.35 + 0.15 * Math.sin(now / 180 + lx);
    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 55);
    grad.addColorStop(0, `rgba(255,200,80,${flicker})`);
    grad.addColorStop(1, 'rgba(255,150,30,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(lx, ly, 55, 0, Math.PI * 2); ctx.fill();
    // Lantern body
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IndoorCanvas({ roomId, nickname, gameRef, onExit, onNpcInteract, onNearNpcChange, hairColor, bodyColor, skinColor, gender }) {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const onExitRef = useRef(onExit);
  const onNpcInteractRef = useRef(onNpcInteract);
  const onNearNpcChangeRef = useRef(onNearNpcChange);
  const hairColorRef = useRef(hairColor ?? '#5a3010');
  const bodyColorRef = useRef(bodyColor ?? '#5a7aaa');
  const skinColorRef = useRef(skinColor ?? '#f6cc88');
  const genderRef = useRef(gender ?? 'male');
  useEffect(() => { onExitRef.current = onExit; });
  useEffect(() => { onNpcInteractRef.current = onNpcInteract; });
  useEffect(() => { onNearNpcChangeRef.current = onNearNpcChange; });
  useEffect(() => { hairColorRef.current = hairColor ?? '#5a3010'; }, [hairColor]);
  useEffect(() => { bodyColorRef.current = bodyColor ?? '#5a7aaa'; }, [bodyColor]);
  useEffect(() => { skinColorRef.current = skinColor ?? '#f6cc88'; }, [skinColor]);
  useEffect(() => { genderRef.current = gender ?? 'male'; }, [gender]);

  const room = ROOMS[roomId];

  // Init player at entry
  useEffect(() => {
    if (!room) return;
    playerRef.current = {
      x: (room.entryTx + 0.5) * TS,
      y: (room.entryTy + 0.5) * TS,
      vx: 0, vy: 0,
      facing: 'up',
    };
  }, [roomId]);

  // Game loop
  useEffect(() => {
    if (!room) return;
    let rafId;
    const SPEED = 2.8;
    const FRIC = 0.80;
    let enterWasDown = false;
    let prevNearNpcName = null;

    function canWalkHere(px, py) {
      // Check 4 corners of a small bounding box
      const r = 7;
      for (const [cx2, cy2] of [[px - r, py], [px + r, py], [px, py - r], [px, py + r]]) {
        const tx2 = Math.floor(cx2 / TS);
        const ty2 = Math.floor(cy2 / TS);
        if (tx2 < 0 || ty2 < 0 || tx2 >= room.w || ty2 >= room.h) return false;
        if (!isWalkable(room.tiles[ty2][tx2])) return false;
      }
      return true;
    }

    function loop() {
      const canvas = canvasRef.current;
      const player = playerRef.current;
      if (!canvas || !player) { rafId = requestAnimationFrame(loop); return; }

      const pw = canvas.offsetWidth || window.innerWidth;
      const ph2 = canvas.offsetHeight || window.innerHeight;
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph2) canvas.height = ph2;
      const W = canvas.width, H = canvas.height;
      if (W === 0 || H === 0) { rafId = requestAnimationFrame(loop); return; }

      const ctx = canvas.getContext('2d');
      const now = performance.now();
      const keys = gameRef.current?.keys ?? {};

      // Movement
      let dx = 0, dy = 0;
      if (keys.ArrowLeft)  { dx -= 1; player.facing = 'left'; }
      if (keys.ArrowRight) { dx += 1; player.facing = 'right'; }
      if (keys.ArrowUp)    { dy -= 1; player.facing = 'up'; }
      if (keys.ArrowDown)  { dy += 1; player.facing = 'down'; }

      if (Math.abs(dx) + Math.abs(dy) > 0) {
        const len = Math.hypot(dx, dy) || 1;
        player.vx += (dx / len) * 0.6;
        player.vy += (dy / len) * 0.6;
      }
      player.vx = Math.max(-SPEED, Math.min(SPEED, player.vx)) * FRIC;
      player.vy = Math.max(-SPEED, Math.min(SPEED, player.vy)) * FRIC;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
      if (Math.abs(player.vy) < 0.05) player.vy = 0;

      const nx = player.x + player.vx;
      if (canWalkHere(nx, player.y)) player.x = nx; else player.vx = 0;
      const ny = player.y + player.vy;
      if (canWalkHere(player.x, ny)) player.y = ny; else player.vy = 0;

      // Exit check
      const ptx = Math.floor(player.x / TS);
      const pty = Math.floor(player.y / TS);
      if (ptx === room.exitTx && pty === room.exitTy) {
        onExitRef.current?.();
        rafId = requestAnimationFrame(loop);
        return;
      }

      // NPC proximity
      let nearNpc = null;
      let nearNpcDist = Infinity;
      for (const npc of room.npcs) {
        const d = Math.hypot(player.x - (npc.tx + 0.5) * TS, player.y - (npc.ty + 0.5) * TS);
        if (d < 2.5 * TS && d < nearNpcDist) { nearNpc = npc; nearNpcDist = d; }
      }

      // Notify parent of nearNpc changes
      const curName = nearNpc?.name ?? null;
      if (curName !== prevNearNpcName) {
        onNearNpcChangeRef.current?.(nearNpc ?? null);
        prevNearNpcName = curName;
      }

      // Enter key interaction (edge trigger)
      const enterDown = !!(keys.Enter || keys[' ']);
      if (enterDown && !enterWasDown && nearNpc) {
        onNpcInteractRef.current?.(nearNpc.name);
      }
      enterWasDown = enterDown;

      // ── Render ──
      // Dark background
      const bgColor = roomId === 'mine' ? '#141420' : roomId === 'inn' ? '#1a100a' : '#2a1a0a';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      const roomW = room.w * TS;
      const roomH = room.h * TS;
      const offX = Math.round((W - roomW) / 2);
      const offY = Math.round((H - roomH) / 2);

      // Mine lantern glow behind tiles
      if (roomId === 'mine') drawMineLanterns(ctx, offX, offY, now);

      // Tiles
      for (let ty2 = 0; ty2 < room.h; ty2++) {
        for (let tx2 = 0; tx2 < room.w; tx2++) {
          drawRoomTile(ctx, room.tiles[ty2][tx2], offX + tx2 * TS, offY + ty2 * TS, room, now);
        }
      }

      // NPCs
      for (const npc of room.npcs) {
        const nsx = offX + (npc.tx + 0.5) * TS;
        const nsy = offY + (npc.ty + 0.5) * TS;
        const dist = Math.hypot(player.x - (npc.tx + 0.5) * TS, player.y - (npc.ty + 0.5) * TS);
        drawIndoorNPC(ctx, nsx, nsy, npc, dist < 3 * TS, now);
      }

      // Player
      drawIndoorPlayer(ctx, offX + player.x, offY + player.y, player.facing, nickname, hairColorRef.current, bodyColorRef.current, skinColorRef.current, genderRef.current, gameRef.current?.marineGear ?? null, gameRef.current?.equippedItems ?? {});

      // Header bar
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, 36);
      ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(room.label, W / 2, 24);

      // Exit hint at bottom
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↓ 출구 문으로 이동하면 나갑니다', W / 2, H - 8);

      // NPC interaction hint
      if (nearNpc) {
        const hint = `Enter · Space : ${nearNpc.name}와(과) 대화`;
        const hm = ctx.measureText(hint);
        const hw = hm.width + 24;
        const hx = W / 2 - hw / 2;
        const hy = H - 52;
        const pulse = 0.7 + 0.3 * Math.sin(now / 400);
        ctx.fillStyle = `rgba(40,30,20,${0.78 * pulse})`;
        ctx.beginPath(); ctx.roundRect(hx, hy, hw, 22, 8); ctx.fill();
        ctx.fillStyle = `rgba(255,240,180,${pulse})`;
        ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hint, W / 2, hy + 15);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [roomId, nickname, gameRef]); // onExit via ref

  if (!room) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}
    />
  );
}
