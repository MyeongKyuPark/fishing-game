import { useState } from 'react';
import MiningMinigame from '../MiningMinigame';
import ResistanceMinigame from '../ResistanceMinigame';

const ZONE_INFO = {
  mine: {
    name: '광산 미니게임',
    icon: '⛏️',
    tutorial: [
      '5×5 아이소메트릭 그리드에 광석이 배치됩니다.',
      '광석을 꾹 눌러 홀드하면 채굴이 진행됩니다.',
      '타이머가 끝나기 전에 최대한 많이 채굴하세요!',
      '레벨이 올라갈수록 더 귀한 광석이 등장합니다.',
    ],
  },
  fishing: {
    name: '낚시 미니게임',
    icon: '🎣',
    tutorial: [
      '물고기의 저항을 이겨내는 릴 미니게임입니다.',
      '화면을 꾹 눌러 릴을 감아 물고기를 끌어당기세요.',
      '스트레스가 100%가 되면 낚싯줄이 끊어집니다!',
      '물고기와의 거리가 0이 되면 포획 성공!',
      '레벨이 올라갈수록 더 강한 물고기가 나타납니다.',
    ],
  },
  farm: {
    name: '농장 미니게임',
    icon: '🌱',
    tutorial: ['농장 미니게임은 곧 추가됩니다!'],
  },
};

function getOreForLevel(level) {
  if (level >= 15) return '금광석';
  if (level >= 10) return '수정';
  if (level >= 5) return '구리광석';
  return '철광석';
}

function getFishForLevel(level) {
  if (level >= 15) return { name: '황금잉어', rarity: '신화', size: 65, grade: 6 };
  if (level >= 10) return { name: '연어', rarity: '전설', size: 48, grade: 4 };
  if (level >= 5) return { name: '붕어', rarity: '전설', size: 32, grade: 2 };
  return { name: '피라미', rarity: '전설', size: 20, grade: 0 };
}

export default function ZoneMiniGame({ zone, level, tutorialSeen, onTutorialSeen, onClose }) {
  const [phase, setPhase] = useState(tutorialSeen ? 'playing' : 'tutorial');
  const [result, setResult] = useState(null);

  const info = ZONE_INFO[zone];

  // Farm zone: coming soon
  if (zone === 'farm') {
    return (
      <div className="overlay" style={{ zIndex: 900 }}>
        <div className="panel" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div className="panel-head">
            <span>{info.icon} {info.name}</span>
            <button onClick={() => onClose(false)}>✕</button>
          </div>
          <div className="section" style={{ padding: '32px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🌱</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
              농장 미니게임 준비 중
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>
              씨앗을 심고 수확하는 미니게임이<br />곧 업데이트됩니다!
            </div>
            <button className="btn" style={{ width: '100%' }} onClick={() => onClose(false)}>
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tutorial screen
  if (phase === 'tutorial') {
    const preview = zone === 'mine'
      ? `이번 광석: ${getOreForLevel(level)}`
      : `이번 물고기: ${getFishForLevel(level).name}`;
    return (
      <div className="overlay" style={{ zIndex: 900 }}>
        <div className="panel" style={{ maxWidth: 420 }}>
          <div className="panel-head">
            <span>{info.icon} {info.name} — 튜토리얼</span>
            <button onClick={() => onClose(false)}>✕</button>
          </div>
          <div className="section" style={{ padding: 20 }}>
            <div style={{ fontSize: 44, textAlign: 'center', marginBottom: 16 }}>{info.icon}</div>
            <ul style={{ paddingLeft: 20, lineHeight: 2.0, color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 20 }}>
              {info.tutorial.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>현재 레벨: <b style={{ color: '#88ccff' }}>Lv.{level}</b></span>
              <span>{preview}</span>
            </div>
            <button className="btn" style={{ width: '100%', fontSize: 15 }} onClick={() => {
              onTutorialSeen?.(zone);
              setPhase('playing');
            }}>
              시작하기!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Result screen
  if (phase === 'result') {
    return (
      <div className="overlay" style={{ zIndex: 900 }}>
        <div className="panel" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div className="panel-head">
            <span>{info.icon} 결과</span>
          </div>
          <div className="section" style={{ padding: '28px 20px' }}>
            {result?.won ? (
              <>
                <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#88ff88' }}>
                  미니게임 완료!
                </div>
                {result.count != null && (
                  <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
                    {result.oreName} × {result.count} 채굴
                  </div>
                )}
                <div style={{ fontSize: 14, color: '#ffdd88', marginBottom: 24 }}>
                  Lv.{level} → Lv.{level + 1} 달성!
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 52, marginBottom: 8 }}>💧</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  아쉽네요...
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
                  다시 도전해보세요!
                </div>
              </>
            )}
            <button className="btn" style={{ width: '100%', fontSize: 15 }} onClick={() => onClose(result?.won ?? false)}>
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  if (zone === 'mine') {
    const oreName = getOreForLevel(level);
    return (
      <MiningMinigame
        oreName={oreName}
        miningBonus={{}}
        onFinish={(count) => {
          setResult({ won: count > 0, count, oreName });
          setPhase('result');
        }}
      />
    );
  }

  if (zone === 'fishing') {
    const fish = getFishForLevel(level);
    return (
      <ResistanceMinigame
        fishName={fish.name}
        rarity={fish.rarity}
        size={fish.size}
        fishGrade={fish.grade}
        resistMastery={{}}
        onSuccess={() => {
          setResult({ won: true });
          setPhase('result');
        }}
        onFail={() => {
          setResult({ won: false });
          setPhase('result');
        }}
      />
    );
  }

  return null;
}
