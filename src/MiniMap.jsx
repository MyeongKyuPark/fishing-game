import { useEffect, useRef } from 'react';
import { MAP_TILES, DOOR_TRIGGERS } from './mapData';
import { MAP_W, MAP_H, TILE_COLOR, TILE } from './gameData';

// Scale: 2px per tile → 140×100 minimap
const SCALE = 2;
const MW = MAP_W * SCALE;
const MH = MAP_H * SCALE;

// Pre-render static map image once
let staticMapCache = null;
function getStaticMapImage() {
  if (staticMapCache) return staticMapCache;
  const offscreen = document.createElement('canvas');
  offscreen.width = MW;
  offscreen.height = MH;
  const ctx = offscreen.getContext('2d');
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const t = MAP_TILES[ty]?.[tx] ?? TILE.WATER;
      ctx.fillStyle = TILE_COLOR[t] ?? '#1a5fa8';
      ctx.fillRect(tx * SCALE, ty * SCALE, SCALE, SCALE);
    }
  }
  staticMapCache = offscreen;
  return offscreen;
}

// Landmark dots
const LANDMARKS = DOOR_TRIGGERS.map(d => ({
  label: d.label.split(' ')[0],
  tx: Math.round(d.wx / 32),
  ty: Math.round(d.wy / 32),
}));

export default function MiniMap({ gameRef, otherPlayersRef, partyMembersRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let raf;
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.drawImage(getStaticMapImage(), 0, 0);

      // Landmark icons
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const lm of LANDMARKS) {
        ctx.fillText(lm.label, lm.tx * SCALE, lm.ty * SCALE);
      }

      // Other players
      const otherPlayers = otherPlayersRef?.current ?? [];
      const partyNicknames = new Set((partyMembersRef?.current ?? []).map(m => m.nickname));
      for (const p of otherPlayers) {
        if (!p.x || !p.y) continue;
        const px = (p.x / 32) * SCALE;
        const py = (p.y / 32) * SCALE;
        ctx.fillStyle = partyNicknames.has(p.nickname) ? 'rgba(100,255,150,0.95)' : 'rgba(255,200,100,0.85)';
        ctx.beginPath();
        ctx.arc(px, py, partyNicknames.has(p.nickname) ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
        // Party member name label
        if (partyNicknames.has(p.nickname)) {
          ctx.fillStyle = 'rgba(100,255,150,0.9)';
          ctx.font = '6px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.nickname.slice(0, 4), px, py - 4);
        }
      }

      // Player dot
      const player = gameRef.current?.player;
      if (player) {
        const px = (player.x / 32) * SCALE;
        const py = (player.y / 32) * SCALE;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [gameRef, otherPlayersRef]);

  return (
    <div className="minimap-wrap">
      <div className="minimap-title">지도</div>
      <canvas
        ref={canvasRef}
        width={MW}
        height={MH}
        className="minimap-canvas"
      />
    </div>
  );
}
