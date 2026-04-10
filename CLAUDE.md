# CLAUDE.md — Tidehaven 개발 가이드

> Claude Code가 이 프로젝트에서 작업할 때 참고하는 규칙 및 컨텍스트 문서입니다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **타이틀** | Tidehaven (낚시와 채굴의 조용한 마을) |
| **장르** | 멀티플레이어 낚시 RPG / 힐링 샌드박스 |
| **스택** | React 19 + HTML5 Canvas + Firebase Realtime DB |
| **빌드** | Vite (npm run dev / npm run build) |
| **저장** | localStorage (개인 진행) + Firebase (랭킹, 멀티플레이) |

---

## 소스 구조

```
src/
├── App.jsx              ★ 핵심 (4200+ 줄) — 게임 상태, 모든 로직, UI 렌더
├── GameCanvas.jsx       ★ 핵심 (2500+ 줄) — 야외 캔버스, 물리, 낚시/채굴 루프
├── IndoorCanvas.jsx     — 실내 캔버스 (상점/주방/여관/광산/은행)
│
├── gameData.js          — FISH, RODS, ORES, BOOTS, BAIT, COOKWARE, HERBS,
│                          MARINE_GEAR, PICKAXES, SMELT_RECIPES, JEWELRY_RECIPES,
│                          POTION_RECIPES, DISH_RECIPES, SEEDS, 가중치/강화 공식
├── abilityData.js       — DEFAULT_ABILITIES, ABILITY_DEFS, gainAbility, doGradeUp
├── achievementData.js   — ACHIEVEMENTS 목록, checkAchievements()
├── npcData.js           — NPCS (5종), getAffinityLevel(), getShopDiscount()
├── petData.js           — PETS (4종), PET_EXP_THRESHOLDS, PET_LEVEL_MULT
├── titleData.js         — TITLES (19종), getTitle()
├── seasonData.js        — SEASONS (4종), getCurrentSeason()
├── explorationData.js   — EXPLORE_ZONES (4곳), checkZoneUnlock()
├── weatherData.js       — getWeather(), msUntilNextWeather()
├── mapData.js           — 타일맵, nearestChair, DOOR_TRIGGERS, isInMineZone 등
│
├── ranking.js           — Firebase 랭킹 읽기/쓰기
├── multiplay.js         — Firebase 실시간 플레이어 위치 동기화
├── firebase.js          — Firebase 초기화
├── bgm.js               — 배경음악 (Web Audio API)
├── soundManager.js      — 효과음 8종 (절차적 생성)
│
├── Chat.jsx             — 채팅창 컴포넌트
├── Joystick.jsx         — 모바일 가상 조이스틱
├── Leaderboard.jsx      — 최대어 리더보드
├── RankSidebar.jsx      — 칭호 랭킹 사이드바
├── ChannelLobby.jsx     — 채널 선택 화면
└── RoomLobby.jsx        — 방 로비
```

### 핵심 상태 (App.jsx `gs`)

`DEFAULT_STATE` → `loadSave()` → `gs` (React state)로 관리.
`stateRef.current`는 콜백/이벤트 내에서 최신 상태 읽기용.
`gameRef.current`는 GameCanvas가 노출하는 렌더 상태 (petBonus, innBuff, fishTimeMult 등).

---

## 작업 규칙

### 코드 수정 규칙

1. **읽기 먼저** — 수정 전 반드시 해당 파일의 관련 섹션을 Read로 확인한다.
2. **최소 변경** — 요청된 기능만 구현. 불필요한 리팩터링·주석·타입 추가 금지.
3. **빌드 확인** — 모든 변경 후 `npm run build`로 컴파일 에러 없음을 확인한다.
4. **중복 방지** — 새 데이터(NPC, 아이템, 업적 등) 추가 전 기존 항목 중복 여부 확인.
5. **상태 확장 패턴** — 새 필드 추가 시 세 곳 모두 업데이트:
   - `DEFAULT_STATE` (초기값)
   - `loadSave()` 반환 객체 (마이그레이션 기본값 `s.X ?? default`)
   - 관련 useEffect/콜백

### 게임 데이터 수정 규칙

- **gameData.js** — 아이템/수치 추가 시 export 목록(`import { ... }` in App.jsx) 확인
- **achievementData.js** — 새 업적 추가 시 `achStats` 코멘트(App.jsx:213)도 업데이트
- **titleData.js** — TITLES 배열은 **낮은 우선순위 → 높은 우선순위** 순서 유지
- **npcData.js** — NPC 추가 시 App.jsx의 `DEFAULT_STATE.npcAffinity`와 `loadSave()`도 함께 수정

### 보너스 적용 패턴

게임 내 보너스는 항상 해당 액션의 시작 시점(useCallback 내)에 계산:

```
낚시 시간 = base × (1 - 낚시어빌리티 × 0.004) × (1 - 체력 × 0.003)
           × (1 - 강화효과) × (1 - 포션보너스) × (1 - 시즌보너스)
           × petFishMult × innBuffMult

채굴 시간 = base × (1 - 채굴어빌리티 × 0.004) × (1 - 체력 × 0.003)
           × pickaxeMult × (1 - paxTimeRed) × (1 - 포션보너스) × (1 - cheolsuBonus)
           × petMineMult × depthTimeMult

판매가    = base × seaBonus × petSellBonus × seasonPriceBonus
           × speechAbilMult (모든 아이템 판매에 적용)
```

### NPC 친밀도 시스템

| NPC키 | 이름 | 친밀도 획득 시점 |
|-------|------|--------------|
| 상인 | 민준 | 장비/미끼/요리도구 구매, 물고기 판매 |
| 요리사 | 수연 | NPC 요리 요청, 요리 완료 |
| 여관주인 | 미나 | NPC 대화, 여관 휴식, 특별 휴식, 외모 변경 |
| 채굴사 | 철수 | 광석 채굴 완료 (+0.5), NPC 대화 (+1) |
| 은행원 | 은행원 | 은행 UI 열기 (+1) |

친밀도 보너스는 구현된 것과 GDD 설계 사이의 차이를 TODO.md에서 추적.

---

## 매 작업 전 체크리스트

- [ ] `git diff --stat`으로 현재 변경 파일 확인
- [ ] 작업 대상 파일의 관련 섹션 Read 도구로 확인
- [ ] `TODO.md`에서 해당 항목이 있으면 확인
- [ ] 기존에 유사한 구현이 없는지 Grep으로 검색
- [ ] 새 필드/NPC/업적 추가 시 의존 파일 목록 파악

## 매 작업 후 체크리스트

- [ ] `npm run build` 실행 — 에러/경고 없음 확인
- [ ] `DEFAULT_STATE`, `loadSave()` 마이그레이션 누락 없음
- [ ] 새 보너스는 모든 관련 코드 경로에 적용됨 (예: 낚시 2개 경로, 판매 4개 경로)
- [ ] 업적/칭호 신규 추가 시 achStats 주석 업데이트
- [ ] `TODO.md` 해당 항목 체크

---

## 자주 쓰는 패턴

### 새 NPC 추가

```
1. npcData.js — NPCS에 항목 추가
2. App.jsx DEFAULT_STATE.npcAffinity — 키 추가
3. App.jsx loadSave() — 키 추가
4. App.jsx handleNpcInteract — else if (npcName === '...') 분기 추가
5. IndoorCanvas.jsx — 해당 방 npcs 배열에 NPC 위치 추가
6. 보너스 로직 — 해당 어빌리티/액션에 친밀도 체크 추가
```

### 새 업적 추가

```
1. achievementData.js — ACHIEVEMENTS에 항목 추가
2. App.jsx achStats 주석 업데이트
3. 해당 액션 콜백에서 achStats 업데이트 → checkAndGrantAchievements() 호출
```

### 새 시즌 효과 추가

```
1. seasonData.js — SEASONS 해당 항목에 새 프로퍼티 추가
2. App.jsx — 해당 액션(낚시/채굴/채집 등) 시작 콜백에서 getCurrentSeason()?.newProp으로 읽기
```

---

## 미니게임 시스템

### 종류 및 파일

| 미니게임 | 파일 | 진입 조건 |
|---------|------|---------|
| 릴 낚시 (ResistanceMinigame) | `src/ResistanceMinigame.jsx` | 전설/신화 물고기 낚시 시 자동 (확률적) |
| 정밀 채굴 (MiningMinigame) | `src/MiningMinigame.jsx` | 수정/금광석 채굴 시 20% 확률 |
| 조류 낚시 (TidalMinigame) | `src/components/TidalMinigame.jsx` | 항구마을 낚시 |
| 얼음 구멍 낚시 (IceHoleMinigame) | `src/components/IceHoleMinigame.jsx` | 설산 낚시 |
| 방향별 존 미니게임 (ZoneMiniGame) | `src/components/ZoneMiniGame.jsx` | 마을 방향 존 진입 시 자동 |

### 방향별 존 미니게임 (ZoneMiniGame)

마을(`'마을'` worldZone)에서 플레이어가 방향별 구역에 진입하면 자동 실행됨.

| 방향 | 타일 조건 | 연결 미니게임 |
|------|----------|------------|
| 동쪽 (광산) | tx ≥ 56, ty ≤ 30 | MiningMinigame 래핑 |
| 남쪽 (낚시터) | ty ≥ 33 | ResistanceMinigame 래핑 |
| 서쪽 (농장) | tx ≤ 11, ty ≤ 30 | 준비 중 placeholder |

**감지 위치**: `GameCanvas.jsx` 게임 루프 내 "Zone mini-game entry detection" 블록.  
`gameRef.current.zoneMiniGameActive = true` 플래그로 미니게임 진행 중 재진입 차단.

**저장 상태** (`useGameState.js` DEFAULT_STATE + loadSave):
```js
zoneMiniGameLevels: { mine: 0, fishing: 0, farm: 0 }  // 존별 레벨 (완료 시 +1)
zoneTutorialSeen:   { mine: false, fishing: false, farm: false }  // 튜토리얼 첫 표시 여부
```

**ZoneMiniGame 흐름**: 튜토리얼(첫 방문) → 미니게임 → 결과 화면 → `onClose(completed)`.  
완료 시 `zoneMiniGameLevels[zone] += 1`, 종료 시 플레이어를 허브 중심(`PLAYER_START_X/Y`)으로 텔레포트.

**레벨별 난이도 스케일**:
- 광산: Lv.0-4 철광석 → Lv.5-9 구리광석 → Lv.10-14 수정 → Lv.15+ 금광석
- 낚시: Lv.0-4 피라미 → Lv.5-9 붕어 → Lv.10-14 연어 → Lv.15+ 황금잉어

### MiningMinigame 인터페이스

```jsx
<MiningMinigame oreName={string} miningBonus={object} onFinish={(yieldCount) => void} />
```

`miningBonus` 프로퍼티: `mineRange`, `mineSpeedMult`, `mineTimerBonus`, `mineYieldBonus`,
`mineDoubleChance`, `mineExtraOres`, `mineChainBonus` — 모두 생략 시 기본값 적용.

### ResistanceMinigame 인터페이스

```jsx
<ResistanceMinigame
  fishName={string} rarity={'전설'|'신화'} size={number}
  fishGrade={number} resistMastery={object}
  onSuccess={() => void} onFail={() => void}
/>
```

`fishGrade`가 높을수록 릴 속도 향상 + 스트레스 감소 (플레이어에게 유리).  
`resistMastery` 프로퍼티: `resistDecayBonus`, `resistStressReduce`, `resistMaxStress`, `resistDistReduce`.

### 새 존 미니게임 추가 패턴

```
1. src/components/ZoneMiniGame.jsx — ZONE_INFO에 항목 추가, playing 분기 추가
2. GameCanvas.jsx — "Zone mini-game entry detection" 블록에 타일 조건 추가
3. useGameState.js — zoneMiniGameLevels / zoneTutorialSeen 기본값에 키 추가
```

---

## Design System

DESIGN.md가 존재합니다. 모든 시각적/UI 결정 전 반드시 읽으세요.
폰트, 색상, 간격, 심미적 방향은 모두 DESIGN.md에 정의되어 있습니다.
명시적인 사용자 승인 없이 이탈하지 마세요.
QA 모드에서는 DESIGN.md와 일치하지 않는 코드를 표시하세요.

---

## 알려진 설계 제약

- **App.jsx 단일 파일 집중**: 현재 모든 게임 로직이 App.jsx에 집중 (4200+ 줄). 파일 분리는 하지 않음.
- **localStorage 저장**: 세이브는 `fishingGame_v1_{닉네임}` 키. 필드 추가 시 항상 `??` 기본값으로 하위 호환성 유지.
- **gameRef vs stateRef**: Canvas 콜백에서는 `stateRef.current`로 최신 상태 읽기. React state 직접 참조 금지.
- **useCallback 의존성 배열**: gainNpcAffinity, checkAndGrantAchievements 등 추가 시 deps 배열 업데이트.
