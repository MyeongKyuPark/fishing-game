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
};
