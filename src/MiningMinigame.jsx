import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 아이소메트릭 타일 정밀 채굴 미니게임
 * - 범위 내 타일만 표시 (범위 밖 완전 숨김)
 * - 클릭 → 원형 범위 표시 → 원 안 광석 일괄 채굴
 * - 광석을 모두 캐면 즉시 새 파도 생성 (타이머 소진까지 반복)
 * - 타이머 종료 시 총 획득량으로 결과 처리
 */

const GRID       = 5;
const CENTER     = 2;
const TILE_W     = 72;
const TILE_H     = 36;
const SVG_W      = 420;
const SVG_H      = 290;
const ORIGIN_X   = 210;
const ORIGIN_Y   = 60;
const CLICK_R    = 62;        // 클릭 채굴 원 반지름 (SVG px)
const BASE_DURATION  = 20;   // 초
const BASE_ORE_COUNT = 14;   // 파도당 기본 광석 수

const ORE_COLORS = { 철광석: '#b0b8c8', 구리광석: '#d4a050', 수정: '#88ccff', 금광석: '#ffd700' };
const ORE_GLYPH  = { 철광석: '■', 구리광석: '●', 수정: '◆', 금광석: '★' };

function cheby(col, row) { return Math.max(Math.abs(col - CENTER), Math.abs(row - CENTER)); }

function iso(col, row) {
  return {
    x: ORIGIN_X + (col - row) * (TILE_W / 2),
    y: ORIGIN_Y + (col + row) * (TILE_H / 2),
  };
}

let _oreIdSeed = 0;
function genOres(count, range) {
  const pool = [];
  for (let c = 0; c < GRID; c++)
    for (let r = 0; r < GRID; r++)
      if (!(c === CENTER && r === CENTER) && cheby(c, r) <= range)
        pool.push({ col: c, row: r });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).map(p => ({
    id: ++_oreIdSeed, col: p.col, row: p.row,
  }));
}

export default function MiningMinigame({ oreName, miningBonus = {}, onFinish }) {
  // mineRange: 0 또는 미설정이면 2 사용 (범위 2칸 = 24타일로 충분한 노드 확보)
  const mineRange        = miningBonus.mineRange        || 2;
  const mineTimerBonus   = miningBonus.mineTimerBonus   ?? 0;
  const mineYieldBonus   = miningBonus.mineYieldBonus   ?? 0;
  const mineDoubleChance = miningBonus.mineDoubleChance ?? 0;
  const mineExtraOres    = miningBonus.mineExtraOres    ?? 0;
  const mineChainBonus   = miningBonus.mineChainBonus   ?? 0;

  const DURATION  = BASE_DURATION + mineTimerBonus;
  const oreCount  = BASE_ORE_COUNT + mineExtraOres;

  // ── 상태 ──────────────────────────────────────────────────────
  const [ores, setOres]               = useState(() => genOres(oreCount, mineRange));
  const [timeLeft, setTimeLeft]       = useState(DURATION);
  const [minedCount, setMinedCount]   = useState(0);
  const [totalYield, setTotalYield]   = useState(0);
  const [waveCount, setWaveCount]     = useState(1);
  const [flashIds, setFlashIds]       = useState([]);
  const [clickCircle, setClickCircle] = useState(null);
  const [phase, setPhase]             = useState('playing');

  // ── 내부 ref ─────────────────────────────────────────────────
  const oresRef    = useRef(ores);
  const timeRef    = useRef(DURATION);
  const yieldRef   = useRef(0);
  const rafRef     = useRef(null);
  const lastRef    = useRef(null);

  useEffect(() => { oresRef.current = ores; }, [ores]);

  // 광석이 모두 채굴되면 → 새 파도 즉시 생성
  useEffect(() => {
    if (phase === 'playing' && ores.length === 0) {
      setWaveCount(w => w + 1);
      setOres(genOres(oreCount, mineRange));
    }
  }, [ores, phase, oreCount, mineRange]);

  // ── 게임 루프 (타이머) ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.1);
      lastRef.current = ts;

      timeRef.current = Math.max(0, timeRef.current - dt);
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        setPhase('done');
        setTimeout(() => onFinish(yieldRef.current), 800);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [phase, onFinish]);

  // ── 클릭 채굴 ────────────────────────────────────────────────
  const handleSvgClick = useCallback((e) => {
    if (phase !== 'playing') return;
    const svgEl = e.currentTarget;
    const rect  = svgEl.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width)  * SVG_W;
    const svgY  = ((e.clientY - rect.top)  / rect.height) * SVG_H;

    setClickCircle({ x: svgX, y: svgY });
    setTimeout(() => setClickCircle(null), 380);

    const toMine = [];
    for (const ore of oresRef.current) {
      const pos  = iso(ore.col, ore.row);
      const dist = Math.sqrt((pos.x - svgX) ** 2 + ((pos.y - 12) - svgY) ** 2);
      if (dist <= CLICK_R) toMine.push(ore.id);
    }
    if (toMine.length === 0) return;

    let gain = 0;
    for (let i = 0; i < toMine.length; i++) {
      let g = 1 + mineYieldBonus;
      if (Math.random() < mineDoubleChance) g += 1;
      gain += g;
    }
    yieldRef.current += gain;
    setMinedCount(c => c + toMine.length);
    setTotalYield(yieldRef.current);
    setFlashIds(toMine);
    setTimeout(() => setFlashIds([]), 420);

    setOres(prev => {
      let next = prev.filter(o => !toMine.includes(o.id));
      if (mineChainBonus > 0) {
        const minedOres = prev.filter(o => toMine.includes(o.id));
        next = next.map(o => {
          const isAdj = minedOres.some(
            m => Math.max(Math.abs(o.col - m.col), Math.abs(o.row - m.row)) <= 1
          );
          return isAdj ? { ...o, chainCredit: Math.min((o.chainCredit ?? 0) + mineChainBonus, 0.9) } : o;
        });
      }
      return next;
    });
  }, [phase, mineYieldBonus, mineDoubleChance, mineChainBonus]);

  // ── 렌더 준비 ─────────────────────────────────────────────────
  const oreColor = ORE_COLORS[oreName] ?? '#aaaaaa';
  const timePct  = timeLeft / DURATION;

  // 범위 내 타일 + 중앙만 렌더 (범위 밖 완전 숨김)
  const sortedTiles = Array.from({ length: GRID * GRID }, (_, i) => ({
    col: i % GRID, row: Math.floor(i / GRID),
  }))
    .filter(({ col, row }) => {
      const isCenter = col === CENTER && row === CENTER;
      return isCenter || cheby(col, row) <= mineRange;
    })
    .sort((a, b) => (a.col + a.row) - (b.col + b.row));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        background: '#080f18', border: `2px solid ${oreColor}`,
        borderRadius: 18, padding: '16px 18px',
        textAlign: 'center', userSelect: 'none',
        boxShadow: `0 0 36px ${oreColor}44`,
        maxWidth: 480,
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 14, color: oreColor, fontWeight: 800 }}>⛏ {oreName} 정밀 채굴</div>
          <div style={{ fontSize: 13, fontWeight: timeLeft < 5 ? 800 : 400, color: timeLeft < 5 ? '#ff4444' : timeLeft < 10 ? '#ffaa22' : '#aaa' }}>
            ⏱ {Math.ceil(timeLeft)}s
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#556', marginBottom: 8, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <span>파도 <span style={{ color: oreColor }}>{waveCount}</span>번째</span>
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
          style={{ display: 'block', margin: '0 auto', touchAction: 'none', cursor: phase === 'playing' ? 'crosshair' : 'default' }}
          onClick={handleSvgClick}
        >
          {sortedTiles.map(({ col, row }) => {
            const isCenter = col === CENTER && row === CENTER;
            const pos      = iso(col, row);
            const ore      = ores.find(o => o.col === col && o.row === row);
            const isFlash  = ore != null && flashIds.includes(ore.id);

            const pts = [
              `${pos.x},${pos.y}`,
              `${pos.x + TILE_W / 2},${pos.y + TILE_H / 2}`,
              `${pos.x},${pos.y + TILE_H}`,
              `${pos.x - TILE_W / 2},${pos.y + TILE_H / 2}`,
            ].join(' ');

            const tileFill   = isCenter ? '#162640' : '#0e1e30';
            const tileStroke = isCenter ? '#2255aa' : '#1a3050';
            const ox = pos.x;
            const oy = pos.y - 12;

            return (
              <g key={`${col}-${row}`}>
                <polygon points={pts} fill={tileFill} stroke={tileStroke} strokeWidth={1} />
                {!isCenter && (
                  <polygon points={pts} fill={`${oreColor}0c`} stroke={`${oreColor}28`} strokeWidth={0.8} />
                )}

                {/* 광석 노드 */}
                {ore && !isFlash && (
                  <g style={{ pointerEvents: 'none' }}>
                    <circle cx={ox} cy={oy} r={11} fill={`${oreColor}30`} stroke={oreColor} strokeWidth={1.5} />
                    <text x={ox} y={oy + 4} textAnchor="middle" fontSize={10} fill={oreColor} style={{ fontWeight: 'bold' }}>
                      {ORE_GLYPH[oreName] ?? '●'}
                    </text>
                  </g>
                )}

                {/* 채굴 완료 플래시 */}
                {isFlash && (
                  <text x={ox} y={oy} textAnchor="middle" fontSize={18} style={{ pointerEvents: 'none' }}>✨</text>
                )}

                {/* 플레이어 */}
                {isCenter && (
                  <text x={pos.x} y={pos.y + TILE_H / 2 + 6} textAnchor="middle" fontSize={17} style={{ pointerEvents: 'none' }}>⛏</text>
                )}
              </g>
            );
          })}

          {/* 클릭 채굴 원 */}
          {clickCircle && (
            <circle
              cx={clickCircle.x} cy={clickCircle.y} r={CLICK_R}
              fill={`${oreColor}18`} stroke={`${oreColor}cc`} strokeWidth={2}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {/* 퍽 정보 */}
        {(mineTimerBonus > 0 || mineExtraOres > 0 || mineChainBonus > 0) && (
          <div style={{ fontSize: 10, color: '#dd88ff', marginTop: 8 }}>
            퍽 적용됨
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
          클릭으로 원 범위 내 광석 일괄 채굴 · 다 캐면 새 파도 등장
        </div>
      </div>
    </div>
  );
}
