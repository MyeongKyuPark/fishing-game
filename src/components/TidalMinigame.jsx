// ── Tidal Timing Minigame ─────────────────────────────────────────────────────
// 항구마을 / 남쪽심해 전용: 조류 타이밍 게임
// props: fishName, rarity, onResult(sizeBonus: number)
import { useEffect, useRef, useState } from 'react';

const SAFE_WIDTH = 0.28; // fraction of bar that is "safe zone"
const SPEED = 0.004;     // normalized units per ms
const TIMEOUT = 2500;    // ms

export default function TidalMinigame({ fishName, rarity, onResult }) {
  const [pos, setPos] = useState(0);      // 0..1
  const [dir, setDir] = useState(1);
  const [flash, setFlash] = useState(null); // 'success' | 'fail' | null
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const doneRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    lastRef.current = performance.now();
    function tick(now) {
      const dt = now - lastRef.current;
      lastRef.current = now;
      setPos(prev => {
        let next = prev + dir * SPEED * dt;
        if (next >= 1) { next = 1; setDir(-1); }
        else if (next <= 0) { next = 0; setDir(1); }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(() => {
      if (!doneRef.current) handleInput(false);
    }, TIMEOUT);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = (manual = true) => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    clearTimeout(timerRef.current);
    const safeStart = 0.5 - SAFE_WIDTH / 2;
    const safeEnd = 0.5 + SAFE_WIDTH / 2;
    const success = manual && pos >= safeStart && pos <= safeEnd;
    setFlash(success ? 'success' : 'fail');
    setTimeout(() => onResult(success ? 0.3 : 0), 600);
  };

  const safeStart = 0.5 - SAFE_WIDTH / 2;
  const safeEnd = 0.5 + SAFE_WIDTH / 2;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,20,50,0.82)',
    }} onClick={() => handleInput(true)}>
      <div style={{
        background: '#0a1a2e', border: '2px solid #44aaff', borderRadius: 12,
        padding: '24px 32px', minWidth: 320, textAlign: 'center',
        color: '#fff', boxShadow: '0 0 30px #0066aa88',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>🌊 조류 타이밍!</div>
        <div style={{ fontSize: 13, color: '#88ccff', marginBottom: 16 }}>
          {fishName} — 막대가 파란 구간에 있을 때 클릭!
        </div>
        {/* bar */}
        <div style={{ position: 'relative', height: 28, background: '#112', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          {/* safe zone */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${safeStart * 100}%`, width: `${SAFE_WIDTH * 100}%`,
            background: '#2266ff44', border: '1px solid #4488ff',
          }} />
          {/* cursor */}
          <div style={{
            position: 'absolute', top: 2, bottom: 2, width: 8, borderRadius: 4,
            left: `calc(${pos * 100}% - 4px)`,
            background: flash === 'success' ? '#44ff88' : flash === 'fail' ? '#ff4444' : '#44aaff',
            transition: flash ? 'background 0.2s' : 'none',
            boxShadow: '0 0 8px currentColor',
          }} />
        </div>
        {flash === 'success' && <div style={{ color: '#44ff88', fontWeight: 700 }}>✅ 성공! +30% 크기 보너스!</div>}
        {flash === 'fail' && <div style={{ color: '#ff8888' }}>❌ 조류를 놓쳤습니다...</div>}
        {!flash && <div style={{ color: '#aaccff', fontSize: 12 }}>클릭하거나 탭해서 타이밍을 맞추세요</div>}
      </div>
    </div>
  );
}
