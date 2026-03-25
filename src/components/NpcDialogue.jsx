// NPC 대화 인터페이스 — 친밀도 기반 대사 + 행동 선택
import { useState, useCallback } from 'react';
import { NPCS, getAffinityLevel } from '../npcData';

// ── 대사 데이터 ─────────────────────────────────────────────────────────────
const DIALOGUE = {
  상인: {
    greetings: {
      0:  ["어서오세요! 무엇을 도와드릴까요?", "오늘도 낚시하러 오셨나요? 장비 구경해보세요!"],
      20: ["단골손님이시네요! 오늘도 좋은 거 드릴게요~", "반갑습니다! 할인 적용해 드릴게요."],
      50: ["친구! 오늘 기분 어때요? 특별히 잘 챙겨드릴게요.", "항상 찾아주셔서 감사해요! 좋은 물건 골라드릴게요."],
      80: ["절친이 오셨군요! 정말 반가워요.", "매번 찾아주셔서 너무 감사해요. 뭐든 도와드릴게요!"],
    },
    chatLines: [
      "요즘 낚시 실력이 많이 늘었죠?",
      "새 낚시 도구 들어왔는데 구경해보세요!",
      "날씨가 낚시하기 딱 좋은 날이에요.",
      "좋은 미끼가 좋은 물고기를 낚죠!",
      "요즘 손님들이 희귀 낚싯대에 관심이 많더라고요.",
      "왕관이요? 비싸지만 판매가가 확 올라가요.",
    ],
    options: [
      { id: 'shop',  icon: '🛒', label: '거래하기' },
      { id: 'chat',  icon: '💬', label: '잡담하기' },
      { id: 'close', icon: '👋', label: '안녕히' },
    ],
  },
  요리사: {
    greetings: {
      0:  ["안녕하세요! 생선 있으면 맛있게 요리해드릴게요!", "오늘도 요리할 생선 갖고 오셨나요?"],
      20: ["수강생이 오셨군요! 오늘은 뭘 요리해드릴까요?", "열심히 하시더니 이제 단골이 됐네요~"],
      50: ["제자님! 솜씨가 많이 늘었어요. 오늘도 잘 부탁해요.", "실력이 날로 느는군요! 신선한 생선 들고 오셨어요?"],
      80: ["수제자가 왔군요! 비법 레시피로 만들어드릴게요.", "최고의 제자님! 오늘은 특별한 요리를 해드릴게요."],
    },
    chatLines: [
      "신선한 생선일수록 요리가 더 맛있답니다!",
      "요리 능력치가 쌓이면 가격 배율이 올라가요.",
      "좋은 요리 도구가 있으면 더 맛있게 만들 수 있어요.",
      "비법 소스가 있으면 더 맛있게 해드릴 수 있는데...",
      "낚시도 중요하지만 요리도 중요하죠!",
      "전설 어종을 요리하면 엄청난 금액이 나온다고 해요.",
    ],
    options: [
      { id: 'cook',  icon: '🍳', label: '요리 부탁하기' },
      { id: 'chat',  icon: '💬', label: '잡담하기' },
      { id: 'close', icon: '👋', label: '안녕히' },
    ],
  },
  여관주인: {
    greetings: {
      0:  ["어서오세요! 피곤하시면 편히 쉬다 가세요.", "여관에 오신 걸 환영해요!"],
      20: ["단골손님이시네요! 항상 감사해요~", "오늘도 고생 많으셨죠? 푹 쉬고 가세요."],
      50: ["VIP 손님이 오셨군요! 특별히 잘 대접해드릴게요.", "항상 이렇게 찾아주시니 정말 감사해요!"],
      80: ["특별손님이시네요! 뭐든 말씀만 하세요~", "이 마을이 활기찬 건 당신 덕분이에요!"],
    },
    chatLines: [
      "낚시로 지친 몸은 꼭 쉬어줘야 해요.",
      "오늘 여관 손님이 많네요! 다들 낚시 열심히 하나봐요.",
      "여관에서 푹 쉬면 내일 더 잘 되더라고요.",
      "이 마을 공기가 정말 좋죠? 저도 매일 행복해요.",
      "특별 휴식 버프 한번 써보셨어요? 정말 효과 있답니다!",
      "퀘스트 다 마치셨어요? 정말 대단해요~",
    ],
    options: [
      { id: 'rest',       icon: '🛏',  label: '휴식하기' },
      { id: 'appearance', icon: '💄',  label: '외모 변경' },
      { id: 'chat',       icon: '💬',  label: '잡담하기' },
      { id: 'close',      icon: '👋',  label: '안녕히' },
    ],
  },
  채굴사: {
    greetings: {
      0:  ["어이, 광산 가본 적 있어? 좋은 광석이 많다고!", "광석 캐러 왔어? 잘 찾아왔네!"],
      20: ["광부 견습이 왔군! 요즘 실력이 느는 것 같아.", "반갑네! 광산에서 또 좋은 거 캤어?"],
      50: ["광부 동료! 오늘도 한판 해보는 거야?", "역시 실력자야! 같이 광산 얘기 좀 하자."],
      80: ["광산 친구! 네가 오면 마음이 든든해.", "오랜 친구! 오늘도 광산 헤집으러 가는 거야?"],
    },
    chatLines: [
      "광산 깊이 내려갈수록 좋은 광석이 나와!",
      "곡괭이 잘 챙겼어? 좋은 곡괭이가 채굴 속도를 올려줘.",
      "광석은 단순히 팔기보단 제련하면 더 비싸게 팔 수 있어.",
      "5층까지 내려가면 특수 광석이 나온다고. 도전해봐!",
      "낚시도 좋지만 광산도 제법 쏠쏠해!",
      "폭풍석? 거긴 좀 깊이 내려가야 나와.",
    ],
    options: [
      { id: 'ores',  icon: '⛏',  label: '광석 확인하기' },
      { id: 'chat',  icon: '💬',  label: '잡담하기' },
      { id: 'close', icon: '👋',  label: '안녕히' },
    ],
  },
  은행원: {
    greetings: {
      0:  ["안녕하세요. 은행 이용하러 오셨나요?", "환영합니다. 무엇을 도와드릴까요?"],
      20: ["일반 고객님, 반갑습니다! 이자율 우대 적용해 드릴게요.", "자주 오시는군요! 잘 챙겨드릴게요."],
      50: ["우대 고객님! 이자가 솔솔 쌓이고 있어요.", "항상 감사합니다. 특별 혜택 안내해드릴게요!"],
      80: ["VIP 고객님! 항상 감사드려요. 최고의 서비스 드릴게요.", "또 오셨군요! 잔액 확인해보실래요?"],
    },
    chatLines: [
      "저금은 미래를 위한 최고의 투자입니다.",
      "이자율이 조금씩 쌓이면 나중에 큰 돈이 되더라고요.",
      "은행 잔액이 늘수록 이자도 많이 붙어요!",
      "요즘 낚시로 목돈 모으시는 분들이 많이 오세요.",
      "안전한 저금 습관이 부자로 가는 길이죠!",
      "친밀도가 높을수록 이자율도 올라가요. 자주 오세요!",
    ],
    options: [
      { id: 'bank',  icon: '🏦', label: '은행 이용하기' },
      { id: 'chat',  icon: '💬', label: '잡담하기' },
      { id: 'close', icon: '👋', label: '안녕히' },
    ],
  },
  행상인: {
    greetings: {
      0: ["어이, 지나가는 나그네! 좋은 물건 있어요~", "초원에서 오셨나요? 싸고 좋은 거 많아요!"],
    },
    chatLines: [
      "서쪽 초원엔 허브가 엄청 많더라고요!",
      "씨앗은 잘 심으면 쏠쏠해요. 저도 팔고 있으니 구경해봐요.",
      "먼 길을 떠돌다 보면 별의별 물건을 만나게 되죠.",
      "좋은 미끼 하나가 전설 물고기를 낚는다는 거 아세요?",
    ],
    options: [
      { id: 'traveling_shop', icon: '🛒', label: '물건 구경하기' },
      { id: 'chat',           icon: '💬', label: '잡담하기' },
      { id: 'close',          icon: '👋', label: '안녕히' },
    ],
  },
  노련한광부: {
    greetings: {
      0: ["이봐, 광부 지망생! 광석 좀 보여줘봐.", "여기 동쪽 절벽은 내 영역이야. 광석 도움 필요해?"],
    },
    chatLines: [
      "이 절벽 광맥은 30년 동안 팠어. 다 알지.",
      "광석은 눈으로 보면 바로 알아. 색깔이 다 달라.",
      "좋은 곡괭이가 없으면 아무리 파도 헛수고야.",
      "아무도 못 가본 5층 깊이... 거기엔 뭔가 있을 거야.",
    ],
    options: [
      { id: 'ore_appraise', icon: '🪨', label: '광석 감정받기' },
      { id: 'pickaxe_repair', icon: '🔧', label: '곡괭이 수리' },
      { id: 'chat',           icon: '💬', label: '잡담하기' },
      { id: 'close',          icon: '👋', label: '안녕히' },
    ],
  },
  산신령: {
    greetings: {
      0: ["...산의 기운이 너를 부르는구나.", "고원의 바람을 타고 찾아왔구나. 무언가를 원하는가?"],
    },
    chatLines: [
      "이 고원의 안개는 모든 것을 품는다.",
      "산의 정기를 받으면 무엇이든 더 잘 된다.",
      "하늘과 땅의 기운... 오늘은 특히 강하구나.",
      "허브와 광석 모두 이 땅에서 나온 선물이니라.",
    ],
    options: [
      { id: 'mountain_buff', icon: '✨', label: '산의 기운 받기 (1일 1회)' },
      { id: 'chat',           icon: '💬', label: '말씀 듣기' },
      { id: 'close',          icon: '🙏', label: '물러가겠습니다' },
    ],
  },
  심해탐험가: {
    greetings: {
      0: ["여기까지 오다니, 대단한 모험가네요!", "남쪽 심해는 위험하지만 보물이 넘쳐요. 저랑 얘기해봐요!"],
    },
    chatLines: [
      "심해 5000m 아래엔 아직 아무도 못 가본 곳이 있어요.",
      "리바이어던을 봤어요? 진짜 크더라고요...",
      "스쿠버다이빙 장비 없으면 여기서 낚시도 어렵죠.",
      "전설 어종 포획 기록을 세우면 역사에 남아요!",
    ],
    options: [
      { id: 'deep_quest', icon: '🌊', label: '심해 원정 보고하기' },
      { id: 'chat',        icon: '💬', label: '잡담하기' },
      { id: 'close',       icon: '👋', label: '안녕히' },
    ],
  },
};

// 친밀도에 맞는 인사 배열 반환
function getGreeting(npcKey, affinity) {
  const data = DIALOGUE[npcKey];
  if (!data) return '...';
  const thresholds = [80, 50, 20, 0];
  for (const t of thresholds) {
    if (affinity >= t) {
      const lines = data.greetings[t];
      return lines[Math.floor(Math.random() * lines.length)];
    }
  }
  return data.greetings[0][0];
}

function getRandChat(npcKey) {
  const lines = DIALOGUE[npcKey]?.chatLines ?? [];
  if (!lines.length) return '...';
  return lines[Math.floor(Math.random() * lines.length)];
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function NpcDialogue({ npcKey, affinity, onAction, onClose }) {
  const npc = NPCS[npcKey];
  const data = DIALOGUE[npcKey];
  const [currentLine, setCurrentLine] = useState(() => getGreeting(npcKey, affinity));
  const [isChatting, setIsChatting] = useState(false);

  const affinityLevel = getAffinityLevel(affinity, npcKey);
  const affinityPct = Math.min(100, affinity);

  // 다음 친밀도 임계값
  const nextThreshold = npc?.thresholds?.find(t => t.at > affinity);

  const handleOption = useCallback((optId) => {
    if (optId === 'chat') {
      setCurrentLine(getRandChat(npcKey));
      setIsChatting(true);
      onAction('chat_affinity'); // +0.5 affinity
      return;
    }
    if (optId === 'close') {
      onClose();
      return;
    }
    onAction(optId);
  }, [npcKey, onAction, onClose]);

  if (!npc || !data) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 80px 0',
      background: 'rgba(0,0,0,0.45)',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(160deg, #0f2035 0%, #0a1828 100%)',
        border: '1px solid rgba(100,180,255,0.25)',
        borderRadius: 16,
        padding: '20px 24px',
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* NPC 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            fontSize: 42, lineHeight: 1,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '8px 12px',
            border: `1px solid ${npc.color}44`,
          }}>
            {npc.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: npc.color, fontWeight: 700, fontSize: 15 }}>{npc.name}</span>
              {affinityLevel && (
                <span style={{
                  background: `${npc.color}22`, border: `1px solid ${npc.color}55`,
                  borderRadius: 6, padding: '1px 7px', fontSize: 11, color: npc.color,
                }}>
                  {affinityLevel.label}
                </span>
              )}
            </div>
            {/* 친밀도 바 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1, height: 5, background: 'rgba(255,255,255,0.1)',
                borderRadius: 3, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${affinityPct}%`, height: '100%',
                  background: `linear-gradient(90deg, ${npc.color}88, ${npc.color})`,
                  borderRadius: 3, transition: 'width 0.4s',
                }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                {Math.floor(affinity)}/100
                {nextThreshold ? ` (다음: ${nextThreshold.label} @${nextThreshold.at})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 말풍선 */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          minHeight: 56,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -8, left: 20,
            width: 0, height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid rgba(255,255,255,0.12)',
          }} />
          <p style={{ color: '#e8edf5', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            {isChatting && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginRight: 6 }}>💬</span>}
            &ldquo;{currentLine}&rdquo;
          </p>
        </div>

        {/* NPC 설명 (첫 대화) */}
        {!isChatting && (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 14px 0', lineHeight: 1.5 }}>
            {npc.desc}
          </p>
        )}

        {/* 친밀도 보상 표시 */}
        {affinityLevel && (
          <div style={{
            background: `${npc.color}11`,
            border: `1px solid ${npc.color}33`,
            borderRadius: 8, padding: '6px 10px',
            marginBottom: 14, fontSize: 12,
            color: npc.color,
          }}>
            ✨ 현재 혜택: {affinityLevel.reward}
          </div>
        )}

        {/* 선택지 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {data.options.map(opt => (
            <button key={opt.id} onClick={() => handleOption(opt.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: opt.id === 'close'
                ? 'rgba(255,255,255,0.04)'
                : `${npc.color}18`,
              border: opt.id === 'close'
                ? '1px solid rgba(255,255,255,0.1)'
                : `1px solid ${npc.color}44`,
              color: opt.id === 'close' ? 'rgba(255,255,255,0.5)' : '#e8edf5',
              fontSize: 14, fontWeight: opt.id === 'close' ? 400 : 600,
              cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
