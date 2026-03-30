// ── Ice Hole Minigame ─────────────────────────────────────────────────────────
// 설산정상 전용: 얼음 구멍 선택 게임
// props: onResult(upgradeRarity: bool)
import { useEffect, useRef, useState } from 'react';

const TIMEOUT = 3000;

export default function IceHoleMinigame({ onResult }) {
  const [answer] = useState(() => Math.floor(Math.random() * 4));
  const [hintPulse, setHintPulse] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3);
  const doneRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // pulse hint
    let pulseTimer = setInterval(() => setHintPulse(p => !p), 600);
    // countdown
    let elapsed = 0;
    let countTimer = setInterval(() => {
      elapsed += 1000;
      setTimeLeft(t => t - 1);
      if (elapsed >= TIMEOUT) {
        clearInterval(countTimer);
        clearInterval(pulseTimer);
        if (!doneRef.current) finish(-1); // timeout = wrong
      }
    }, 1000);
    timerRef.current = { countTimer, pulseTimer };
    return () => { clearInterval(countTimer); clearInterval(pulseTimer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function finish(idx) {
    if (doneRef.current) return;
    doneRef.current = true;
    const { countTimer, pulseTimer } = timerRef.current ?? {};
    clearInterval(countTimer); clearInterval(pulseTimer);
    setChosen(idx);
    const success = idx === answer;
    setTimeout(() => onResult(success), 900);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,20,40,0.88)',
    }}>
      <div style={{
        background: '#0d1f30', border: '2px solid #88ddff', borderRadius: 14,
        padding: '24px 32px', minWidth: 340, textAlign: 'center',
        color: '#fff', boxShadow: '0 0 30px #44aaffaa',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>❄️ 얼음 구멍 낚시!</div>
        <div style={{ fontSize: 13, color: '#aaddff', marginBottom: 4 }}>물고기가 있는 구멍을 선택하세요!</div>
        <div style={{ fontSize: 12, color: '#88aacc', marginBottom: 18 }}>남은 시간: {Math.max(0, timeLeft)}초</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
          {[0, 1, 2, 3].map(i => {
            const isAnswer = i === answer;
            const isPulse = isAnswer && hintPulse && chosen === null;
            const isChosen = chosen !== null && i === chosen;
            let bg = '#1a3050';
            let border = '2px solid #335577';
            if (chosen !== null && isAnswer) { bg = '#1a4a22'; border = '2px solid #44ff88'; }
            else if (isChosen && !isAnswer) { bg = '#4a1a1a'; border = '2px solid #ff4444'; }
            else if (isPulse) { bg = '#1a3060'; border = '2px solid #88ddff'; }
            return (
              <button key={i} onClick={() => { if (!doneRef.current) finish(i); }}
                style={{
                  width: 60, height: 60, borderRadius: '50%', cursor: chosen === null ? 'pointer' : 'default',
                  background: bg, border, color: '#fff', fontSize: 22,
                  transition: 'background 0.2s, border 0.2s',
                  boxShadow: isPulse ? '0 0 16px #44aaffaa' : 'none',
                }}>
                {chosen !== null && isAnswer ? '🐟' : '🕳️'}
              </button>
            );
          })}
        </div>
        {chosen !== null && chosen === answer && <div style={{ color: '#44ff88', fontWeight: 700 }}>🎉 정답! 희귀도 상향 가능!</div>}
        {chosen !== null && chosen !== answer && <div style={{ color: '#ff8888' }}>❌ 빗나갔습니다...</div>}
        {chosen === null && <div style={{ color: '#aaccee', fontSize: 12 }}>파문이 일렁이는 구멍을 찾아보세요...</div>}
      </div>
    </div>
  );
}
