import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 아이소메트릭 타일 정밀 채굴 미니게임 (7×7 그리드)
 * - 범위 내 타일만 표시 (range 1=8칸, range 2=24칸, range 3=48칸)
 * - 클릭 → 원형 범위 → 원 안 광석 일괄 채굴
 * - 잭팟 광석: 파도마다 랜덤 등장, 금빛, 3× 수확
 * - 연속 파도 배율: 파도 클리어마다 +0.2 (최대 2.0×)
 * - 파도 클리어 → +2s 보너스 → 새 파도 (광석 수 증가)
 */

const GRID           = 7;
const CENTER         = 3;
const TILE_W         = 60;
const TILE_H         = 30;
const SVG_W          = 510;
const SVG_H          = 340;
const ORIGIN_X       = 255;
const ORIGIN_Y       = 52;
const BASE_CLICK_R   = 55;
const BASE_DURATION  = 20;
const BASE_ORE_COUNT = 14;
const MAX_ORE_COUNT  = 24;
const JACKPOT_CHANCE = 0.35;   // 파도당 잭팟 광석 등장 확률
const MAX_MULTIPLIER = 2.0;    // 연속 파도 배율 상한

const ORE_COLORS   = { 철광석: '#b0b8c8', 구리광석: '#d4a050', 수정: '#88ccff', 금광석: '#ffd700' };
const ORE_GLYPH    = { 철광석: '■', 구리광석: '●', 수정: '◆', 금광석: '★' };
const JACKPOT_COLOR = '#ffe066';

function cheby(col, row) { return Math.max(Math.abs(col - CENTER), Math.abs(row - CENTER)); }

function iso(col, row) {
  return {
    x: ORIGIN_X + (col - row) * (TILE_W / 2),
    y: ORIGIN_Y + (col + row) * (TILE_H / 2),
  };
}

let _oreIdSeed = 0;
function genOres(count, range, addJackpot = true) {
  const pool = [];
  for (let c = 0; c < GRID; c++)
    for (let r = 0; r < GRID; r++)
      if (!(c === CENTER && r === CENTER) && cheby(c, r) <= range)
        pool.push({ col: c, row: r });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected = pool.slice(0, Math.min(count, pool.length));
  const jackpotIdx = (addJackpot && Math.random() < JACKPOT_CHANCE)
    ? Math.floor(Math.random() * selected.length) : -1;
  return selected.map((p, i) => ({
    id: ++_oreIdSeed, col: p.col, row: p.row, chainCredit: 0,
    isJackpot: i === jackpotIdx,
  }));
}

export default function MiningMinigame({ oreName, miningBonus = {}, onFinish }) {
  const mineRange        = miningBonus.mineRange        || 2;
  const mineTimerBonus   = miningBonus.mineTimerBonus   ?? 0;
  const mineYieldBonus   = miningBonus.mineYieldBonus   ?? 0;
  const mineDoubleChance = miningBonus.mineDoubleChance ?? 0;
  const mineExtraOres    = miningBonus.mineExtraOres    ?? 0;
  const mineChainBonus   = miningBonus.mineChainBonus   ?? 0;
  const mineClickBonus   = miningBonus.mineClickBonus   ?? 0;

  const DURATION = BASE_DURATION + mineTimerBonus;
  const CLICK_R  = BASE_CLICK_R * (1 + mineClickBonus);
  const baseCount = Math.min(BASE_ORE_COUNT + mineExtraOres, MAX_ORE_COUNT);

  // ── 상태 ──────────────────────────────────────────────────────
  const [ores, setOres]                   = useState(() => genOres(baseCount, mineRange));
  const [timeLeft, setTimeLeft]           = useState(DURATION);
  const [minedCount, setMinedCount]       = useState(0);
  const [totalYield, setTotalYield]       = useState(0);
  const [waveCount, setWaveCount]         = useState(1);
  const [multiplier, setMultiplier]       = useState(1.0);
  const [flashIds, setFlashIds]           = useState([]);
  const [clickCircle, setClickCircle]     = useState(null);
  const [waveFlash, setWaveFlash]         = useState(false);
  const [comboText, setComboText]         = useState(null);
  const [jackpotText, setJackpotText]     = useState(null);  // { x, y }
  const [timeBonusText, setTimeBonusText] = useState(null);
  const [spawnPulse, setSpawnPulse]       = useState(false);
  const [bestCombo, setBestCombo]         = useState(0);
  const [phase, setPhase]                 = useState('playing');

  // ── 내부 ref ─────────────────────────────────────────────────
  const oresRef        = useRef(ores);
  const timeRef        = useRef(DURATION);
  const yieldRef       = useRef(0);
  const waveRef        = useRef(1);
  const multRef        = useRef(1.0);
  const bestComboRef   = useRef(0);
  const rafRef         = useRef(null);
  const lastRef        = useRef(null);
  const respawningRef  = useRef(false);

  useEffect(() => { oresRef.current = ores; }, [ores]);

  // 광석 소진 → 파도 클리어 연출 → 배율 상승 → +2s → 새 파도
  useEffect(() => {
    if (phase !== 'playing' || ores.length > 0 || respawningRef.current) return;
    respawningRef.current = true;
    setWaveFlash(true);

    // 연속 배율 +0.2 (상한 MAX_MULTIPLIER)
    const newMult = Math.min(multRef.current + 0.2, MAX_MULTIPLIER);
    multRef.current = newMult;
    setMultiplier(newMult);

    // +2s 보너스
    timeRef.current = Math.min(timeRef.current + 2, DURATION);
    setTimeBonusText('+2s!');
    setTimeout(() => setTimeBonusText(null), 900);

    setTimeout(() => {
      const nextWave = waveRef.current + 1;
      waveRef.current = nextWave;
      setWaveCount(nextWave);
      const nextCount = Math.min(baseCount + Math.floor((nextWave - 1) / 2), MAX_ORE_COUNT);
      setOres(genOres(nextCount, mineRange));
      setWaveFlash(false);
      setSpawnPulse(true);
      setTimeout(() => setSpawnPulse(false), 350);
      respawningRef.current = false;
    }, 650);
  }, [ores, phase, baseCount, mineRange, DURATION]);

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
        setTimeout(() => onFinish(yieldRef.current, waveRef.current), 800);
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

    // 베스트 콤보
    if (toMine.length > bestComboRef.current) {
      bestComboRef.current = toMine.length;
      setBestCombo(toMine.length);
    }
    // 콤보 텍스트 (3개+)
    if (toMine.length >= 3) {
      setComboText({ n: toMine.length, x: svgX, y: svgY - 24 });
      setTimeout(() => setComboText(null), 750);
    }

    // 수확 계산
    let gain = 0;
    const allOres = oresRef.current;
    let hasJackpot = false;
    for (const id of toMine) {
      const ore = allOres.find(o => o.id === id);
      const credit = ore?.chainCredit ?? 0;
      if (ore?.isJackpot) {
        hasJackpot = true;
        gain += Math.round((3 + mineYieldBonus) * multRef.current);
      } else {
        let g = (1 + mineYieldBonus + credit) * multRef.current;
        if (Math.random() < mineDoubleChance) g += multRef.current;
        gain += Math.round(g);
      }
    }
    if (hasJackpot) {
      setJackpotText({ x: svgX, y: svgY - 44 });
      setTimeout(() => setJackpotText(null), 900);
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
  const multColor = multiplier >= 2.0 ? '#ff8844' : multiplier >= 1.6 ? '#ffcc44' : multiplier >= 1.2 ? '#88ffcc' : '#445566';

  const sortedTiles = Array.from({ length: GRID * GRID }, (_, i) => ({
    col: i % GRID, row: Math.floor(i / GRID),
  }))
    .filter(({ col, row }) => col === CENTER && row === CENTER ? true : cheby(col, row) <= mineRange)
    .sort((a, b) => (a.col + a.row) - (b.col + b.row));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        background: '#080f18', border: `2px solid ${oreColor}`,
        borderRadius: 18, padding: '14px 16px',
        textAlign: 'center', userSelect: 'none',
        boxShadow: `0 0 36px ${oreColor}44`,
        maxWidth: 560, position: 'relative',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ fontSize: 14, color: oreColor, fontWeight: 800 }}>⛏ {oreName} 정밀 채굴</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {multiplier > 1.0 && (
              <div style={{ fontSize: 12, fontWeight: 800, color: multColor }}>×{multiplier.toFixed(1)}</div>
            )}
            <div style={{ fontSize: 13, fontWeight: timeLeft < 5 ? 800 : 400, color: timeLeft < 5 ? '#ff4444' : timeLeft < 10 ? '#ffaa22' : '#aaa' }}>
              ⏱ {Math.ceil(timeLeft)}s
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#556', marginBottom: 7, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <span>파도 <span style={{ color: oreColor, fontWeight: 700 }}>{waveCount}</span></span>
          <span>채굴 <span style={{ color: oreColor }}>{minedCount}</span></span>
          <span>획득 <span style={{ color: '#ffd700', fontWeight: 700 }}>{totalYield}</span>개</span>
          {mineChainBonus > 0 && <span style={{ color: '#dd88ff' }}>연쇄</span>}
          {mineClickBonus > 0 && <span style={{ color: '#88ccff' }}>광역</span>}
        </div>

        {/* 타임바 */}
        <div style={{ height: 3, background: '#1a2a3a', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
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
              const isJackpot = ore?.isJackpot === true;

              const pts = [
                `${pos.x},${pos.y}`,
                `${pos.x + TILE_W / 2},${pos.y + TILE_H / 2}`,
                `${pos.x},${pos.y + TILE_H}`,
                `${pos.x - TILE_W / 2},${pos.y + TILE_H / 2}`,
              ].join(' ');

              const ox = pos.x;
              const oy = pos.y - 12;
              const tileDepth = cheby(col, row); // 0=center, 1=inner, 2=mid, 3=outer
              const tileFill  = isCenter ? '#162640'
                : tileDepth === 1 ? '#0e1e32'
                : tileDepth === 2 ? '#0b1828'
                : '#091420';
              const tileStroke = isCenter ? '#2255aa'
                : tileDepth === 1 ? '#1a3050'
                : tileDepth === 2 ? '#152840'
                : '#102030';

              return (
                <g key={`${col}-${row}`}>
                  <polygon points={pts} fill={tileFill} stroke={tileStroke} strokeWidth={1} />
                  {!isCenter && (
                    <polygon points={pts} fill={`${oreColor}0a`} stroke={`${oreColor}22`} strokeWidth={0.7} />
                  )}

                  {/* 광석 노드 */}
                  {ore && !isFlash && (
                    <g style={{ pointerEvents: 'none' }}>
                      {/* 잭팟 외곽 글로우 */}
                      {isJackpot && (
                        <>
                          <circle cx={ox} cy={oy} r={19} fill="none" stroke={`${JACKPOT_COLOR}55`} strokeWidth={2.5} />
                          <circle cx={ox} cy={oy} r={14} fill="none" stroke={`${JACKPOT_COLOR}88`} strokeWidth={1.5} />
                        </>
                      )}
                      {/* 스폰 펄스 링 */}
                      {spawnPulse && (
                        <circle cx={ox} cy={oy} r={17} fill="none" stroke={`${isJackpot ? JACKPOT_COLOR : oreColor}99`} strokeWidth={1.5} />
                      )}
                      {/* 체인 글로우 */}
                      {hasChain && !isJackpot && (
                        <circle cx={ox} cy={oy} r={16} fill="none" stroke="#dd88ff88" strokeWidth={2} />
                      )}
                      {/* 광석 몸체 */}
                      <circle cx={ox} cy={oy} r={11}
                        fill={isJackpot ? `${JACKPOT_COLOR}44` : spawnPulse ? `${oreColor}55` : hasChain ? `${oreColor}50` : `${oreColor}30`}
                        stroke={isJackpot ? JACKPOT_COLOR : spawnPulse ? oreColor : hasChain ? '#dd88ff' : oreColor}
                        strokeWidth={isJackpot ? 2.5 : spawnPulse ? 2.5 : hasChain ? 2 : 1.5}
                      />
                      {/* 글리프 */}
                      <text x={ox} y={oy + 4} textAnchor="middle"
                        fontSize={isJackpot ? 12 : 10}
                        fill={isJackpot ? JACKPOT_COLOR : oreColor}
                        style={{ fontWeight: 'bold' }}>
                        {isJackpot ? '★' : (ORE_GLYPH[oreName] ?? '●')}
                      </text>
                      {/* ×3 라벨 */}
                      {isJackpot && (
                        <text x={ox} y={oy - 16} textAnchor="middle" fontSize={8} fill={JACKPOT_COLOR} style={{ fontWeight: 'bold' }}>
                          ×3
                        </text>
                      )}
                      {/* 체인 크레딧 */}
                      {hasChain && !isJackpot && (
                        <text x={ox} y={oy - 16} textAnchor="middle" fontSize={8} fill="#dd88ff" style={{ fontWeight: 'bold' }}>
                          +{Math.round(ore.chainCredit * 10) / 10}
                        </text>
                      )}
                    </g>
                  )}

                  {/* 채굴 완료 플래시 */}
                  {isFlash && (
                    <text x={ox} y={oy} textAnchor="middle" fontSize={18} style={{ pointerEvents: 'none' }}>
                      {ore?.isJackpot ? '💰' : '✨'}
                    </text>
                  )}

                  {/* 플레이어 */}
                  {isCenter && (
                    <text x={pos.x} y={pos.y + TILE_H / 2 + 7} textAnchor="middle" fontSize={17} style={{ pointerEvents: 'none' }}>⛏</text>
                  )}
                </g>
              );
            })}

            {/* 클릭 채굴 원 */}
            {clickCircle && (
              <circle cx={clickCircle.x} cy={clickCircle.y} r={CLICK_R}
                fill={`${oreColor}15`} stroke={`${oreColor}cc`} strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* COMBO 텍스트 */}
            {comboText && (
              <text x={comboText.x} y={comboText.y} textAnchor="middle" fontSize={17}
                fill="#ffdd44" style={{ pointerEvents: 'none', fontWeight: 'bold', filter: 'drop-shadow(0 0 4px #ffaa00)' }}>
                COMBO ×{comboText.n}!
              </text>
            )}

            {/* JACKPOT 텍스트 */}
            {jackpotText && (
              <text x={jackpotText.x} y={jackpotText.y} textAnchor="middle" fontSize={17}
                fill={JACKPOT_COLOR} style={{ pointerEvents: 'none', fontWeight: 'bold', filter: `drop-shadow(0 0 6px ${JACKPOT_COLOR})` }}>
                JACKPOT! ×3
              </text>
            )}
          </svg>

          {/* 파도 클리어 오버레이 */}
          {waveFlash && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: `${oreColor}18`, borderRadius: 8, pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: oreColor, filter: `drop-shadow(0 0 8px ${oreColor})` }}>
                WAVE {waveCount} CLEAR!
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#88ffaa' }}>+2s ⏱</div>
              {multRef.current > 1.0 && (
                <div style={{ fontSize: 13, fontWeight: 700, color: multColor }}>배율 ×{multRef.current.toFixed(1)}</div>
              )}
            </div>
          )}

          {/* 시간 보너스 플로팅 */}
          {timeBonusText && !waveFlash && (
            <div style={{ position: 'absolute', top: 8, right: 12, fontSize: 14, fontWeight: 800, color: '#88ffaa', pointerEvents: 'none', filter: 'drop-shadow(0 0 4px #44ff88)' }}>
              {timeBonusText}
            </div>
          )}
        </div>

        {/* 퍽 정보 */}
        {(mineTimerBonus > 0 || mineExtraOres > 0 || mineChainBonus > 0 || mineClickBonus > 0) && (
          <div style={{ fontSize: 10, color: '#dd88ff', marginTop: 6 }}>
            퍽:
            {mineTimerBonus > 0 ? ` 시간+${mineTimerBonus}s` : ''}
            {mineExtraOres  > 0 ? ` 노드+${mineExtraOres}` : ''}
            {mineChainBonus > 0 ? ` 연쇄${Math.round(mineChainBonus * 100)}%` : ''}
            {mineClickBonus > 0 ? ` 원+${Math.round(mineClickBonus * 100)}%` : ''}
          </div>
        )}

        {/* 결과 */}
        {phase === 'done' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: totalYield > 0 ? oreColor : '#aaa', marginBottom: 4 }}>
              {totalYield > 0 ? `💎 ${oreName} ×${totalYield} 획득!` : '이번엔 채굴 못했어요'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 11, color: '#667' }}>
              <span>파도 <span style={{ color: oreColor, fontWeight: 700 }}>{waveCount}</span>개</span>
              {bestCombo >= 3 && <span>베스트 콤보 <span style={{ color: '#ffdd44', fontWeight: 700 }}>×{bestCombo}</span></span>}
              {multRef.current > 1.0 && <span>최종 배율 <span style={{ color: multColor, fontWeight: 700 }}>×{multRef.current.toFixed(1)}</span></span>}
            </div>
          </div>
        )}

        <div style={{ marginTop: 6, fontSize: 9, color: '#2a3a4a' }}>
          클릭 → 원 내 광석 채굴 · ★잭팟 3배 · 파도 클리어마다 배율↑
        </div>
      </div>
    </div>
  );
}
