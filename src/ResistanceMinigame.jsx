import { useState, useEffect, useRef, useCallback } from 'react';

const RARITY_COLOR = { 전설: '#ffdd44', 신화: '#ff88ff' };
const RARITY_ICON  = { 전설: '⭐', 신화: '🌟' };

/**
 * 릴 미니게임: 꾹 눌러서 릴을 감아 물고기를 당겨오는 방식
 * - 스페이스/엔터/터치/클릭 홀드 → 릴 감기 (거리 감소)
 * - 릴 감는 중 스트레스 증가 → 100% 도달 시 줄 끊김
 * - 손 떼면 스트레스 회복, 물고기는 천천히 멀어짐
 * - 물고기가 주기적으로 저항(돌진) → 거리 급증 + 스트레스 급증
 * - 거리 0 도달 시 포획 성공
 */
export default function ResistanceMinigame({ fishName, rarity, size, fishGrade = 0, resistMastery = {}, onSuccess, onFail }) {
  const isMythic = rarity === '신화';
  const rColor   = RARITY_COLOR[rarity] ?? '#ffdd44';
  const rIcon    = RARITY_ICON[rarity]  ?? '⭐';

  // ── 그레이드 보너스 ─────────────────────────────────────────
  const gradeReelBonus    = fishGrade * 0.6;           // 릴 속도 +0.6m/s per grade
  const gradeStressReduce = Math.min(fishGrade * 0.02, 0.16); // 스트레스 증가 최대 -16%
  const gradeDecayBonus   = fishGrade * 1.5;           // 스트레스 회복 +1.5%/s per grade
  const gradeDriftReduce  = fishGrade >= 3 ? 0.25 : 0; // grade 3+ 비릴 시 흘러가는 속도 -25%

  // ── 퍽 보너스 ──────────────────────────────────────────────
  const perkDecayBonus    = resistMastery.resistDecayBonus   ?? 0;  // %/s
  const perkStressReduce  = resistMastery.resistStressReduce ?? 0;  // 비율 감소
  const perkMaxStress     = resistMastery.resistMaxStress    ?? 0;  // 최대치 +
  const perkDistReduce    = resistMastery.resistDistReduce   ?? 0;  // 시작 거리 -

  // ── 게임 파라미터 ────────────────────────────────────────────
  const MAX_STRESS    = 100 + perkMaxStress;
  const REEL_RATE     = (isMythic ? 11 : 13) + gradeReelBonus;       // m/s
  const DRIFT_RATE    = (isMythic ? 3.5 : 2.5) * (1 - gradeDriftReduce); // m/s (비릴 시 멀어지는 속도)
  const STRESS_RATE   = (isMythic ? 16 : 13) * (1 - gradeStressReduce) * (1 - perkStressReduce); // %/s
  const DECAY_RATE    = (isMythic ? 22 : 25) + gradeDecayBonus + perkDecayBonus; // %/s
  const FIGHT_INTERVAL_MIN = isMythic ? 3.5 : 4.5; // 저항 최소 간격 (s)
  const FIGHT_INTERVAL_RNG = isMythic ? 3.0 : 3.5; // 랜덤 추가
  const FIGHT_DURATION_MIN = isMythic ? 0.9 : 0.6;
  const FIGHT_DURATION_RNG = isMythic ? 1.1 : 0.9;
  const FIGHT_DRIFT_MULT   = isMythic ? 3.5 : 3;   // 저항 중 drift 배율
  const FIGHT_STRESS_EXTRA = isMythic ? 13  : 9;   // 저항 중 스트레스 추가 %/s

  // ── 초기 거리 (1회만 계산) ──────────────────────────────────
  const initDistRef = useRef(null);
  if (initDistRef.current === null) {
    const base = isMythic ? (120 + Math.random() * 100) : (70 + Math.random() * 90);
    initDistRef.current = Math.round(base * (1 - perkDistReduce));
  }
  const INIT_DIST = initDistRef.current;

  // ── React 상태 (렌더용) ──────────────────────────────────────
  const [distance,   setDistance]   = useState(INIT_DIST);
  const [stress,     setStress]     = useState(0);
  const [isReeling,  setIsReeling]  = useState(false);
  const [isFighting, setIsFighting] = useState(false);
  const [phase,      setPhase]      = useState('playing'); // 'playing' | 'success' | 'fail'

  // ── 내부 ref (RAF 루프용) ─────────────────────────────────────
  const stRef        = useRef({ distance: INIT_DIST, stress: 0, reeling: false, fighting: false, done: false });
  const rafRef       = useRef(null);
  const lastRef      = useRef(null);
  const lastVibrateRef = useRef(0);
  const fightRef = useRef({
    nextFightAt: FIGHT_INTERVAL_MIN + Math.random() * FIGHT_INTERVAL_RNG,
    fightEndAt:  0,
    elapsed:     0,
  });

  // ── 게임 루프 ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.1); // seconds, cap 100ms
      lastRef.current = ts;

      const st = stRef.current;
      const fr = fightRef.current;
      if (st.done) return;

      fr.elapsed += dt;

      // 저항 상태 갱신
      if (!st.fighting && fr.elapsed >= fr.nextFightAt) {
        st.fighting = true;
        setIsFighting(true);
        fr.fightEndAt = fr.elapsed + FIGHT_DURATION_MIN + Math.random() * FIGHT_DURATION_RNG;
      }
      if (st.fighting && fr.elapsed >= fr.fightEndAt) {
        st.fighting = false;
        setIsFighting(false);
        fr.nextFightAt = fr.elapsed + FIGHT_INTERVAL_MIN + Math.random() * FIGHT_INTERVAL_RNG;
      }

      // 거리 갱신
      let dist = st.distance;
      if (st.reeling) {
        dist -= REEL_RATE * dt;
        if (st.fighting) dist += DRIFT_RATE * FIGHT_DRIFT_MULT * dt; // 저항으로 되밀림
      } else {
        dist += DRIFT_RATE * (st.fighting ? FIGHT_DRIFT_MULT : 1) * dt;
      }
      dist = Math.max(0, Math.min(INIT_DIST * 1.3, dist));

      // 스트레스 갱신
      let str = st.stress;
      if (st.reeling) {
        str += STRESS_RATE * dt;
        if (st.fighting) str += FIGHT_STRESS_EXTRA * dt;
      } else {
        str -= DECAY_RATE * dt;
      }
      str = Math.max(0, str);

      st.distance = dist;
      st.stress   = str;
      setDistance(Math.round(dist));
      setStress(str);

      // 스트레스 80% 이상 — 진동 (모바일) / 화면 흔들림은 렌더에서 처리
      if (str / MAX_STRESS >= 0.8) {
        const nowMs = performance.now();
        if (nowMs - lastVibrateRef.current > 120) {
          const intensity = Math.round(6 + ((str / MAX_STRESS) - 0.8) * 40);
          navigator.vibrate?.(intensity);
          lastVibrateRef.current = nowMs;
        }
      }

      // 승패 판정
      if (dist <= 0) {
        st.done = true;
        cancelAnimationFrame(rafRef.current);
        navigator.vibrate?.(0);
        setPhase('success');
        setTimeout(() => onSuccess(), 600);
        return;
      }
      if (str >= MAX_STRESS) {
        st.done = true;
        cancelAnimationFrame(rafRef.current);
        navigator.vibrate?.(0);
        setPhase('fail');
        setTimeout(() => onFail(), 600);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 릴 조작 ─────────────────────────────────────────────────
  const startReel = useCallback(() => {
    if (stRef.current.done) return;
    stRef.current.reeling = true;
    setIsReeling(true);
  }, []);

  const stopReel = useCallback(() => {
    stRef.current.reeling = false;
    setIsReeling(false);
  }, []);

  // 키보드
  useEffect(() => {
    const onDown = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startReel(); } };
    const onUp   = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); stopReel(); } };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [startReel, stopReel]);

  // ── 계산된 표시값 ────────────────────────────────────────────
  const stressPct   = Math.min((stress / MAX_STRESS) * 100, 100);
  const distPct     = Math.min(distance / INIT_DIST, 1); // 1 = 멀다, 0 = 잡았다
  const stressColor = stressPct > 75 ? '#ff4444' : stressPct > 45 ? '#ffaa22' : '#44cc88';

  // 데스크탑 화면 흔들림 (터치 미지원 기기만)
  const isTouchDevice = navigator.maxTouchPoints > 0;
  const shakeAmp = (!isTouchDevice && stressPct > 80 && phase === 'playing')
    ? ((stressPct - 80) / 20) * 5
    : 0;
  const t = performance.now();
  const shakeTransform = shakeAmp > 0
    ? `translate(${(Math.sin(t / 40) * shakeAmp).toFixed(1)}px, ${(Math.cos(t / 29) * shakeAmp * 0.6).toFixed(1)}px)`
    : 'none';

  const hasPerkBonus = perkDecayBonus > 0 || perkStressReduce > 0 || perkMaxStress > 0 || perkDistReduce > 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.82)' }}
      onMouseDown={startReel}
      onMouseUp={stopReel}
      onMouseLeave={stopReel}
      onTouchStart={(e) => { e.preventDefault(); startReel(); }}
      onTouchEnd={(e)   => { e.preventDefault(); stopReel();  }}
      onTouchCancel={(e)=> { e.preventDefault(); stopReel();  }}
    >
      <div style={{
        background: '#0a1a2a', border: `2px solid ${rColor}`,
        borderRadius: 18, padding: '22px 28px', minWidth: 340, maxWidth: 400,
        textAlign: 'center', userSelect: 'none',
        boxShadow: `0 0 36px ${rColor}44`,
        transform: shakeTransform,
      }}>
        {/* 헤더 */}
        <div style={{ fontSize: 26, marginBottom: 3 }}>{rIcon}</div>
        <div style={{ fontSize: 18, color: rColor, fontWeight: 800, marginBottom: 2 }}>
          {fishName} {size}cm
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
          {rarity} — 꾹 눌러서 릴을 감으세요
        </div>

        {/* 그레이드 / 퍽 정보 */}
        {(fishGrade > 0 || hasPerkBonus) && (
          <div style={{ fontSize: 10, marginBottom: 12, lineHeight: 1.7 }}>
            {fishGrade > 0 && (
              <span style={{ color: '#88ccff' }}>
                낚시 {fishGrade}성 — 릴 +{gradeReelBonus.toFixed(1)}m/s
                {gradeDecayBonus > 0 ? ` · 회복 +${gradeDecayBonus.toFixed(0)}%/s` : ''}
                {gradeStressReduce > 0 ? ` · 스트레스 -${Math.round(gradeStressReduce * 100)}%` : ''}
                {gradeDriftReduce > 0 ? ' · 흘러가기 -25%' : ''}
              </span>
            )}
            {hasPerkBonus && (
              <span style={{ color: '#ff9977', display: 'block' }}>
                대어격투 퍽
                {perkDecayBonus   > 0 ? ` · 회복 +${perkDecayBonus}%/s`            : ''}
                {perkStressReduce > 0 ? ` · 스트레스 -${Math.round(perkStressReduce * 100)}%` : ''}
                {perkMaxStress    > 0 ? ` · 내구도 +${perkMaxStress}`               : ''}
                {perkDistReduce   > 0 ? ` · 거리 -${Math.round(perkDistReduce * 100)}%`        : ''}
              </span>
            )}
          </div>
        )}

        {/* 거리 바 + 릴 버튼 | 수직 스트레스 바 */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>

          {/* 왼쪽: 거리 바 + 릴 버튼 + 결과 */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* 거리 바 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#aaa', marginBottom: 5 }}>
                <span>🎣</span>
                <span style={{
                  color: isFighting ? '#ff6644' : '#cccccc',
                  fontWeight: isFighting ? 800 : 400,
                  fontSize: isFighting ? 13 : 11,
                }}>
                  {isFighting ? '⚡ 저항 중!' : `${distance}m`}
                </span>
                <span style={{ color: rColor }}>{rIcon}</span>
              </div>

              {/* 줄 + 물고기 */}
              <div style={{ position: 'relative', height: 28, background: '#111e2e', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${(1 - distPct) * 100}%`,
                  background: isReeling
                    ? `linear-gradient(90deg, ${rColor}55, ${rColor}22)`
                    : 'rgba(255,255,255,0.05)',
                  transition: 'background 0.2s',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: 0,
                  width: `${(1 - distPct) * 100}%`,
                  height: 2,
                  background: isReeling ? rColor : '#445566',
                  transform: 'translateY(-50%)',
                  transition: 'background 0.15s',
                }} />
                <div style={{
                  position: 'absolute', top: '50%',
                  left: `${(1 - distPct) * 100}%`,
                  transform: 'translateY(-50%) translateX(-2px)',
                  fontSize: 18,
                  filter: isFighting ? 'hue-rotate(30deg) brightness(1.3)' : 'none',
                  transition: 'left 0.08s linear, filter 0.15s',
                }}>
                  🐟
                </div>
              </div>

              <div style={{ fontSize: 10, color: '#445566', marginTop: 3, textAlign: 'right' }}>
                {distance}m / {INIT_DIST}m
              </div>
            </div>

            {/* 릴 버튼 */}
            {phase === 'playing' && (
              <div
                style={{
                  padding: '13px 0', borderRadius: 10,
                  background: isReeling ? rColor : 'rgba(255,255,255,0.07)',
                  color: isReeling ? '#000' : '#777',
                  fontWeight: 800, fontSize: 15,
                  border: `2px solid ${isReeling ? rColor : 'rgba(255,255,255,0.12)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  boxShadow: isReeling ? `0 0 16px ${rColor}88` : 'none',
                }}
                onMouseDown={(e) => { e.stopPropagation(); startReel(); }}
                onMouseUp={(e)   => { e.stopPropagation(); stopReel();  }}
                onTouchStart={(e)=> { e.stopPropagation(); e.preventDefault(); startReel(); }}
                onTouchEnd={(e)  => { e.stopPropagation(); e.preventDefault(); stopReel();  }}
              >
                {isReeling ? '🎣 릴 감는 중...' : '꾹 눌러서 릴 감기'}
              </div>
            )}

            {/* 결과 */}
            {phase !== 'playing' && (
              <div style={{ padding: '13px 0', fontSize: 16, fontWeight: 800, color: phase === 'success' ? '#44ff88' : '#ff4444' }}>
                {phase === 'success' ? '🎉 포획 성공!' : '💔 줄이 끊어졌습니다!'}
              </div>
            )}

          </div>{/* /왼쪽 */}

          {/* 오른쪽: 수직 스트레스 바 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 28 }}>
            {/* 수치 */}
            <div style={{ fontSize: 9, color: stressColor, fontWeight: 800, lineHeight: 1.2, textAlign: 'center' }}>
              {MAX_STRESS > 100
                ? <>{Math.round(stress)}<br/><span style={{ color: '#445', fontWeight: 400 }}>{MAX_STRESS}</span></>
                : `${Math.round(stressPct)}%`
              }
            </div>
            {/* 세그먼트 (위 = 위험, 아래 = 안전) */}
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2, flex: 1 }}>
              {Array.from({ length: 10 }, (_, i) => {
                const filled   = stressPct > i * 10;
                const segColor = i >= 8 ? '#ff2020'
                               : i >= 6 ? '#ff7700'
                               : i >= 4 ? '#ffcc00'
                               : '#44cc88';
                const isHot    = filled && stressPct > 80;
                const pulse    = isHot
                  ? 0.55 + 0.45 * Math.abs(Math.sin(performance.now() / (105 - i * 4) + i * 1.2))
                  : 1;
                const segW     = 14 + i * 1.2; // 위로 갈수록 넓게
                return (
                  <div key={i} style={{
                    width: segW, height: 11, borderRadius: 3, alignSelf: 'center',
                    background: filled ? segColor : '#0d1a28',
                    border: `1px solid ${filled ? segColor + '99' : '#182434'}`,
                    opacity: filled ? pulse : 0.35,
                    boxShadow: isHot ? `0 0 ${4 + i}px ${segColor}bb` : 'none',
                  }} />
                );
              })}
            </div>
            {/* 레이블 */}
            <div style={{ fontSize: 8, color: '#445', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 1, marginTop: 2 }}>
              스트레스
            </div>
            {perkMaxStress > 0 && (
              <div style={{ fontSize: 7, color: '#ff9977', textAlign: 'center', lineHeight: 1.3 }}>
                +{perkMaxStress}
              </div>
            )}
          </div>{/* /오른쪽 */}

        </div>{/* /2-col */}

        <div style={{ marginTop: 10, fontSize: 10, color: '#444' }}>
          스페이스/엔터 또는 화면을 꾹 누르세요
        </div>
      </div>
    </div>
  );
}
