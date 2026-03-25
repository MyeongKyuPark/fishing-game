# TODO.md — Tidehaven 개발 체크리스트

> GDD.md 기반으로 구현 단위별로 세분화한 작업 목록.
> ✅ = 완료 / 🔲 = 미구현 / 🚧 = 부분 구현

---

## Phase 1 — 핵심 기반 (완료된 항목 포함)

### 1-1. 낚시 시스템
- [x] 22종 어종 데이터 (FISH)
- [x] 7단계 어빌리티 기반 어종 풀 (getAbilityFishTable)
- [x] 낚시 의자 감지 + 착석 로직
- [x] 낚시 시간 공식 (낚시×0.004, 체력×0.003, 강화효과)
- [x] 찌 타이밍 미니게임 (bite 상태 → 스페이스/버튼 입력)
- [x] 판매가 계산 (크기, 화술, 강화, 심해 보너스)
- [x] 낚싯줄 끊김 이벤트 (3%)
- [x] 보물상자 이벤트 (2%, 200~800G)
- [x] 심해 방파제 가격 ×1.5 보너스
- [x] 전설/신화 포획 시 서버 전체 공지
- [x] 물고기 도감 (22종 수집 추적 + 최고 크기 기록)
- [x] 도감 완성 서버 전체 방송 (broadcastAnnouncement 구현 확인 완료)
- [x] 미끼 시스템 (4종 — 구리/황금/전설/신화, 영구/1회용)
- [x] 해양 장비 (스쿠버다이빙세트) 심해 낚시

### 1-2. 채굴 시스템
- [x] 4종 광석 데이터 (ORES)
- [x] 채굴 조건 (광산 구역 진입 확인)
- [x] 채굴 시간 공식 (채굴×0.004, 체력×0.003, 곡괭이 배율)
- [x] 광석 대박 이벤트 (3%, 4~9개 추가)
- [x] 광산 깊이 시스템 (1~5층, 층별 광석 비율/시간 배율)
- [x] 층별 채굴 어빌리티 요구사항 (MINE_DEPTH_REQ)
- [x] 곡괭이 강화 시스템

### 1-3. 허브 채집 시스템
- [x] 3종 허브 (들풀/버섯/희귀허브)
- [x] 숲 구역 감지
- [x] 채집 시간/가중치 공식

### 1-4. 요리 시스템
- [x] 기본 요리 (물고기 전체 요리, 프라이팬×2.0/화로×3.5)
- [x] 요리 배율 공식 (요리어빌리티×0.01 추가)
- [x] 특별 요리 레시피 시스템 (DISH_RECIPES, 작물+물고기)
- [x] 요리사 NPC lv50: 제자 보너스 (15% 확률 2배 요리)
- [x] 요리사 lv80: 전설 레시피 해금 (reqNpc: {요리사: 80})

### 1-5. 제작/강화 시스템
- [x] 낚싯대 강화 (0~100레벨, 구간별 재료, 성공률 공식)
- [x] 곡괭이 강화
- [x] 제련 레시피 (SMELT_RECIPES)
- [x] 귀금속 제작 (JEWELRY_RECIPES)
- [x] 포션 제작 (POTION_RECIPES) + 활성 포션 효과 적용

### 1-6. 어빌리티 시스템
- [x] 6종 어빌리티 (낚시/채굴/요리/화술/체력/강화)
- [x] 그레이드업 (100달성 → 0 초기화, 희귀어 보너스 누적)
- [x] 파티 보너스 (동채널 플레이어 존재 시 20% 확률 2배)
- [x] 직업 트리 시스템 (낚시장인/광부대가/미식가/상인왕 4종, 그레이드1 조건, 보너스 적용)

### 1-7. 경제 시스템
- [x] 상점 (낚싯대/신발/미끼/요리도구 구매)
- [x] 상인 친밀도 할인 (5%/10%/15%)
- [x] 물고기/광석/허브/작물 판매 (화술+펫 보너스 적용)
- [x] 은행 시스템 (예금, 이자, 출금)
- [x] 오프라인 보상 (최대 2시간, 8G/분)
- [x] 출석 보너스 (300G + 연속 접속 스트릭)

### 1-8. NPC 친밀도 시스템
- [x] 상인 (민준) — 할인, 특별 미끼 매일 지급(lv80)
- [x] 요리사 (수연) — 요리 경험치 보너스, 제자 보너스, 전설 레시피
- [x] 여관주인 (미나) — 체력 +1(lv20), 퀘스트 +1(lv50), 오프라인 +50%(lv80)
- [x] 채굴사 (철수) — 채굴 속도 +8%(lv20), 대박 +5%(lv50), 5층 해금(lv80)
- [x] 은행원 — 이자율 +0.5%/+1%(lv20/50), 오프라인 수입 ×2(lv80)
- [x] NPC 개별 퀘스트 라인 (Phase 2에서 구현 완료)

### 1-9. 퀘스트/업적 시스템
- [x] 일일 퀘스트 풀 (24종, 날짜 해시 기반 추출)
- [x] 여관주인 lv50 효과 (퀘스트 +1개)
- [x] 업적 시스템 (50종+) — 낚시/채굴/채집/요리/농장/은행/로그인/NPC/탐험
- [x] 업적 보상 중 아이템 지급 (낚시달인→황금미끼, 전설낚시꾼→신화미끼, 광산왕→채굴포션, 모험가→희귀낚시포션, 대지의주인→채집강화포션)

### 1-10. 펫 시스템
- [x] 4종 펫 (수달/두더지/고양이/아기용)
- [x] 펫 레벨 시스템 (최대 lv5, 경험치 누적)
- [x] 펫 보너스 적용 (낚시속도/채굴속도/판매가/희귀도/대박)
- [x] 펫 추가 종류 확장 (봉황/황금두더지/별빛고양이 3종 추가, 채집속도 petBonus 지원)

### 1-11. 탐험 시스템
- [x] 4개 탐험 구역 (비밀낚시터/심층광맥/신비의숲/고대유적)
- [x] 구역 해금 조건 (어빌리티 기반)
- [x] 구역 효과 적용 (낚시 보너스, 광석 보너스, 허브 보너스)
- [x] 탐험 구역 내 미니 퀘스트/스토리 (발견 시 NPC 대사 + 힌트 메시지 순차 표시)

### 1-12. 농장 시스템
- [x] 씨앗 3종 (밀씨앗/약초씨앗/황금씨앗)
- [x] 작물 재배/수확 루프
- [x] 물주기 (시간 25% 단축)
- [x] 비 날씨 자동 물주기
- [x] 계절별 수확량 보너스
- [x] 농장 확장 (farmExpansionCount 상태, 3000G×최대3회, +3칸씩 최대 15칸)
- [x] 씨앗 추가 종류 (봄/여름/가을/겨울 계절 씨앗 4종 추가, reqSeason 검사)

### 1-13. 계절 시스템
- [x] 4개 계절 이벤트 (봄/여름/가을/겨울)
- [x] 계절별 효과 적용 (물고기가격, 희귀도, 채집속도, 수확량, 낚시속도)
- [x] 여름 금광석 출현율 ×1.5 적용
- [x] 겨울 낚시 속도 +10% 적용
- [x] 계절별 전용 이벤트 스토리 (각 계절 첫 접속 시 NPC 대사+효과 안내 1회 표시)

### 1-14. 멀티플레이 & 소셜
- [x] Firebase 채널 기반 멀티플레이 (10채널 × 최대 20인)
- [x] 실시간 플레이어 위치/상태 동기화 (200ms)
- [x] 전설/신화 포획 서버 공지 배너
- [x] 서버 전체 통계 (totalFishCaught)
- [x] 중복 탭 방지 (BroadcastChannel)
- [x] 서버 집단 퀘스트 마일스톤 방송
- [x] 파티 시스템 정식화 (초대/수락/탈퇴, 미니맵 파티원 녹색 표시, /파티 채팅, Firebase 기반)

### 1-15. 랭킹 & 칭호
- [x] 최대어 리더보드 (어종별 Top 10, Firebase)
- [x] 칭호 랭킹 Top 30
- [x] 19종 칭호 (GDD 15종 + NPC/탐험/광산 관련 4종 추가)
- [x] 서버 전체 실시간 랭킹 (보유 골드 순위, 어빌리티 합산 순위)

### 1-16. UI / UX
- [x] 캐릭터 외형 커스터마이징 (성별/피부/머리/옷색 + 여관에서 변경)
- [x] 모바일 가상 조이스틱
- [x] 스탯 패널 (장비/어빌리티/제련제작/업적/펫/관계도/탐험/농장 탭)
- [x] 물고기 도감 패널
- [x] 인벤토리 패널 (개별/전체 판매)
- [x] 퀘스트 패널
- [x] 광산 깊이 선택 UI (층별 잠금/해금 표시)
- [x] 은행 모달 (이자율 동적 표시)
- [x] NPC 관계도 패널 (모든 달성 혜택 표시)
- [x] 미니맵 표시 (데스크탑 전용, RAF 실시간 갱신)

### 1-17. 사운드
- [x] 효과음 8종 (낚시시작/포획/채굴/요리/판매/입장/NPC/레벨업)
- [x] BGM 시스템 (볼륨 조절, 재생/정지)
- [x] 계절/날씨별 앰비언트 사운드 변경 (봄/여름/가을/겨울/비 야외 트랙 추가, 날씨 기반 BGM 자동 전환)

---

## Phase 2 — 단기 예정 🔜

### 2-1. UX 연출 강화
- [x] 그레이드업 전체화면 축하 애니메이션 (CSS 오버레이 + 바운스)
- [x] 전설/신화 포획 시 캔버스 파티클 이펙트 (rareEffect + fishParticles)
- [x] 광물 대박 시 화면 흔들림 (shakeEffect in GameCanvas)
- [x] 업적 달성 팝업 애니메이션 (토스트 팝업 + 큐 시스템)

### 2-2. NPC 개별 퀘스트 라인
- [x] 민준 퀘스트 (강화/장비 관련 3단계)
- [x] 수연 퀘스트 (요리/어빌리티 관련 3단계)
- [x] 미나 퀘스트 (여관방문/마을/로그인 3단계)
- [x] 철수 퀘스트 (채굴/광석 관련 3단계)
- [x] 은행원 퀘스트 (예금/저축/친밀도 3단계)
- [x] 의뢰 진행도 관계도 탭 표시
- [x] 퀘스트 전용 보상 아이템 (낚싯대 스킨 2종, 코스튬 3종 — 민준/수연/미나/철수/은행원 최종 보상, 관계도 탭에 컬렉션 표시)

### 2-3. 이벤트 시스템
- [x] 전설어 출몰 타임 이벤트 (특정 어종 확률 ×4, 30분 한정, 서버 공지 + HUD 표시)
- [x] 이벤트 스케줄러 (Firebase server_events 컬렉션, active 이벤트 구독, rareFish/sellBonus 효과 적용, HUD 표시)

### 2-4. 랭킹 확장
- [x] 보유 골드 Top 30 랭킹 (Leaderboard 탭 추가)
- [x] 어빌리티 합산 Top 30 랭킹 (Leaderboard 탭 추가)
- [x] 업적 달성수 Top 30 랭킹 (Leaderboard 탭 추가, achievement_records Firebase 컬렉션)

### 2-5. 파티 시스템 정식화
- [x] 파티 초대/수락 UI (팝업 + /파티초대/수락/거절 명령어)
- [x] 파티원 위치 미니맵 공유 (partyMembersRef 녹색 점 표시)
- [x] 파티 전용 채팅 채널 (/파티 [메시지] 명령어, Firebase party_chat)
- [x] 파티원 공동 낚시 희귀도 보너스 (파티원 수 × 10%, 최대 25% 희귀도 부스트)

---

## Phase 3 — 중기 예정 🔜

### 3-1. 이벤트 & 경쟁
- [x] ✅ 주간 낚시대회 (주간 마릿수 Firebase 랭킹, 리더보드 탭 추가)
- [x] ✅ 서버 공동 퀘스트 (fishCaught 공동 목표, 마일스톤 서버 공지, HUD 진행도)
- [x] ✅ 폭풍 강화 이벤트 (폭풍 시 폭풍석 드롭 8%, 서버 공지)

### 3-2. 콘텐츠 확장
- [x] ✅ 어종 확장 (22종 → 30종) — 피라미/도미/해마/전갱이/부시리/개복치/빙어/불사조고기 추가
- [x] ✅ 도감 완성 전용 칭호 ("바다의 주인" — 30종 완성)
- [x] ✅ 희귀어 박제 시스템 (전설/신화 포획 → 박제실 탭, 최대 20개)
- [x] ✅ 광산 고대 유적 비밀 구역 (5번째 탐험 구역, 고대보석 드롭, 광석 부스트)

### 3-3. 캐릭터 외형
- [x] ✅ 모자 아이템 시스템 (4종: 밀짚모자/낚시캡/광부헬멧/왕관, 상점 구매/장착)
- [x] ✅ 낚시복 아이템 시스템 (5종: 어부의의상/광부작업복/요리사유니폼/황금낚시복 등)
- [x] ✅ 낚싯대 스킨 (5종: 황금/수정/불꽃/용의가호 스킨, 상점 구매)
- [x] ✅ 낚시터 개인 자리 꾸미기 (파라솔/이름표/고급의자/미끼통, 상점 구매)

### 3-4. 미니게임
- [x] ✅ 대어 저항 미니게임 (전설/신화 포획 시 슬라이더 타이밍 게임, ResistanceMinigame.jsx)
- [x] ✅ 광석 정밀 채굴 미니게임 (수정/금광석 20% 확률 원형 타이밍 게임, MiningMinigame.jsx)

---

## Phase 4 — 장기 목표 🔜

### 4-1. 길드 시스템
- [x] ✅ 길드 생성/가입/탈퇴 UI
- [x] ✅ 길드 공동 퀘스트
- [x] ✅ 길드 vs 길드 주간/월간 경쟁
- [x] ✅ 길드 전용 채팅
- [x] ✅ 길드 회관 건물 (맵 서쪽 확장)

### 4-2. 스토리 & 세계관
- [x] ✅ NPC 스토리라인 (챕터 0~3 텍스트 이벤트)
- [x] ✅ 전설어 신화 세계관 확장 (고대어·용고기 관련 컷씬)
- [x] ✅ 계절별 전용 스토리 이벤트

### 4-3. 직업 트리
- [x] ✅ 직업 조건 시스템 (어빌리티 그레이드 기반)
- [x] ✅ 낚시 장인 (전설어 출현 개인 알림)
- [x] ✅ 광부 대가 (대박 확률 ×2)
- [x] ✅ 미식가 (요리 배율 +0.5배)
- [x] ✅ 상인 왕 (판매 +15%)

### 4-4. 경제 확장
- [x] ✅ 플레이어 간 거래 (경매장 또는 직거래)
- [x] ✅ 야시장/경매장 건물 (맵 동쪽 확장)

### 4-5. 맵 확장
- [x] ✅ 심해 탐험 구역 (남쪽 바다, 신규 어종)
- [x] ✅ 계절 이벤트 전용 구역 (북동쪽)
- [x] ✅ 서버 공동 보스 이벤트

---

## 기술 부채 & 개선 사항

- [x] ✅ App.jsx 분리 (5800+ 줄 → hooks/useGameState, useWebSocket, useKeyboard, useOfflineReward + components/TopBar, Sidebar, ChatBox, GameCanvas)
- [x] ✅ GameCanvas.jsx 분리 (2500+ 줄) — src/game/, src/canvas/ 모듈로 분리 완료
- [x] ✅ localStorage 세이브 버전 마이그레이션 시스템 (`v1` → `v2`)
- [x] ✅ Firebase 보안 규칙 강화 (firestore.rules 파일 생성)
- [x] ✅ 번들 크기 최적화 (vite.config manualChunks: vendor-react/vendor-firebase)
- [x] ✅ 에러 바운더리 추가 (main.jsx ErrorBoundary 이미 구현됨)
- [x] ✅ 오프라인 모드 대응 (navigator.onLine + window online/offline 이벤트, HUD 배지)

---

## Phase 5 — 다음 단계 제안 🔜

### A. 플레이 품질 개선

- [x] ✅ 인벤토리 드래그 정렬 / 카테고리 필터 (물고기/광석/허브/작물/기타)
- [x] ✅ 채팅 이모지 자동완성 (`:` 입력 시 팝업, 자주 쓰는 이모지 목록)
- [x] ✅ 설정 패널 — 효과음 개별 ON/OFF, 캔버스 화질(저/중/고) 설정

### B. 신규 콘텐츠

- [x] ✅ 계절 전용 한정 어종 추가 (봄 벚꽃붕어, 여름 불꽃송어, 가을 단풍잉어, 겨울 빙어왕)
- [x] ✅ 낚시 토너먼트 전용 UI (시간 제한 내 총 무게 경쟁, 실시간 순위 HUD)
- [x] ✅ 낚시터 개인 자리 꾸미기 실제 렌더링 구현 (파라솔/이름표/고급의자 캔버스 표시)

### C. 기술/성능

- [x] ✅ 세이브 데이터 압축 (LZ-string 또는 JSON 키 단축으로 localStorage 용량 절감)
- [x] ✅ 캔버스 렌더링 성능 프로파일링 (TREE_POSITIONS 루프, 파티클 오브젝트 풀링)
- [x] ✅ PWA 지원 (manifest.json + Service Worker 캐시, 오프라인 플레이 가능)

---

## Phase 6 — 밸런스 & 주거 시스템 🔜

### A. 게임 밸런스 & 폴리싱

- [x] ✅ 계절 한정 어종 등장 가중치 및 판매가 재조정 (현행 수치 플레이테스트 기반 튜닝)
- [x] ✅ 토너먼트 점수 배분 검토 (크기 기반 vs 마릿수 혼합, 상위 3위 보상 설계)
- [x] ✅ 길드 공동 퀘스트 보상 수치 재조정 (기여도 대비 보상 체감 개선)
- [x] ✅ 파티 희귀도 보너스 상한 재검토 (현행 최대 25% → 적정 값 검증)
- [x] ✅ NPC 친밀도 획득 속도 및 구간별 혜택 체감 밸런싱
- [x] ✅ 은행 이자율/오프라인 수입 경제 균형 검토 (골드 인플레이션 방지)

### B. 주거 시스템

- [x] ✅ 플레이어 개인 오두막 구역 추가 (맵 북서쪽, 닉네임별 고정 집 타일)
- [x] ✅ 오두막 실내 캔버스 (IndoorCanvas 확장, 가구 배치 그리드 8×6)
- [x] ✅ 가구 아이템 추가 (책상/침대/어항/벽난로 — gameData.js FURNITURE 추가)
- [x] ✅ 상점에서 가구 구매 및 오두막 내 배치/이동 UI
- [x] ✅ 박제 물고기 트로피 오두막 내 전시 (박제실 → 오두막 벽 슬롯 연동)
- [x] ✅ 업적 패 전시 (달성한 업적 중 최대 6개 선택해 오두막 벽에 표시)
- [x] ✅ 오두막 방문 기능 (다른 플레이어 닉네임 입력 → 해당 오두막 관람)

---

## Phase 7 — UI/UX 개선 🔜

### A. HUD & 정보 표시

- [x] ✅ 낚시/채굴/채집 진행 바 애니메이션 개선 (현재 텍스트 카운트다운 → 원형 프로그레스 링)
- [x] ✅ 물고기 포획 시 팝업 카드 (어종 이미지·크기·가격·희귀도를 카드 형태로 0.8초 표시)
- [x] ✅ 채굴 대박 이벤트 전용 화면 연출 (현재 텍스트 메시지 → 광물 이모지 터지는 효과)
- [x] ✅ HUD 골드 변화 시 +/- 플로팅 텍스트 (판매·구매·보상 시 캔버스 위에 숫자 떠오름)
- [x] ✅ 계절/날씨 전환 시 전체화면 페이드 연출 (현재 즉시 전환 → 0.5초 크로스페이드)

### B. 패널 & 모달 UX

- [x] ✅ 인벤토리 패널 물고기 개별 카드에 도감 달성 여부 표시 (신기록이면 🏆 뱃지)
- [x] ✅ 상점 패널 구매 확인 토스트 (구매 후 "✅ 구매 완료" 1초 스낵바)
- [x] ✅ 퀘스트 패널 완료 항목 체크 애니메이션 (체크마크 드로잉 효과)
- [x] ✅ 패널 열림/닫힘 슬라이드 트랜지션 (현재 즉시 표시 → CSS transform 0.15s)
- [x] ✅ 스탯 패널 어빌리티 탭 — 경험치 바 채워지는 애니메이션 (새로고침 시 0→현재 값 채움)
- [x] ✅ NPC 관계도 탭 — 친밀도 구간 달성 시 반짝이는 하이라이트 효과

### C. 모바일 경험

- [x] ✅ 모바일 하단 액션 버튼 배치 재구성 (자주 쓰는 버튼 크게, 덜 쓰는 버튼은 더보기로)
- [x] ✅ 모바일 패널 높이 최적화 (인벤토리·상점 등 80vh 고정 → 콘텐츠 양에 맞춰 조절)
- [x] ✅ 핀치 줌 / 더블탭 줌 방지 (뷰포트 meta 강화로 의도치 않은 확대 차단)
- [x] ✅ 모바일 채팅창 키보드 올라올 때 레이아웃 밀림 방지 (visualViewport API 활용)

### D. 접근성 & 편의

- [x] ✅ 툴팁 시스템 — 아이템/버튼에 마우스 호버 시 설명 말풍선 표시 (PC)
- [x] ✅ 단축키 안내 오버레이 (`?` 키로 토글 — 키보드 단축키 목록 표시)
- [x] ✅ 색약 친화 희귀도 색상 모드 옵션 (빨강/녹색 대신 모양으로 구분하는 대안 테마)
- [x] ✅ 로그인 화면 닉네임 자동완성 (localStorage에 저장된 기존 닉네임 드롭다운)

### E. 온보딩 & 튜토리얼

- [x] ✅ 첫 접속 튜토리얼 시퀀스 (낚시 의자 안내 → 낚시 → 판매 → 상점 순서로 하이라이트 표시)
- [x] ✅ 신규 기능 안내 툴팁 (세이브에 없는 새 필드 감지 시 해당 UI에 "NEW" 뱃지 1회 표시)
- [x] ✅ 채팅 명령어 자동완성 (`!` 입력 시 사용 가능한 명령어 팝업)

---

## Phase 8 — 도감 확장 & 신규 콘텐츠

### 8-1. 전체 도감 시스템 확장

현재 물고기 도감만 존재. 모든 수집/제작 카테고리에 도감 탭 추가.

- ✅ **어종 도감** (기존 확장) — 30종 수집 현황, 최고 크기 기록
- ✅ **채집 도감** — 3종 허브 총 채집 횟수 기록 (herbLog)
- ✅ **광석 도감** — 4종 광석 총 채굴 수 기록 (oreLog)
- ✅ **요리 도감** — DISH_RECIPES 9종 완료 횟수 기록 (dishLog)
- ✅ **제련/장신구 도감** — SMELT_RECIPES·JEWELRY_RECIPES 제작 횟수 기록 (smeltLog/jewelLog)
- ✅ **포션 도감** — POTION_RECIPES 7종 제조 횟수 기록 (potionLog)
- ✅ **작물 도감** — SEEDS 9종 수확 횟수 기록 (cropLog)
- ✅ **도감 탭 통합 UI** — 도감 패널에 탭 추가: 어종 / 채집 / 광석 / 요리 / 제작 / 포션 / 작물
- ✅ **도감 완성 업적 추가** — 숲의 탐험가, 광석 수집가, 마스터 셰프, 대지의 개척자, 연금술사
- ✅ **도감 완성률 HUD 표시** — 전체 도감 달성 % 스탯 패널 장비 탭에 표시

### 8-2. 콘텐츠 깊이 확장

- ✅ **낚시 시즌 리그** — 월간 시즌 종료 시 최종 순위에 따라 전용 칭호(시즌1 낚시왕 등) + 스킨 지급, Firebase season_rankings 컬렉션
- ✅ **레시피 발견 시스템** — 요리 레시피를 상점에서 바로 확인하는 대신 재료 조합 실험으로 발견, 도감에 미발견 레시피는 "???" 표시
- ✅ **낚시 미끼 DIY 제작** — 허브 + 광석 조합으로 커스텀 미끼 제작 (BAIT_RECIPES 4종, 상점 탭 추가)
- ✅ **납품 주문 시스템** — 매일 NPC 3종이 특정 광석/허브/작물 납품 요청, 완료 시 골드+친밀도 보너스 (DELIVERY_ORDER_POOL 13종)

### 8-3. 소셜 & 멀티플레이 강화

- ✅ **플레이어 우편함** — 오프라인 플레이어에게 아이템/골드/메시지 전송, Firebase player_mailbox 컬렉션, 인박스 UI (최대 10개 보관)
- ✅ **길드 창고 / 길드 레벨** — 길드원 공유 창고 (슬롯 20개), 길드 레벨 1~5 (공동 퀘스트 기여도 누적), 레벨별 창고 확장 + 길드 보너스
- ✅ **오두막 방문객 방명록** — 방문한 플레이어가 메모 남기기 (최대 20개), Firebase cottage_guestbooks/{nickname}

### 8-4. 게임플레이 루프 확장

- ✅ **어종 생태계 시스템 (부분)** — 방류 버튼 인벤토리 추가, !방류/!방류 [어종명] 명령어, 생태계 기여 메시지
- ✅ **심해 원정대 (파티 전용)** — 파티원 3명 이상 심해 구역 진입 시 협동 보스 낚시 이벤트 발생, 초전설 어종(크라켄/해룡) 포획 가능
- ✅ **농장 → NPC 납품 연동** — 작물 수확 시 NPC 납품 주문 자동 매칭, 잉여 작물 일괄 납품 버튼

### 8-5. 기술/UX 개선

- ✅ **세이브 데이터 백업** — 세팅 패널에서 .save 파일 다운로드 및 불러오기 (로컬 백업/복구)
- ✅ **일일 미션 PWA 푸시 알림** — Service Worker 활용, 일일 퀘스트 초기화(자정) 시 선택적 푸시 알림
- ✅ **도감 공유 기능** — 도감 현황 텍스트 클립보드 복사 (공유 버튼)

---

## Phase 9 — Live Service Platform

### 9-1. Prestige / New Tide+ System
- ✅ DEFAULT_STATE.prestigeCount (0), prestigePermanentSellBonus (0)
- ✅ Prestige trigger condition: all 5 NPC story quests complete + seenChapter4 === true
- ✅ Atomic prestige reset: abilities → 0, prestigeCount +1, prestigePermanentSellBonus += 0.02
- ✅ prestigePending flag in DEFAULT_STATE for crash recovery
- ✅ Prestige bonus applied to sell price formula (× (1 + prestigePermanentSellBonus))
- ✅ Prestige-exclusive titles in titleData.js (새벽의 낚시꾼 prestige≥1, 전설의 어부 prestige≥3, 불멸의 어부 prestige≥5)
- ✅ Prestige confirm modal in App.jsx showing exactly what resets vs persists
- ✅ Prestige leaderboard tab in Leaderboard.jsx

### 9-2. Admin Event Dashboard
- ✅ AdminPanel.jsx — password-protected #admin route (VITE_ADMIN_PASSWORD env var)
- ✅ Event CRUD UI against existing server_events Firebase collection
- ✅ Admin audit log writes to Firebase admin_audit_log/{timestamp} on each action
- ✅ Drop rate override: write fishRateOverride to server_events for client to pick up

### 9-3. Season Pass (30-day)
- ✅ DEFAULT_STATE.seasonPassXP (0), seasonPassTier (0), seasonPassClaimedTiers ([]), lastSeasonReset ("")
- ✅ SEASON_PASS_REWARDS array in gameData.js (10 tiers: cosmetics, bait, gold)
- ✅ Season pass XP gains: fishing (+1), mining (+1), cooking (+2), daily quest complete (+5)
- ✅ SeasonPass.jsx panel: tier progress bar, reward list, claim button
- ✅ Monthly reset logic: compare lastSeasonReset month/year to now, reset if different month

### 9-4. Content Batch
- ✅ 10 new fish in gameData.js FISH array:
    빛붕어(lightCrucian, common, 200-350G), 자갈치(cobbleFish, common, 180-300G),
    무지개퍼치(rainbowPerch, common, 220-380G), 황금장어(goldenEel, uncommon, 600-900G),
    삼치(mackerel, uncommon, 500-750G), 보석복어(jewelPufferfish, uncommon, 700-1000G),
    달빛가오리(moonRay, uncommon, 800-1200G), 고대철갑상어(ancientSturgeon, rare, 2000-3500G),
    용아귀(dragonAnglerfish, rare, 2500-4000G), 타이드헤이븐리바이어던(tidalLeviathan, legendary, 15000-25000G)
- ✅ 2 new exploration zones in explorationData.js:
    침몰한 신전 (Sunken Temple, requires guild level 3, ancient gem drop + deep fish bonus ×1.5)
    얼어붙은 연못 (Frozen Tundra Pond, winter-only reqSeason:"겨울얼음낚시", ice fish bonus ×1.3)

### 9-5. Auction House
- ✅ AuctionHouse.jsx — browse listings, list item, my-sales tabs
- ✅ Firebase auction_house/{listingId} collection writes in App.jsx
- ✅ Atomic buy using Firebase runTransaction (gold deduct + mark sold + mailbox notify)
- ✅ 30s localStorage cache for browse (avoid live subscription)
- ✅ Economy guardrails: max 5 listings per player, price 50%-300% of base sell price
- ✅ Inventory pre-listing validation (not equipped, not in active delivery order)

### 9-6. NPC Story Conclusion (Ch 4-5)
- ✅ DEFAULT_STATE.seenChapter4 (false), seenChapter5 (false)
- ✅ Chapter 4: triggered in ancient ruins zone first visit after all 5 NPC quests complete
- ✅ Chapter 5: server-wide event triggerable from admin panel (type: "chapter5")
- ✅ "타이드헤이븐의 전설" title in titleData.js for players with seenChapter5 === true

### 9-7. Technical Health
- ✅ GameCanvas.jsx: skip RAF when document.hidden (document.addEventListener visibilitychange)
- ✅ App.jsx: auction house listing cache with 30s TTL in localStorage
- ✅ Season pass XP sync: stored in localStorage state (no per-action Firebase writes)
- ✅ Firebase: auction_house collection used; season_pass stays in localStorage

### 9-8. Mobile PWA Enhancement
- ✅ Service worker: already caches app shell + static assets (exclude Firebase API calls)
- ✅ PWA manifest: display: standalone, theme/background colors set, icons configured
- ✅ Visual-viewport keyboard fix: verified already done in Phase 7
- ✅ Offline indicator: "오프라인" badge verified in TopBar.jsx

---

---

## 기술 부채 & 미래 작업 (Eng Review 2026-03-22)

- ✅ 시즌패스 코스메틱 보상 실제 지급 — 티어 5/9의 스킨 아이템을 ownedCosmetics 또는 ownedOutfits에 추가하는 로직 구현 (현재 수령 버튼은 있지만 실제로 아무것도 지급 안 됨)
- ✅ 거래소 Admin 패널 Firebase 보안 규칙 강화 — auction_house/admin_audit_log 컬렉션에 Firebase Security Rules 작성 (현재는 클라이언트 비밀번호만 보호)
- ✅ 프레스티지 낚시 중 차단 — 낚시/채굴/채집 진행 중에는 프레스티지 버튼 비활성화 처리
- ✅ 거래소 허브/작물/포션 아이템 지원 — 현재 물고기/광석만 거래 가능

## 보안 & 버그 (적대적 리뷰 2026-03-22)

### CRITICAL
- ✅ AdminPanel 비밀번호 클라이언트 번들 노출 — `VITE_ADMIN_PASSWORD` 제거, Firebase Auth `signInWithEmailAndPassword`로 이전. firestore.rules `server_events` write에 `request.auth != null` 적용
- ✅ 거래소 취소 시 소유권 서버 검증 없음 — `handleCancel`을 `runTransaction`으로 교체, seller 불일치 시 예외 발생

### HIGH
- ✅ 거래소 구매 골드 차감이 트랜잭션 밖에서 실행 — `isBuying` 더블클릭 가드 추가, `PENDING_BUY_KEY` localStorage로 크래시 복구 지원, 트랜잭션 내 만료 검증 추가
- ✅ 거래소 등록 시 Firebase 쓰기 후 인벤토리 제거 — `PENDING_LISTING_KEY` localStorage 플래그로 setDoc 전/후 마킹
- ✅ GameCanvas RAF 이중 스케줄링 — `onVisibilityChange`에 `if (rafId) return` 가드 추가, 비가시 시 cancelAnimationFrame 호출, loop 조기 반환 시 `rafId = undefined`
- ✅ 프레스티지 stateRef 레이스 컨디션 — `stateRef.current`에서 newCount 선계산 후 setGs·Firebase 기록에 동일값 사용
- ✅ 시즌패스 월 키 오프바이원 + 클럭스큐 데이터 손실 — `getMonth() + 1` 수정, `seasonResetDoneRef`로 세션당 1회 실행 보장

### MEDIUM
- ✅ `prestigePending` 복구 플래그 미구현 — 리셋 전 `prestigePending: true` 별도 dispatch 추가, nickname useEffect에서 `prestigePending` 감지 시 복구 완료 처리
- ✅ 시즌패스 티어 4곳에서 중복 계산 — `SeasonPass.jsx`에서 `gs.seasonPassTier` 대신 `Math.min(10, Math.floor(xp / 50))`로 항상 파생
- ✅ 거래소 nanoid 충돌 가능 — `crypto.randomUUID()`로 교체, `nanoid()` 함수 제거
- ✅ 챕터5 이벤트 effect 재발동 — `chapter5PlayedRef`로 onSnapshot 재연결 시 중복 실행 차단

### LOW (INVESTIGATE)
- ✅ 거래소 만료 목록이 서버에서 삭제되지 않음 — `handleBuy` 트랜잭션 내 `expiresAt` 서버 측 검증 추가
- ✅ `checkZoneUnlock`의 `reqAbil` falsy 체크 취약 — `!z.reqAbil || Object.keys(z.reqAbil).length === 0` 명시적 체크로 변경

*마지막 업데이트: 2026-03-22 → 수정 완료 2026-03-22*

---

## Phase 2 — 단기 신규 기능 (UX 개선 및 콘텐츠 확장)

### 2-1. 서버 실시간 랭킹
- ✅ Firebase `gold_records`, `ability_records` — 골드/어빌리티 합산 순위 (ranking.js)
- ✅ Leaderboard.jsx 탭: 💰 보유 골드, ⚡ 어빌리티, 🏆 업적, 🌟 프레스티지
- ✅ 랭킹 업데이트: 60초 디바운스로 saveGoldRecord/saveAbilityRecord 호출 (App.jsx)

### 2-2. 레벨업 / 그레이드업 화면 연출
- ✅ gradeUpCelebration state — doGradeUp 시 setGradeUpCelebration 호출 (Sidebar.jsx)
- ✅ TopBar.jsx에서 gradeup-burst CSS 애니메이션 오버레이 렌더링
- ✅ playLevelUp 사운드 (Web Audio API)

### 2-3. 희귀어 포획 파티클 이펙트
- ✅ 희귀/전설/신화 포획 시 emoji 파티클 gameRef.fishParticles 에 추가 (App.jsx:911)
- ✅ GameCanvas에서 fishParticles 캔버스 렌더링

### 2-4. 7일 연속 접속 특별 미끼 지급
- ✅ streak >= 7 달성 시 전설미끼 1개 자동 지급 (useOfflineReward.js:41)
- ✅ 채팅창 알림 메시지 "7일 연속 접속! +500G + 전설 미끼 1개 지급!"

### 2-5. NPC 개별 퀘스트 라인
- ✅ npcQuestData.js — 민준/수연/미나/철수 각 3단계 퀘스트 체인
- ✅ npcQuestStep 상태 추적, NPC 대화 UI에 퀘스트 진행 표시 (App.jsx:2227)
- ✅ 퀘스트 완료 시 골드/아이템/스킨 보상 지급

### 2-6. 전설어 출몰 알림 이벤트 (30분 한정)
- ✅ 20~40분 간격 자동 랜덤 출몰 이벤트 (useWebSocket.js:231)
- ✅ fishSurgeRef로 낚시 확률 4배 적용, 채팅창 알림
- ✅ Admin 패널에서 수동 발동 — 어종 선택 드롭다운 + `legendarySpawn` 이벤트 버튼 (AdminPanel.jsx)
- ✅ 클라이언트에서 `legendarySpawn` 이벤트 감지 → fishSurgeRef 동기화 (useWebSocket.js)

---

## Phase 3 — 중기 콘텐츠

### 3-1. 주간 낚시대회
- ✅ 매주 자동 집계 (getWeekKey 기준), submitTournamentScore로 점수 제출
- ✅ Leaderboard.jsx 🎣 주간 대회 탭 (Top 20, 크기+희귀도 보너스 점수)
- ✅ Sidebar 내 TournamentPanel — 내 점수, 순위 표시

### 3-2. 희귀어 박제 시스템
- ✅ trophyFish 배열 — 전설/신화 포획 시 자동 수집 (App.jsx:904)
- ✅ Sidebar.jsx 박제실 탭 — trophyFish 목록 전시, 크기/포획일 표시

### 3-3. 캐릭터 코스튬 시스템
- ✅ HATS, FISHING_OUTFITS, ROD_SKINS, SPOT_DECOS (gameData.js)
- ✅ ownedHats, hat, outfit, ownedOutfits, activeRodSkin 상태 관리
- ✅ Sidebar.jsx 코스튬 탭 — 모자/낚시복/낚싯대 스킨 선택 UI
- ✅ GameCanvas 캐릭터 렌더링에 의상 적용

### 3-4. 광산 고대 유적 비밀 구역
- ✅ explorationData.js — '광산 고대 유적' 탐험 구역 (광산 깊이 4층+ 요구, 고대 보석 드롭)
- ✅ App.jsx:1120 — 고대 보석 5% 드롭 로직
- ✅ Sidebar.jsx 탐험 탭에 구역 목록 및 탐험 버튼

### 3-5. 어종 확장 (30종+) + 도감 칭호
- ✅ FISH 배열 40종+ (계절 한정, 보스 전용 포함)
- ✅ titleData.js — '박물학자'(20종), '바다의 주인'(30종) 칭호

---

## Phase 4 — 장기 목표

### 4-1. 직업 트리 시스템
- ✅ jobData.js — JOBS 데이터 (낚시장인, 광산전문가 등), getAvailableJobs()
- ✅ selectedJob 상태, 직업 선택 UI (Sidebar.jsx 어빌리티 탭)
- ✅ 직업별 패시브 보너스 낚시/채굴 루프에 적용 (JOBS[selectedJob].bonus)

### 4-2. 계절별 스토리 이벤트
- ✅ seasonData.js SEASONS 각 항목에 story 배열 (봄/여름/가을/겨울 스토리)
- ✅ 계절 전환 시 shownSeasonStories 체크 후 자동 대사 표시 (App.jsx:2202)

### 4-3. 낚시터 개인 자리 꾸미기
- ✅ SPOT_DECOS (gameData.js) — 파라솔, 이름표, 낚시의자, 미끼통
- ✅ spotDecos 상태, GameCanvas에 데코 렌더링
- ✅ Sidebar.jsx 코스튬 탭에 자리 꾸미기 구매/장착 UI

*마지막 업데이트: 2026-03-22*

---

## Phase 10 — 월드존 시스템 완성

### 10-1. 채굴 접근 수정 (버그 수준)
- ✅ `isInMineZone` 다중 존 지원 — `ZONE_MINE_ZONES` 좌표 추가, 활성 존 기반 영역 반환
- ✅ `getActiveMineEntrance()` 동쪽절벽(tx13,ty10)·북쪽고원(tx13,ty6) 입구 등록
- ✅ GameCanvas 광산 입구 이미 `getActiveMineEntrance()` 사용 — 자동 반영
- ✅ App.jsx `isInMineZone` 이미 동적 함수 사용 — 자동 반영

### 10-2. 월드 맵 오버뷰 UI
- ✅ WorldMap.jsx 컴포넌트 — 3×3 그리드, 마을 중심 4방향 외곽 존, 커넥터 화살표
- ✅ 현재 위치 하이라이트 (색상 테두리 + glow + "현재" 뱃지) + 보너스 요약 표시
- ✅ `M` 키 (useKeyboard) + 데스크탑 단축키 버튼 + 모바일 메뉴 항목
- ✅ 현재 존 상세 설명 카드 (하단), Escape 닫기

### 10-3. 귀환 명령어
- ✅ `!귀환` 채팅 명령어 — 현재 존이 마을이 아닐 때 5초 캐스팅 후 마을 중앙으로 텔레포트
- ✅ 캐스팅 중 이동 시 취소, HUD 카운트다운 표시
- ✅ `setActiveZone('마을')` + `setActiveTiles(ZONE_TILES['마을'])` + player 위치 초기화
- ✅ 모바일: 귀환 버튼 추가 (현재 존이 마을 아닐 때만 표시)

### 10-4. 존 첫 방문 인트로 메시지
- ✅ `DEFAULT_STATE.visitedZones: ['마을']` 추가, loadSave 마이그레이션
- ✅ `handleZoneTransition`에서 미방문 존 진입 시 존 전용 환영 메시지 + 보너스 안내 채팅 출력
- ✅ 각 존 인트로 대사 4종 (서쪽초원/동쪽절벽/북쪽고원/남쪽심해)

### 10-5. 존 해금 조건
- ✅ `ZONE_UNLOCK_REQ` 정의 — 동쪽절벽(채굴 10+), 북쪽고원(탐험 구역 2개 완료), 남쪽심해(스쿠버다이빙세트 보유)
- ✅ GameCanvas 존 전환 시도 시 해금 조건 미달이면 차단 + 안내 메시지
- ✅ WorldMap UI에서 잠금 존은 🔒 아이콘으로 표시, 조건 툴팁

### 10-6. 외곽 존 여행 NPC
- ✅ 서쪽초원 — 행상인 NPC: 상점 열기 + 대화 기능
- ✅ 동쪽절벽 — 노련한 광부 NPC: 광석 감정 + 곡괭이 수리 기능 (200G)
- ✅ 북쪽고원 — 산신령 NPC: 1일 1회 랜덤 버프 (낚시/채굴/판매가 +15%, 30분)
- ✅ 남쪽심해 — 심해 탐험가 NPC: 신화급 물고기 원정 보고 → 보상 3000G/마리
- ✅ 각 여행 NPC를 NpcDialogue.jsx에 추가 (DIALOGUE 항목 + 기능 연결)
- ✅ ZONE_TRAVEL_NPCS in mapData.js, 근접 감지 + Canvas 렌더 + [F] 상호작용

*마지막 업데이트: 2026-03-25*

---

## Phase 11 — 존 심화 & 콘텐츠 밀도

### 11-1. 산신령 mountainBuff 공식 반영 (버그 수정)
- ✅ `mountainBuff` (`fishSpeed`/`mineSpeed`/`sellPrice`) 낚시·채굴·판매 공식에 실제 적용
- ✅ `useWebSocket.js`에 mountainBuff → gameRef 동기화 추가
- ✅ 만료된 버프 로그인 시 자동 클리어

### 11-2. 존별 업적 + 칭호
- ✅ 업적 4종 추가 — 서쪽초원 허브 50개, 동쪽절벽 광석 100개, 북쪽고원 희귀자원 30개, 남쪽심해 전설어 5마리
- ✅ 칭호 2종 추가 — '초원의 바람' (서쪽초원 허브 50), '심해의 지배자' (남쪽심해 전설 5)
- ✅ achStats에 존별 카운터 추가 및 해당 액션에서 집계

### 11-3. Zone NPC 타일 위치 검증 & 보정
- ✅ 각 ZONE_TILES 맵에서 walkable 여부 확인
- ✅ 동쪽절벽 tx=20,ty=12 → WATER(cave lake) → tx=35,ty=12로 수정
- ✅ 남쪽심해 tx=20,ty=12 → WATER → tx=36,ty=16(섬 위)으로 수정

### 11-4. 존별 날씨 오버레이
- ✅ 북쪽고원: 흰 반투명 안개 그라데이션 + 3개 흐르는 안개 밴드 (drift 애니메이션)
- ✅ 남쪽심해: 파란 틴트 + 상단 코스틱 물빛 그라데이션 오버레이
- (페이드인/아웃은 canvas RAF 루프에서 자연스럽게 처리)

### 11-5. 존 숙련도 시스템
- ✅ `zoneMastery: {}` 상태 추가 (DEFAULT_STATE, loadSave 마이그레이션)
- ✅ 활동 시 exp 획득: 서쪽초원 허브→+1, 동쪽절벽/북쪽고원 광석→+1, 남쪽심해 낚시→+1
- ✅ 레벨 1~5 (10/30/60/100/150), 레벨당 +10% 보너스
  - 서쪽초원 Lv보너스: 10%*lv 확률로 허브 +1 추가 획득
  - 동쪽절벽 Lv보너스: 10%*lv 확률로 광석 +1 추가 획득
  - 남쪽심해 Lv보너스: 생선 판매가 ×(1 + lv*0.1)
- ✅ WorldMap 존 카드: Lv뱃지 + 현재 존 상세에 exp바/레벨 표시
- ✅ TopBar 존 HUD 칩: Lv뱃지 표시

*마지막 업데이트: 2026-03-25*
