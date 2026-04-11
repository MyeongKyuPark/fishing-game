import { useState } from 'react';
import MiningMinigame from '../MiningMinigame';
import ResistanceMinigame from '../ResistanceMinigame';

const ZONE_INFO = {
  mine:    { name: '광산 구역',   icon: '⛏️', color: '#b0b8c8' },
  fishing: { name: '낚시터 구역', icon: '🎣', color: '#44aaff' },
  farm:    { name: '농장 구역',   icon: '🌱', color: '#88cc44' },
};

export const PERK_DEFS = {
  mine: [
    { id: 'big_circle',   icon: '🔵', name: '광역 채굴',    desc: '클릭 원 범위 35% 확대',     cost: 1 },
    { id: 'extra_nodes',  icon: '💎', name: '추가 노드',    desc: '광석 노드 +3개',            cost: 1 },
    { id: 'chain_mine',   icon: '🔗', name: '연쇄 채굴',    desc: '인접 광석에 수확량 보너스', cost: 2 },
    { id: 'wide_range',   icon: '📡', name: '넓은 범위',    desc: '채굴 범위 +1칸 (→ 3칸)',   cost: 2 },
    { id: 'double_yield', icon: '✨', name: '이중 획득',    desc: '25% 확률로 광석 2배',       cost: 3 },
  ],
  fishing: [
    { id: 'slow_decay',    icon: '🌊', name: '느린 감속',    desc: '릴 감속 30% 감소',         cost: 1 },
    { id: 'quick_cast',    icon: '🎯', name: '빠른 낚시',    desc: '초기 거리 15% 감소',       cost: 1 },
    { id: 'stress_resist', icon: '💪', name: '스트레스 내성', desc: '줄 끊김 위험 20% 감소',   cost: 2 },
    { id: 'strong_line',   icon: '🪝', name: '강한 낚싯줄',  desc: '최대 스트레스 +30',         cost: 2 },
  ],
  farm: [],
};

function getOreForLevel(level) {
  if (level >= 15) return '금광석';
  if (level >= 10) return '수정';
  if (level >= 5)  return '구리광석';
  return '철광석';
}

function getFishForLevel(level) {
  if (level >= 15) return { name: '황금잉어', rarity: '신화', size: 65, grade: 6 };
  if (level >= 10) return { name: '연어',     rarity: '전설', size: 48, grade: 4 };
  if (level >= 5)  return { name: '붕어',     rarity: '전설', size: 32, grade: 2 };
  return { name: '피라미', rarity: '전설', size: 20, grade: 0 };
}

function getMiningBonus(perks) {
  const has = id => perks.includes(id);
  return {
    mineClickBonus:   has('big_circle')   ? 0.35 : 0,    // 클릭 원 35% 확대
    mineExtraOres:    has('extra_nodes')  ? 3    : 0,
    mineChainBonus:   has('chain_mine')   ? 0.25 : 0,
    mineRange:        has('wide_range')   ? 3    : 2,    // 기본 2칸, 퍽 시 3칸
    mineDoubleChance: has('double_yield') ? 0.25 : 0,
  };
}

function getFishingBonus(perks) {
  const has = id => perks.includes(id);
  return {
    resistDecayBonus:   has('slow_decay')    ? 0.3  : 0,
    resistDistReduce:   has('quick_cast')    ? 0.15 : 0,
    resistStressReduce: has('stress_resist') ? 0.2  : 0,
    resistMaxStress:    has('strong_line')   ? 30   : 0,
  };
}

// ── 퍽 카드 ──────────────────────────────────────────────────────────
function PerkCard({ perk, owned, canBuy, accentColor, onBuy }) {
  return (
    <button
      disabled={!canBuy && !owned}
      onClick={() => canBuy && onBuy(perk.id, perk.cost)}
      style={{
        background: owned ? `${accentColor}1a` : canBuy ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${owned ? accentColor + '88' : canBuy ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10, padding: '9px 11px',
        textAlign: 'left', cursor: canBuy ? 'pointer' : 'default',
        opacity: !owned && !canBuy ? 0.4 : 1,
        transition: 'border-color 0.15s, background 0.15s',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: owned ? accentColor : 'rgba(255,255,255,0.88)' }}>
          {perk.icon} {perk.name}
        </span>
        <span style={{ fontSize: 11, color: owned ? '#88ff88' : '#ffdd88', fontWeight: 600 }}>
          {owned ? '✓' : `${perk.cost}pt`}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.48)' }}>{perk.desc}</div>
    </button>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function ZoneMiniGame({
  zone, level, perks = [], perkPoints = 0,
  tutorialSeen, onTutorialSeen,
  onComplete, onBuyPerk, onClose,
}) {
  const [phase, setPhase] = useState(tutorialSeen ? 'hub' : 'tutorial');
  const [lastResult, setLastResult] = useState(null);

  const info     = ZONE_INFO[zone];
  const perkDefs = PERK_DEFS[zone] ?? [];
  const accent   = info.color;

  // ── 농장: 준비 중 ──────────────────────────────────────────────────
  if (zone === 'farm') {
    return (
      <div className="overlay" style={{ zIndex: 900 }}>
        <div className="panel" style={{ maxWidth: 340, textAlign: 'center' }}>
          <div className="panel-head">
            <span>{info.icon} {info.name}</span>
            <button onClick={onClose}>나가기</button>
          </div>
          <div className="section" style={{ padding: '32px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🌱</div>
            <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>농장 미니게임 준비 중</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>씨앗을 심고 수확하는 미니게임이<br />곧 업데이트됩니다!</div>
            <button className="btn" style={{ width: '100%' }} onClick={onClose}>돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  // ── 튜토리얼 (첫 방문) ─────────────────────────────────────────────
  if (phase === 'tutorial') {
    const lines = zone === 'mine'
      ? ['아이소메트릭 그리드에 광석이 배치됩니다.', '클릭하면 원형 범위가 활성화되어 원 안의 광석이 모두 채굴됩니다.', '광석을 모두 캐면 새 파도가 등장합니다. 파도마다 광석이 늘어납니다!', '3개 이상 동시 채굴 시 COMBO 보너스! 레벨이 오를수록 귀한 광석이 등장합니다.']
      : ['물고기의 저항을 이겨내는 릴 미니게임입니다.', '화면을 꾹 눌러 릴을 감아 물고기를 끌어당기세요.', '스트레스가 100%가 되면 낚싯줄이 끊어집니다!', '레벨이 올라갈수록 더 강한 물고기가 나타납니다.'];
    return (
      <div className="overlay" style={{ zIndex: 900 }}>
        <div className="panel" style={{ maxWidth: 400 }}>
          <div className="panel-head">
            <span>{info.icon} {info.name} — 안내</span>
            <button onClick={onClose}>나가기</button>
          </div>
          <div className="section" style={{ padding: 20 }}>
            <div style={{ fontSize: 42, textAlign: 'center', marginBottom: 14 }}>{info.icon}</div>
            <ul style={{ paddingLeft: 20, lineHeight: 2.0, color: 'rgba(255,255,255,0.88)', fontSize: 13, marginBottom: 22 }}>
              {lines.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <button className="btn" style={{ width: '100%', fontSize: 15 }} onClick={() => {
              onTutorialSeen?.(zone);
              setPhase('hub');
            }}>
              확인!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 미니게임 플레이 ────────────────────────────────────────────────
  if (phase === 'playing') {
    if (zone === 'mine') {
      const oreName = getOreForLevel(level);
      return (
        <MiningMinigame
          oreName={oreName}
          miningBonus={getMiningBonus(perks)}
          onFinish={(count) => {
            const result = { won: count > 0, count, oreName, prevLevel: level };
            onComplete(result);
            setLastResult(result);
            setPhase('result');
          }}
        />
      );
    }
    if (zone === 'fishing') {
      const fish = getFishForLevel(level);
      const finish = (won) => {
        const result = { won, prevLevel: level };
        onComplete(result);
        setLastResult(result);
        setPhase('result');
      };
      return (
        <ResistanceMinigame
          fishName={fish.name}
          rarity={fish.rarity}
          size={fish.size}
          fishGrade={fish.grade}
          resistMastery={getFishingBonus(perks)}
          onSuccess={() => finish(true)}
          onFail={() => finish(false)}
        />
      );
    }
  }

  // ── 결과 화면 ──────────────────────────────────────────────────────
  if (phase === 'result') {
    const won = lastResult?.won;
    const prev = lastResult?.prevLevel ?? 0;
    return (
      <div className="overlay" style={{ zIndex: 900 }}>
        <div className="panel" style={{ maxWidth: 320, textAlign: 'center', border: `1.5px solid ${accent}44` }}>
          <div className="panel-head" style={{ borderBottom: `1px solid ${accent}33` }}>
            <span style={{ color: accent }}>{info.icon} 결과</span>
          </div>
          <div className="section" style={{ padding: '24px 20px' }}>
            {won ? (
              <>
                <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: '#88ff88' }}>미니게임 완료!</div>
                {lastResult.count != null && (
                  <div style={{ color: 'rgba(255,255,255,0.82)', marginBottom: 5, fontSize: 14 }}>
                    {lastResult.oreName} × {lastResult.count} 채굴
                  </div>
                )}
                {zone === 'fishing' && (
                  <div style={{ color: '#e8d888', marginBottom: 5, fontSize: 14 }}>
                    +{50 + (prev + 1) * 20}G 획득
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#ffdd88', marginBottom: 4 }}>
                  Lv.{prev} → Lv.{prev + 1}
                </div>
                <div style={{ fontSize: 13, color: accent, marginBottom: 20 }}>★ 퍽 포인트 +1</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44, marginBottom: 8 }}>💧</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'rgba(255,255,255,0.9)' }}>아쉽네요...</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>다시 도전해보세요!</div>
              </>
            )}
            <button className="btn" style={{ width: '100%', fontSize: 14 }} onClick={() => setPhase('hub')}>
              계속하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 허브 화면 ──────────────────────────────────────────────────────
  const nextLabel = zone === 'mine'
    ? getOreForLevel(level)
    : (() => { const f = getFishForLevel(level); return `${f.name} (${f.rarity})`; })();

  return (
    <div className="overlay" style={{ zIndex: 900 }}>
      <div className="panel" style={{ maxWidth: 400, border: `1.5px solid ${accent}44` }}>

        {/* 헤더 */}
        <div className="panel-head" style={{ borderBottom: `1px solid ${accent}22` }}>
          <span style={{ color: accent, fontWeight: 800 }}>{info.icon} {info.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: `${accent}22`, border: `1px solid ${accent}55`,
              borderRadius: 8, padding: '2px 10px', fontSize: 12,
              color: accent, fontWeight: 700,
            }}>
              Lv.{level}
            </span>
            <button
              onClick={onClose}
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
            >
              나가기 ✕
            </button>
          </div>
        </div>

        <div className="section" style={{ padding: 16 }}>

          {/* 다음 타겟 + 퍽 포인트 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              {zone === 'mine' ? '이번 광석' : '이번 물고기'}:&nbsp;
              <span style={{ color: accent, fontWeight: 700 }}>{nextLabel}</span>
            </div>
            <div style={{ fontSize: 12, color: '#ffdd88', fontWeight: 700 }}>
              ★ {perkPoints}pt
            </div>
          </div>

          {/* 퍽 그리드 */}
          {perkDefs.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8 }}>퍽</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 16 }}>
                {perkDefs.map(perk => (
                  <PerkCard
                    key={perk.id}
                    perk={perk}
                    owned={perks.includes(perk.id)}
                    canBuy={!perks.includes(perk.id) && perkPoints >= perk.cost}
                    accentColor={accent}
                    onBuy={onBuyPerk}
                  />
                ))}
              </div>
            </>
          )}

          {/* 시작 버튼 */}
          <button className="btn" style={{ width: '100%', fontSize: 15 }} onClick={() => setPhase('playing')}>
            {info.icon} 시작하기!
          </button>
        </div>
      </div>
    </div>
  );
}
