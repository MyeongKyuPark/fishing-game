// NPC individual quest chains
// condition(gs) returns true when the quest can be completed
// reward: { money?, item?, rodSkin?, costume? }
//   item: { type: 'bait'|'fishInventory'|'oreInventory', key, qty }
//   rodSkin: string (skin name)
//   costume: string (costume name)

export const NPC_QUESTS = {
  민준: [
    {
      title: '낚싯대 강화 입문',
      desc: '낚싯대를 5회 강화하고 돌아오세요.',
      hint: (gs) => `강화 횟수: ${gs.achStats?.enhanceCount ?? 0} / 5`,
      condition: (gs) => (gs.achStats?.enhanceCount ?? 0) >= 5,
      reward: { money: 500 },
      rewardLabel: '500G',
      dialogue: [
        '민준: "낚싯대는 잘 관리해야 큰 물고기를 잡을 수 있죠! 한번 강화해보세요."',
        '민준: "역시! 장인의 손길이 느껴지는군요. 이걸 받으세요!"',
      ],
    },
    {
      title: '장비 업그레이드',
      desc: '중급 낚싯대를 구매하세요.',
      hint: (gs) => gs.rod === '초급낚시대' ? '상점에서 중급 낚싯대를 구매하세요.' : '완료!',
      condition: (gs) => gs.rod !== '초급낚시대',
      reward: { money: 1000 },
      rewardLabel: '1,000G',
      dialogue: [
        '민준: "아직 초급 낚싯대만 쓰시는군요. 중급 낚싯대로 업그레이드하면 훨씬 좋아요!"',
        '민준: "새 낚싯대가 잘 어울리네요! 성과도 기대됩니다."',
      ],
    },
    {
      title: '광석 수집',
      desc: '광석을 합쳐 10개 이상 보유하세요.',
      hint: (gs) => {
        const total = Object.values(gs.oreInventory ?? {}).reduce((s, n) => s + n, 0);
        return `현재 광석: ${total} / 10개`;
      },
      condition: (gs) => Object.values(gs.oreInventory ?? {}).reduce((s, n) => s + n, 0) >= 10,
      reward: { money: 1500, item: { type: 'bait', key: '구리미끼' }, rodSkin: '황금낚싯대 스킨' },
      rewardLabel: '1,500G + 구리 미끼 + 황금낚싯대 스킨',
      dialogue: [
        '민준: "광석은 강화 재료로도 쓰이지만, 저한테 팔면 꽤 괜찮은 가격을 드려요!"',
        '민준: "훌륭해요! 앞으로도 잘 부탁해요. 특별 미끼와 황금낚싯대 스킨도 드릴게요!"',
      ],
    },
  ],

  수연: [
    {
      title: '첫 요리 도전',
      desc: '생선을 요리해 5마리의 요리 횟수를 채우세요.',
      hint: (gs) => `요리 횟수: ${gs.achStats?.cookCount ?? 0} / 5`,
      condition: (gs) => (gs.achStats?.cookCount ?? 0) >= 5,
      reward: { money: 500 },
      rewardLabel: '500G',
      dialogue: [
        '수연: "요리는 연습이 중요해요! 일단 생선 요리부터 시작해봐요."',
        '수연: "손맛이 생기고 있는데요? 특제 소스 레시피도 알려드릴게요!"',
      ],
    },
    {
      title: '특별 요리 마스터',
      desc: '특별 요리를 3개 이상 만드세요.',
      hint: (gs) => `특별 요리: ${gs.achStats?.dishCooked ?? 0} / 3`,
      condition: (gs) => (gs.achStats?.dishCooked ?? 0) >= 3,
      reward: { money: 1500 },
      rewardLabel: '1,500G',
      dialogue: [
        '수연: "이제 기본 요리는 익혔죠? 작물을 조합한 특별 요리에 도전해봐요!"',
        '수연: "이 정도면 저한테 배운 보람이 있네요! 계속 가르쳐 드릴게요."',
      ],
    },
    {
      title: '요리 어빌리티 도전',
      desc: '요리 어빌리티를 15 이상 올리세요.',
      hint: (gs) => `요리 어빌리티: ${(gs.abilities?.요리?.value ?? 0).toFixed(1)} / 15`,
      condition: (gs) => (gs.abilities?.요리?.value ?? 0) >= 15,
      reward: { money: 3000, costume: '요리사 의상' },
      rewardLabel: '3,000G + 요리사 의상',
      dialogue: [
        '수연: "요리 실력이 많이 늘었네요! 이제 고급 레시피에 도전할 때예요."',
        '수연: "완전한 수제자가 됐어요! 요리사 의상도 선물로 드릴게요~"',
      ],
    },
  ],

  미나: [
    {
      title: '여관의 단골',
      desc: '여관을 3번 방문하세요.',
      hint: (gs) => `방문 횟수: ${gs.achStats?.innVisits ?? 0} / 3`,
      condition: (gs) => (gs.achStats?.innVisits ?? 0) >= 3,
      reward: { money: 500 },
      rewardLabel: '500G',
      dialogue: [
        '미나: "자주 와서 쉬어가세요! 피로가 쌓이면 아무것도 안 돼요."',
        '미나: "이제 우리 여관 단골이 됐네요! 소박하지만 선물이에요."',
      ],
    },
    {
      title: '마을 탐방',
      desc: '모든 NPC와 친밀도를 10 이상 쌓으세요.',
      hint: (gs) => {
        const below = Object.values(gs.npcAffinity ?? {}).filter(v => v < 10).length;
        return below === 0 ? '완료!' : `친밀도 10 미달 NPC: ${below}명`;
      },
      condition: (gs) => Object.values(gs.npcAffinity ?? {}).every(v => v >= 10),
      reward: { money: 2000 },
      rewardLabel: '2,000G',
      dialogue: [
        '미나: "마을 사람들과도 친해져봐요! 다들 좋은 분들이랍니다."',
        '미나: "우리 마을 진짜 주민이 됐네요! 앞으로도 잘 부탁해요!"',
      ],
    },
    {
      title: '성실한 생활',
      desc: '7일 연속으로 접속하세요.',
      hint: (gs) => `연속 접속: ${gs.loginStreak ?? 0} / 7일`,
      condition: (gs) => (gs.loginStreak ?? 0) >= 7,
      reward: { money: 3000, item: { type: 'bait', key: '전설미끼', qty: 2 }, costume: '어부의 의상' },
      rewardLabel: '3,000G + 전설 미끼 2개 + 어부의 의상',
      dialogue: [
        '미나: "하루도 빠짐없이 오는 분을 위한 특별 서비스가 있어요!"',
        '미나: "정말 성실한 분이에요! 전설 미끼와 어부의 의상을 드릴게요~"',
      ],
    },
  ],

  철수: [
    {
      title: '광부 입문',
      desc: '광석을 20개 채굴하세요.',
      hint: (gs) => `채굴 횟수: ${gs.achStats?.oreMined ?? 0} / 20`,
      condition: (gs) => (gs.achStats?.oreMined ?? 0) >= 20,
      reward: { money: 500 },
      rewardLabel: '500G',
      dialogue: [
        '철수: "광산은 처음엔 무섭지만 익숙해지면 중독된다니까요! 일단 20개 캐봐요."',
        '철수: "제법인데요? 광부의 자질이 있어요!"',
      ],
    },
    {
      title: '심층 채굴 도전',
      desc: '채굴 어빌리티를 20 이상 올려 광산 3층에 도전하세요.',
      hint: (gs) => `채굴 어빌리티: ${(gs.abilities?.채굴?.value ?? 0).toFixed(1)} / 20`,
      condition: (gs) => (gs.abilities?.채굴?.value ?? 0) >= 20,
      reward: { money: 1500 },
      rewardLabel: '1,500G',
      dialogue: [
        '철수: "3층부터 진짜 광석들이 나와요! 채굴 실력을 올려봐요."',
        '철수: "이제 진짜 광부네요! 3층은 조심해야 해요."',
      ],
    },
    {
      title: '금광석 수집',
      desc: '금광석을 5개 가져오세요.',
      hint: (gs) => `금광석: ${gs.oreInventory?.금광석 ?? 0} / 5개`,
      condition: (gs) => (gs.oreInventory?.금광석 ?? 0) >= 5,
      reward: { money: 3000, rodSkin: '광부낚싯대 스킨' },
      rewardLabel: '3,000G + 광부낚싯대 스킨',
      dialogue: [
        '철수: "금광석 5개만 구해주면 뭔가 보여드릴 게 있어요!"',
        '철수: "이야, 역시! 채굴사의 자격이 충분해요. 특제 광부낚싯대 스킨도 드릴게요!"',
      ],
    },
  ],

  은행원: [
    {
      title: '첫 예금',
      desc: '은행에 1,000G 이상 예금하세요.',
      hint: (gs) => `예금 잔액: ${(gs.bankDeposit ?? 0).toLocaleString()}G / 1,000G`,
      condition: (gs) => (gs.bankDeposit ?? 0) >= 1000,
      reward: { money: 500 },
      rewardLabel: '500G',
      dialogue: [
        '은행원: "저축은 미래를 위한 투자예요! 1,000G부터 시작해봐요."',
        '은행원: "첫 예금 축하드려요! 이자도 꼬박꼬박 드릴게요."',
      ],
    },
    {
      title: '자산가의 길',
      desc: '누적 예금액을 10,000G 이상으로 만드세요.',
      hint: (gs) => `누적 예금: ${(gs.achStats?.totalDeposited ?? 0).toLocaleString()}G / 10,000G`,
      condition: (gs) => (gs.achStats?.totalDeposited ?? 0) >= 10000,
      reward: { money: 2000 },
      rewardLabel: '2,000G',
      dialogue: [
        '은행원: "꾸준한 저축이 중요해요. 누적 1만G을 목표로 해봐요!"',
        '은행원: "정말 훌륭한 자산관리예요! 우대 서비스를 드릴게요."',
      ],
    },
    {
      title: '신뢰의 VIP',
      desc: '은행원과의 친밀도를 50 이상 달성하세요.',
      hint: (gs) => `은행원 친밀도: ${gs.npcAffinity?.은행원 ?? 0} / 50`,
      condition: (gs) => (gs.npcAffinity?.은행원 ?? 0) >= 50,
      reward: { money: 5000, costume: 'VIP 의상' },
      rewardLabel: '5,000G + VIP 의상',
      dialogue: [
        '은행원: "자주 와주시는 분들이 VIP가 되는 법이죠!"',
        '은행원: "이제 VIP 고객이 됐어요! VIP 의상도 선물로 드릴게요."',
      ],
    },
  ],

  // ── Phase 16-5: 외곽 NPC S2 의뢰 체인 ────────────────────────────────────

  행상인: [
    {
      title: '초원 약초꾼',
      desc: '허브를 15개 채집하세요.',
      hint: (gs) => `허브 채집: ${gs.achStats?.herbGathered ?? 0} / 15`,
      condition: (gs) => (gs.achStats?.herbGathered ?? 0) >= 15,
      reward: { money: 1500 },
      rewardLabel: '1,500G',
      dialogue: [
        '행상인: "이 초원엔 좋은 허브가 정말 많죠! 한번 수집해봐요."',
        '행상인: "와, 이렇게 많이 채집하셨어요? 초원의 자연을 잘 아시는군요!"',
      ],
    },
    {
      title: '초원의 오랜 친구',
      desc: '행상인과의 친밀도를 20 이상 높이세요.',
      hint: (gs) => `행상인 친밀도: ${Math.floor(gs.npcAffinity?.행상인 ?? 0)} / 20`,
      condition: (gs) => (gs.npcAffinity?.행상인 ?? 0) >= 20,
      reward: { money: 2500 },
      rewardLabel: '2,500G',
      dialogue: [
        '행상인: "자주 들러주는 분한텐 특별한 게 있죠! 친해지면 좋은 거 알려드릴게요."',
        '행상인: "이제 단골 손님이 됐군요! 초원을 돌 때마다 꼭 들릴게요~"',
      ],
    },
  ],

  노련한광부: [
    {
      title: '광석 감정 수업',
      desc: '광석 감정을 3회 받으세요.',
      hint: (gs) => `광석 감정 횟수: ${gs.achStats?.oreAppraiseCount ?? 0} / 3`,
      condition: (gs) => (gs.achStats?.oreAppraiseCount ?? 0) >= 3,
      reward: { money: 2000 },
      rewardLabel: '2,000G',
      dialogue: [
        '노련한 광부: "광석 보는 눈을 키우려면 직접 봐야 해. 내가 몇 번 봐줄게."',
        '노련한 광부: "이제 괜찮은 광석 눈이 생겼는데! 도움이 됐으면 좋겠군."',
      ],
    },
    {
      title: '심층 탐험가',
      desc: '광산 4층 이상에 도달하세요.',
      hint: (gs) => `현재 광산 깊이: ${gs.mineDepth ?? 1}층 / 4층`,
      condition: (gs) => (gs.mineDepth ?? 1) >= 4,
      reward: { money: 3500, item: { type: 'oreInventory', key: '빙정광석', qty: 2 } },
      rewardLabel: '3,500G + 빙정광석 2개',
      dialogue: [
        '노련한 광부: "4층... 아무나 못 가는 곳이지. 실력이 있어야 해."',
        '노련한 광부: "대단해! 4층까지 간 사람 중에 젤 젊은 편이야. 특별 선물 줄게."',
      ],
    },
  ],

  산신령: [
    {
      title: '산기운의 수혜자',
      desc: '산신령의 기운을 5회 받으세요.',
      hint: (gs) => `산기운 획득 횟수: ${gs.achStats?.mountainBuffCount ?? 0} / 5`,
      condition: (gs) => (gs.achStats?.mountainBuffCount ?? 0) >= 5,
      reward: { money: 2500 },
      rewardLabel: '2,500G',
      dialogue: [
        '산신령: "산의 기운은 꾸준히 받아야 효험이 있느니라..."',
        '산신령: "산과 하나가 되어가는구나. 이 고원의 진기를 나누어 주겠노라."',
      ],
    },
    {
      title: '대지의 손길',
      desc: '허브를 총 40개 채집하세요.',
      hint: (gs) => `총 허브 채집: ${gs.achStats?.herbGathered ?? 0} / 40`,
      condition: (gs) => (gs.achStats?.herbGathered ?? 0) >= 40,
      reward: { money: 4000 },
      rewardLabel: '4,000G',
      dialogue: [
        '산신령: "대지의 허브를 모으는 자... 이 산의 정기를 느끼는가?"',
        '산신령: "대지의 마음을 이해하는 자로다. 산의 축복이 함께하리라."',
      ],
    },
  ],

  심해탐험가: [
    {
      title: '신화급 탐험대',
      desc: '신화급 물고기를 3마리 이상 포획하세요.',
      hint: (gs) => `신화급 포획: ${gs.achStats?.mythicCount ?? 0} / 3`,
      condition: (gs) => (gs.achStats?.mythicCount ?? 0) >= 3,
      reward: { money: 4000 },
      rewardLabel: '4,000G',
      dialogue: [
        '심해 탐험가: "심해는 거짓말 안 해요. 신화급 어종이 숨어있답니다!"',
        '심해 탐험가: "이야... 신화급 3마리라니! 진정한 심해 탐험가예요!"',
      ],
    },
    {
      title: '리바이어던 목격자',
      desc: '타이드헤이븐 리바이어던을 포획하세요.',
      hint: (gs) => `리바이어던 포획: ${(gs.caughtSpecies ?? []).includes('타이드헤이븐리바이어던') ? '완료' : '미완료'}`,
      condition: (gs) => (gs.caughtSpecies ?? []).includes('타이드헤이븐리바이어던'),
      reward: { money: 15000, item: { type: 'bait', key: '전설미끼', qty: 3 } },
      rewardLabel: '15,000G + 전설미끼 3개',
      dialogue: [
        '심해 탐험가: "리바이어던... 10년을 찾아 헤맸어요. 같이 찾아볼래요?"',
        '심해 탐험가: "정말로?! 리바이어던을 잡으셨다고?! 역사에 남을 업적이에요!!"',
      ],
    },
  ],

  어시장상인: [
    {
      title: '항구 단골 납품자',
      desc: '항구 어시장에서 총 10,000G 이상 판매하세요.',
      hint: (gs) => `항구 판매 누적: ${(gs.harborFishSellTotal ?? 0).toLocaleString()}G / 10,000G`,
      condition: (gs) => (gs.harborFishSellTotal ?? 0) >= 10000,
      reward: { money: 2500 },
      rewardLabel: '2,500G',
      dialogue: [
        '어시장 상인: "항구 물건은 역시 항구에서 팔아야죠! 많이 가져와요~"',
        '어시장 상인: "이제 항구 단골이 됐어요! 항상 제일 좋은 가격 드릴게요."',
      ],
    },
    {
      title: '항구 최고 납품자',
      desc: '항구 어시장에서 총 50,000G 이상 판매하세요.',
      hint: (gs) => `항구 판매 누적: ${(gs.harborFishSellTotal ?? 0).toLocaleString()}G / 50,000G`,
      condition: (gs) => (gs.harborFishSellTotal ?? 0) >= 50000,
      reward: { money: 8000 },
      rewardLabel: '8,000G',
      dialogue: [
        '어시장 상인: "그 정도 판매를 항구에서만 해준 사람은 처음이에요!"',
        '어시장 상인: "항구 역사에 남을 납품 기록이에요! 최고 파트너로 인정합니다!"',
      ],
    },
  ],

  선장: [
    {
      title: '항해 이야기 청취자',
      desc: '선장의 항해 이야기를 3회 이상 들으세요.',
      hint: (gs) => `항해 이야기 청취: ${gs.achStats?.captainChatCount ?? 0} / 3`,
      condition: (gs) => (gs.achStats?.captainChatCount ?? 0) >= 3,
      reward: { money: 2500 },
      rewardLabel: '2,500G',
      dialogue: [
        '선장: "내 이야기가 지루하지 않다면 더 들어봐. 아직 할 말이 많거든!"',
        '선장: "이야기를 귀 기울여 듣는 사람이 드물어. 진심으로 고마워!"',
      ],
    },
    {
      title: '바다의 전설 어부',
      desc: '물고기를 총 500마리 이상 낚으세요.',
      hint: (gs) => `물고기 포획: ${gs.fishCaught ?? 0} / 500마리`,
      condition: (gs) => (gs.fishCaught ?? 0) >= 500,
      reward: { money: 6000, item: { type: 'bait', key: '구리미끼', qty: 5 } },
      rewardLabel: '6,000G + 구리미끼 5개',
      dialogue: [
        '선장: "500마리... 그건 진짜 어부만 가능한 기록이야!"',
        '선장: "이 항구에서 500마리라니! 바다가 당신을 인정했군. 미끼는 내가 쏠게!"',
      ],
    },
  ],

  유물학자: [
    {
      title: '고대 협력자',
      desc: '유물학자에게 고대광석을 5개 이상 감정받으세요.',
      hint: (gs) => `고대광석 감정 총량: ${gs.achStats?.ancientOreAppraised ?? 0} / 5`,
      condition: (gs) => (gs.achStats?.ancientOreAppraised ?? 0) >= 5,
      reward: { money: 3000 },
      rewardLabel: '3,000G',
      dialogue: [
        '유물학자: "고대광석은 일반인이 함부로 다룰 수 없소. 내게 맡겨봐요!"',
        '유물학자: "이 정도면 고대 문명 연구 협력자라고 불러도 되겠군요!"',
      ],
    },
    {
      title: '신전의 비밀 해독자',
      desc: '신전수호어를 포획하세요.',
      hint: (gs) => `신전수호어 포획: ${(gs.caughtSpecies ?? []).includes('신전수호어') ? '완료' : '미완료'}`,
      condition: (gs) => (gs.caughtSpecies ?? []).includes('신전수호어'),
      reward: { money: 12000 },
      rewardLabel: '12,000G',
      dialogue: [
        '유물학자: "신전수호어는 신전의 비밀을 지키는 어종이오. 잡을 수 있겠소?"',
        '유물학자: "놀랍소! 신전수호어라니... 이 사진은 역사 기록에 올려야겠소!"',
      ],
    },
  ],

  설인: [
    {
      title: '설산의 방문자',
      desc: '설인에게서 따뜻한 음료를 5회 받으세요.',
      hint: (gs) => `따뜻한 음료 수령: ${gs.achStats?.warmDrinkCount ?? 0} / 5`,
      condition: (gs) => (gs.achStats?.warmDrinkCount ?? 0) >= 5,
      reward: { money: 2000 },
      rewardLabel: '2,000G',
      dialogue: [
        '설인: "...자주 오면 더 따뜻하게 대접할게. 추위 좀 견뎌봐."',
        '설인: "...이제 진짜 설산 사람 같아. 우리 둘이 친구야."',
      ],
    },
    {
      title: '설산용 목격자',
      desc: '설산용을 포획하세요.',
      hint: (gs) => `설산용 포획: ${(gs.caughtSpecies ?? []).includes('설산용') ? '완료' : '미완료'}`,
      condition: (gs) => (gs.caughtSpecies ?? []).includes('설산용'),
      reward: { money: 10000 },
      rewardLabel: '10,000G',
      dialogue: [
        '설인: "...얼음 아래 용이 살아. 옛날 이야기라고 했는데... 진짜야."',
        '설인: "...설산용이라니. 진짜야. 이 산 최강. 너도 최강."',
      ],
    },
  ],
};
