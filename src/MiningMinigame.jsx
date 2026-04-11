import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 아이소메트릭 타일 정밀 채굴 미니게임
 * - 범위 내 타일만 표시
 * - 클릭 → 원형 범위 → 원 안 광석 일괄 채굴
 * - 광석 소진 → 파도 클리어 연출 → 새 파도 (파도마다 광석 +1)
 * - 3개+ 동시 채굴 시 COMBO 표시
 * - chain_mine 퍽: 인접 광석 chainCredit 축적 → 수확량 보너스
 */

const GRID          = 5;
const CENTER        = 2;
const TILE_W        = 72;
const TILE_H        = 36;
const SVG_W         = 420;
const SVG_H         = 290;
const ORIGIN_X      = 210;
const ORIGIN_Y      = 60;
const BASE_CLICK_R  = 62;   // 기본 클릭 원 반지름 (SVG px)
const BASE_DURATION = 20;   // 초
const BASE_ORE_COUNT = 14;  // 첫 파도 광석 수
const MAX_ORE_COUNT  = 20;  // 파도 스케일 상한

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
    id: ++_oreIdSeed, col: p.col, row: p.row, chainCredit: 0,
  }));
}

export default function MiningMinigame({ oreName, miningBonus = {}, onFinish }) {
  const mineRange        = miningBonus.mineRange        || 2;
  const mineTimerBonus   = miningBonus.mineTimerBonus   ?? 0;
  const mineYieldBonus   = miningBonus.mineYieldBonus   ?? 0;
  const mineDoubleChance = miningBonus.mineDoubleChance ?? 0;
  const mineExtraOres    = miningBonus.mineExtraOres    ?? 0;
  const mineChainBonus   = miningBonus.mineChainBonus   ?? 0;
  const mineClickBonus   = miningBonus.mineClickBonus   ?? 0; // 클릭 원 반지름 배율

  const DURATION  = BASE_DURATION + mineTimerBonus;
  const CLICK_R   = BASE_CLICK_R * (1 + mineClickBonus);
  const baseCount = Math.min(BASE_ORE_COUNT + mineExtraOres, MAX_ORE_COUNT);

  // ── 상태 ──────────────────────────────────────────────────────
  const [ores, setOres]               = useState(() => genOres(baseCount, mineRange));
  const [timeLeft, setTimeLeft]       = useState(DURATION);
  const [minedCount, setMinedCount]   = useState(0);
  const [totalYield, setTotalYield]   = useState(0);
  const [waveCount, setWaveCount]     = useState(1);
  const [flashIds, setFlashIds]       = useState([]);
  const [clickCircle, setClickCircle] = useState(null); // { x, y }
  const [waveFlash, setWaveFlash]     = useState(false); // 파도 클리어 연출
  const [comboText, setComboText]     = useState(null);  // { n, x, y }
  const [phase, setPhase]             = useState('playing');

  // ── 내부 ref ─────────────────────────────────────────────────
  const oresRef       = useRef(ores);
  const timeRef       = useRef(DURATION);
  const yieldRef      = useRef(0);
  const waveRef       = useRef(1);
  const rafRef        = useRef(null);
  const lastRef       = useRef(null);
  const respawningRef = useRef(false);

  useEffect(() => { oresRef.current = ores; }, [ores]);

  // 광석 소진 → 파도 클리어 연출 → 새 파도
  useEffect(() => {
    if (phase !== 'playing' || ores.length > 0 || respawningRef.current) return;
    respawningRef.current = true;
    setWaveFlash(true);
    setTimeout(() => {
      const nextWave = waveRef.current + 1;
      waveRef.current = nextWave;
      setWaveCount(nextWave);
      // 파도마다 광석 +1 (2파도마다), 상한 MAX_ORE_COUNT
      const nextCount = Math.min(baseCount + Math.floor((nextWave - 1) / 2), MAX_ORE_COUNT);
      setOres(genOres(nextCount, mineRange));
      setWaveFlash(false);
      respawningRef.current = false;
    }, 650);
  }, [ores, phase, baseCount, mineRange]);

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
    if (phase !== 'playing' || waveFlash) return;
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

    // 콤보 표시 (3개 이상)
    if (toMine.length >= 3) {
      setComboText({ n: toMine.length, x: svgX, y: svgY - 20 });
      setTimeout(() => setComboText(null), 750);
    }

    // 수확 계산 (체인 크레딧은 수확량 보너스로 적용)
    let gain = 0;
    const allOres = oresRef.current;
    for (const id of toMine) {
      const ore = allOres.find(o => o.id === id);
      const credit = ore?.chainCredit ?? 0;
      let g = 1 + mineYieldBonus + credit; // chain credit → 수확량 보너스
      if (Math.random() < mineDoubleChance) g += 1;
      gain += Math.round(g);
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
          return isAdj ? { ...o, chainCredit: Math.min((o.chainCredit ?? 0) + mineChainBonus, 1.5) } : o;
        });
      }
      return next;
    });
  }, [phase, waveFlash, mineYieldBonus, mineDoubleChance, mineChainBonus, CLICK_R]);

  // ── 렌더 준비 ─────────────────────────────────────────────────
  const oreColor = ORE_COLORS[oreName] ?? '#aaaaaa';
  const timePct  = timeLeft / DURATION;

  const sortedTiles = Array.from({ length: GRID * GRID }, (_, i) => ({
    col: i % GRID, row: Math.floor(i / GRID),
  }))
    .filter(({ col, row }) => col === CENTER && row === CENTER ? true : cheby(col, row) <= mineRange)
    .sort((a, b) => (a.col + a.row) - (b.col + b.row));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        background: '#080f18', border: `2px solid ${oreColor}`,
        borderRadius: 18, padding: '16px 18px',
        textAlign: 'center', userSelect: 'none',
        boxShadow: `0 0 36px ${oreColor}44`,
        maxWidth: 480, position: 'relative',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 14, color: oreColor, fontWeight: 800 }}>⛏ {oreName} 정밀 채굴</div>
          <div style={{ fontSize: 13, fontWeight: timeLeft < 5 ? 800 : 400, color: timeLeft < 5 ? '#ff4444' : timeLeft < 10 ? '#ffaa22' : '#aaa' }}>
            ⏱ {Math.ceil(timeLeft)}s
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#556', marginBottom: 8, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <span>파도 <span style={{ color: oreColor, fontWeight: 700 }}>{waveCount}</span></span>
          <span>채굴 <span style={{ color: oreColor }}>{minedCount}</span>회</span>
          <span>획득 <span style={{ color: '#ffd700', fontWeight: 700 }}>{totalYield}</span>개</span>
          {mineChainBonus > 0 && <span style={{ color: '#dd88ff' }}>연쇄</span>}
          {mineClickBonus > 0 && <span style={{ color: '#88ccff' }}>원 확대</span>}
        </div>

        {/* 타임바 */}
        <div style={{ height: 3, background: '#1a2a3a', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${timePct * 100}%`, background: timeLeft < 5 ? '#ff4444' : timeLeft < 10 ? '#ffaa22' : oreColor, transition: 'width 0.1s linear, background 0.3s', borderRadius: 2 }} />
        </div>

        {/* 아이소메트릭 그리드 */}
        <div style={{ position: 'relative' }}>
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
              const hasChain = ore != null && (ore.chainCredit ?? 0) > 0;

              const pts = [
                `${pos.x},${pos.y}`,
                `${pos.x + TILE_W / 2},${pos.y + TILE_H / 2}`,
                `${pos.x},${pos.y + TILE_H}`,
                `${pos.x - TILE_W / 2},${pos.y + TILE_H / 2}`,
              ].join(' ');

              const ox = pos.x;
              const oy = pos.y - 12;

              return (
                <g key={`${col}-${row}`}>
                  <polygon points={pts} fill={isCenter ? '#162640' : '#0e1e30'} stroke={isCenter ? '#2255aa' : '#1a3050'} strokeWidth={1} />
                  {!isCenter && <polygon points={pts} fill={`${oreColor}0c`} stroke={`${oreColor}28`} strokeWidth={0.8} />}

                  {/* 광석 노드 */}
                  {ore && !isFlash && (
                    <g style={{ pointerEvents: 'none' }}>
                      {/* 체인 글로우 */}
                      {hasChain && (
                        <circle cx={ox} cy={oy} r={16} fill="none" stroke="#dd88ff88" strokeWidth={2} />
                      )}
                      <circle cx={ox} cy={oy} r={11}
                        fill={hasChain ? `${oreColor}50` : `${oreColor}30`}
                        stroke={hasChain ? '#dd88ff' : oreColor}
                        strokeWidth={hasChain ? 2 : 1.5}
                      />
                      <text x={ox} y={oy + 4} textAnchor="middle" fontSize={10} fill={oreColor} style={{ fontWeight: 'bold' }}>
                        {ORE_GLYPH[oreName] ?? '●'}
                      </text>
                      {/* 체인 크레딧 수치 */}
                      {hasChain && (
                        <text x={ox} y={oy - 16} textAnchor="middle" fontSize={8} fill="#dd88ff" style={{ fontWeight: 'bold' }}>
                          +{Math.round(ore.chainCredit * 10) / 10}
                        </text>
                      )}
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
              <circle cx={clickCircle.x} cy={clickCircle.y} r={CLICK_R}
                fill={`${oreColor}18`} stroke={`${oreColor}cc`} strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* 콤보 텍스트 */}
            {comboText && (
              <text
                x={comboText.x} y={comboText.y}
                textAnchor="middle" fontSize={18}
                fill="#ffdd44"
                style={{ pointerEvents: 'none', fontWeight: 'bold', filter: 'drop-shadow(0 0 4px #ffaa00)' }}
              >
                COMBO ×{comboText.n}!
              </text>
            )}
          </svg>

          {/* 파도 클리어 오버레이 */}
          {waveFlash && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${oreColor}18`, borderRadius: 8,
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: oreColor, filter: `drop-shadow(0 0 8px ${oreColor})` }}>
                WAVE {waveCount} CLEAR! →
              </div>
            </div>
          )}
        </div>

        {/* 퍽 정보 */}
        {(mineTimerBonus > 0 || mineExtraOres > 0 || mineChainBonus > 0 || mineClickBonus > 0) && (
          <div style={{ fontSize: 10, color: '#dd88ff', marginTop: 8 }}>
            퍽 적용됨
            {mineTimerBonus  > 0 ? ` · 시간 +${mineTimerBonus}s`                         : ''}
            {mineExtraOres   > 0 ? ` · 노드 +${mineExtraOres}`                            : ''}
            {mineChainBonus  > 0 ? ` · 연쇄 ${Math.round(mineChainBonus * 100)}%`         : ''}
            {mineClickBonus  > 0 ? ` · 원 +${Math.round(mineClickBonus * 100)}%`          : ''}
          </div>
        )}

        {/* 결과 */}
        {phase === 'done' && (
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 800, color: totalYield > 0 ? oreColor : '#aaa' }}>
            {totalYield > 0 ? `💎 ${oreName} ×${totalYield} 획득!` : '이번엔 채굴 못했어요'}
          </div>
        )}

        <div style={{ marginTop: 8, fontSize: 9, color: '#333' }}>
          클릭 → 원 범위 내 광석 일괄 채굴 · 3개+ 동시 = COMBO · 파도마다 광석 증가
        </div>
      </div>
    </div>
  );
}
