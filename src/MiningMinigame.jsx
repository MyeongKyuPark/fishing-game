import { useState, useEffect, useRef, useCallback } from 'react';

// 광석 정밀 채굴 미니게임
// 화면에 원이 줄어들고, 타이밍에 맞게 클릭하면 추가 광석 획득
// 녹색 링 안에 들어올 때 클릭 → 성공, 총 3번 기회, 맞출수록 많은 보너스

const ORE_COLORS = {
  철광석: '#b0b8c8',
  구리광석: '#d4a050',
  수정: '#88ccff',
  금광석: '#ffd700',
};

export default function MiningMinigame({ oreName, onFinish }) {
  const [phase, setPhase]     = useState(0);   // 0,1,2 = 세 번의 기회
  const [score, setScore]     = useState(0);   // 성공 횟수
  const [radius, setRadius]   = useState(100); // 줄어드는 원 반지름
  const [flash,  setFlash]    = useState(null);// 'hit'|'miss'
  const [done,   setDone]     = useState(false);
  const TARGET_R = 28;  // 타겟 반지름 (녹색 링)
  const TARGET_TOLERANCE = 14; // 허용 오차 px
  const SHRINK_SPEED = 0.7; // px per frame
  const rafRef  = useRef(null);
  const radRef  = useRef(100);
  const lastRef = useRef(null);

  const oreColor = ORE_COLORS[oreName] ?? '#aaaaaa';

  useEffect(() => {
    if (done) return;
    radRef.current = 100;
    setRadius(100);
    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 16.67;
      lastRef.current = ts;
      radRef.current = Math.max(4, radRef.current - SHRINK_SPEED * dt);
      setRadius(radRef.current);
      if (radRef.current <= 4) {
        // Auto-fail if circle hits center
        handleResult(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [phase, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResult = useCallback((isHit) => {
    cancelAnimationFrame(rafRef.current);
    setFlash(isHit ? 'hit' : 'miss');
    if (isHit) setScore(s => s + 1);
    setTimeout(() => {
      setFlash(null);
      const next = phase + 1;
      if (next >= 3) {
        setDone(true);
        // score is state, need +1 if hit
        setTimeout(() => onFinish(isHit ? score + 1 : score), 600);
      } else {
        setPhase(next);
        radRef.current = 100;
        lastRef.current = null;
      }
    }, 400);
  }, [phase, score, onFinish]);

  const handleClick = useCallback(() => {
    if (done || flash) return;
    const r = radRef.current;
    const inZone = Math.abs(r - TARGET_R) <= TARGET_TOLERANCE;
    handleResult(inZone);
  }, [done, flash, handleResult]);

  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handleClick(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClick]);

  const SIZE = 200;
  const cx = SIZE / 2, cy = SIZE / 2;
  const isInZone = Math.abs(radius - TARGET_R) <= TARGET_TOLERANCE;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
    }} onClick={handleClick}>
      <div style={{
        background: '#0a1218', border: `2px solid ${oreColor}`,
        borderRadius: 16, padding: '24px 32px',
        textAlign: 'center', userSelect: 'none',
        boxShadow: `0 0 30px ${oreColor}44`,
      }}>
        <div style={{ fontSize: 16, color: oreColor, fontWeight: 800, marginBottom: 4 }}>
          ⛏ {oreName} 정밀 채굴
        </div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
          녹색 링에 원이 겹칠 때 클릭!
        </div>

        {/* Circles */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto' }}>
          <svg width={SIZE} height={SIZE}>
            {/* Target ring (green) */}
            <circle cx={cx} cy={cy} r={TARGET_R + TARGET_TOLERANCE} fill="none" stroke="#44ff8844" strokeWidth={TARGET_TOLERANCE * 2} />
            <circle cx={cx} cy={cy} r={TARGET_R} fill="none" stroke="#44ff88" strokeWidth={2} />
            {/* Shrinking circle */}
            <circle cx={cx} cy={cy} r={Math.max(4, radius)}
              fill="none"
              stroke={flash === 'hit' ? '#44ff88' : flash === 'miss' ? '#ff4444' : isInZone ? '#ffdd44' : oreColor}
              strokeWidth={3}
              style={{ transition: 'stroke 0.1s' }}
            />
            {/* Center ore icon */}
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fill={oreColor}>⛏</text>
          </svg>
        </div>

        {/* Phase dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < phase ? (i < score ? '#44ff88' : '#ff4444') : i === phase ? oreColor : '#333',
              border: `2px solid ${i === phase ? oreColor : '#444'}`,
            }} />
          ))}
        </div>

        {done && (
          <div style={{ marginTop: 12, fontSize: 15, fontWeight: 800, color: score >= 2 ? '#44ff88' : score === 1 ? '#ffdd44' : '#aaa' }}>
            {score >= 2 ? `💎 정밀 채굴 성공! +${score}개 추가` : score === 1 ? `⛏ 보통 결과 +1개 추가` : '광석 추가 없음'}
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 11, color: '#666' }}>
          클릭 또는 스페이스/엔터
        </div>
      </div>
    </div>
  );
}
