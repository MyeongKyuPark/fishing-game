import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 아이소메트릭 타일 정밀 채굴 미니게임
 * - 5x5 대각선 뷰 그리드, 플레이어(⛏)가 중앙(2,2)
 * - 타일 위에 광석 노드가 떠있음
 * - 범위 내 광석을 클릭/터치 홀드 → 진행률이 차면 채굴 완료
 * - 타이머가 끝나면 채굴한 수를 보고 종료
 */

const GRID       = 5;
const CENTER     = 2;
const TILE_W     = 56;   // 타일 다이아몬드 가로
const TILE_H     = 28;   // 타일 다이아몬드 세로
const SVG_W      = 310;
const SVG_H      = 215;
const ORIGIN_X   = 155;
const ORIGIN_Y   = 50;
const PROG_R     = 15;   // 진행 링 반지름
const PROG_CIRC  = 2 * Math.PI * PROG_R;
const BASE_MINE_TIME = 1.5;   // 초
const BASE_DURATION  = 20;    // 초
const BASE_ORE_COUNT = 8;     // 초기 광석 수

const ORE_COLORS = { 철광석: '#b0b8c8', 구리광석: '#d4a050', 수정: '#88ccff', 금광석: '#ffd700' };
const ORE_GLYPH  = { 철광석: '■', 구리광석: '●', 수정: '◆', 금광석: '★' };

// 체비쇼프 거리
function cheby(col, row) { return Math.max(Math.abs(col - CENTER), Math.abs(row - CENTER)); }

// 아이소메트릭 좌표 → SVG 좌표 (타일 최상단 꼭짓점)
function iso(col, row) {
  return {
    x: ORIGIN_X + (col - row) * (TILE_W / 2),
    y: ORIGIN_Y + (col + row) * (TILE_H / 2),
  };
}

// 초기 광석 배치 (shuffle → 앞에서 n개 선택)
function genOres(count) {
  const pool = [];
  for (let c = 0; c < GRID; c++)
    for (let r = 0; r < GRID; r++)
      if (!(c === CENTER && r === CENTER)) pool.push({ col: c, row: r });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).map((p, i) => ({
    id: i, col: p.col, row: p.row, chainCredit: 0,
  }));
}

export default function MiningMinigame({ oreName, miningBonus = {}, onFinish }) {
  const mineRange        = miningBonus.mineRange        ?? 1;
  const mineSpeedMult    = miningBonus.mineSpeedMult    ?? 1;
  const mineTimerBonus   = miningBonus.mineTimerBonus   ?? 0;
  const mineYieldBonus   = miningBonus.mineYieldBonus   ?? 0;
  const mineDoubleChance = miningBonus.mineDoubleChance ?? 0;
  const mineExtraOres    = miningBonus.mineExtraOres    ?? 0;
  const mineChainBonus   = miningBonus.mineChainBonus   ?? 0;

  const MINE_TIME = BASE_MINE_TIME * mineSpeedMult;
  const DURATION  = BASE_DURATION + mineTimerBonus;

  // ── 상태 ──────────────────────────────────────────────────────
  const [ores, setOres]             = useState(() => genOres(BASE_ORE_COUNT + mineExtraOres));
  const [holdTargetId, setHoldTgt]  = useState(null);
  const [holdProgress, setHoldProg] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(DURATION);
  const [minedCount, setMinedCount] = useState(0);
  const [totalYield, setTotalYield] = useState(0);
  const [flashId, setFlashId]       = useState(null); // 채굴 완료 효과
  const [phase, setPhase]           = useState('playing');

  // ── 내부 ref (RAF 루프) ───────────────────────────────────────
  const oresRef     = useRef(ores);
  const holdRef     = useRef({ id: null, startTs: null });
  const timeRef     = useRef(DURATION);
  const yieldRef    = useRef(0);
  const rafRef      = useRef(null);
  const lastRef     = useRef(null);

  useEffect(() => { oresRef.current = ores; }, [ores]);

  // ── 게임 루프 ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.1);
      lastRef.current = ts;

      // 타이머
      timeRef.current = Math.max(0, timeRef.current - dt);
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        setPhase('done');
        setTimeout(() => onFinish(yieldRef.current), 800);
        return;
      }

      // 홀드 진행률
      const h = holdRef.current;
      if (h.id !== null && h.startTs !== null) {
        const elapsed = (ts - h.startTs) / 1000;
        const prog = Math.min(elapsed / MINE_TIME, 1);
        setHoldProg(prog);

        if (prog >= 1) {
          // 채굴 완료
          const minedId  = h.id;
          const minedOre = oresRef.current.find(o => o.id === minedId);
          h.id = null; h.startTs = null;
          setHoldTgt(null); setHoldProg(0);

          // 수확 계산
          let gain = 1 + mineYieldBonus;
          if (Math.random() < mineDoubleChance) gain += 1;
          yieldRef.current += gain;
          setMinedCount(c => c + 1);
          setTotalYield(yieldRef.current);
          setFlashId(minedId);
          setTimeout(() => setFlashId(null), 450);

          setOres(prev => {
            let next = prev.filter(o => o.id !== minedId);
            // 연쇄 채굴: 인접 광석에 크레딧 부여
            if (mineChainBonus > 0 && minedOre) {
              next = next.map(o => {
                const adj = Math.max(Math.abs(o.col - minedOre.col), Math.abs(o.row - minedOre.row)) <= 1;
                return adj ? { ...o, chainCredit: Math.min((o.chainCredit ?? 0) + mineChainBonus, 0.9) } : o;
              });
            }
            return next;
          });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [phase, MINE_TIME, mineYieldBonus, mineDoubleChance, mineChainBonus, onFinish]);

  // ── 인터랙션 ──────────────────────────────────────────────────
  const startHold = useCallback((oreId, inRange) => {
    if (!inRange || phase !== 'playing') return;
    const ore = oresRef.current.find(o => o.id === oreId);
    const credit = ore?.chainCredit ?? 0;
    holdRef.current = { id: oreId, startTs: performance.now() - credit * MINE_TIME * 1000 };
    setHoldTgt(oreId);
    setHoldProg(credit);
  }, [phase, MINE_TIME]);

  const stopHold = useCallback(() => {
    if (!holdRef.current.id) return;
    holdRef.current = { id: null, startTs: null };
    setHoldTgt(null); setHoldProg(0);
  }, []);

  // ── 렌더 준비 ─────────────────────────────────────────────────
  const oreColor = ORE_COLORS[oreName] ?? '#aaaaaa';
  const timePct  = timeLeft / DURATION;

  // 타일 painter's algorithm 정렬: col+row 오름차순
  const sortedTiles = Array.from({ length: GRID * GRID }, (_, i) => ({
    col: i % GRID, row: Math.floor(i / GRID),
  })).sort((a, b) => (a.col + a.row) - (b.col + b.row));

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
    >
      <div style={{
        background: '#080f18', border: `2px solid ${oreColor}`,
        borderRadius: 18, padding: '16px 18px',
        textAlign: 'center', userSelect: 'none',
        boxShadow: `0 0 36px ${oreColor}44`,
        maxWidth: 360,
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 14, color: oreColor, fontWeight: 800 }}>⛏ {oreName} 정밀 채굴</div>
          <div style={{ fontSize: 13, fontWeight: timeLeft < 5 ? 800 : 400, color: timeLeft < 5 ? '#ff4444' : timeLeft < 10 ? '#ffaa22' : '#aaa' }}>
            ⏱ {Math.ceil(timeLeft)}s
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#556', marginBottom: 8, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <span>범위 <span style={{ color: oreColor }}>{mineRange}</span>칸</span>
          <span>채굴 <span style={{ color: oreColor }}>{minedCount}</span>회</span>
          <span>획득 <span style={{ color: '#ffd700' }}>{totalYield}</span>개</span>
          {mineChainBonus > 0 && <span style={{ color: '#dd88ff' }}>연쇄</span>}
        </div>

        {/* 타임바 */}
        <div style={{ height: 3, background: '#1a2a3a', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${timePct * 100}%`, background: timeLeft < 5 ? '#ff4444' : timeLeft < 10 ? '#ffaa22' : oreColor, transition: 'width 0.1s linear, background 0.3s', borderRadius: 2 }} />
        </div>

        {/* 아이소메트릭 그리드 */}
        <svg
          width={SVG_W} height={SVG_H}
          style={{ display: 'block', margin: '0 auto', touchAction: 'none' }}
        >
          {sortedTiles.map(({ col, row }) => {
            const isCenter = col === CENTER && row === CENTER;
            const dist     = cheby(col, row);
            const inRange  = !isCenter && dist <= mineRange;
            const pos      = iso(col, row);
            const ore      = ores.find(o => o.col === col && o.row === row);
            const isMining = ore != null && holdTargetId === ore.id;
            const prog     = isMining ? holdProgress : (ore?.chainCredit ?? 0);
            const isFlash  = ore != null && flashId === ore.id;

            // 타일 다이아몬드 꼭짓점
            const pts = [
              `${pos.x},${pos.y}`,
              `${pos.x + TILE_W / 2},${pos.y + TILE_H / 2}`,
              `${pos.x},${pos.y + TILE_H}`,
              `${pos.x - TILE_W / 2},${pos.y + TILE_H / 2}`,
            ].join(' ');

            // 타일 색상
            const tileFill   = isCenter ? '#162640' : inRange ? '#0e1e30' : '#090f18';
            const tileStroke = isCenter ? '#2255aa' : inRange ? '#1a3050' : '#0d1620';

            // 광석 위치 (타일 꼭대기에서 위로 떠있음)
            const ox = pos.x;
            const oy = pos.y - 12;

            return (
              <g key={`${col}-${row}`}>
                {/* 타일 면 */}
                <polygon points={pts} fill={tileFill} stroke={tileStroke} strokeWidth={1} />

                {/* 범위 강조 */}
                {inRange && (
                  <polygon points={pts} fill={`${oreColor}0c`} stroke={`${oreColor}28`} strokeWidth={0.8} />
                )}

                {/* 광석 노드 */}
                {ore && !isFlash && (
                  <g
                    style={{ cursor: inRange ? 'pointer' : 'default' }}
                    onPointerDown={(e) => { e.stopPropagation(); startHold(ore.id, inRange); }}
                  >
                    {/* 진행 링 */}
                    {prog > 0 && (
                      <circle
                        cx={ox} cy={oy} r={PROG_R}
                        fill="none"
                        stroke={isMining ? oreColor : `${oreColor}88`}
                        strokeWidth={isMining ? 3 : 2}
                        strokeDasharray={`${prog * PROG_CIRC} ${PROG_CIRC}`}
                        strokeLinecap="round"
                        transform={`rotate(-90,${ox},${oy})`}
                      />
                    )}
                    {/* 외곽 글로우 (범위 내 + 홀드 중) */}
                    {inRange && isMining && (
                      <circle cx={ox} cy={oy} r={12} fill={`${oreColor}20`} stroke={`${oreColor}60`} strokeWidth={1} />
                    )}
                    {/* 광석 몸체 */}
                    <circle
                      cx={ox} cy={oy} r={9}
                      fill={inRange ? `${oreColor}30` : '#0a1520'}
                      stroke={inRange ? oreColor : '#1e2e3e'}
                      strokeWidth={inRange ? 1.5 : 1}
                    />
                    {/* 광석 글리프 */}
                    <text x={ox} y={oy + 4} textAnchor="middle" fontSize={9}
                      fill={inRange ? oreColor : '#2a3a4a'}
                      style={{ pointerEvents: 'none', fontWeight: 'bold' }}>
                      {ORE_GLYPH[oreName] ?? '●'}
                    </text>
                    {/* 범위 밖 표시 */}
                    {!inRange && (
                      <text x={ox} y={oy - 14} textAnchor="middle" fontSize={8} fill="#2a3a4a" style={{ pointerEvents: 'none' }}>
                        범위밖
                      </text>
                    )}
                  </g>
                )}

                {/* 채굴 완료 플래시 */}
                {isFlash && (
                  <text x={ox} y={oy} textAnchor="middle" fontSize={16} style={{ pointerEvents: 'none' }}>
                    ✨
                  </text>
                )}

                {/* 플레이어 */}
                {isCenter && (
                  <text
                    x={pos.x} y={pos.y + TILE_H / 2 + 6}
                    textAnchor="middle" fontSize={17}
                    style={{ pointerEvents: 'none' }}>
                    ⛏
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* 퍽 정보 */}
        {(mineTimerBonus > 0 || mineSpeedMult < 1 || mineExtraOres > 0 || mineChainBonus > 0) && (
          <div style={{ fontSize: 10, color: '#dd88ff', marginTop: 8 }}>
            퍽 적용됨
            {mineSpeedMult < 1  ? ` · 속도 +${Math.round((1 - mineSpeedMult) * 100)}%` : ''}
            {mineTimerBonus > 0 ? ` · 시간 +${mineTimerBonus}s` : ''}
            {mineExtraOres > 0  ? ` · 노드 +${mineExtraOres}` : ''}
            {mineChainBonus > 0 ? ` · 연쇄 ${Math.round(mineChainBonus * 100)}%` : ''}
          </div>
        )}

        {/* 결과 */}
        {phase === 'done' && (
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 800, color: totalYield > 0 ? oreColor : '#aaa' }}>
            {totalYield > 0 ? `💎 ${oreName} +${totalYield}개 추가!` : '이번엔 채굴 못했어요'}
          </div>
        )}

        <div style={{ marginTop: 8, fontSize: 9, color: '#333' }}>
          광석을 꾹 눌러 채굴 · 범위 밖은 퍽으로 확장 가능
        </div>
      </div>
    </div>
  );
}
