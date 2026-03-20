import { useState, useEffect, useRef, useCallback } from 'react';

const RARITY_COLOR = { 전설: '#ffdd44', 신화: '#ff88ff' };
const RARITY_ICON  = { 전설: '⭐', 신화: '🌟' };

// 대어 저항 미니게임: 이동하는 인디케이터를 녹색 구간에서 3회 적중해야 포획 성공
// 전설: 3타 성공 / 신화: 4타 성공, 실패 허용 2회
export default function ResistanceMinigame({ fishName, rarity, size, onSuccess, onFail }) {
  const MAX_HITS  = rarity === '신화' ? 4 : 3;
  const MAX_FAILS = 2;
  const ZONE_W    = rarity === '신화' ? 0.18 : 0.24; // green zone width (fraction of bar)
  const SPEED     = rarity === '신화' ? 0.0038 : 0.003; // indicator speed

  const [indicator, setIndicator] = useState(0.5); // 0~1
  const [direction, setDirection] = useState(1);
  const [hits,   setHits]   = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash,  setFlash]  = useState(null); // 'hit' | 'miss'
  const [done,   setDone]   = useState(false);
  const stateRef = useRef({ indicator: 0.5, direction: 1, hits: 0, misses: 0 });
  const rafRef   = useRef(null);
  const lastRef  = useRef(null);

  // Zone: centered around random position, shifts each hit
  const [zoneCenter, setZoneCenter] = useState(() => 0.3 + Math.random() * 0.4);

  const zoneLeft  = Math.max(0.02, zoneCenter - ZONE_W / 2);
  const zoneRight = Math.min(0.98, zoneCenter + ZONE_W / 2);

  // Animate indicator
  useEffect(() => {
    if (done) return;
    const tick = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 16.67; // normalize to ~60fps
      lastRef.current = ts;
      const st = stateRef.current;
      let pos = st.indicator + st.direction * SPEED * dt;
      let dir = st.direction;
      if (pos >= 1) { pos = 1; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1;  }
      stateRef.current.indicator = pos;
      stateRef.current.direction = dir;
      setIndicator(pos);
      setDirection(dir);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done, SPEED]);

  const handleCatch = useCallback(() => {
    if (done) return;
    const pos = stateRef.current.indicator;
    const isHit = pos >= zoneLeft && pos <= zoneRight;
    if (isHit) {
      const newHits = stateRef.current.hits + 1;
      stateRef.current.hits = newHits;
      setHits(newHits);
      setFlash('hit');
      setZoneCenter(0.25 + Math.random() * 0.5);
      setTimeout(() => setFlash(null), 300);
      if (newHits >= MAX_HITS) {
        setDone(true);
        setTimeout(() => onSuccess(), 500);
      }
    } else {
      const newMisses = stateRef.current.misses + 1;
      stateRef.current.misses = newMisses;
      setMisses(newMisses);
      setFlash('miss');
      setTimeout(() => setFlash(null), 300);
      if (newMisses > MAX_FAILS) {
        setDone(true);
        setTimeout(() => onFail(), 500);
      }
    }
  }, [done, zoneLeft, zoneRight, MAX_HITS, MAX_FAILS, onSuccess, onFail]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handleCatch(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCatch]);

  const rColor = RARITY_COLOR[rarity] ?? '#ffdd44';
  const rIcon  = RARITY_ICON[rarity]  ?? '⭐';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
    }}
      onClick={handleCatch}
    >
      <div style={{
        background: '#0a1a2a', border: `2px solid ${rColor}`,
        borderRadius: 16, padding: '24px 32px', minWidth: 320,
        textAlign: 'center', userSelect: 'none',
        boxShadow: `0 0 30px ${rColor}44`,
      }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>{rIcon}</div>
        <div style={{ fontSize: 18, color: rColor, fontWeight: 800, marginBottom: 2 }}>
          {fishName} {size}cm
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
          {rarity} — 녹색 구간에서 클릭/스페이스!
        </div>

        {/* Hit/miss indicators */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
          {Array.from({ length: MAX_HITS }).map((_, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: i < hits ? '#44ff88' : 'rgba(255,255,255,0.15)',
              border: `2px solid ${i < hits ? '#44ff88' : '#444'}`,
            }} />
          ))}
          <div style={{ width: 8 }} />
          {Array.from({ length: MAX_FAILS + 1 }).map((_, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: i < misses ? '#ff4444' : 'rgba(255,255,255,0.15)',
              border: `2px solid ${i < misses ? '#ff4444' : '#444'}`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 16 }}>
          ● = 성공 &nbsp;|&nbsp; ○ = 실패 허용
        </div>

        {/* Bar */}
        <div style={{ position: 'relative', width: '100%', height: 32, background: '#1a2a3a', borderRadius: 8, overflow: 'hidden' }}>
          {/* Green zone */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${zoneLeft * 100}%`, width: `${(zoneRight - zoneLeft) * 100}%`,
            background: flash === 'hit' ? '#88ffaa88' : '#44ff8844',
            borderLeft: '2px solid #44ff88', borderRight: '2px solid #44ff88',
            transition: 'left 0.25s ease-out',
          }} />
          {/* Indicator */}
          <div style={{
            position: 'absolute', top: 2, bottom: 2, width: 6,
            left: `calc(${indicator * 100}% - 3px)`,
            background: flash === 'hit' ? '#44ff88' : flash === 'miss' ? '#ff4444' : '#fff',
            borderRadius: 3,
            boxShadow: `0 0 8px ${flash === 'hit' ? '#44ff88' : flash === 'miss' ? '#ff4444' : '#ffffff88'}`,
          }} />
        </div>

        {done && (
          <div style={{ marginTop: 14, fontSize: 16, fontWeight: 800, color: hits >= MAX_HITS ? '#44ff88' : '#ff4444' }}>
            {hits >= MAX_HITS ? '🎉 포획 성공!' : '💔 도주...'}
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 11, color: '#666' }}>
          화면 클릭 또는 스페이스/엔터
        </div>
      </div>
    </div>
  );
}
