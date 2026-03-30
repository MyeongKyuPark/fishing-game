import { FISH, RODS, ORES, BOOTS, BAIT, COOKWARE, HERBS, MARINE_GEAR, PICKAXES, GATHER_TOOLS,
  SMELT_RECIPES, JEWELRY_RECIPES, POTION_RECIPES, DISH_RECIPES, SEEDS, MAX_FARM_PLOTS,
  FARM_EXPANSION_PRICE, FARM_EXPANSION_SLOTS, FARM_MAX_EXPANSIONS,
  getAbilityFishTable, rodEnhanceCost, rodEnhanceMatsNeeded, rodEnhanceSuccessRate, rodEnhanceEffect,
  pickaxeEnhanceCost, pickaxeEnhanceMatsNeeded, pickaxeEnhanceSuccessRate, pickaxeEnhanceEffect,
  ZONE_FISH, FISHING_ZONES, HATS, FISHING_OUTFITS, TOPS, BOTTOMS, BELTS, ROD_SKINS, SPOT_DECOS, FURNITURE,
  BAIT_RECIPES, DELIVERY_ORDER_POOL } from '../gameData';
import { DEFAULT_ABILITIES, ABILITY_DEFS, doGradeUp, gradeRareBonus,
  SELL_ABILITY_PER_100G, ENHANCE_ABILITY_GAIN } from '../abilityData';
import { getTitle, TITLES } from '../titleData';
import { PETS, EVOLVED_PETS, EVOLVE_REQUIREMENTS, PET_RARITY_COLOR, PET_EXP_THRESHOLDS, PET_MAX_LEVEL, PET_LEVEL_MULT } from '../petData';
import { JOB_CLASSES } from '../jobData';
import { NPCS, getAffinityLevel, getShopDiscount } from '../npcData';
import { EXPLORE_ZONES, checkZoneUnlock } from '../explorationData';
import { ACHIEVEMENTS } from '../achievementData';
import { SEASONS, getCurrentSeason } from '../seasonData';
import { JOBS, getAvailableJobs } from '../jobData';
import { NPC_QUESTS } from '../npcQuestData';
import { createGuild, joinGuild, leaveGuild, sendGuildChat,
  GUILD_LEVEL_XP, GUILD_WAREHOUSE_SLOTS, GUILD_LEVEL_BONUSES,
  contributeGuildXP, fetchGuildWarehouse, addToGuildWarehouse, removeFromGuildWarehouse } from '../guildData';
import { listItem, buyItem, cancelListing } from '../marketData';
import Leaderboard from '../Leaderboard';
import { rarityColor, SKIN_PRESETS } from '../hooks/useGameState';
import CottagePanel from './CottagePanel';
import { sendPlayerMail, fetchMailbox, clearMailbox, subscribeSeasonRankings, getSeasonKey } from '../ranking';

const TOURNAMENT_PRIZES = [2000, 1000, 500]; // 1위/2위/3위 주간 보상 골드
import { useState } from 'react';
import { getSettings, setSfxEnabled, setCanvasQuality, setColorBlindMode, subscribeSettings } from '../settingsManager';
import { setBgmVolume, getBgmVolume } from '../bgm';

// eslint-disable-next-line no-unused-vars
export default function Sidebar(props) {
  const {
    gs, setGs, nickname,
    addMsg, handleCommand, grantAbility, advanceQuest, gainNpcAffinity, checkAndGrantAchievements,
    sellAll, sellOne, equipBait, equipRod, equipBoots, equipCookware, equipMarineGear, equipPickaxe, equipGatherTool, totalFishVal,
    showInv, setShowInv,
    showShop, setShowShop, sellQty, setSellQty,
    showStats, setShowStats, statsTab, setStatsTab,
    showRank, setShowRank,
    showQuest, setShowQuest,
    showDex, setShowDex,
    showBank, setShowBank, bankInput, setBankInput,
    showAppearance, setShowAppearance, appearanceDraft, setAppearanceDraft,
    inspectPlayer, setInspectPlayer,
    showTournament, setShowTournament, tournamentRanking,
    serverQuest, serverBoss, serverAnnouncements,
    showGuild, setShowGuild, guildTab, setGuildTab,
    myGuildId, setMyGuildId,
    guildInfo, guildMembers, guildList, guildChat, guildQuest, guildCompetition,
    guildChatInput, setGuildChatInput, guildCreateName, setGuildCreateName,
    guildJoinId, setGuildJoinId,
    showMarket, setShowMarket, marketListings, myListings, marketTab, setMarketTab,
    marketListForm, setMarketListForm,
    partyMessages, partyId,
    checkNpcQuest,
    resistanceGame, setResistanceGame,
    miningMinigame, setMiningMinigame,
    showSettings, setShowSettings,
    showCottage, setShowCottage,
    showMailbox, setShowMailbox,
    showSeasonLeague, setShowSeasonLeague,
    gameRef, playLevelUp, otherPlayersRef,
    onResistanceSuccess, onResistanceFail,
    setGradeUpCelebration,
    stateRef, playSellSound,
    buyRod, buyBoots, buyBait,
    buyCookware, buyMarineGear,
    buyPickaxe, buyGatherTool,
    setGuildInfo, setGuildMembers, setGuildChat, setGuildQuest,
    handlePetEvolve, handleChooseJobClass,
  } = props;

  const myTitle = getTitle(gs);
  const currentSeason = getCurrentSeason();

  const [invFilter, setInvFilter] = useState('전체');
  const [equipPicker, setEquipPicker] = useState(null);
  const [shopSection, setShopSection] = useState('낚시대');
  const [buyToast, setBuyToast] = useState(null);
  const [settingsState, setSettingsState] = useState(() => getSettings());
  const [bgmVol, setBgmVolState] = useState(() => getBgmVolume());
  const [dexTab, setDexTab] = useState('어종');
  const [evolvingPet, setEvolvingPet] = useState(null);

  const showBuyToast = (msg) => {
    setBuyToast(msg);
    setTimeout(() => setBuyToast(null), 1000);
  };

  return (
    <>
      {/* Inventory modal */}
      {showInv && (() => {
        const RARITY_ORDER = { 신화: 5, 전설: 4, 희귀: 3, 보통: 2, 흔함: 1 };
        const groups = {};
        for (const f of gs.fishInventory) {
          if (!groups[f.name]) groups[f.name] = [];
          groups[f.name].push(f);
        }
        const sortedGroups = Object.entries(groups).sort(([a], [b]) =>
          (RARITY_ORDER[FISH[b]?.rarity] ?? 0) - (RARITY_ORDER[FISH[a]?.rarity] ?? 0)
        );
        const sellSpecies = (name) => {
          const total = groups[name].reduce((s, f) => s + f.price, 0);
          setGs(prev => {
            const prevStats = prev.achStats ?? {};
            const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + total, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + total) };
            setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
            return { ...prev, money: prev.money + total, fishInventory: prev.fishInventory.filter(f => f.name !== name), achStats: updatedStats };
          });
          addMsg(`💰 ${name} ${groups[name].length}마리 판매 +${total}G`, 'catch');
          grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
          advanceQuest('sell', total);
          gainNpcAffinity('상인', Math.max(1, Math.floor(total / 150)));
        };
        const INV_FILTERS = ['전체', '물고기', '광석', '허브', '작물', '기타'];
        const showFish  = invFilter === '전체' || invFilter === '물고기';
        const showOre   = invFilter === '전체' || invFilter === '광석';
        const showHerb  = invFilter === '전체' || invFilter === '허브';
        const showCrop  = invFilter === '전체' || invFilter === '작물';
        const showOther = invFilter === '전체' || invFilter === '기타';
        const cropEntries = Object.entries(gs.cropInventory ?? {}).filter(([, n]) => n > 0);
        return (
          <div className="overlay" onClick={() => setShowInv(false)}>
            <div className="panel" onClick={e => e.stopPropagation()}>
              <div className="panel-head">
                <span>🎒 인벤토리</span>
                <button tabIndex={-1} onClick={() => setShowInv(false)}>✕</button>
              </div>

              {/* Category filter tabs */}
              <div style={{ display: 'flex', gap: 4, padding: '6px 10px 2px', flexWrap: 'wrap' }}>
                {INV_FILTERS.map(f => (
                  <button key={f} tabIndex={-1}
                    onClick={() => setInvFilter(f)}
                    style={{
                      padding: '3px 8px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: invFilter === f ? 'rgba(100,180,255,0.35)' : 'rgba(255,255,255,0.08)',
                      color: invFilter === f ? '#7df' : 'rgba(255,255,255,0.6)',
                      fontWeight: invFilter === f ? 700 : 400,
                    }}
                  >{f}</button>
                ))}
              </div>

              {showFish && (
                <div className="section">
                  <div className="section-title">물고기 ({gs.fishInventory.length}마리)</div>
                  {gs.fishInventory.length === 0
                    ? <div className="empty">물고기가 없습니다.</div>
                    : <>
                        <button tabIndex={-1} className="sell-all-btn" onClick={sellAll}>
                          전체 판매 ({totalFishVal}G)
                        </button>
                        <div className="fish-list">
                          {sortedGroups.map(([species, fishes]) => {
                            const fd = FISH[species];
                            const rc = rarityColor(fd?.rarity);
                            const speciesVal = fishes.reduce((s, f) => s + f.price, 0);
                            const sorted = [...fishes].sort((a, b) => b.size - a.size);
                            return (
                              <div key={species} className="species-group">
                                <div className="species-header">
                                  <span className="species-rarity" style={{ color: rc }}>[{fd?.rarity}]</span>
                                  <span className="species-name" style={{ color: rc }}>{species}</span>
                                  <span className="species-count">{fishes.length}마리</span>
                                  <span className="species-val">{speciesVal}G</span>
                                  <button tabIndex={-1} className="sell-btn" onClick={() => sellSpecies(species)}>전체판매</button>
                                  <button tabIndex={-1} className="sell-btn" style={{ color: '#88ddff', borderColor: 'rgba(100,200,255,0.3)' }}
                                    onClick={() => {
                                      const ids = new Set(fishes.map(f => f.id));
                                      setGs(prev => ({ ...prev, fishInventory: prev.fishInventory.filter(f => !ids.has(f.id)) }));
                                      addMsg(`🌊 ${species} ${fishes.length}마리 방류! 생태계 회복에 기여했습니다.`, 'catch');
                                    }}>방류</button>
                                </div>
                                <div className="species-fish-list">
                                  {sorted.map(f => {
                                    const recSize = gs.fishRecords?.[species]?.size ?? 0;
                                    const isRecord = f.size >= recSize && recSize > 0;
                                    return (
                                    <div key={f.id} className="fish-row fish-row-compact">
                                      <span className="grow">{f.size.toFixed(1)}cm{f.cooked ? ' 🍳' : ''}{isRecord ? ' 🏆' : ''}</span>
                                      <span className="gold">{f.price}G</span>
                                      <button tabIndex={-1} className="sell-btn" onClick={() => sellOne(f.id)}>판매</button>
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                  }
                </div>
              )}

              {showOre && (
                <div className="section">
                  <div className="section-title">광물</div>
                  {Object.entries(gs.oreInventory).filter(([, n]) => n > 0).length === 0
                    ? <div className="empty">광물 없음 (광산에서 채굴)</div>
                    : Object.entries(gs.oreInventory).filter(([, n]) => n > 0).map(([ore, cnt]) => (
                      <div key={ore} className="ore-row">
                        <span className="grow">{ore}</span>
                        <span className="dim">{cnt}개</span>
                        <span className="gold">{(ORES[ore]?.price ?? 0) * cnt}G 상당</span>
                      </div>
                    ))
                  }
                </div>
              )}

              {showHerb && (
                <div className="section">
                  <div className="section-title">허브</div>
                  {Object.keys(gs.herbInventory ?? {}).filter(k => (gs.herbInventory[k] ?? 0) > 0).length === 0
                    ? <div className="empty">허브 없음 (숲에서 채집)</div>
                    : Object.entries(gs.herbInventory ?? {}).filter(([, n]) => n > 0).map(([herb, cnt]) => (
                      <div key={herb} className="ore-row">
                        <span className="grow" style={{ color: HERBS[herb]?.color ?? '#8c4' }}>🌿 {herb}</span>
                        <span className="dim">{cnt}개</span>
                        <span className="gold">{(HERBS[herb]?.price ?? 0) * cnt}G 상당</span>
                      </div>
                    ))
                  }
                </div>
              )}

              {showCrop && (
                <div className="section">
                  <div className="section-title">작물</div>
                  {cropEntries.length === 0
                    ? <div className="empty">작물 없음 (농장에서 수확)</div>
                    : cropEntries.map(([itemName, count]) => {
                      const seed = Object.values(SEEDS).find(s => s.yield?.item === itemName);
                      return (
                        <div key={itemName} className="ore-row">
                          <span className="grow">🌾 {itemName}</span>
                          <span className="dim">{count}개</span>
                          <span className="gold">{(seed?.yield?.sellPrice ?? 0) * count}G 상당</span>
                        </div>
                      );
                    })
                  }
                </div>
              )}

              {showOther && (
                <div className="section">
                  <div className="section-title">기타 (미끼)</div>
                  {Object.entries(BAIT).map(([key, bait]) => {
                    const owned = bait.type === 'permanent' ? (gs.ownedBait ?? []).includes(key) : ((gs.baitInventory ?? {})[key] ?? 0) > 0;
                    if (!owned) return null;
                    const equipped = gs.equippedBait === key;
                    return (
                      <div key={key} className="fish-row">
                        <span style={{ color: bait.color }}>🪝 {bait.name}</span>
                        {bait.type === 'once' && <span className="dim">{(gs.baitInventory ?? {})[key] ?? 0}개</span>}
                        <span className="grow" />
                        <button tabIndex={-1} className={equipped ? 'btn-eq' : 'sell-btn'} onClick={() => equipBait(key)}>
                          {equipped ? '장착중' : '장착'}
                        </button>
                      </div>
                    );
                  })}
                  {!Object.values(BAIT).some((b, i) => {
                    const key = Object.keys(BAIT)[i];
                    return b.type === 'permanent' ? (gs.ownedBait ?? []).includes(key) : ((gs.baitInventory ?? {})[key] ?? 0) > 0;
                  }) && <div className="empty">미끼 없음 (상점에서 구매)</div>}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Status modal (장비 + 어빌리티 tabs) */}
      {showStats && (
        <div className="overlay" onClick={() => setShowStats(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>📊 상태창</span>
              <button tabIndex={-1} onClick={() => setShowStats(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div className="stats-tabs">
              {['장비', '어빌리티', '제련/제작', '전설 제작', '업적', '펫', '관계도', '탐험', '농장', '박제실'].map(tab => (
                <button key={tab} tabIndex={-1}
                  className={`stats-tab ${statsTab === tab ? 'stats-tab-active' : ''}`}
                  onClick={() => setStatsTab(tab)}>{tab}</button>
              ))}
            </div>

            {/* ── 장비 tab ── */}
            {statsTab === '장비' && (() => {
              const rodData   = RODS[gs.rod];
              const bootData  = BOOTS[gs.boots];
              const baitData  = gs.equippedBait ? (BAIT[gs.equippedBait] ?? BAIT_RECIPES[gs.equippedBait]) : null;
              const cwData    = gs.cookware ? COOKWARE[gs.cookware] : null;
              const enhLv     = gs.rodEnhance?.[gs.rod] ?? 0;
              // Compute overall 도감 completion %
              const dexFish   = (gs.caughtSpecies ?? []).length;
              const dexHerb   = Object.keys(HERBS).filter(h => (gs.herbLog ?? {})[h] > 0).length;
              const dexOre    = Object.keys(ORES).filter(o => (gs.oreLog ?? {})[o] > 0).length;
              const dexDish   = Object.keys(DISH_RECIPES).filter(d => (gs.dishLog ?? {})[d] > 0).length;
              const dexSmelt  = Object.keys(SMELT_RECIPES).filter(k => (gs.smeltLog ?? {})[k] > 0).length;
              const dexJewel  = Object.keys(JEWELRY_RECIPES).filter(k => (gs.jewelLog ?? {})[k] > 0).length;
              const dexPotion = Object.keys(POTION_RECIPES).filter(k => (gs.potionLog ?? {})[k] > 0).length;
              const dexCrop   = Object.keys(SEEDS).filter(s => (gs.cropLog ?? {})[SEEDS[s].yield.item] > 0).length;
              const dexTotal  = Object.keys(FISH).length + Object.keys(HERBS).length + Object.keys(ORES).length + Object.keys(DISH_RECIPES).length + Object.keys(SMELT_RECIPES).length + Object.keys(JEWELRY_RECIPES).length + Object.keys(POTION_RECIPES).length + Object.keys(SEEDS).length;
              const dexDone   = dexFish + dexHerb + dexOre + dexDish + dexSmelt + dexJewel + dexPotion + dexCrop;
              const dexPct    = dexTotal > 0 ? Math.round(dexDone / dexTotal * 100) : 0;

              // Build picker configs for each equippable slot
              const pickerConfigs = {
                rod: {
                  label: '낚싯대',
                  items: (gs.ownedRods ?? [gs.rod]).map(key => ({
                    key,
                    name: RODS[key]?.name ?? key,
                    color: RODS[key]?.color,
                    sub: (gs.rodEnhance?.[key] ?? 0) > 0 ? `+${gs.rodEnhance[key]} 강화` : (RODS[key]?.desc ?? null),
                    equipped: gs.rod === key,
                  })),
                  onEquip: (key) => { equipRod(key); setEquipPicker(null); },
                  canUnequip: false,
                },
                bait: {
                  label: '미끼',
                  items: [
                    ...(gs.ownedBait ?? []).map(key => ({
                      key, name: (BAIT[key] ?? BAIT_RECIPES[key])?.name ?? key,
                      color: (BAIT[key] ?? BAIT_RECIPES[key])?.color,
                      sub: (BAIT[key] ?? BAIT_RECIPES[key])?.desc ?? null,
                      equipped: gs.equippedBait === key,
                    })),
                    ...Object.entries(gs.baitInventory ?? {})
                      .filter(([k, n]) => n > 0 && !(gs.ownedBait ?? []).includes(k))
                      .map(([key, count]) => ({
                        key, name: (BAIT[key] ?? BAIT_RECIPES[key])?.name ?? key,
                        color: (BAIT[key] ?? BAIT_RECIPES[key])?.color,
                        sub: `×${count}`,
                        equipped: gs.equippedBait === key,
                      })),
                  ],
                  onEquip: (key) => { equipBait(key); setEquipPicker(null); },
                  canUnequip: true,
                  onUnequip: () => { setGs(prev => ({ ...prev, equippedBait: null })); setEquipPicker(null); addMsg('🪝 미끼 해제'); },
                },
                boots: {
                  label: '신발',
                  items: (gs.ownedBoots ?? ['기본신발']).map(key => ({
                    key, name: BOOTS[key]?.name ?? key,
                    color: BOOTS[key]?.color,
                    sub: BOOTS[key]?.speedBonus > 0 ? `+${BOOTS[key].speedBonus} 속도` : (BOOTS[key]?.desc ?? null),
                    equipped: gs.boots === key,
                  })),
                  onEquip: (key) => { equipBoots(key); setEquipPicker(null); },
                  canUnequip: false,
                },
                cookware: {
                  label: '요리도구',
                  items: (gs.ownedCookware ?? []).map(key => ({
                    key, name: COOKWARE[key]?.name ?? key,
                    color: COOKWARE[key]?.color,
                    sub: COOKWARE[key]?.mult ? `×${COOKWARE[key].mult} 요리배율` : null,
                    equipped: gs.cookware === key,
                  })),
                  onEquip: (key) => { equipCookware(key); setEquipPicker(null); },
                  canUnequip: false,
                },
                hat: {
                  label: '모자',
                  items: (gs.ownedHats ?? []).map(key => ({
                    key, name: HATS[key]?.name ?? key,
                    color: HATS[key]?.color,
                    sub: HATS[key]?.desc ?? null,
                    equipped: gs.hat === key,
                  })),
                  onEquip: (key) => { setGs(prev => ({ ...prev, hat: key })); setEquipPicker(null); addMsg(`🎩 ${HATS[key]?.name} 장착`); },
                  canUnequip: true,
                  onUnequip: () => { setGs(prev => ({ ...prev, hat: null })); setEquipPicker(null); addMsg('🎩 모자 해제'); },
                },
                outfit: {
                  label: '의상',
                  items: (gs.ownedOutfits ?? ['기본낚시복']).map(key => ({
                    key, name: FISHING_OUTFITS[key]?.name ?? key,
                    color: FISHING_OUTFITS[key]?.color,
                    sub: FISHING_OUTFITS[key]?.desc ?? null,
                    equipped: gs.outfit === key,
                  })),
                  onEquip: (key) => { setGs(prev => ({ ...prev, outfit: key })); setEquipPicker(null); addMsg(`🧥 ${FISHING_OUTFITS[key]?.name ?? key} 착용`); },
                  canUnequip: false,
                },
                rodSkin: {
                  label: '낚싯대 스킨',
                  items: (gs.ownedRodSkins ?? ['기본스킨']).map(key => ({
                    key, name: ROD_SKINS[key]?.name ?? key,
                    color: ROD_SKINS[key]?.color,
                    sub: null,
                    equipped: gs.activeRodSkin === key,
                  })),
                  onEquip: (key) => { setGs(prev => ({ ...prev, activeRodSkin: key })); setEquipPicker(null); addMsg(`🎣 ${ROD_SKINS[key]?.name ?? key} 스킨 적용`); },
                  canUnequip: false,
                },
                ring: {
                  label: '반지',
                  items: [...new Map((gs.jewelryInventory ?? []).filter(j => JEWELRY_RECIPES[j.name]?.slot === 'ring').map(j => [j.name, j])).values()].map(j => ({
                    key: j.name, name: j.name,
                    color: JEWELRY_RECIPES[j.name]?.color,
                    sub: JEWELRY_RECIPES[j.name]?.desc ?? null,
                    equipped: gs.equippedJewelry?.ring === j.name,
                  })),
                  onEquip: (key) => { setGs(prev => ({ ...prev, equippedJewelry: { ...(prev.equippedJewelry ?? {}), ring: key } })); setEquipPicker(null); addMsg(`💍 ${key} 장착`); },
                  canUnequip: true,
                  onUnequip: () => { setGs(prev => ({ ...prev, equippedJewelry: { ...(prev.equippedJewelry ?? {}), ring: null } })); setEquipPicker(null); addMsg('💍 반지 해제'); },
                },
                necklace: {
                  label: '목걸이',
                  items: [...new Map((gs.jewelryInventory ?? []).filter(j => JEWELRY_RECIPES[j.name]?.slot === 'necklace').map(j => [j.name, j])).values()].map(j => ({
                    key: j.name, name: j.name,
                    color: JEWELRY_RECIPES[j.name]?.color,
                    sub: JEWELRY_RECIPES[j.name]?.desc ?? null,
                    equipped: gs.equippedJewelry?.necklace === j.name,
                  })),
                  onEquip: (key) => { setGs(prev => ({ ...prev, equippedJewelry: { ...(prev.equippedJewelry ?? {}), necklace: key } })); setEquipPicker(null); addMsg(`📿 ${key} 장착`); },
                  canUnequip: true,
                  onUnequip: () => { setGs(prev => ({ ...prev, equippedJewelry: { ...(prev.equippedJewelry ?? {}), necklace: null } })); setEquipPicker(null); addMsg('📿 목걸이 해제'); },
                },
              };

              // Clickable slot renderer
              const Slot = ({ slotKey, icon, label, color, sub, locked }) => {
                const isOpen = equipPicker === slotKey;
                const hasConfig = !!pickerConfigs[slotKey];
                return (
                  <div
                    className={`doll-slot ${locked ? 'doll-slot-locked' : label ? 'doll-slot-filled' : 'doll-slot-empty'}${hasConfig && !locked ? ' doll-slot-clickable' : ''}${isOpen ? ' doll-slot-active' : ''}`}
                    onClick={hasConfig && !locked ? () => setEquipPicker(isOpen ? null : slotKey) : undefined}
                  >
                    <div className="doll-slot-icon">{icon}</div>
                    {label
                      ? <div className="doll-slot-name" style={{ color: color ?? '#ccc' }}>{label}</div>
                      : <div className="doll-slot-name doll-slot-none">{locked ? '준비 중' : '없음'}</div>
                    }
                    {sub && <div className="doll-slot-sub">{sub}</div>}
                    {hasConfig && !locked && <div className="doll-slot-hint">탭</div>}
                  </div>
                );
              };

              return (
                <>
                <div style={{ padding: '6px 16px 4px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#aaa' }}>📖 도감 달성률</span>
                    <span style={{ fontSize: 13, color: '#ffcc44', fontWeight: 700 }}>{dexPct}%</span>
                    <span style={{ fontSize: 11, color: '#666' }}>({dexDone}/{dexTotal})</span>
                    <button tabIndex={-1} style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 6, border: 'none', background: 'rgba(100,180,255,0.2)', color: '#88ddff', cursor: 'pointer' }}
                      onClick={() => setShowDex(true)}>도감 열기</button>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                    <div style={{ width: `${dexPct}%`, height: '100%', background: `hsl(${dexPct * 1.2}, 80%, 55%)`, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
                <div className="doll-wrap">
                  {/* Left column — body slots */}
                  <div className="doll-col doll-col-left">
                    <Slot slotKey="hat" icon="🎩"
                      label={gs.hat ? HATS[gs.hat]?.name : null}
                      color={gs.hat ? HATS[gs.hat]?.color : undefined}
                      sub={gs.hat ? HATS[gs.hat]?.desc : null}
                    />
                    <Slot icon="👕"
                      label={gs.top !== '기본상의' ? TOPS[gs.top]?.name : null}
                      color={gs.top !== '기본상의' ? TOPS[gs.top]?.color : undefined}
                      sub={gs.top !== '기본상의' ? TOPS[gs.top]?.desc : null}
                    />
                    <Slot icon="🧥"
                      label={gs.outfit !== '기본낚시복' ? FISHING_OUTFITS[gs.outfit]?.name : null}
                      color={gs.outfit !== '기본낚시복' ? FISHING_OUTFITS[gs.outfit]?.color : undefined}
                      sub={gs.outfit !== '기본낚시복' ? FISHING_OUTFITS[gs.outfit]?.desc : null}
                    />
                    <Slot icon="👖"
                      label={gs.bottom !== '기본하의' ? BOTTOMS[gs.bottom]?.name : null}
                      color={gs.bottom !== '기본하의' ? BOTTOMS[gs.bottom]?.color : undefined}
                      sub={gs.bottom !== '기본하의' ? BOTTOMS[gs.bottom]?.desc : null}
                    />
                    <Slot icon="🪢"
                      label={gs.belt ? BELTS[gs.belt]?.name : null}
                      color={gs.belt ? BELTS[gs.belt]?.color : undefined}
                      sub={gs.belt ? BELTS[gs.belt]?.desc : null}
                    />
                    <Slot icon="💍"
                      label={gs.equippedJewelry?.ring ?? null}
                      color={JEWELRY_RECIPES[gs.equippedJewelry?.ring]?.color}
                      sub={gs.equippedJewelry?.ring ? JEWELRY_RECIPES[gs.equippedJewelry.ring]?.desc : null}
                    />
                    <Slot slotKey="rodSkin" icon="🎨"
                      label={gs.activeRodSkin !== '기본스킨' ? ROD_SKINS[gs.activeRodSkin]?.name : null}
                      color={gs.activeRodSkin !== '기본스킨' ? ROD_SKINS[gs.activeRodSkin]?.color : undefined}
                    />
                    <Slot slotKey="necklace" icon="📿"
                      label={gs.equippedJewelry?.necklace ?? null}
                      color={JEWELRY_RECIPES[gs.equippedJewelry?.necklace]?.color}
                      sub={gs.equippedJewelry?.necklace ? JEWELRY_RECIPES[gs.equippedJewelry.necklace]?.desc : null}
                    />
                    <Slot slotKey="boots" icon="👟"
                      label={bootData?.name ?? gs.boots}
                      color={bootData?.color}
                      sub={bootData?.speedBonus > 0 ? `+${bootData.speedBonus} 속도` : null}
                    />
                  </div>

                  {/* Center — character silhouette */}
                  <div className="doll-center">
                    <div className="doll-char">
                      <div className="doll-char-head">
                        <div className="doll-char-face" />
                      </div>
                      <div className="doll-char-body" />
                      <div className="doll-char-legs" />
                    </div>
                    <div className="doll-char-name" style={{ color: myTitle.color }}>[{myTitle.label}]</div>
                    <div className="doll-char-nick">{nickname}</div>
                    <div className="doll-char-money">💰 {gs.money.toLocaleString()}G</div>
                  </div>

                  {/* Right column — activity slots */}
                  <div className="doll-col doll-col-right">
                    <Slot slotKey="rod" icon="🎣"
                      label={rodData?.name ?? gs.rod}
                      color={rodData?.color}
                      sub={enhLv > 0 ? `+${enhLv} 강화` : null}
                    />
                    <Slot slotKey="bait" icon="🪝"
                      label={baitData?.name ?? null}
                      color={baitData?.color}
                    />
                    <Slot slotKey="cookware" icon="🍳"
                      label={cwData?.name ?? null}
                      color={cwData?.color}
                      sub={cwData ? `×${cwData.mult} 요리` : null}
                    />
                  </div>
                </div>

                {/* Equipment picker panel */}
                {equipPicker && pickerConfigs[equipPicker] && (() => {
                  const cfg = pickerConfigs[equipPicker];
                  return (
                    <div className="equip-picker">
                      <div className="equip-picker-head">
                        <span className="equip-picker-title">🔄 {cfg.label} 교체</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {cfg.canUnequip && cfg.onUnequip && (
                            <button tabIndex={-1} className="equip-picker-unequip" onClick={cfg.onUnequip}>해제</button>
                          )}
                          <button tabIndex={-1} className="equip-picker-close" onClick={() => setEquipPicker(null)}>✕</button>
                        </div>
                      </div>
                      {cfg.items.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '10px 0' }}>보유 중인 {cfg.label}이 없습니다</div>
                      ) : (
                        <div className="equip-picker-list">
                          {cfg.items.map(item => (
                            <div key={item.key} className={`equip-picker-item${item.equipped ? ' equip-picker-item-on' : ''}`}>
                              <div className="equip-picker-item-name" style={{ color: item.color ?? '#ccc' }}>{item.name}</div>
                              {item.sub && <div className="equip-picker-item-sub">{item.sub}</div>}
                              {item.equipped
                                ? <span className="equip-picker-badge">장착중</span>
                                : <button tabIndex={-1} className="equip-picker-btn" onClick={() => cfg.onEquip(item.key)}>장착</button>
                              }
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                </>
              );
            })()}

            {/* ── 어빌리티 tab ── */}
            {statsTab === '어빌리티' && (
              <>
                {(otherPlayersRef.current?.length ?? 0) > 0 && (
                  <div className="party-banner">🎉 파티 중 — 어빌리티 획득 시 20% 확률로 2배!</div>
                )}
                <div className="section">
                  <div className="skill-grid">
                    {Object.entries(ABILITY_DEFS).map(([name, def]) => {
                      const ab = gs.abilities?.[name] ?? { value: 0, grade: 0 };
                      const pct = Math.min(100, ab.value);
                      const canGrade = ab.value >= 100;
                      return (
                        <div key={name} className="skill-card">
                          <div className="skill-top">
                            <span className="skill-icon">{def.icon}</span>
                            <span className="skill-name" style={{ color: def.color }}>{name}</span>
                            <span className="skill-lv">{ab.value.toFixed(2)}</span>
                            {ab.grade > 0 && <span className="grade-badge">G{ab.grade}</span>}
                          </div>
                          <div className="skill-bar-wrap">
                            <div className="skill-bar-fill" style={{ '--pct': `${pct}%`, background: def.color }} />
                          </div>
                          <div className="skill-exp-txt">{ab.value.toFixed(2)} / 100.00</div>
                          <div className="skill-source">{def.desc}</div>
                          {canGrade && (
                            <button className="btn-buy grade-up-btn" onClick={() => {
                              setGs(prev => ({
                                ...prev,
                                abilities: { ...(prev.abilities ?? DEFAULT_ABILITIES),
                                  [name]: doGradeUp(prev.abilities?.[name] ?? { value: 100, grade: 0 }) },
                              }));
                              addMsg(`🌟 ${def.icon} ${name} 그레이드 ${ab.grade + 1} 달성! 희귀 보너스 +${((ab.grade + 1) * 10)}%`, 'catch');
                              playLevelUp();
                              if (gameRef.current) gameRef.current.gradeUpEffect = {
                                age: 0,
                                abilName: name,
                                grade: ab.grade + 1,
                                color: def.color,
                                icon: def.icon,
                              };
                              setGradeUpCelebration({ abilName: name, grade: ab.grade + 1, color: def.color, icon: def.icon });
                              setTimeout(() => setGradeUpCelebration(null), 3000);
                            }}>
                              ⬆️ 그레이드업 → G{ab.grade + 1}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* ── 직업 트리 ── */}
                <div className="section">
                  <div className="section-title">⚔️ 직업 트리 {gs.selectedJob ? `— 현재: ${JOBS[gs.selectedJob]?.icon} ${JOBS[gs.selectedJob]?.name}` : '(미선택)'}</div>
                  {(() => {
                    const availableJobKeys = getAvailableJobs(gs.abilities);
                    if (availableJobKeys.length === 0) {
                      return <div className="empty">어빌리티 그레이드 1을 달성하면 직업을 선택할 수 있습니다.<br/>낚시/채굴/요리/화술 중 하나를 100 달성 후 그레이드업 하세요!</div>;
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {Object.entries(JOBS).map(([key, job]) => {
                          const available = availableJobKeys.includes(key);
                          const selected = gs.selectedJob === key;
                          return (
                            <div key={key} className="rod-card" style={{
                              borderColor: selected ? job.color : available ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                              opacity: available ? 1 : 0.5,
                            }}>
                              <div style={{ fontSize: 18, marginBottom: 4 }}>{job.icon} {job.name}</div>
                              <div style={{ fontSize: 11, color: '#ccc', marginBottom: 6 }}>{job.desc}</div>
                              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>{job.reqLabel}</div>
                              {selected
                                ? <div style={{ fontSize: 11, color: job.color, fontWeight: 700 }}>✅ 현재 직업</div>
                                : available
                                  ? <button className="btn-buy" style={{ fontSize: 11 }} onClick={() => {
                                      setGs(prev => ({ ...prev, selectedJob: key }));
                                      addMsg(`⚔️ 직업 선택: ${job.icon} ${job.name}! ${job.desc}`, 'catch');
                                    }}>직업 선택</button>
                                  : <div style={{ fontSize: 10, color: '#888' }}>🔒 {job.reqLabel}</div>
                              }
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* ── 전문 직업 분기 (Phase 12-4) ── */}
                <div className="section">
                  <div className="section-title">⭐ 전문 직업
                    {gs.jobClass && (
                      <span style={{ marginLeft: 8, color: JOB_CLASSES[gs.jobClass]?.color ?? '#ffd700', fontWeight: 700, fontSize: 12 }}>
                        — {JOB_CLASSES[gs.jobClass]?.icon} {JOB_CLASSES[gs.jobClass]?.name}
                      </span>
                    )}
                  </div>
                  {gs.jobClass ? (
                    (() => {
                      const cls = JOB_CLASSES[gs.jobClass];
                      return (
                        <div className="rod-card" style={{ borderColor: cls?.color ?? 'rgba(255,215,0,0.4)', background: 'rgba(255,215,0,0.05)' }}>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>{cls?.icon} {cls?.name}</div>
                          <div style={{ fontSize: 11, color: '#ccc', marginBottom: 4 }}>{cls?.desc}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                            {Object.entries(cls?.bonus ?? {}).map(([k, v]) => {
                              if (k === 'fishSellBonus') return `물고기 판매 +${(v*100).toFixed(0)}%`;
                              if (k === 'fishTimeBonus') return `낚시 속도 +${(v*100).toFixed(0)}%`;
                              if (k === 'mineSellBonus') return `채굴 판매 +${(v*100).toFixed(0)}%`;
                              if (k === 'mineTimeBonus') return `채굴 속도 +${(v*100).toFixed(0)}%`;
                              if (k === 'oreExtraChance') return `추가 광석 확률 ${(v*100).toFixed(0)}%`;
                              if (k === 'cookSellBonus') return `요리 판매 +${(v*100).toFixed(0)}%`;
                              if (k === 'cookSpeedBonus') return `요리 속도 +${(v*100).toFixed(0)}%`;
                              if (k === 'windfall') return `횡재 확률 +${(v*100).toFixed(0)}%`;
                              return `${k}: +${v}`;
                            }).join(' · ')}
                          </div>
                        </div>
                      );
                    })()
                  ) : (() => {
                    const totalAbil = Object.values(gs.abilities ?? {}).reduce((sum, a) => sum + (a?.value ?? 0), 0);
                    const unlocked = totalAbil >= 200;
                    if (!unlocked) {
                      return (
                        <div className="empty">
                          어빌리티 합산 200 이상 시 선택 가능.<br/>
                          현재: {Math.floor(totalAbil)} / 200
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 11, color: '#ffcc44', marginBottom: 4 }}>⚠️ 한 번 선택하면 변경할 수 없습니다.</div>
                        {Object.entries(JOB_CLASSES).map(([key, cls]) => (
                          <div key={key} className="rod-card" style={{ borderColor: cls.color ?? 'rgba(255,255,255,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: cls.color }}>{cls.icon} {cls.name}</div>
                                <div style={{ fontSize: 11, color: '#ccc', marginTop: 2 }}>{cls.desc}</div>
                              </div>
                              <button
                                className="btn-buy"
                                style={{ fontSize: 11, padding: '3px 10px', marginLeft: 8 }}
                                onClick={() => handleChooseJobClass(key)}
                              >
                                선택
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="section">
                  <div className="section-title">🔨 낚싯대 강화</div>
                  {gs.ownedRods.map(rodKey => {
                    const rod = RODS[rodKey];
                    const enhLv = gs.rodEnhance?.[rodKey] ?? 0;
                    const cost = rodEnhanceCost(enhLv);
                    const mats = rodEnhanceMatsNeeded(enhLv);
                    const ganghwaAbil = gs.abilities?.강화?.value ?? 0;
                    const furnitureEnhBonus = (gs.cottage?.furniture ?? []).reduce((sum, f) => sum + (FURNITURE[f.key]?.bonus?.enhanceBonus ?? 0), 0);
                    const rate = Math.min(0.98, rodEnhanceSuccessRate(enhLv, ganghwaAbil) + furnitureEnhBonus);
                    const canAfford = gs.money >= cost;
                    const hasMats = Object.entries(mats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n);
                    const matsStr = Object.entries(mats).map(([k, n]) => `${k}×${n}`).join(' ');
                    const eff = rodEnhanceEffect(enhLv);
                    return (
                      <div key={rodKey} className="rod-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ color: rod.color, fontWeight: 700 }}>🎣 {rod.name}</span>
                          <span className="badge" style={{ background: enhLv >= 80 ? '#ff4400' : enhLv >= 50 ? '#ffaa00' : '#446688' }}>
                            +{enhLv}
                          </span>
                        </div>
                        <div className="rod-meta">효과: 낚시 -{(eff.timeReduction*100).toFixed(0)}% · 판매 +{(eff.priceBonus*100).toFixed(0)}%</div>
                        <div className="rod-meta">강화비: {cost}G{matsStr ? ` + ${matsStr}` : ''} · 성공률 {(rate*100).toFixed(0)}%</div>
                        <div className="rod-meta" style={{ color: canAfford && hasMats ? '#88ff88' : '#ff8888' }}>
                          보유: {gs.money.toLocaleString()}G
                          {Object.entries(mats).map(([ore, n]) => (
                            <span key={ore} style={{ marginLeft: 6, color: (gs.oreInventory[ore] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                              · {ore} {gs.oreInventory[ore] || 0}/{n}
                            </span>
                          ))}
                        </div>
                        <button
                          className={canAfford && hasMats ? 'btn-buy' : 'btn-dis'}
                          disabled={!canAfford || !hasMats || enhLv >= 100}
                          onClick={() => {
                            if (enhLv >= 100) return;
                            const success = Math.random() < Math.min(0.98, rodEnhanceSuccessRate(enhLv, gs.abilities?.강화?.value ?? 0) + furnitureEnhBonus);
                            setGs(prev => {
                              const ores = { ...prev.oreInventory };
                              for (const [ore, n] of Object.entries(mats)) ores[ore] = Math.max(0, (ores[ore] || 0) - n);
                              return { ...prev, money: prev.money - cost, oreInventory: ores,
                                rodEnhance: { ...(prev.rodEnhance ?? {}), [rodKey]: success ? enhLv + 1 : enhLv } };
                            });
                            if (success) {
                              addMsg(`🔨 ${rod.name} +${enhLv + 1} 강화 성공!`, 'catch');
                              grantAbility('강화', ENHANCE_ABILITY_GAIN);
                              setGs(prev2 => {
                                const ps = prev2.achStats ?? {};
                                const us = { ...ps, enhanceCount: (ps.enhanceCount ?? 0) + 1 };
                                setTimeout(() => checkAndGrantAchievements(us), 0);
                                return { ...prev2, achStats: us };
                              });
                            } else addMsg(`🔨 강화 실패... (${rod.name} +${enhLv} 유지)`, 'error');
                          }}
                        >
                          {enhLv >= 100 ? '최대 강화' : `강화 (+${enhLv} → +${enhLv + 1})`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pickaxe enhancement ── */}
                <div className="section">
                  <div className="section-title">⛏ 곡괭이 강화</div>
                  {(gs.ownedPickaxes ?? ['나무곡괭이']).map(pxKey => {
                    const px = PICKAXES[pxKey];
                    const enhLv = gs.pickaxeEnhance?.[pxKey] ?? 0;
                    const cost = pickaxeEnhanceCost(enhLv);
                    const mats = pickaxeEnhanceMatsNeeded(enhLv);
                    const ganghwaAbil = gs.abilities?.강화?.value ?? 0;
                    const rate = pickaxeEnhanceSuccessRate(enhLv, ganghwaAbil);
                    const canAfford = gs.money >= cost;
                    const hasMats = Object.entries(mats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n);
                    const matsStr = Object.entries(mats).map(([k, n]) => `${k}×${n}`).join(' ');
                    const eff = pickaxeEnhanceEffect(enhLv);
                    return (
                      <div key={pxKey} className="rod-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ color: px.color, fontWeight: 700 }}>⛏ {px.name}</span>
                          <span className="badge" style={{ background: enhLv >= 80 ? '#ff4400' : enhLv >= 50 ? '#ffaa00' : '#446688' }}>
                            +{enhLv}
                          </span>
                        </div>
                        <div className="rod-meta">효과: 채굴 -{(eff.timeReduction * 100).toFixed(0)}%</div>
                        <div className="rod-meta">강화비: {cost}G{matsStr ? ` + ${matsStr}` : ''} · 성공률 {(rate * 100).toFixed(0)}%</div>
                        <div className="rod-meta" style={{ color: canAfford && hasMats ? '#88ff88' : '#ff8888' }}>
                          보유: {gs.money.toLocaleString()}G
                          {Object.entries(mats).map(([ore, n]) => (
                            <span key={ore} style={{ marginLeft: 6, color: (gs.oreInventory[ore] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                              · {ore} {gs.oreInventory[ore] || 0}/{n}
                            </span>
                          ))}
                        </div>
                        <button
                          className={canAfford && hasMats ? 'btn-buy' : 'btn-dis'}
                          disabled={!canAfford || !hasMats || enhLv >= 100}
                          onClick={() => {
                            if (enhLv >= 100) return;
                            const success = Math.random() < pickaxeEnhanceSuccessRate(enhLv, gs.abilities?.강화?.value ?? 0);
                            setGs(prev => {
                              const ores = { ...prev.oreInventory };
                              for (const [ore, n] of Object.entries(mats)) ores[ore] = Math.max(0, (ores[ore] || 0) - n);
                              return { ...prev, money: prev.money - cost, oreInventory: ores,
                                pickaxeEnhance: { ...(prev.pickaxeEnhance ?? {}), [pxKey]: success ? enhLv + 1 : enhLv } };
                            });
                            if (success) {
                              addMsg(`⛏ ${px.name} +${enhLv + 1} 강화 성공!`, 'catch');
                              grantAbility('강화', ENHANCE_ABILITY_GAIN);
                              setGs(prev2 => {
                                const ps = prev2.achStats ?? {};
                                const us = { ...ps, enhanceCount: (ps.enhanceCount ?? 0) + 1 };
                                setTimeout(() => checkAndGrantAchievements(us), 0);
                                return { ...prev2, achStats: us };
                              });
                            } else addMsg(`⛏ 강화 실패... (+${enhLv} 유지)`, 'error');
                          }}
                        >
                          {enhLv >= 100 ? '최대 강화' : `강화 (+${enhLv} → +${enhLv + 1})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {/* ── 뉴 타이드+ (Prestige) ── */}
                {(() => {
                  const npcKeys = ['민준', '수연', '미나', '철수', '은행원'];
                  const allQuestsDone = npcKeys.every(k => (gs.npcQuestStep?.[k] ?? 0) >= (NPC_QUESTS[k]?.length ?? 0));
                  const canPrestige = allQuestsDone && gs.seenChapter4;
                  const [showPrestigeConfirm, setShowPrestigeConfirm] = props._prestigeConfirmState ?? [false, () => {}];
                  return canPrestige ? (
                    <div className="section">
                      <div className="section-title">🌟 뉴 타이드+ (명예 초기화)</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                        프레스티지 횟수: <b style={{ color: '#ffd700' }}>{gs.prestigeCount ?? 0}회</b>
                        &nbsp;·&nbsp; 영구 판매가 보너스: <b style={{ color: '#88ff88' }}>+{((gs.prestigePermanentSellBonus ?? 0) * 100).toFixed(0)}%</b>
                      </div>
                      <button className="btn-buy" style={{ background: 'linear-gradient(135deg, #7733cc, #3366cc)' }}
                        onClick={() => props.onPrestige?.()}>
                        🌟 명예 초기화 (뉴 타이드+)
                      </button>
                    </div>
                  ) : null;
                })()}
              </>
            )}

            {/* ── 제련/제작 tab ── */}
            {statsTab === '제련/제작' && (() => {
              const smeltAbil = gs.abilities?.제련?.value ?? 0;
              const successBonus = smeltAbil * 0.005; // up to +50% at 100
              return (
                <>
                  {/* Smelting */}
                  <div className="section">
                    <div className="section-title">🔥 광물 제련 (제련 어빌 {smeltAbil.toFixed(0)})</div>
                    {Object.entries(SMELT_RECIPES).map(([key, recipe]) => {
                      const hasMats = Object.entries(recipe.input).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n);
                      const baseRate = 0.60 + successBonus;
                      const rate = Math.min(0.98, baseRate);
                      return (
                        <div key={key} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ color: recipe.color, fontWeight: 700 }}>🔥 {recipe.name}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>성공률 {(rate * 100).toFixed(0)}%</span>
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          <div className="rod-meta" style={{ color: hasMats ? '#88ff88' : '#ff8888' }}>
                            재료: {Object.entries(recipe.input).map(([ore, n]) => (
                              <span key={ore} style={{ marginRight: 6, color: (gs.oreInventory[ore] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                {ore} {gs.oreInventory[ore] || 0}/{n}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                            보유: {gs.processedOreInventory?.[key] ?? 0}개
                          </div>
                          <button className={hasMats ? 'btn-buy' : 'btn-dis'} disabled={!hasMats} onClick={() => {
                            const success = Math.random() < rate;
                            setGs(prev => {
                              const ores = { ...prev.oreInventory };
                              for (const [ore, n] of Object.entries(recipe.input)) ores[ore] = Math.max(0, (ores[ore] || 0) - n);
                              const proc = { ...(prev.processedOreInventory ?? {}) };
                              if (success) proc[key] = (proc[key] ?? 0) + 1;
                              return { ...prev, oreInventory: ores, processedOreInventory: proc };
                            });
                            grantAbility('제련', 2);
                            if (success) {
                              addMsg(`🔥 ${recipe.name} 제련 성공!`, 'catch');
                              setGs(prev2 => {
                                const ps = prev2.achStats ?? {};
                                const newSmeltLog = { ...(prev2.smeltLog ?? {}), [key]: ((prev2.smeltLog ?? {})[key] ?? 0) + 1 };
                                const us = { ...ps, smeltCount: (ps.smeltCount ?? 0) + 1 };
                                setTimeout(() => checkAndGrantAchievements(us), 0);
                                return { ...prev2, achStats: us, smeltLog: newSmeltLog };
                              });
                            } else addMsg(`🔥 제련 실패… 재료 소모됨`, 'error');
                          }}>제련하기</button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Jewelry crafting */}
                  <div className="section">
                    <div className="section-title">💍 장신구 제작</div>
                    {Object.entries(JEWELRY_RECIPES).map(([key, recipe]) => {
                      const hasMats = Object.entries(recipe.input).every(([mat, n]) => (gs.processedOreInventory?.[mat] || 0) >= n);
                      const smeltRate = Math.min(0.98, 0.50 + successBonus);
                      const equipped = gs.equippedJewelry?.[recipe.slot] === key;
                      const owned = (gs.jewelryInventory ?? []).some(j => j.name === key);
                      return (
                        <div key={key} className="rod-card" style={equipped ? { borderColor: 'rgba(255,215,0,0.4)' } : {}}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ color: recipe.color, fontWeight: 700 }}>{recipe.icon} {recipe.name}</span>
                            {equipped && <span className="badge">장착됨</span>}
                            {owned && !equipped && <span className="badge owned">보유</span>}
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>성공률 {(smeltRate * 100).toFixed(0)}%</span>
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          <div className="rod-meta" style={{ color: hasMats ? '#88ff88' : '#ff8888' }}>
                            재료: {Object.entries(recipe.input).map(([mat, n]) => (
                              <span key={mat} style={{ marginRight: 6, color: (gs.processedOreInventory?.[mat] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                {mat} {gs.processedOreInventory?.[mat] || 0}/{n}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button className={hasMats ? 'btn-buy' : 'btn-dis'} disabled={!hasMats} onClick={() => {
                              const success = Math.random() < smeltRate;
                              setGs(prev => {
                                const proc = { ...(prev.processedOreInventory ?? {}) };
                                for (const [mat, n] of Object.entries(recipe.input)) proc[mat] = Math.max(0, (proc[mat] || 0) - n);
                                const jewelry = success ? [...(prev.jewelryInventory ?? []), { id: Date.now(), name: key, ...recipe }] : (prev.jewelryInventory ?? []);
                                const newJewelLog = success ? { ...(prev.jewelLog ?? {}), [key]: ((prev.jewelLog ?? {})[key] ?? 0) + 1 } : (prev.jewelLog ?? {});
                                return { ...prev, processedOreInventory: proc, jewelryInventory: jewelry, jewelLog: newJewelLog };
                              });
                              grantAbility('제련', 5);
                              if (success) {
                                addMsg(`${recipe.icon} ${recipe.name} 제작 성공!`, 'catch');
                                setGs(prev2 => {
                                  const ps = prev2.achStats ?? {};
                                  const us = { ...ps, smeltCount: (ps.smeltCount ?? 0) + 1 };
                                  setTimeout(() => checkAndGrantAchievements(us), 0);
                                  return { ...prev2, achStats: us };
                                });
                              } else addMsg(`제작 실패… 재료 소모됨`, 'error');
                            }}>제작</button>
                            {owned && (
                              <button className={equipped ? 'btn-dis' : 'btn-eq'} disabled={equipped} onClick={() => {
                                setGs(prev => ({ ...prev, equippedJewelry: { ...(prev.equippedJewelry ?? {}), [recipe.slot]: equipped ? null : key } }));
                                addMsg(`${recipe.icon} ${recipe.name} ${equipped ? '해제' : '장착'}`);
                              }}>{equipped ? '해제' : '장착'}</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Potion crafting */}
                  <div className="section">
                    <div className="section-title">🧪 포션 제작</div>
                    {Object.entries(POTION_RECIPES).map(([key, recipe]) => {
                      const herbOk = Object.entries(recipe.input ?? {}).every(([h, n]) => (gs.herbInventory?.[h] || 0) >= n);
                      const cropOk = Object.entries(recipe.cropInput ?? {}).every(([c, n]) => (gs.cropInventory?.[c] || 0) >= n);
                      const hasMats = herbOk && cropOk;
                      const stock = gs.potionInventory?.[key] ?? 0;
                      const isActive = gs.activePotion?.type === key;
                      return (
                        <div key={key} className="rod-card" style={isActive ? { borderColor: 'rgba(100,200,255,0.4)' } : {}}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ color: recipe.color, fontWeight: 700 }}>{recipe.icon} {recipe.name}</span>
                            {stock > 0 && <span className="badge owned">×{stock}</span>}
                            {isActive && <span className="badge" style={{ background: '#1a88cc' }}>효과 중</span>}
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          <div className="rod-meta">
                            재료:{' '}
                            {Object.entries(recipe.input ?? {}).map(([herb, n]) => (
                              <span key={herb} style={{ marginRight: 6, color: (gs.herbInventory?.[herb] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                {herb} {gs.herbInventory?.[herb] || 0}/{n}
                              </span>
                            ))}
                            {Object.entries(recipe.cropInput ?? {}).map(([crop, n]) => (
                              <span key={crop} style={{ marginRight: 6, color: (gs.cropInventory?.[crop] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                🌾{crop} {gs.cropInventory?.[crop] || 0}/{n}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button className={hasMats ? 'btn-buy' : 'btn-dis'} disabled={!hasMats} onClick={() => {
                              setGs(prev => {
                                const herbs = { ...(prev.herbInventory ?? {}) };
                                for (const [herb, n] of Object.entries(recipe.input ?? {})) herbs[herb] = Math.max(0, (herbs[herb] || 0) - n);
                                const crops = { ...(prev.cropInventory ?? {}) };
                                for (const [crop, n] of Object.entries(recipe.cropInput ?? {})) crops[crop] = Math.max(0, (crops[crop] || 0) - n);
                                const pots = { ...(prev.potionInventory ?? {}), [key]: (prev.potionInventory?.[key] ?? 0) + 1 };
                                const newPotionLog = { ...(prev.potionLog ?? {}), [key]: ((prev.potionLog ?? {})[key] ?? 0) + 1 };
                                const potionSpecies = Object.keys(newPotionLog).filter(k => newPotionLog[k] > 0).length;
                                const ps = prev.achStats ?? {};
                                const us = { ...ps, potionSpecies };
                                setTimeout(() => checkAndGrantAchievements(us), 0);
                                return { ...prev, herbInventory: herbs, cropInventory: crops, potionInventory: pots, potionLog: newPotionLog, achStats: us };
                              });
                              addMsg(`${recipe.icon} ${recipe.name} 제조 완료!`, 'catch');
                            }}>제조</button>
                            {stock > 0 && !isActive && (
                              <button className="btn-eq" onClick={() => {
                                const expiresAt = Date.now() + recipe.effect.duration;
                                setGs(prev => ({
                                  ...prev,
                                  potionInventory: { ...(prev.potionInventory ?? {}), [key]: prev.potionInventory[key] - 1 },
                                  activePotion: { type: key, effect: recipe.effect, expiresAt },
                                }));
                                addMsg(`${recipe.icon} ${recipe.name} 사용! (${recipe.effect.duration / 1000}초)`, 'catch');
                              }}>사용</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dish recipes */}
                  <div className="section">
                    <div className="section-title">🍽 특별 요리 레시피</div>
                    <div className="rod-meta" style={{ marginBottom: 8, color: 'rgba(255,255,255,0.45)' }}>요리소 근처에서 !요리 [요리명] 또는 버튼 클릭</div>
                    {Object.entries(DISH_RECIPES).map(([key, recipe]) => {
                      // Check NPC affinity lock
                      const npcLocked = recipe.reqNpc && Object.entries(recipe.reqNpc).some(
                        ([npc, reqLv]) => (gs.npcAffinity?.[npc] ?? 0) < reqLv
                      );
                      const cropOk = !npcLocked && Object.entries(recipe.crops ?? {}).every(([c, n]) => (gs.cropInventory?.[c] ?? 0) >= n);
                      const fishNeeded = recipe.fish;
                      const fishOk = !fishNeeded || (!npcLocked && (() => {
                        const inv = gs.fishInventory ?? [];
                        return fishNeeded.name
                          ? inv.some(f => f.name === fishNeeded.name)
                          : inv.some(f => FISH[f.name]?.rarity === fishNeeded.rarity);
                      })());
                      const canCook = !npcLocked && cropOk && fishOk;
                      return (
                        <div key={key} className="rod-card" style={npcLocked ? { opacity: 0.55 } : {}}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 18 }}>{npcLocked ? '🔒' : recipe.icon}</span>
                            <span style={{ fontWeight: 700, color: npcLocked ? '#888' : '#ffe0a0' }}>{recipe.name}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>+{recipe.price}G</span>
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          {npcLocked && (
                            <div className="rod-meta" style={{ color: '#ff8888' }}>
                              🔒 {Object.entries(recipe.reqNpc).map(([npc, lv]) => `${npc} 관계 ${lv} 필요`).join(', ')}
                            </div>
                          )}
                          {!npcLocked && (
                            <div className="rod-meta" style={{ marginTop: 3 }}>
                              {Object.entries(recipe.crops ?? {}).map(([c, n]) => (
                                <span key={c} style={{ marginRight: 6, color: (gs.cropInventory?.[c] ?? 0) >= n ? '#88ff88' : '#ff8888' }}>
                                  🌾{c} {gs.cropInventory?.[c] ?? 0}/{n}
                                </span>
                              ))}
                              {fishNeeded && (
                                <span style={{ color: fishOk ? '#88ff88' : '#ff8888' }}>
                                  🐟{fishNeeded.name ?? fishNeeded.rarity + ' 생선'} {fishOk ? '✓' : '✗'}
                                </span>
                              )}
                            </div>
                          )}
                          <button tabIndex={-1} className={canCook ? 'btn-buy' : 'btn-dis'}
                            style={{ marginTop: 6, fontSize: 11 }} disabled={!canCook}
                            onClick={() => handleCommand(`!요리 ${key}`)}>
                            {npcLocked ? '🔒 잠금됨' : `요리하기 (+${recipe.price}G)`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* ── 전설 제작 tab ── */}
            {statsTab === '전설 제작' && (() => {
              const legendItems = [
                { key: '전설낚시대', type: 'rod', data: RODS['전설낚시대'] },
                { key: '전설곡괭이', type: 'pickaxe', data: PICKAXES['전설곡괭이'] },
              ];
              return (
                <div className="section">
                  <div className="section-title" style={{ marginBottom: 4 }}>✨ 전설 장비 제작</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
                    여러 존의 희귀 재료와 전설 어종이 필요합니다.
                  </div>
                  {legendItems.map(({ key, type, data }) => {
                    if (!data) return null;
                    const alreadyOwned = type === 'rod'
                      ? (gs.ownedRods ?? []).includes(key)
                      : (gs.ownedPickaxes ?? []).includes(key);
                    // Check ore mats
                    const oreMats = data.craftMats ?? {};
                    const canAffordOre = Object.entries(oreMats).every(([ore, qty]) => (gs.oreInventory?.[ore] ?? 0) >= qty);
                    // Check fish mats
                    const fishMats = data.craftFish ?? [];
                    const fishInv = gs.fishInventory ?? [];
                    const canAffordFish = fishMats.every(f => fishInv.some(fi => fi.name === f));
                    // Check rod/pickaxe prereq
                    const reqEnhance = data.reqEnhance ?? 0;
                    const prereqKey = type === 'rod' ? data.reqRod : data.reqPickaxe;
                    const prereqEnhance = type === 'rod'
                      ? (gs.rodEnhance?.[prereqKey] ?? 0)
                      : (gs.pickaxeEnhance?.[prereqKey] ?? 0);
                    const prereqOwned = type === 'rod'
                      ? (gs.ownedRods ?? []).includes(prereqKey)
                      : (gs.ownedPickaxes ?? []).includes(prereqKey);
                    const prereqOk = prereqOwned && prereqEnhance >= reqEnhance;
                    const canCraft = !alreadyOwned && canAffordOre && canAffordFish && prereqOk;
                    return (
                      <div key={key} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${alreadyOwned ? '#44ff8844' : '#ff44ff44'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ color: '#ff44ff', fontWeight: 700, fontSize: 13 }}>✨ {data.name}</span>
                          {alreadyOwned && <span style={{ color: '#44ff88', fontSize: 11 }}>보유 중</span>}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 8 }}>{data.desc}</div>
                        {/* Prerequisite */}
                        <div style={{ fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: prereqOk ? '#44ff88' : 'rgba(255,255,255,0.4)' }}>
                            {prereqOk ? '✓' : '✗'} {prereqKey} 강화 {reqEnhance} 이상 ({prereqEnhance}/{reqEnhance})
                          </span>
                        </div>
                        {/* Ore mats */}
                        <div style={{ fontSize: 11, marginBottom: 4 }}>
                          {Object.entries(oreMats).map(([ore, qty]) => {
                            const have = gs.oreInventory?.[ore] ?? 0;
                            const ok = have >= qty;
                            return (
                              <span key={ore} style={{ color: ok ? '#44ff88' : '#ff6666', marginRight: 8 }}>
                                {ok ? '✓' : '✗'} {ore} ×{qty} ({have}/{qty})
                              </span>
                            );
                          })}
                        </div>
                        {/* Fish mats */}
                        {fishMats.length > 0 && (
                          <div style={{ fontSize: 11, marginBottom: 8 }}>
                            {fishMats.map(f => {
                              const have = fishInv.some(fi => fi.name === f);
                              return (
                                <span key={f} style={{ color: have ? '#44ff88' : '#ff6666', marginRight: 8 }}>
                                  {have ? '✓' : '✗'} {f} 1마리
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {!alreadyOwned && (
                          <button
                            disabled={!canCraft}
                            onClick={() => {
                              if (!canCraft) return;
                              // Consume mats and add item
                              setGs(prev => {
                                const newOre = { ...prev.oreInventory };
                                Object.entries(oreMats).forEach(([ore, qty]) => { newOre[ore] = (newOre[ore] ?? 0) - qty; });
                                const usedFish = new Set();
                                const newFishInv = prev.fishInventory.filter(fi => {
                                  if (fishMats.includes(fi.name) && !usedFish.has(fi.name)) {
                                    usedFish.add(fi.name);
                                    return false;
                                  }
                                  return true;
                                });
                                if (type === 'rod') {
                                  return { ...prev, oreInventory: newOre, fishInventory: newFishInv, ownedRods: [...(prev.ownedRods ?? []), key] };
                                } else {
                                  return { ...prev, oreInventory: newOre, fishInventory: newFishInv, ownedPickaxes: [...(prev.ownedPickaxes ?? []), key] };
                                }
                              });
                              addMsg(`✨ ${data.name} 제작 완료! 장비 탭에서 장착하세요.`, 'catch');
                            }}
                            style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: canCraft ? '#ff44ff' : 'rgba(255,255,255,0.1)', color: canCraft ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 12, cursor: canCraft ? 'pointer' : 'not-allowed' }}
                          >
                            {canCraft ? '제작하기' : '재료 부족'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── 업적 tab ── */}
            {statsTab === '업적' && (
              <div className="section">
                <div className="section-title">업적 ({(gs.achievements ?? []).length} / {ACHIEVEMENTS.length})</div>
                {ACHIEVEMENTS.map(ach => {
                  const val = gs.achStats?.[ach.type] ?? 0;
                  const done = (gs.achievements ?? []).includes(ach.id);
                  const pct = Math.min(100, Math.round((val / ach.goal) * 100));
                  return (
                    <div key={ach.id} className="rod-card" style={{ opacity: done ? 0.6 : 1, borderColor: done ? 'rgba(255,215,0,0.3)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 18 }}>{ach.icon}</span>
                        <span style={{ fontWeight: 700, color: done ? '#ffdd44' : '#ffe0a0' }}>{ach.label}</span>
                        {done && <span className="badge" style={{ background: '#886600' }}>완료</span>}
                      </div>
                      <div className="rod-meta">{ach.desc}</div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden', margin: '4px 0' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: done ? '#886600' : '#4488ff', borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{Math.min(val, ach.goal)} / {ach.goal} · 보상 {ach.reward.money}G</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── 펫 tab ── */}
            {statsTab === '펫' && (() => {
              const now = Date.now();
              const petLevels = gs.petLevels ?? {};
              const petExp = gs.petExp ?? {};
              const innBuff = gs.innBuff;
              const innBuffActive = innBuff && now < innBuff.expiresAt;
              return (
                <>
                  {innBuffActive && (
                    <div className="section">
                      <div className="rod-card" style={{ borderColor: 'rgba(100,200,255,0.5)', background: 'rgba(0,100,200,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>💤</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#88ccff' }}>여관 휴식 버프 활성</div>
                            <div className="rod-meta">낚시 속도 +20% · {Math.ceil((innBuff.expiresAt - now) / 60000)}분 남음</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {gs.activePet && (() => {
                    const pet = PETS[gs.activePet];
                    const level = typeof petLevels[gs.activePet] === 'number' ? petLevels[gs.activePet] : 1;
                    const exp = typeof petExp[gs.activePet] === 'number' ? petExp[gs.activePet] : 0;
                    const nextThresh = level < PET_MAX_LEVEL ? PET_EXP_THRESHOLDS[level - 1] : null;
                    const mult = PET_LEVEL_MULT[level - 1] ?? 1.0;
                    return (
                      <div className="section">
                        <div className="section-title">활성 펫</div>
                        <div className="rod-card" style={{ borderColor: 'rgba(255,170,0,0.4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={evolvingPet === gs.activePet ? 'pet-evolving' : ''} style={{ fontSize: 24 }}>{pet?.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: PET_RARITY_COLOR[pet?.rarity] ?? '#fff' }}>
                                {pet?.name} <span style={{ color: '#ffcc44', fontSize: 12 }}>Lv.{level}</span>
                                {level >= PET_MAX_LEVEL && <span style={{ color: '#ff8844', fontSize: 11, marginLeft: 4 }}>MAX</span>}
                              </div>
                              <div className="rod-meta">{pet?.desc} · 보너스 ×{mult.toFixed(2)}</div>
                              {level < PET_MAX_LEVEL && (
                                <div style={{ marginTop: 4 }}>
                                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                                    EXP {exp} / {nextThresh} (Lv.{level + 1}까지)
                                  </div>
                                  <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                                    <div style={{ width: `${Math.min(100, (exp / nextThresh) * 100)}%`, height: '100%', background: '#ffcc44', borderRadius: 2 }} />
                                  </div>
                                </div>
                              )}
                            </div>
                            <button className="btn-dis" style={{ fontSize: 11 }}
                              onClick={() => { setGs(prev => ({ ...prev, activePet: null })); addMsg('펫 해제됨', 'system'); }}>
                              해제
                            </button>
                          </div>
                          {level < PET_MAX_LEVEL && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                물고기로 먹이주기 (!펫먹이 [물고기명]):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {[...new Set((gs.fishInventory ?? []).map(f => f.name).filter(n => typeof n === 'string'))].slice(0, 6).map(fname => (
                                  <button key={fname} className="btn-eq" style={{ fontSize: 11, padding: '2px 6px' }}
                                    onClick={() => handleCommand(`!펫먹이 ${fname}`)}>
                                    {fname} (+{Math.max(1, Math.ceil((FISH[fname]?.price ?? 20) / 40))}exp)
                                  </button>
                                ))}
                                {(gs.fishInventory?.length ?? 0) === 0 && (
                                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>인벤토리에 물고기 없음</span>
                                )}
                              </div>
                            </div>
                          )}
                          {/* ── 진화 패널 (MAX 레벨 달성 시) ── */}
                          {level >= PET_MAX_LEVEL && (() => {
                            const evolvedEntry = Object.entries(EVOLVE_REQUIREMENTS).find(([, r]) => r.basePet === gs.activePet);
                            if (!evolvedEntry) return null;
                            const [evolvedKey, req] = evolvedEntry;
                            const alreadyEvolved = !!(gs.evolvedPets ?? {})[gs.activePet];
                            if (alreadyEvolved) {
                              const evoData = EVOLVED_PETS[evolvedKey];
                              return (
                                <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,68,255,0.12)', borderRadius: 6, border: '1px solid rgba(255,68,255,0.3)' }}>
                                  <span className={evolvingPet === gs.activePet ? 'pet-evolved-icon' : ''} style={{ fontSize: 22, marginRight: 6 }}>{evoData?.icon}</span>
                                  <span style={{ fontSize: 12, color: '#ff88ff', fontWeight: 700 }}>{evoData?.name} 진화 완료!</span>
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{evoData?.desc}</div>
                                </div>
                              );
                            }
                            const gems = gs.specialItems?.evolutionGem ?? 0;
                            const mythics = gs.specialItems?.mythicOre ?? 0;
                            const canEvolve = gems >= req.evolutionGem && mythics >= req.mythicOre;
                            const evoData = EVOLVED_PETS[evolvedKey];
                            return (
                              <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(150,50,255,0.1)', borderRadius: 6, border: '1px solid rgba(150,50,255,0.3)' }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#cc88ff', marginBottom: 4 }}>✨ 진화 가능: {evoData?.name}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{evoData?.desc}</div>
                                <div style={{ fontSize: 11, marginBottom: 6 }}>
                                  <span style={{ color: gems >= req.evolutionGem ? '#88ff88' : '#ff8888' }}>진화석 {gems}/{req.evolutionGem}</span>
                                  {' · '}
                                  <span style={{ color: mythics >= req.mythicOre ? '#88ff88' : '#ff8888' }}>신화광석 {mythics}/{req.mythicOre}</span>
                                </div>
                                <button
                                  className={canEvolve ? 'btn-buy' : 'btn-dis'}
                                  style={{ fontSize: 11, padding: '3px 10px', cursor: canEvolve ? 'pointer' : 'not-allowed' }}
                                  disabled={!canEvolve}
                                  onClick={() => {
                                    if (!canEvolve) return;
                                    setEvolvingPet(gs.activePet);
                                    setTimeout(() => setEvolvingPet(null), 1400);
                                    handlePetEvolve(evolvedKey);
                                  }}
                                >
                                  진화하기
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="section">
                    <div className="section-title">내 펫 / 알</div>
                    {Object.keys(PETS).every(k => !(gs.petEggs ?? {})[k]) && !gs.activePet
                      ? <div className="empty">보유한 펫 또는 알이 없습니다. 상점에서 구매하세요.</div>
                      : Object.entries(PETS).map(([key, pet]) => {
                          const egg = (gs.petEggs ?? {})[key];
                          if (!egg) return null;
                          const hatched = now >= egg.hatchAt;
                          const isActive = gs.activePet === key;
                          const remainMs = Math.max(0, egg.hatchAt - now);
                          const remainMin = Math.ceil(remainMs / 60000);
                          const level = typeof petLevels[key] === 'number' ? petLevels[key] : 1;
                          return (
                            <div key={key} className="rod-card">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 22 }}>{hatched ? pet.icon : '🥚'}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, color: PET_RARITY_COLOR[pet.rarity] ?? '#fff' }}>
                                    {hatched ? pet.name : `${pet.name} 알`}
                                    {hatched && <span style={{ color: '#ffcc44', fontSize: 11, marginLeft: 4 }}>Lv.{level}</span>}
                                  </div>
                                  <div className="rod-meta">
                                    {hatched ? pet.desc : `부화까지 ${remainMin}분 남음`}
                                  </div>
                                </div>
                                {hatched && !isActive && (
                                  <button className="btn-eq" onClick={() => {
                                    setGs(prev => ({ ...prev, activePet: key }));
                                    addMsg(`${pet.icon} ${pet.name} 장착!`, 'catch');
                                  }}>장착</button>
                                )}
                                {isActive && <span className="badge">장착됨</span>}
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                  <div className="section">
                    <div className="section-title" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>펫 레벨업 안내</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                      물고기를 먹이면 EXP를 얻어 레벨이 오릅니다.<br/>
                      레벨이 높을수록 보너스 효과가 증가합니다.<br/>
                      Lv.2: ×1.25 / Lv.3: ×1.5 / Lv.4: ×1.75 / Lv.5: ×2.0
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ── 관계도 tab ── */}
            {statsTab === '관계도' && (
              <div className="section">
                <div className="section-title">NPC 관계도</div>
                {Object.entries(NPCS).map(([npcKey, npc]) => {
                  const affinity = gs.npcAffinity?.[npcKey] ?? 0;
                  const level = getAffinityLevel(affinity, npcKey);
                  const next = npc.thresholds.find(t => affinity < t.at);
                  return (
                    <div key={npcKey} className="rod-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{npc.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: npc.color }}>{npc.name}</div>
                          <div className="rod-meta">{npc.desc}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12 }}>
                          <div style={{ color: level ? npc.color : '#888', fontWeight: 700 }}>
                            {level ? `[${level.label}]` : '[일반]'}
                          </div>
                          <div style={{ color: '#ffcc44' }}>{affinity} / 100</div>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ width: `${affinity}%`, height: '100%', background: npc.color, borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                      {npc.thresholds.filter(t => affinity >= t.at).map(t => (
                        <div key={t.at} className="affinity-milestone" style={{ fontSize: 11, color: '#88ff88', marginBottom: 1 }}>✓ [{t.label}] {t.reward}</div>
                      ))}
                      {next && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>다음: [{next.label}] 호감도 {next.at} — {next.reward}</div>}
                      {!next && affinity >= 80 && <div style={{ fontSize: 11, color: npc.color, marginTop: 2 }}>최고 관계 달성!</div>}
                      {(() => {
                        const npcQuests = NPC_QUESTS[npcKey];
                        if (!npcQuests) return null;
                        const step = gs.npcQuestStep?.[npcKey] ?? 0;
                        if (step >= npcQuests.length) return (
                          <div style={{ fontSize: 11, color: '#88ff88', marginTop: 4 }}>📜 모든 의뢰 완수!</div>
                        );
                        const q = npcQuests[step];
                        return (
                          <div style={{ marginTop: 6, padding: '5px 8px', background: 'rgba(255,200,50,0.08)', borderRadius: 6, borderLeft: '2px solid #ffcc44' }}>
                            <div style={{ fontSize: 11, color: '#ffcc44', fontWeight: 700 }}>📜 의뢰 {step + 1}/{npcQuests.length}: {q.title}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{q.hint(gs)}</div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
                {(() => {
                  const discount = getShopDiscount(gs.npcAffinity);
                  if (discount > 0) return (
                    <div style={{ padding: '8px 0', fontSize: 12, color: '#ffcc44' }}>
                      현재 상점 할인: {Math.round(discount * 100)}%
                    </div>
                  );
                  return null;
                })()}

                {/* Cosmetic rewards from NPC quests */}
                {((gs.rodSkins ?? []).length > 0 || (gs.ownedCostumes ?? []).length > 0) && (
                  <div style={{ marginTop: 10, padding: '8px', background: 'rgba(255,200,100,0.07)', borderRadius: 8, border: '1px solid rgba(255,200,100,0.2)' }}>
                    <div style={{ fontSize: 12, color: '#ffcc44', fontWeight: 700, marginBottom: 6 }}>🎁 의뢰 보상 컬렉션</div>
                    {(gs.rodSkins ?? []).length > 0 && (
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>낚싯대 스킨</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(gs.rodSkins ?? []).map(skin => (
                            <span key={skin} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(100,200,255,0.15)', borderRadius: 10, border: '1px solid rgba(100,200,255,0.3)', color: '#88ccff' }}>🎣 {skin}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(gs.ownedCostumes ?? []).length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>코스튬</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(gs.ownedCostumes ?? []).map(costume => (
                            <span key={costume} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(200,100,255,0.15)', borderRadius: 10, border: '1px solid rgba(200,100,255,0.3)', color: '#cc88ff' }}>👘 {costume}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── 탐험 tab ── */}
            {statsTab === '탐험' && (
              <div className="section">
                <div className="section-title">탐험 구역 ({(gs.exploredZones ?? []).length} / {EXPLORE_ZONES.length} 발견)</div>
                {EXPLORE_ZONES.map(zone => {
                  const unlocked = (gs.exploredZones ?? []).includes(zone.id);
                  const furnitureExploreRed = (gs.cottage?.furniture ?? []).reduce((sum, f) => sum + Math.abs(FURNITURE[f.key]?.bonus?.exploreReq ?? 0), 0);
                  const canUnlock = Object.entries(zone.reqAbil).every(([abil, req]) => (gs.abilities?.[abil]?.value ?? 0) >= Math.max(0, req - furnitureExploreRed));
                  return (
                    <div key={zone.id} className="rod-card" style={{ opacity: unlocked ? 1 : 0.7, borderColor: unlocked ? 'rgba(100,220,100,0.3)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{zone.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: unlocked ? '#88ff88' : '#ffe0a0' }}>
                            {unlocked ? '✓ ' : '🔒 '}{zone.name}
                          </div>
                          <div className="rod-meta">{zone.desc}</div>
                        </div>
                        {unlocked && <span className="badge" style={{ background: '#1a7a1a' }}>발견됨</span>}
                      </div>
                      {unlocked
                        ? <div style={{ fontSize: 11, color: '#88ff88' }}>혜택: {zone.benefit}</div>
                        : <>
                            <div style={{ fontSize: 11, color: canUnlock ? '#ffcc44' : '#888' }}>
                              조건: {zone.reqLabel}
                            </div>
                            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                              {Object.entries(zone.reqAbil).map(([abil, req]) => {
                                const cur = gs.abilities?.[abil]?.value ?? 0;
                                return (
                                  <span key={abil} style={{ marginRight: 8, color: cur >= req ? '#88ff88' : '#ff8888' }}>
                                    {abil} {cur.toFixed(0)}/{req}
                                  </span>
                                );
                              })}
                            </div>
                          </>
                      }
                    </div>
                  );
                })}
                <div style={{ marginTop: 8 }}>
                  <button className="btn-buy" onClick={() => handleCommand('!탐험')}>
                    🗺 탐험 실행 (!탐험)
                  </button>
                </div>
              </div>
            )}

            {/* ── 농장 tab ── */}
            {statsTab === '농장' && (() => {
              const now = Date.now();
              const plots = gs.farmPlots ?? [];
              const cropInv = gs.cropInventory ?? {};
              const cropEntries = Object.entries(cropInv).filter(([, n]) => n > 0);
              const expCount = gs.farmExpansionCount ?? 0;
              const currentMaxPlots = MAX_FARM_PLOTS + expCount * FARM_EXPANSION_SLOTS;
              const canExpand = expCount < FARM_MAX_EXPANSIONS;
              // Find sellPrice for a crop from SEEDS
              const getCropSellPrice = (itemName) => {
                for (const sd of Object.values(SEEDS)) {
                  if (sd.yield.item === itemName) return sd.yield.sellPrice;
                }
                return 0;
              };
              return (
                <>
                  <div className="section">
                    <div className="section-title">🌱 농장 현황 ({plots.length}/{currentMaxPlots}칸)</div>
                    {plots.length === 0 && (
                      <div className="empty">심은 작물이 없습니다. !심기 [씨앗명] 으로 씨앗을 심으세요.</div>
                    )}
                    {plots.map(plot => {
                      const sd = SEEDS[plot.seed];
                      if (!sd) return null;
                      const isReady = now >= plot.harvestAt;
                      const elapsed = now - plot.plantedAt;
                      const total = plot.harvestAt - plot.plantedAt;
                      const pct = Math.min(100, Math.round((elapsed / total) * 100));
                      const remainMs = Math.max(0, plot.harvestAt - now);
                      const remainMin = Math.ceil(remainMs / 60000);
                      return (
                        <div key={plot.id} className="rod-card" style={{ borderColor: isReady ? 'rgba(100,220,100,0.4)' : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 18 }}>🌱</span>
                            <span style={{ fontWeight: 700, color: isReady ? '#88ff88' : '#ffe0a0' }}>{sd.name}</span>
                            {isReady && <span className="badge" style={{ background: '#1a7a1a' }}>수확 가능!</span>}
                            {!isReady && plot.watered && <span className="badge" style={{ background: '#1a4a8a' }}>💧 물줌</span>}
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: isReady ? '#44ff88' : plot.watered ? '#44aaff' : '#4488ff', borderRadius: 4 }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>
                            {isReady ? `✅ 수확 준비 완료! (수확: ${sd.yield.item})` : `⏳ ${remainMin}분 남음 (${pct}%)${plot.watered ? ' · 물 줌 ✓' : ''}`}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {plots.some(p => now >= p.harvestAt) && (
                        <button className="btn-buy" onClick={() => handleCommand('!수확')}>
                          🌾 전체 수확
                        </button>
                      )}
                      {plots.some(p => !p.watered && now < p.harvestAt) && (
                        <button className="btn-eq" onClick={() => handleCommand('!물주기')}>
                          💧 물 주기 (성장 25%↑)
                        </button>
                      )}
                    </div>
                    {plots.length < currentMaxPlots && (() => {
                      const curSeason = getCurrentSeason();
                      return (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>씨앗 심기 (농장 근처에서):</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(SEEDS).map(([key, sd]) => {
                              const seasonOk = !sd.reqSeason || sd.reqSeason === curSeason?.id;
                              const canAfford = gs.money >= sd.price;
                              const ok = canAfford && seasonOk;
                              return (
                                <button key={key} className={ok ? 'btn-buy' : 'btn-dis'}
                                  style={{ fontSize: 11 }}
                                  disabled={!ok}
                                  title={sd.seasonDesc ?? ''}
                                  onClick={() => handleCommand(`!심기 ${key}`)}>
                                  🌱 {sd.name} ({sd.price}G){sd.reqSeason ? (seasonOk ? ' 🌟' : ' ❌') : ''}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    {canExpand && (
                      <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,200,50,0.1)', borderRadius: 6, border: '1px solid rgba(255,200,50,0.3)' }}>
                        <div style={{ fontSize: 12, color: '#ffcc66', marginBottom: 4 }}>
                          🌾 농장 확장 ({expCount}/{FARM_MAX_EXPANSIONS}회 완료) — +{FARM_EXPANSION_SLOTS}칸 추가
                        </div>
                        <button
                          className={gs.money >= FARM_EXPANSION_PRICE ? 'btn-buy' : 'btn-dis'}
                          style={{ fontSize: 12 }}
                          disabled={gs.money < FARM_EXPANSION_PRICE}
                          onClick={() => {
                            if ((gs.farmExpansionCount ?? 0) >= FARM_MAX_EXPANSIONS) { addMsg('🌾 농장을 더 이상 확장할 수 없습니다. (최대 확장 완료)'); return; }
                            if (gs.money < FARM_EXPANSION_PRICE) { addMsg(`💰 골드 부족 (${FARM_EXPANSION_PRICE}G 필요)`); return; }
                            setGs(prev => ({ ...prev, money: prev.money - FARM_EXPANSION_PRICE, farmExpansionCount: (prev.farmExpansionCount ?? 0) + 1 }));
                            addMsg(`🌾 농장 확장 완료! 이제 ${currentMaxPlots + FARM_EXPANSION_SLOTS}칸 사용 가능`, 'catch');
                          }}>
                          🌾 농장 확장 ({FARM_EXPANSION_PRICE}G)
                        </button>
                      </div>
                    )}
                    {!canExpand && <div style={{ marginTop: 8, fontSize: 11, color: '#aaa' }}>🌾 최대 농장 확장 완료 ({currentMaxPlots}칸)</div>}
                  </div>

                  <div className="section">
                    <div className="section-title">🌾 수확물 창고</div>
                    {cropEntries.length === 0
                      ? <div className="empty">수확한 작물이 없습니다.</div>
                      : cropEntries.map(([itemName, count]) => {
                          const sp = getCropSellPrice(itemName);
                          const total = sp * count;
                          return (
                            <div key={itemName} className="rod-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, color: '#88ff88' }}>🌾 {itemName} ×{count}</span>
                                <span style={{ color: '#ffcc44', fontSize: 12 }}>{sp}G/개 (총 {total}G)</span>
                              </div>
                              <button className="btn-buy" style={{ fontSize: 11 }} onClick={() => {
                                setGs(prev => {
                                  const newCrop = { ...(prev.cropInventory ?? {}), [itemName]: 0 };
                                  const prevStats = prev.achStats ?? {};
                                  const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + total, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + total) };
                                  setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                                  return { ...prev, money: prev.money + total, cropInventory: newCrop, achStats: updatedStats };
                                });
                                addMsg(`💰 ${itemName} ${count}개 판매 +${total}G`, 'catch');
                                grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
                                advanceQuest('sell', total);
                                gainNpcAffinity('상인', Math.max(1, Math.floor(total / 150)));
                              }}>
                                전체 판매 ({total}G)
                              </button>
                            </div>
                          );
                        })
                    }
                  </div>
                </>
              );
            })()}

            {/* ── 박제실 tab ── */}
            {statsTab === '박제실' && (() => {
              const trophies = gs.trophyFish ?? [];
              return (
                <div className="section">
                  <div className="section-title">🏆 희귀어 박제실</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                    전설/신화 어종 포획 시 자동 등록 (최대 20개)
                  </div>
                  {trophies.length === 0
                    ? <div className="empty">아직 전설급 이상 물고기를 낚지 못했습니다.</div>
                    : trophies.map((t, i) => {
                        const rColor = t.rarity === '신화' ? '#ff88ff' : '#ffdd44';
                        const rIcon  = t.rarity === '신화' ? '🌟' : '⭐';
                        const date   = new Date(t.caughtAt).toLocaleDateString('ko-KR');
                        return (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: `rgba(${t.rarity === '신화' ? '120,0,120' : '100,80,0'},0.2)`,
                            border: `1px solid ${rColor}55`,
                            borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                          }}>
                            <div style={{ fontSize: 20 }}>{rIcon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: rColor, fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                              <div style={{ fontSize: 12, color: '#ccc' }}>{t.size}cm · {date}</div>
                            </div>
                            <div style={{ fontSize: 11, color: rColor, background: `${rColor}22`, borderRadius: 4, padding: '2px 6px' }}>
                              {t.rarity}
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 광석 정밀 채굴 미니게임 */}
      {miningMinigame && <MiningMinigame
        oreName={miningMinigame.oreName}
        onFinish={(score) => {
          setMiningMinigame(null);
          if (score > 0) {
            setGs(prev => ({
              ...prev,
              oreInventory: { ...prev.oreInventory, [miningMinigame.oreName]: (prev.oreInventory[miningMinigame.oreName] || 0) + score },
            }));
            addMsg(`⛏ 정밀 채굴 성공! ${miningMinigame.oreName} +${score}개 추가!`, 'catch');
          } else {
            addMsg('⛏ 정밀 채굴 — 이번엔 놓쳤어요.', 'mine');
          }
        }}
      />}

      {/* 대어 저항 미니게임 */}
      {resistanceGame?.active && <ResistanceMinigame
        fishName={resistanceGame.name}
        rarity={resistanceGame.fd?.rarity}
        size={resistanceGame.size}
        onSuccess={onResistanceSuccess}
        onFail={onResistanceFail}
      />}

      {/* Ranking modal */}
      {showRank && <Leaderboard onClose={() => setShowRank(false)} myNickname={nickname} />}

      {/* Player inspect modal */}
      {inspectPlayer && (
        <div className="overlay" onClick={() => setInspectPlayer(null)}>
          <div className="panel inspect-panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>👤 플레이어 정보</span>
              <button tabIndex={-1} onClick={() => setInspectPlayer(null)}>✕</button>
            </div>
            <div className="inspect-header">
              <div className="inspect-title" style={{ color: inspectPlayer.titleColor ?? '#aaa' }}>
                [{inspectPlayer.title ?? '신입'}]
              </div>
              <div className="inspect-name">{inspectPlayer.nickname}</div>
              <div className="inspect-sub">🐟 {inspectPlayer.fishCaught ?? 0}마리 낚음</div>
            </div>
            <div className="section">
              <div className="section-title">장비</div>
              <div className="inspect-equip-row">
                <span style={{ color: RODS[inspectPlayer.rod]?.color ?? '#fff' }}>
                  🎣 {RODS[inspectPlayer.rod]?.name ?? inspectPlayer.rod}
                </span>
              </div>
              <div className="inspect-equip-row">
                <span style={{ color: BOOTS[inspectPlayer.boots]?.color ?? '#aaa' }}>
                  👟 {BOOTS[inspectPlayer.boots]?.name ?? inspectPlayer.boots ?? '기본 신발'}
                </span>
              </div>
            </div>
            <div className="section">
              <div className="section-title">어빌리티</div>
              <div className="inspect-skill-list">
                {Object.entries(ABILITY_DEFS).map(([name, def]) => {
                  const val = inspectPlayer.abilityVals?.[name] ?? 0;
                  const grade = inspectPlayer.abilityGrades?.[name] ?? 0;
                  return (
                    <div key={name} className="inspect-skill-row">
                      <span className="inspect-skill-icon">{def.icon}</span>
                      <span className="inspect-skill-name" style={{ color: def.color }}>{name}</span>
                      <div className="inspect-skill-bar-wrap">
                        <div className="inspect-skill-bar-fill"
                          style={{ width: `${Math.min(100, val)}%`, background: def.color }} />
                      </div>
                      <span className="inspect-skill-lv">{val.toFixed(1)}{grade > 0 ? ` G${grade}` : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quest modal */}
      {showQuest && (
        <div className="overlay" onClick={() => setShowQuest(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>📋 오늘의 퀘스트</span>
              <button tabIndex={-1} onClick={() => setShowQuest(false)}>✕</button>
            </div>
            {currentSeason && (
              <div className="section">
                <div className="rod-card" style={{ borderColor: `${currentSeason.color}66`, background: `${currentSeason.color}18` }}>
                  <div style={{ fontWeight: 700, color: currentSeason.color, marginBottom: 4 }}>
                    {currentSeason.icon} {currentSeason.name} 이벤트 진행 중!
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{currentSeason.desc}</div>
                </div>
              </div>
            )}
            <div className="section">
              {(gs.dailyQuests ?? []).map(q => {
                const cur = Math.min(q.goal, (gs.questProgress ?? {})[q.id] ?? 0);
                const done = cur >= q.goal;
                const claimed = !!(gs.questClaimed ?? {})[q.id];
                const pct = Math.round((cur / q.goal) * 100);
                return (
                  <div key={q.id} className={`quest-card${done ? ' quest-done' : ''}`} style={{ opacity: claimed ? 0.45 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: claimed ? '#aaa' : done ? '#88ff88' : '#ffe0a0' }}>
                        {claimed ? '☑ ' : done ? '✅ ' : ''}{q.label}
                      </span>
                      <span style={{ color: '#ffcc44', fontSize: 12 }}>+{q.reward}G</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: claimed ? '#666' : done ? '#44ff88' : '#4488ff', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{cur} / {q.goal}</span>
                      {done && !claimed && (
                        <button
                          style={{ background: 'rgba(255,220,50,0.25)', color: '#ffdd44', border: '1px solid rgba(255,220,50,0.5)', borderRadius: 6, padding: '3px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                          onClick={() => {
                            setGs(prev => {
                              const newSpXP = (prev.seasonPassXP ?? 0) + 5;
                              const prevStats = prev.achStats ?? {};
                              const updatedStats = { ...prevStats, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + q.reward) };
                              setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                              return {
                                ...prev,
                                money: prev.money + q.reward,
                                questClaimed: { ...(prev.questClaimed ?? {}), [q.id]: true },
                                seasonPassXP: newSpXP,
                                seasonPassTier: Math.min(10, Math.floor(newSpXP / 50)),
                                achStats: updatedStats,
                              };
                            });
                            addMsg(`🎁 퀘스트 보상 수령: +${q.reward}G!`, 'catch');
                            if (gameRef.current) gameRef.current.questCompleteEffect = { age: 0 };
                          }}
                        >
                          🎁 수령
                        </button>
                      )}
                      {claimed && <span style={{ fontSize: 11, color: '#888' }}>수령 완료</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '8px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              퀘스트는 매일 자정에 초기화됩니다
            </div>
          </div>
        </div>
      )}

      {/* Fish encyclopedia modal */}
      {showDex && (() => {
        const DEX_TABS = ['어종', '채집', '광석', '요리', '제작', '포션', '작물', '칭호'];
        // Compute per-tab completion for overall %
        const fishTotal = Object.keys(FISH).length;
        const fishDone = (gs.caughtSpecies ?? []).length;
        const herbTotal = Object.keys(HERBS).length;
        const herbDone = Object.keys(HERBS).filter(h => (gs.herbLog ?? {})[h] > 0).length;
        const oreTotal = Object.keys(ORES).length;
        const oreDone = Object.keys(ORES).filter(o => (gs.oreLog ?? {})[o] > 0).length;
        const dishTotal = Object.keys(DISH_RECIPES).length;
        const dishDone = Object.keys(DISH_RECIPES).filter(d => (gs.dishLog ?? {})[d] > 0).length;
        const smeltTotal = Object.keys(SMELT_RECIPES).length;
        const smeltDone = Object.keys(SMELT_RECIPES).filter(k => (gs.smeltLog ?? {})[k] > 0).length;
        const jewelTotal = Object.keys(JEWELRY_RECIPES).length;
        const jewelDone = Object.keys(JEWELRY_RECIPES).filter(k => (gs.jewelLog ?? {})[k] > 0).length;
        const potionTotal = Object.keys(POTION_RECIPES).length;
        const potionDone = Object.keys(POTION_RECIPES).filter(k => (gs.potionLog ?? {})[k] > 0).length;
        const cropTotal = Object.keys(SEEDS).length;
        const cropDone = Object.keys(SEEDS).filter(s => (gs.cropLog ?? {})[SEEDS[s].yield.item] > 0).length;
        const titleTotal = TITLES.length;
        const titleDone = TITLES.filter(t => t.condition(gs)).length;
        const grandTotal = fishTotal + herbTotal + oreTotal + dishTotal + smeltTotal + jewelTotal + potionTotal + cropTotal + titleTotal;
        const grandDone = fishDone + herbDone + oreDone + dishDone + smeltDone + jewelDone + potionDone + cropDone + titleDone;
        const completePct = grandTotal > 0 ? Math.round(grandDone / grandTotal * 100) : 0;

        return (
          <div className="overlay" onClick={() => setShowDex(false)}>
            <div className="panel" onClick={e => e.stopPropagation()}>
              <div className="panel-head">
                <span>📖 도감 ({completePct}% 완성)</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button tabIndex={-1} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'rgba(100,200,100,0.25)', color: '#88ee88', cursor: 'pointer' }}
                    onClick={() => {
                      const summary = `🎮 타이드헤이븐 도감 현황 (${completePct}% 달성)\n` +
                        `🐟 어종: ${fishDone}/${fishTotal} | 🌿 채집: ${herbDone}/${herbTotal} | ⛏ 광석: ${oreDone}/${oreTotal}\n` +
                        `🍽 요리: ${dishDone}/${dishTotal} | 🔥 제작: ${(smeltDone+jewelDone)}/${(smeltTotal+jewelTotal)} | 🧪 포션: ${potionDone}/${potionTotal} | 🌱 작물: ${cropDone}/${cropTotal}`;
                      navigator.clipboard?.writeText(summary).then(() => addMsg('📋 도감 현황 클립보드 복사 완료!', 'catch')).catch(() => addMsg('클립보드 복사 실패', 'error'));
                    }}>공유</button>
                  <button tabIndex={-1} onClick={() => setShowDex(false)}>✕</button>
                </div>
              </div>
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 4, padding: '6px 10px 2px', flexWrap: 'wrap' }}>
                {DEX_TABS.map(t => (
                  <button key={t} tabIndex={-1} onClick={() => setDexTab(t)}
                    style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: dexTab === t ? 'rgba(100,180,255,0.35)' : 'rgba(255,255,255,0.08)',
                      color: dexTab === t ? '#7df' : 'rgba(255,255,255,0.6)', fontWeight: dexTab === t ? 700 : 400 }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ padding: '6px 16px 12px', overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
                {/* 어종 탭 */}
                {dexTab === '어종' && (() => {
                  const FISH_HINT = {
                    붕어: '낚시 0+ · 부두에서 낚시', 잉어: '낚시 0+ · 부두에서 낚시',
                    미꾸라지: '낚시 0+ · 부두에서 낚시', 메기: '낚시 0+ · 부두에서 낚시',
                    멸치: '낚시 10+ · 부두 낚시', 배스: '낚시 10+ · 부두 낚시',
                    송어: '낚시 10+ · 부두 낚시',
                    꽁치: '낚시 20+ · 미끼 추천', 강꼬치고기: '낚시 20+ · 미끼 추천',
                    황다랑어: '낚시 20+ · 미끼 추천', 금눈돔: '낚시 20+ · 미끼 추천',
                    연어: '낚시 30+ · 심해 부두 추천', 황금붕어: '낚시 30+ · 황금 미끼',
                    오징어: '낚시 30+ · 심해 부두', 낙지: '낚시 30+ · 심해 부두',
                    참치: '낚시 40+ · 바다 낚시', 광어: '낚시 40+ · 바다 낚시',
                    감성돔: '낚시 40+ · 전설 미끼',
                    우럭: '낚시 50+ · 바다·전설 미끼', 뱀장어: '낚시 50+ · 바다 낚시',
                    황새치: '낚시 50+ · 신화 미끼 추천',
                    용고기: '낚시 70+ · 바다·신화 미끼', 고대어: '낚시 70+ · 신화 미끼 필수',
                    피라미: '낚시 10+ · 부두 낚시', 도미: '낚시 20+ · 바다 낚시',
                    해마: '낚시 30+ · 심해 부두 추천', 전갱이: '낚시 40+ · 바다 낚시',
                    부시리: '낚시 50+ · 바다·전설 미끼', 개복치: '낚시 65+ · 바다 낚시',
                    빙어: '낚시 70+ · ❄️ 겨울에 잘 잡힘', 불사조고기: '낚시 70+ · 신화 미끼 추천',
                    크라켄: '🦑 심해 원정대 전용 · 파티 3인+ 심해 입장',
                    해룡: '🐲 심해 원정대 전용 · 파티 3인+ 심해 입장',
                    벚꽃붕어: '🌸 봄 한정 · 낚시 20+', 불꽃송어: '🔥 여름 한정 · 낚시 40+',
                    단풍잉어: '🍂 가을 한정 · 낚시 20+', 빙어왕: '❄️ 겨울 한정 · 낚시 40+',
                  };
                  return (
                    <>
                      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>수집: {fishDone} / {fishTotal}</div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                        <div style={{ width: `${fishDone / fishTotal * 100}%`, height: '100%', background: '#44ffaa', borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {Object.entries(FISH).map(([fishName, fd]) => {
                          const caught = (gs.caughtSpecies ?? []).includes(fishName);
                          const record = (gs.fishRecords ?? {})[fishName];
                          const isMaxSize = record && record.size >= fd.maxSz * 0.97;
                          return (
                            <div key={fishName} style={{
                              background: caught ? (isMaxSize ? 'rgba(255,200,0,0.12)' : 'rgba(68,255,170,0.1)') : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${caught ? (isMaxSize ? 'rgba(255,200,0,0.5)' : 'rgba(68,255,170,0.3)') : 'rgba(255,255,255,0.08)'}`,
                              borderRadius: 6, padding: '6px 10px', opacity: caught ? 1 : 0.65,
                            }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: caught ? (isMaxSize ? '#ffcc44' : '#44ffaa') : '#aaa' }}>
                                {caught ? (isMaxSize ? '🏆 ' : '✓ ') : '🔍 '}{fishName}
                                {fd.reqSeason && <span style={{ fontSize: 10, color: '#ffcc66', marginLeft: 4 }}>[계절]</span>}
                              </div>
                              {caught ? <>
                                <div style={{ fontSize: 10, color: '#888' }}>{fd.rarity} · {fd.price}G~</div>
                                {record && <div style={{ fontSize: 10, color: isMaxSize ? '#ffcc44' : '#aaa' }}>최대: {record.size}cm {isMaxSize ? '(최고!)' : `/ ${fd.maxSz}cm`}</div>}
                              </> : <div style={{ fontSize: 10, color: '#7ab' }}>{FISH_HINT[fishName] ?? '낚시 중 발견 가능'}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
                {/* 채집 탭 */}
                {dexTab === '채집' && (
                  <>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>채집: {herbDone} / {herbTotal}종</div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                      <div style={{ width: `${herbDone / herbTotal * 100}%`, height: '100%', background: '#88ee44', borderRadius: 4 }} />
                    </div>
                    {Object.entries(HERBS).map(([herbName, hd]) => {
                      const count = (gs.herbLog ?? {})[herbName] ?? 0;
                      const done = count > 0;
                      return (
                        <div key={herbName} className="rod-card" style={{ opacity: done ? 1 : 0.6, borderColor: done ? 'rgba(136,238,68,0.4)' : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>🌿</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: done ? '#88ee44' : '#aaa' }}>{done ? '✓ ' : '🔍 '}{herbName}</div>
                              <div style={{ fontSize: 11, color: '#aaa' }}>판매가: {hd.price}G/개</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#ffcc44', fontSize: 13, fontWeight: 700 }}>{count.toLocaleString()}회</div>
                              <div style={{ fontSize: 10, color: '#aaa' }}>총 채집</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {herbDone < herbTotal && <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>💡 숲 구역에서 채집하면 모든 종류를 발견할 수 있습니다.</div>}
                    {herbDone >= herbTotal && <div style={{ fontSize: 11, color: '#88ee44', marginTop: 8 }}>🌿 모든 허브 종류 채집 완료! "숲의 탐험가" 업적 달성 가능</div>}
                  </>
                )}
                {/* 광석 탭 */}
                {dexTab === '광석' && (
                  <>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>채굴: {oreDone} / {oreTotal}종</div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                      <div style={{ width: `${oreDone / oreTotal * 100}%`, height: '100%', background: '#ffaa44', borderRadius: 4 }} />
                    </div>
                    {Object.entries(ORES).map(([oreName, od]) => {
                      const count = (gs.oreLog ?? {})[oreName] ?? 0;
                      const done = count > 0;
                      return (
                        <div key={oreName} className="rod-card" style={{ opacity: done ? 1 : 0.6, borderColor: done ? `${od.color}55` : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>⛏</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: done ? od.color : '#aaa' }}>{done ? '✓ ' : '🔍 '}{oreName}</div>
                              <div style={{ fontSize: 11, color: '#aaa' }}>판매가: {od.price}G/개 · {od.desc ?? ''}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#ffcc44', fontSize: 13, fontWeight: 700 }}>{count.toLocaleString()}개</div>
                              <div style={{ fontSize: 10, color: '#aaa' }}>총 채굴</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {oreDone >= oreTotal && <div style={{ fontSize: 11, color: '#ffaa44', marginTop: 8 }}>💎 모든 광석 종류 채굴 완료! "광석 수집가" 업적 달성 가능</div>}
                  </>
                )}
                {/* 요리 탭 */}
                {dexTab === '요리' && (
                  <>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>완성: {dishDone} / {dishTotal}종</div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                      <div style={{ width: `${dishDone / dishTotal * 100}%`, height: '100%', background: '#ffaa00', borderRadius: 4 }} />
                    </div>
                    {Object.entries(DISH_RECIPES).map(([key, recipe]) => {
                      const count = (gs.dishLog ?? {})[key] ?? 0;
                      const done = count > 0;
                      const discovered = (gs.discoveredRecipes ?? []).includes(key) || done;
                      const locked = recipe.reqNpc && Object.entries(recipe.reqNpc).some(([npc, lv]) => (gs.npcAffinity?.[npc] ?? 0) < lv);
                      if (!discovered) {
                        return (
                          <div key={key} className="rod-card" style={{ opacity: 0.45 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 20 }}>❓</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#666' }}>??? 미발견 레시피</div>
                                <div style={{ fontSize: 11, color: '#555' }}>!조합 [재료] 으로 실험해 발견하세요</div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="rod-card" style={{ opacity: done ? 1 : 0.65, borderColor: done ? 'rgba(255,170,0,0.4)' : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>{locked ? '🔒' : recipe.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: done ? '#ffe0a0' : '#aaa' }}>{done ? '✓ ' : '🔍 '}{recipe.name}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{locked ? '🔒 ' + Object.entries(recipe.reqNpc).map(([n, l]) => `${n} Lv.${l}`).join(', ') : recipe.desc}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#ffcc44', fontSize: 13, fontWeight: 700 }}>{count}회</div>
                              <div style={{ fontSize: 10, color: '#aaa' }}>{recipe.price}G/개</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {dishDone >= dishTotal && <div style={{ fontSize: 11, color: '#ffaa00', marginTop: 8 }}>👨‍🍳 모든 특별 요리 완성! "마스터 셰프" 업적 달성 가능</div>}
                  </>
                )}
                {/* 제작 탭 (제련 + 장신구) */}
                {dexTab === '제작' && (
                  <>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>제련: {smeltDone}/{smeltTotal} · 장신구: {jewelDone}/{jewelTotal}</div>
                    <div className="section-title" style={{ marginTop: 8 }}>🔥 제련 도감</div>
                    {Object.entries(SMELT_RECIPES).map(([key, recipe]) => {
                      const count = (gs.smeltLog ?? {})[key] ?? 0;
                      const done = count > 0;
                      return (
                        <div key={key} className="rod-card" style={{ opacity: done ? 1 : 0.6, borderColor: done ? `${recipe.color}55` : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, color: recipe.color }}>⬡</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: done ? recipe.color : '#aaa' }}>{done ? '✓ ' : '🔍 '}{recipe.name}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{recipe.desc}</div>
                            </div>
                            <div style={{ color: '#ffcc44', fontSize: 12 }}>{count}회</div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="section-title" style={{ marginTop: 12 }}>💍 장신구 도감</div>
                    {Object.entries(JEWELRY_RECIPES).map(([key, recipe]) => {
                      const count = (gs.jewelLog ?? {})[key] ?? 0;
                      const done = count > 0;
                      const equipped = gs.equippedJewelry?.[recipe.slot] === key;
                      return (
                        <div key={key} className="rod-card" style={{ opacity: done ? 1 : 0.6, borderColor: done ? `${recipe.color}55` : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18, color: recipe.color }}>{recipe.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: done ? recipe.color : '#aaa' }}>{done ? '✓ ' : '🔍 '}{recipe.name} {equipped && <span className="badge">장착</span>}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{recipe.desc}</div>
                            </div>
                            <div style={{ color: '#ffcc44', fontSize: 12 }}>{count}회</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {/* 포션 탭 */}
                {dexTab === '포션' && (
                  <>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>제조: {potionDone} / {potionTotal}종</div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                      <div style={{ width: `${potionDone / potionTotal * 100}%`, height: '100%', background: '#cc44ff', borderRadius: 4 }} />
                    </div>
                    {Object.entries(POTION_RECIPES).map(([key, recipe]) => {
                      const count = (gs.potionLog ?? {})[key] ?? 0;
                      const done = count > 0;
                      const stock = (gs.potionInventory ?? {})[key] ?? 0;
                      const isActive = gs.activePotion?.type === key;
                      return (
                        <div key={key} className="rod-card" style={{ opacity: done ? 1 : 0.6, borderColor: done ? `${recipe.color}55` : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18, color: recipe.color }}>{recipe.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: done ? recipe.color : '#aaa' }}>{done ? '✓ ' : '🔍 '}{recipe.name} {isActive && <span className="badge" style={{ background: '#1a88cc' }}>효과중</span>}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{recipe.desc}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#ffcc44', fontSize: 12 }}>{count}회 제조</div>
                              {stock > 0 && <div style={{ fontSize: 10, color: '#88ff88' }}>보유 ×{stock}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {potionDone >= potionTotal && <div style={{ fontSize: 11, color: '#cc44ff', marginTop: 8 }}>⚗️ 모든 포션 제조 완료! "연금술사" 업적 달성 가능</div>}
                  </>
                )}
                {/* 작물 탭 */}
                {dexTab === '작물' && (
                  <>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>수확: {cropDone} / {cropTotal}종</div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                      <div style={{ width: `${cropDone / cropTotal * 100}%`, height: '100%', background: '#66cc44', borderRadius: 4 }} />
                    </div>
                    {Object.entries(SEEDS).map(([seedKey, sd]) => {
                      const cropName = sd.yield.item;
                      const count = (gs.cropLog ?? {})[cropName] ?? 0;
                      const done = count > 0;
                      const seasonal = sd.reqSeason ? `🗓 ${sd.seasonDesc ?? sd.reqSeason}` : null;
                      return (
                        <div key={seedKey} className="rod-card" style={{ opacity: done ? 1 : 0.65, borderColor: done ? 'rgba(102,204,68,0.4)' : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🌱</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: done ? '#66cc44' : '#aaa' }}>
                                {done ? '✓ ' : '🔍 '}{cropName}
                                {seasonal && <span style={{ fontSize: 10, color: '#ffcc66', marginLeft: 4 }}>[계절]</span>}
                              </div>
                              <div style={{ fontSize: 11, color: '#888' }}>{sd.name} · 판매가 {sd.yield.sellPrice}G{seasonal ? ` · ${seasonal}` : ''}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#ffcc44', fontSize: 12, fontWeight: 700 }}>{count.toLocaleString()}개</div>
                              <div style={{ fontSize: 10, color: '#aaa' }}>총 수확</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {cropDone >= cropTotal && <div style={{ fontSize: 11, color: '#66cc44', marginTop: 8 }}>🌾 모든 작물 수확 완료! "대지의 개척자" 업적 달성 가능</div>}
                  </>
                )}
                {/* 칭호 탭 */}
                {dexTab === '칭호' && (
                  <>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>획득: {titleDone} / {titleTotal}종</div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                      <div style={{ width: `${titleDone / titleTotal * 100}%`, height: '100%', background: '#cc88ff', borderRadius: 4 }} />
                    </div>
                    {/* 자동 설정 버튼 */}
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#ccc' }}>현재 장착: <span style={{ color: getTitle(gs).color, fontWeight: 700 }}>[{getTitle(gs).label}]</span></div>
                        {gs.equippedTitle
                          ? <div style={{ fontSize: 10, color: '#aaa' }}>수동 장착 — 효과: {TITLES.find(t => t.label === gs.equippedTitle)?.effectDesc ?? ''}</div>
                          : <div style={{ fontSize: 10, color: '#aaa' }}>자동 설정 (최고 달성 칭호)</div>
                        }
                      </div>
                      {gs.equippedTitle && (
                        <button tabIndex={-1} onClick={() => setGs(prev => ({ ...prev, equippedTitle: null }))}
                          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(200,200,255,0.3)', background: 'rgba(100,100,200,0.25)', color: '#aac', cursor: 'pointer' }}>
                          자동으로
                        </button>
                      )}
                    </div>
                    {TITLES.slice().reverse().map(t => {
                      const unlocked = t.condition(gs);
                      const isEquipped = gs.equippedTitle === t.label;
                      const isAuto = !gs.equippedTitle && getTitle(gs).label === t.label;
                      return (
                        <div key={t.label} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 6,
                          borderRadius: 8, border: `1px solid ${unlocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                          background: isEquipped ? 'rgba(180,100,255,0.15)' : isAuto ? 'rgba(100,180,255,0.10)' : 'rgba(0,0,0,0.2)',
                          opacity: unlocked ? 1 : 0.5,
                        }}>
                          <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{unlocked ? '🏅' : '🔒'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: unlocked ? t.color : '#666' }}>
                              [{t.label}]
                              {isEquipped && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(180,80,255,0.4)', borderRadius: 4, padding: '1px 5px', color: '#ddb' }}>장착 중</span>}
                              {isAuto && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(80,160,255,0.35)', borderRadius: 4, padding: '1px 5px', color: '#adf' }}>자동</span>}
                            </div>
                            <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>🔓 {t.unlockDesc}</div>
                            {unlocked && t.effectDesc !== '없음' && (
                              <div style={{ fontSize: 10, color: '#ffdd88', marginTop: 1 }}>✨ {t.effectDesc}</div>
                            )}
                            {!unlocked && (
                              <div style={{ fontSize: 10, color: '#ff8866', marginTop: 1 }}>🔒 미획득</div>
                            )}
                          </div>
                          {unlocked && !isEquipped && (
                            <button tabIndex={-1}
                              onClick={() => setGs(prev => ({ ...prev, equippedTitle: t.label }))}
                              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(200,150,255,0.4)', background: 'rgba(140,80,220,0.3)', color: '#dcc', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              장착
                            </button>
                          )}
                          {isEquipped && (
                            <button tabIndex={-1}
                              onClick={() => setGs(prev => ({ ...prev, equippedTitle: null }))}
                              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,100,100,0.4)', background: 'rgba(180,60,60,0.3)', color: '#faa', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              해제
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Shop modal */}
      {showShop && (
        <div className="overlay" onClick={() => setShowShop(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>🏪 상점</span>
              <button tabIndex={-1} onClick={() => setShowShop(false)}>✕</button>
            </div>
            <div className="shop-money">보유: {gs.money.toLocaleString()}G
              {getShopDiscount(gs.npcAffinity) > 0 && (
                <span style={{ marginLeft: 10, color: '#88ff88', fontSize: 12 }}>
                  🧑‍💼 상인 할인 -{Math.round(getShopDiscount(gs.npcAffinity) * 100)}%
                </span>
              )}
            </div>

            {/* ── 카테고리 인덱스 ── */}
            <div style={{ padding: '8px 12px 6px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {[
                { id: '낚시대',    icon: '🎣', label: '낚시대' },
                { id: '미끼',      icon: '🪝', label: '미끼' },
                { id: '미끼DIY',   icon: '🌿', label: '미끼DIY' },
                { id: '해양장비',  icon: '🌊', label: '해양장비' },
                { id: '낚싯대스킨', icon: '🎨', label: '로드스킨' },
                { id: '낚시터',    icon: '🪑', label: '낚시터' },
                { id: '신발',      icon: '👟', label: '신발' },
                { id: '요리도구',  icon: '🍳', label: '요리도구' },
                { id: '펫에그',    icon: '🥚', label: '펫에그' },
                { id: '씨앗',      icon: '🌱', label: '씨앗' },
                { id: '펫간식',    icon: '🍖', label: '펫간식' },
                { id: '곡괭이',    icon: '⛏',  label: '곡괭이' },
                { id: '채집도구',  icon: '🧺', label: '채집도구' },
                { id: '모자',      icon: '🎩', label: '모자' },
                { id: '낚시복',    icon: '👘', label: '낚시복' },
                { id: '상의',      icon: '👕', label: '상의' },
                { id: '하의',      icon: '👖', label: '하의' },
                { id: '벨트',      icon: '🪢', label: '벨트' },
                { id: '판매',      icon: '💰', label: '판매' },
              ].map(tab => {
                const active = shopSection === tab.id;
                return (
                  <button key={tab.id} tabIndex={-1} onClick={() => setShopSection(tab.id)} style={{
                    padding: '4px 9px',
                    border: `1px solid ${active ? 'rgba(100,180,255,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 6,
                    background: active ? 'rgba(100,180,255,0.18)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#88ccff' : 'rgba(255,255,255,0.45)',
                    fontSize: 11, fontWeight: active ? 700 : 400,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.12s',
                  }}>
                    {tab.icon} {tab.label}
                  </button>
                );
              })}
            </div>
            <div style={{ borderTop: '1px solid rgba(100,180,255,0.15)', margin: '0 12px 4px' }} />

            {shopSection === '낚시대' && <div className="section">
              <div className="section-title">낚시대</div>
              {Object.entries(RODS).map(([key, rod]) => {
                const owned = gs.ownedRods.includes(key);
                const equipped = gs.rod === key;
                const needMoney = rod.price > 0;
                const canAfford = !needMoney || gs.money >= rod.price;
                const hasMats = rod.upgradeMats
                  ? Object.entries(rod.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const matsStr = rod.upgradeMats
                  ? Object.entries(rod.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ')
                  : null;
                const canBuy = canAfford && hasMats;
                const [tMin, tMax] = rod.catchTimeRange;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: rod.color, fontWeight: 700 }}>🎣 {rod.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {needMoney ? `${rod.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}낚시 {tMin/1000}~{tMax/1000}초
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipRod(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => { buyRod(key); showBuyToast(`${rod.name} 구매 완료`); }} disabled={!canBuy}>
                            {canBuy ? (needMoney ? `${rod.price}G + 재료` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '신발' && <div className="section">
              <div className="section-title">신발 (이동속도)</div>
              {Object.entries(BOOTS).map(([key, boot]) => {
                const owned = (gs.ownedBoots ?? ['기본신발']).includes(key);
                const equipped = gs.boots === key;
                const canAfford = gs.money >= boot.price;
                const hasMats = boot.upgradeMats
                  ? Object.entries(boot.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = boot.upgradeMats ? Object.entries(boot.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: boot.color, fontWeight: 700 }}>👟 {boot.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {boot.price > 0 ? `${boot.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}속도 +{boot.speedBonus > 0 ? `${Math.round(boot.speedBonus / 3.5 * 100)}%` : '기본'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipBoots(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => { buyBoots(key); showBuyToast(`${boot.name} 구매 완료`); }} disabled={!canBuy}>
                            {canBuy ? (boot.price > 0 ? `${boot.price}G 구매` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '미끼' && <div className="section">
              <div className="section-title">미끼</div>
              {Object.entries(BAIT).map(([key, bait]) => {
                const isPerm = bait.type === 'permanent';
                const owned = isPerm ? (gs.ownedBait ?? []).includes(key) : false;
                const equipped = gs.equippedBait === key;
                const stock = (gs.baitInventory ?? {})[key] ?? 0;
                const canAfford = gs.money >= bait.price;
                return (
                  <div key={key} className="rod-card" style={equipped ? { borderColor: 'rgba(170,68,255,0.4)', background: 'rgba(170,68,255,0.07)' } : {}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ color: bait.color, fontWeight: 700 }}>🪝 {bait.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {isPerm && owned && !equipped && <span className="badge owned">보유</span>}
                      {!isPerm && stock > 0 && <span className="badge owned">×{stock}</span>}
                    </div>
                    <div className="rod-meta">{bait.price}G · {bait.desc}</div>
                    <div style={{ marginTop: 5, display: 'flex', gap: 6 }}>
                      {isPerm && owned
                        ? <button tabIndex={-1} className={equipped ? 'btn-dis' : 'btn-eq'} onClick={() => equipBait(key)} disabled={equipped}>
                            {equipped ? '장착중' : '장착'}
                          </button>
                        : <button tabIndex={-1} className={canAfford ? 'btn-buy' : 'btn-dis'} onClick={() => { buyBait(key); showBuyToast(`${bait.name} 구매 완료`); }} disabled={!canAfford}>
                            {canAfford ? `${bait.price}G 구매` : '💰 부족'}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '미끼DIY' && <div className="section">
              <div className="section-title">🌿 미끼 DIY 제작</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>허브 + 광석 조합으로 커스텀 미끼 제작</div>
              {Object.entries(BAIT_RECIPES).map(([key, recipe]) => {
                const herbOk = Object.entries(recipe.input).filter(([k]) => ['들풀','버섯','희귀허브'].includes(k)).every(([h, n]) => (gs.herbInventory?.[h] ?? 0) >= n);
                const oreOk = Object.entries(recipe.input).filter(([k]) => ['철광석','구리광석','수정','금광석'].includes(k)).every(([o, n]) => (gs.oreInventory?.[o] ?? 0) >= n);
                const canCraft = herbOk && oreOk;
                const stock = (gs.baitInventory ?? {})[recipe.name] ?? 0;
                return (
                  <div key={key} className="rod-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 18 }}>{recipe.icon}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: '#ffe0a0' }}>{recipe.name}</span>
                        {stock > 0 && <span style={{ marginLeft: 6, color: '#88ff88', fontSize: 11 }}>×{stock}</span>}
                        <div style={{ fontSize: 11, color: '#888' }}>{recipe.effect}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, marginBottom: 4 }}>
                      재료:{' '}
                      {Object.entries(recipe.input).map(([item, n]) => {
                        const isHerb = ['들풀','버섯','희귀허브'].includes(item);
                        const have = isHerb ? (gs.herbInventory?.[item] ?? 0) : (gs.oreInventory?.[item] ?? 0);
                        return (
                          <span key={item} style={{ marginRight: 6, color: have >= n ? '#88ff88' : '#ff8888' }}>
                            {item} {have}/{n}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button tabIndex={-1} className={canCraft ? 'btn-buy' : 'btn-dis'} disabled={!canCraft} style={{ fontSize: 11 }}
                        onClick={() => {
                          setGs(prev => {
                            const herbs = { ...(prev.herbInventory ?? {}) };
                            const ores = { ...prev.oreInventory };
                            for (const [item, n] of Object.entries(recipe.input)) {
                              if (['들풀','버섯','희귀허브'].includes(item)) herbs[item] = Math.max(0, (herbs[item] ?? 0) - n);
                              else ores[item] = Math.max(0, (ores[item] ?? 0) - n);
                            }
                            const newBait = { ...(prev.baitInventory ?? {}), [recipe.name]: ((prev.baitInventory ?? {})[recipe.name] ?? 0) + 1 };
                            const newDiyLog = { ...(prev.diyBaitLog ?? {}), [key]: ((prev.diyBaitLog ?? {})[key] ?? 0) + 1 };
                            if (!prev.ownedBait.includes(recipe.name)) {
                              return { ...prev, herbInventory: herbs, oreInventory: ores, baitInventory: newBait, diyBaitLog: newDiyLog, ownedBait: [...prev.ownedBait, recipe.name] };
                            }
                            return { ...prev, herbInventory: herbs, oreInventory: ores, baitInventory: newBait, diyBaitLog: newDiyLog };
                          });
                          addMsg(`${recipe.icon} ${recipe.name} 제작 완료!`, 'catch');
                        }}>
                        {canCraft ? '제작' : '재료 부족'}
                      </button>
                      {stock > 0 && (
                        <button tabIndex={-1}
                          className={gs.equippedBait === key ? 'btn-eq' : 'sell-btn'}
                          style={{ fontSize: 11 }}
                          onClick={() => equipBait(key)}>
                          {gs.equippedBait === key ? '장착중' : '장착'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '요리도구' && <div className="section">
              <div className="section-title">요리 도구</div>
              {Object.entries(COOKWARE).map(([key, cw]) => {
                const owned = (gs.ownedCookware ?? []).includes(key);
                const equipped = gs.cookware === key;
                const canAfford = gs.money >= cw.price;
                const hasMats = cw.upgradeMats ? Object.entries(cw.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n) : true;
                const matsStr = cw.upgradeMats ? Object.entries(cw.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                const canBuy = canAfford && hasMats;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ color: cw.color, fontWeight: 700 }}>🍳 {cw.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {cw.price}G{matsStr ? ` + ${matsStr}` : ''} · {cw.desc}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipCookware(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyCookware(key)} disabled={!canBuy}>
                            {canBuy ? `${cw.price}G 구매` : (!canAfford ? '💰 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '해양장비' && <div className="section">
              <div className="section-title">🌊 해양 장비 (바다 낚시)</div>
              {Object.entries(MARINE_GEAR).map(([key, gear]) => {
                const owned = (gs.ownedMarineGear ?? []).includes(key);
                const equipped = gs.marineGear === key;
                const canAfford = gs.money >= gear.price;
                const hasMats = gear.upgradeMats
                  ? Object.entries(gear.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = gear.upgradeMats ? Object.entries(gear.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: gear.color, fontWeight: 700 }}>🌊 {gear.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {gear.price}G{matsStr ? ` + 재료: ${matsStr}` : ''} · {gear.desc}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? <button tabIndex={-1} className={equipped ? 'btn-dis' : 'btn-eq'} onClick={() => equipMarineGear(key)}>
                            {equipped ? '해제' : '장착'}
                          </button>
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyMarineGear(key)} disabled={!canBuy}>
                            {canBuy ? `${gear.price}G 구매` : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '곡괭이' && <div className="section">
              <div className="section-title">⛏ 곡괭이 (채굴 도구)</div>
              {Object.entries(PICKAXES).map(([key, px]) => {
                const owned = (gs.ownedPickaxes ?? ['나무곡괭이']).includes(key);
                const equipped = gs.pickaxe === key;
                const canAfford = gs.money >= px.price;
                const hasMats = px.upgradeMats
                  ? Object.entries(px.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = px.upgradeMats ? Object.entries(px.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: px.color, fontWeight: 700 }}>⛏ {px.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {px.price > 0 ? `${px.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}{px.desc}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipPickaxe(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyPickaxe(key)} disabled={!canBuy}>
                            {canBuy ? (px.price > 0 ? `${px.price}G 구매` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '채집도구' && <div className="section">
              <div className="section-title">🌿 채집 도구</div>
              {Object.entries(GATHER_TOOLS).map(([key, gt]) => {
                const owned = (gs.ownedGatherTools ?? ['맨손']).includes(key);
                const equipped = gs.gatherTool === key;
                const canAfford = gs.money >= gt.price;
                const hasMats = gt.upgradeMats
                  ? Object.entries(gt.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = gt.upgradeMats ? Object.entries(gt.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: gt.color, fontWeight: 700 }}>🌿 {gt.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {gt.price > 0 ? `${gt.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}{gt.desc}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipGatherTool(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyGatherTool(key)} disabled={!canBuy}>
                            {canBuy ? (gt.price > 0 ? `${gt.price}G 구매` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '모자' && <div className="section">
              <div className="section-title">🎩 모자</div>
              {Object.entries(HATS).map(([key, hat]) => {
                const owned = (gs.ownedHats ?? []).includes(key);
                const equipped = gs.hat === key;
                const discount = 1 - getShopDiscount(gs.npcAffinity);
                const price = Math.floor(hat.price * discount);
                const canAfford = gs.money >= price;
                const hasMats = hat.upgradeMats
                  ? Object.entries(hat.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: hat.color, fontWeight: 700 }}>{hat.icon} {hat.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{price > 0 ? `${price}G` : '무료'} · {hat.desc}</div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => setGs(prev => ({ ...prev, hat: key }))}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                            onClick={() => {
                              if (!canBuy) return;
                              const newOre = { ...gs.oreInventory };
                              if (hat.upgradeMats) Object.entries(hat.upgradeMats).forEach(([k, n]) => { newOre[k] = (newOre[k] || 0) - n; });
                              setGs(prev => ({ ...prev, money: prev.money - price, ownedHats: [...(prev.ownedHats ?? []), key], hat: key, oreInventory: newOre }));
                              gainNpcAffinity('상인', 1);
                              addMsg(`🎩 ${hat.name} 구매!`, 'catch');
                            }}>
                            {canBuy ? `${price}G` : (!canAfford ? '💰 부족' : '재료 부족')}
                          </button>
                      }
                      {owned && equipped && <button tabIndex={-1} className="btn-eq" style={{ opacity: 0.5 }} onClick={() => setGs(prev => ({ ...prev, hat: null }))}>탈착</button>}
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '낚시복' && <div className="section">
              <div className="section-title">🧥 낚시복</div>
              {Object.entries(FISHING_OUTFITS).map(([key, outfit]) => {
                const owned = (gs.ownedOutfits ?? ['기본낚시복']).includes(key);
                const equipped = gs.outfit === key;
                const discount = 1 - getShopDiscount(gs.npcAffinity);
                const price = Math.floor(outfit.price * discount);
                const canAfford = gs.money >= price;
                const hasMats = outfit.upgradeMats
                  ? Object.entries(outfit.upgradeMats).every(([k, n]) => {
                      if (HERBS[k]) return (gs.herbInventory?.[k] || 0) >= n;
                      return (gs.oreInventory[k] || 0) >= n;
                    })
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = outfit.upgradeMats
                  ? Object.entries(outfit.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ')
                  : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: outfit.color === '#ffffff' ? '#ddd' : outfit.color, fontWeight: 700 }}>{outfit.icon} {outfit.name}</span>
                      {equipped && <span className="badge">착용됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{price > 0 ? `${price}G` : '무료'}{matsStr ? ` + ${matsStr}` : ''} · {outfit.desc}</div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => setGs(prev => ({ ...prev, outfit: key }))}>착용</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                            onClick={() => {
                              if (!canBuy) return;
                              const newOre = { ...gs.oreInventory };
                              const newHerb = { ...(gs.herbInventory ?? {}) };
                              if (outfit.upgradeMats) Object.entries(outfit.upgradeMats).forEach(([k, n]) => {
                                if (HERBS[k]) newHerb[k] = (newHerb[k] || 0) - n;
                                else newOre[k] = (newOre[k] || 0) - n;
                              });
                              setGs(prev => ({ ...prev, money: prev.money - price, ownedOutfits: [...(prev.ownedOutfits ?? []), key], outfit: key, oreInventory: newOre, herbInventory: newHerb }));
                              gainNpcAffinity('상인', 1);
                              addMsg(`🧥 ${outfit.name} 구매!`, 'catch');
                            }}>
                            {canBuy ? `${price}G` : (!canAfford ? '💰 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '상의' && <div className="section">
              <div className="section-title">👕 상의</div>
              {Object.entries(TOPS).map(([key, item]) => {
                const owned = (gs.ownedTops ?? ['기본상의']).includes(key);
                const equipped = gs.top === key;
                const discount = 1 - getShopDiscount(gs.npcAffinity);
                const price = Math.floor(item.price * discount);
                const canAfford = gs.money >= price;
                const hasMats = item.upgradeMats
                  ? Object.entries(item.upgradeMats).every(([k, n]) => (gs.oreInventory[k] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = item.upgradeMats
                  ? Object.entries(item.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ')
                  : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: item.color, fontWeight: 700 }}>{item.icon} {item.name}</span>
                      {equipped && <span className="badge">착용됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{price > 0 ? `${price}G` : '무료'}{matsStr ? ` + ${matsStr}` : ''} · {item.desc}</div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => setGs(prev => ({ ...prev, top: key }))}>착용</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                            onClick={() => {
                              if (!canBuy) return;
                              const newOre = { ...gs.oreInventory };
                              if (item.upgradeMats) Object.entries(item.upgradeMats).forEach(([k, n]) => { newOre[k] = (newOre[k] || 0) - n; });
                              setGs(prev => ({ ...prev, money: prev.money - price, ownedTops: [...(prev.ownedTops ?? []), key], top: key, oreInventory: newOre }));
                              gainNpcAffinity('상인', 1);
                              addMsg(`👕 ${item.name} 구매!`, 'catch');
                            }}>
                            {canBuy ? `${price}G` : (!canAfford ? '💰 부족' : '재료 부족')}
                          </button>
                      }
                      {owned && equipped && key !== '기본상의' && <button tabIndex={-1} className="btn-eq" style={{ opacity: 0.5 }} onClick={() => setGs(prev => ({ ...prev, top: '기본상의' }))}>탈착</button>}
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '하의' && <div className="section">
              <div className="section-title">👖 하의</div>
              {Object.entries(BOTTOMS).map(([key, item]) => {
                const owned = (gs.ownedBottoms ?? ['기본하의']).includes(key);
                const equipped = gs.bottom === key;
                const discount = 1 - getShopDiscount(gs.npcAffinity);
                const price = Math.floor(item.price * discount);
                const canAfford = gs.money >= price;
                const hasMats = item.upgradeMats
                  ? Object.entries(item.upgradeMats).every(([k, n]) => (gs.oreInventory[k] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = item.upgradeMats
                  ? Object.entries(item.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ')
                  : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: item.color, fontWeight: 700 }}>{item.icon} {item.name}</span>
                      {equipped && <span className="badge">착용됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{price > 0 ? `${price}G` : '무료'}{matsStr ? ` + ${matsStr}` : ''} · {item.desc}</div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => setGs(prev => ({ ...prev, bottom: key }))}>착용</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                            onClick={() => {
                              if (!canBuy) return;
                              const newOre = { ...gs.oreInventory };
                              if (item.upgradeMats) Object.entries(item.upgradeMats).forEach(([k, n]) => { newOre[k] = (newOre[k] || 0) - n; });
                              setGs(prev => ({ ...prev, money: prev.money - price, ownedBottoms: [...(prev.ownedBottoms ?? []), key], bottom: key, oreInventory: newOre }));
                              gainNpcAffinity('상인', 1);
                              addMsg(`👖 ${item.name} 구매!`, 'catch');
                            }}>
                            {canBuy ? `${price}G` : (!canAfford ? '💰 부족' : '재료 부족')}
                          </button>
                      }
                      {owned && equipped && key !== '기본하의' && <button tabIndex={-1} className="btn-eq" style={{ opacity: 0.5 }} onClick={() => setGs(prev => ({ ...prev, bottom: '기본하의' }))}>탈착</button>}
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '벨트' && <div className="section">
              <div className="section-title">🪢 벨트</div>
              {Object.entries(BELTS).map(([key, item]) => {
                const owned = (gs.ownedBelts ?? []).includes(key);
                const equipped = gs.belt === key;
                const discount = 1 - getShopDiscount(gs.npcAffinity);
                const price = Math.floor(item.price * discount);
                const canAfford = gs.money >= price;
                const hasMats = item.upgradeMats
                  ? Object.entries(item.upgradeMats).every(([k, n]) => (gs.oreInventory[k] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = item.upgradeMats
                  ? Object.entries(item.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ')
                  : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: item.color, fontWeight: 700 }}>{item.icon} {item.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{price > 0 ? `${price}G` : '무료'}{matsStr ? ` + ${matsStr}` : ''} · {item.desc}</div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => setGs(prev => ({ ...prev, belt: key }))}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                            onClick={() => {
                              if (!canBuy) return;
                              const newOre = { ...gs.oreInventory };
                              if (item.upgradeMats) Object.entries(item.upgradeMats).forEach(([k, n]) => { newOre[k] = (newOre[k] || 0) - n; });
                              setGs(prev => ({ ...prev, money: prev.money - price, ownedBelts: [...(prev.ownedBelts ?? []), key], belt: key, oreInventory: newOre }));
                              gainNpcAffinity('상인', 1);
                              addMsg(`🪢 ${item.name} 구매!`, 'catch');
                            }}>
                            {canBuy ? `${price}G` : (!canAfford ? '💰 부족' : '재료 부족')}
                          </button>
                      }
                      {owned && equipped && <button tabIndex={-1} className="btn-eq" style={{ opacity: 0.5 }} onClick={() => setGs(prev => ({ ...prev, belt: null }))}>탈착</button>}
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '낚싯대스킨' && <div className="section">
              <div className="section-title">🎨 낚싯대 스킨</div>
              {Object.entries(ROD_SKINS).filter(([key, skin]) => !skin.questOnly || (gs.ownedRodSkins ?? []).includes(key)).map(([key, skin]) => {
                const owned = (gs.ownedRodSkins ?? ['기본스킨']).includes(key);
                const equipped = gs.activeRodSkin === key;
                const canAfford = gs.money >= skin.price;
                const hasMats = skin.upgradeMats
                  ? Object.entries(skin.upgradeMats).every(([k, n]) => (gs.processedOreInventory?.[k] || 0) >= n)
                  : true;
                const reqMythicMet = skin.reqMythic
                  ? (gs.trophyFish ?? []).filter(t => t.name === skin.reqMythic && t.rarity === '신화').length >= (skin.reqCount ?? 1)
                  : true;
                const canUnlock = (skin.price === 0 ? hasMats && reqMythicMet : canAfford && hasMats);
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: skin.color, fontWeight: 700 }}>🎣 {skin.name}</span>
                      {equipped && <span className="badge">적용됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {skin.price > 0 ? `${skin.price}G` : '무료'}
                      {skin.upgradeMats ? ` + 재료: ${Object.entries(skin.upgradeMats).map(([k,n])=>`${k}×${n}`).join(', ')}` : ''}
                      {skin.reqMythic ? ` (${skin.reqMythic} 신화 ${skin.reqCount}마리 포획 조건)` : ''}
                      {' · '}{skin.desc}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => setGs(prev => ({ ...prev, activeRodSkin: key }))}>적용</button>)
                        : <button tabIndex={-1} className={canUnlock ? 'btn-buy' : 'btn-dis'} disabled={!canUnlock}
                            onClick={() => {
                              if (!canUnlock) return;
                              const newOre = { ...gs.processedOreInventory };
                              if (skin.upgradeMats) Object.entries(skin.upgradeMats).forEach(([k, n]) => { newOre[k] = (newOre[k] || 0) - n; });
                              setGs(prev => ({ ...prev, money: prev.money - skin.price, ownedRodSkins: [...(prev.ownedRodSkins ?? []), key], activeRodSkin: key, processedOreInventory: newOre }));
                              if (skin.price > 0) gainNpcAffinity('상인', 1);
                              addMsg(`🎨 ${skin.name} 획득!`, 'catch');
                            }}>
                            {canUnlock ? (skin.price > 0 ? `${skin.price}G` : '해금') : (skin.reqMythic && !reqMythicMet ? '조건 미달' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '낚시터' && <div className="section">
              <div className="section-title">🪑 낚시터 꾸미기</div>
              {Object.entries(SPOT_DECOS).map(([key, deco]) => {
                const owned = (gs.spotDecos ?? []).includes(key) || key === '기본의자';
                const canAfford = gs.money >= deco.price;
                const hasMats = deco.upgradeMats
                  ? Object.entries(deco.upgradeMats).every(([k, n]) => (gs.processedOreInventory?.[k] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats && !owned;
                return (
                  <div key={key} className="rod-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{deco.icon} {deco.name}</span>
                      {owned && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{deco.price > 0 ? `${deco.price}G` : '기본 제공'} · {deco.desc}</div>
                    {!owned && (
                      <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                        onClick={() => {
                          if (!canBuy) return;
                          setGs(prev => ({ ...prev, money: prev.money - deco.price, spotDecos: [...(prev.spotDecos ?? []), key] }));
                          if (deco.price > 0) gainNpcAffinity('상인', 1);
                          addMsg(`${deco.icon} ${deco.name} 설치!`, 'catch');
                        }}>
                        {canBuy ? `${deco.price}G` : (!canAfford ? '💰 부족' : '이미 보유')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>}

            {shopSection === '펫에그' && <div className="section">
              <div className="section-title">🥚 펫 에그</div>
              {Object.entries(PETS).map(([key, pet]) => {
                const egg = (gs.petEggs ?? {})[key];
                const canAfford = gs.money >= pet.eggPrice;
                const hatchMs = pet.hatchMs;
                const hatchMin = Math.round(hatchMs / 60000);
                return (
                  <div key={key} className="rod-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 20 }}>{pet.icon}</span>
                      <span style={{ fontWeight: 700, color: PET_RARITY_COLOR[pet.rarity] ?? '#fff' }}>{pet.name}</span>
                      <span style={{ fontSize: 11, color: PET_RARITY_COLOR[pet.rarity] ?? '#aaa' }}>[{pet.rarity}]</span>
                      {egg && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{pet.desc}</div>
                    <div className="rod-meta">{pet.eggPrice}G · 부화 {hatchMin}분</div>
                    <div style={{ marginTop: 5 }}>
                      {egg ? (
                        <span style={{ fontSize: 11, color: '#aaa' }}>
                          {Date.now() >= egg.hatchAt ? '부화 완료! 스탯창 펫 탭에서 확인' : `부화까지 ${Math.ceil((egg.hatchAt - Date.now()) / 60000)}분`}
                        </span>
                      ) : (
                        <button tabIndex={-1} className={canAfford ? 'btn-buy' : 'btn-dis'} disabled={!canAfford}
                          onClick={() => {
                            if (gs.money < pet.eggPrice) { addMsg('💰 골드 부족', 'error'); return; }
                            const boughtAt = Date.now();
                            const hatchAt = boughtAt + pet.hatchMs;
                            setGs(prev => ({
                              ...prev,
                              money: prev.money - pet.eggPrice,
                              petEggs: { ...(prev.petEggs ?? {}), [key]: { boughtAt, hatchAt } },
                            }));
                            gainNpcAffinity('상인', 2);
                            addMsg(`🥚 ${pet.name} 알 구매! ${hatchMin}분 후 부화됩니다.`, 'catch');
                          }}>
                          {canAfford ? `${pet.eggPrice}G 구매` : '💰 골드 부족'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>}

            {shopSection === '판매' && <div className="section">
              <div className="section-title">광석 판매</div>
              {Object.entries(gs.oreInventory ?? {}).every(([, n]) => n === 0)
                ? <div className="empty">판매할 광석 없음</div>
                : <div>
                    {Object.entries(gs.oreInventory ?? {}).filter(([, n]) => n > 0).map(([ore, count]) => {
                      const oreColors = { 철광석: '#cc8844', 구리광석: '#44ccaa', 수정: '#aa66ff', 금광석: '#ffd700' };
                      const petSell = 1 + (gameRef.current?.petBonus?.sellBonus ?? 0);
                      const speechMult = 1 + (gs.abilities?.화술?.value ?? 0) * 0.005;
                      const mtnBuffOre = gameRef.current?.mountainBuff;
                      const mtnOreSell = (mtnBuffOre?.type === 'sellPrice' && Date.now() < mtnBuffOre.expiresAt) ? 1.15 : 1.0;
                      const price = Math.round((ORES[ore]?.price ?? 100) * petSell * speechMult * mtnOreSell);
                      const qtyKey = `ore_${ore}`;
                      const qty = Math.min(count, Math.max(1, parseInt(sellQty[qtyKey] ?? count) || count));
                      const total = price * qty;
                      return (
                        <div key={ore} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: oreColors[ore] ?? '#fff', fontWeight: 700 }}>⛏ {ore} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>{price}G/개</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min={1} max={count} value={sellQty[qtyKey] ?? count}
                              onChange={e => setSellQty(prev => ({ ...prev, [qtyKey]: e.target.value }))}
                              style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                            <span style={{ color: '#ffcc44', fontSize: 12, flex: 1 }}>{total.toLocaleString()}G</span>
                            <button tabIndex={-1} className="btn-eq" style={{ fontSize: 11 }} onClick={() => setSellQty(prev => ({ ...prev, [qtyKey]: count }))}>전체</button>
                            <button tabIndex={-1} className="btn-buy" onClick={() => {
                              setGs(prev => {
                                const prevStats = prev.achStats ?? {};
                                const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + total, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + total) };
                                setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                                return { ...prev, money: prev.money + total, oreInventory: { ...prev.oreInventory, [ore]: count - qty }, achStats: updatedStats };
                              });
                              addMsg(`💰 ${ore} ${qty}개 → ${total}G!`, 'catch');
                              grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
                              advanceQuest('sell', total);
                              gainNpcAffinity('상인', Math.max(1, Math.floor(total / 150)));
                              setSellQty(prev => ({ ...prev, [qtyKey]: '' }));
                            }}>판매</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>}

            {shopSection === '판매' && <div className="section">
              <div className="section-title">허브 판매</div>
              {Object.keys(gs.herbInventory ?? {}).filter(k => (gs.herbInventory[k] ?? 0) > 0).length === 0
                ? <div className="empty">판매할 허브 없음</div>
                : <div>
                    {Object.entries(gs.herbInventory ?? {}).filter(([, n]) => n > 0).map(([herb, count]) => {
                      const petSellH = 1 + (gameRef.current?.petBonus?.sellBonus ?? 0);
                      const speechMultH = 1 + (gs.abilities?.화술?.value ?? 0) * 0.005;
                      const price = Math.round((HERBS[herb]?.price ?? 0) * petSellH * speechMultH);
                      const qtyKey = `herb_${herb}`;
                      const qty = Math.min(count, Math.max(1, parseInt(sellQty[qtyKey] ?? count) || count));
                      const total = price * qty;
                      return (
                        <div key={herb} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: HERBS[herb]?.color ?? '#8c4', fontWeight: 700 }}>🌿 {herb} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>{price}G/개</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min={1} max={count} value={sellQty[qtyKey] ?? count}
                              onChange={e => setSellQty(prev => ({ ...prev, [qtyKey]: e.target.value }))}
                              style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                            <span style={{ color: '#ffcc44', fontSize: 12, flex: 1 }}>{total.toLocaleString()}G</span>
                            <button tabIndex={-1} className="btn-eq" style={{ fontSize: 11 }} onClick={() => setSellQty(prev => ({ ...prev, [qtyKey]: count }))}>전체</button>
                            <button tabIndex={-1} className="btn-buy" onClick={() => {
                              setGs(prev => {
                                const prevStats = prev.achStats ?? {};
                                const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + total, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + total) };
                                setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                                return { ...prev, money: prev.money + total, herbInventory: { ...(prev.herbInventory ?? {}), [herb]: count - qty }, achStats: updatedStats };
                              });
                              addMsg(`💰 ${herb} ${qty}개 → ${total}G!`, 'catch');
                              grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
                              advanceQuest('sell', total);
                              gainNpcAffinity('상인', Math.max(1, Math.floor(total / 150)));
                              setSellQty(prev => ({ ...prev, [qtyKey]: '' }));
                            }}>판매</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>}

            {shopSection === '판매' && <div className="section">
              <div className="section-title">물고기 판매</div>
              {gs.fishInventory.length === 0
                ? <div className="empty">판매할 물고기 없음</div>
                : <>
                    <button tabIndex={-1} className="sell-all-btn" onClick={() => { sellAll(); }}>
                      전체 판매 ({totalFishVal}G)
                    </button>
                    {/* Group by species */}
                    {Object.entries(
                      gs.fishInventory.reduce((acc, f) => {
                        if (!acc[f.name]) acc[f.name] = { items: [], totalPrice: 0 };
                        acc[f.name].items.push(f);
                        acc[f.name].totalPrice += f.price;
                        return acc;
                      }, {})
                    ).map(([species, { items, totalPrice }]) => {
                      const fd = FISH[species];
                      const rarityColors = { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' };
                      const qtyKey = `fish_${species}`;
                      const count = items.length;
                      const qty = Math.min(count, Math.max(1, parseInt(sellQty[qtyKey] ?? count) || count));
                      const unitPrice = Math.round(totalPrice / count);
                      const sellTotal = items.slice(0, qty).reduce((s, f) => s + f.price, 0);
                      return (
                        <div key={species} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: rarityColors[fd?.rarity] ?? '#fff', fontWeight: 700 }}>🐟 {species} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>~{unitPrice}G/개</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min={1} max={count} value={sellQty[qtyKey] ?? count}
                              onChange={e => setSellQty(prev => ({ ...prev, [qtyKey]: e.target.value }))}
                              style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                            <span style={{ color: '#ffcc44', fontSize: 12, flex: 1 }}>{sellTotal.toLocaleString()}G</span>
                            <button tabIndex={-1} className="btn-eq" style={{ fontSize: 11 }} onClick={() => setSellQty(prev => ({ ...prev, [qtyKey]: count }))}>전체</button>
                            <button tabIndex={-1} className="btn-buy" onClick={() => {
                              const toSell = items.slice(0, qty);
                              const ids = new Set(toSell.map(f => f.id));
                              const earned = toSell.reduce((s, f) => s + f.price, 0);
                              setGs(prev => {
                                const prevStats = prev.achStats ?? {};
                                const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + earned, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + earned) };
                                setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                                return { ...prev, money: prev.money + earned, fishInventory: prev.fishInventory.filter(f => !ids.has(f.id)), achStats: updatedStats };
                              });
                              addMsg(`💰 ${species} ${qty}마리 → ${earned}G!`, 'catch');
                              grantAbility('화술', Math.max(0.01, Math.floor(earned / 100) * SELL_ABILITY_PER_100G));
                              advanceQuest('sell', earned);
                              gainNpcAffinity('상인', Math.max(1, Math.floor(earned / 150)));
                              playSellSound(earned);
                              setSellQty(prev => ({ ...prev, [qtyKey]: '' }));
                            }}>판매</button>
                          </div>
                        </div>
                      );
                    })}
                  </>
              }
            </div>}

            {shopSection === '판매' && (() => {
              const today = new Date().toDateString();
              let orders = gs.deliveryOrders ?? [];
              // Generate new orders daily
              if ((gs.deliveryDate ?? '') !== today || orders.length === 0) {
                // This is render-time generation — just show what we'd show; actual generation is in App via command or this triggers via state
                // We generate a preview for display; actual state update on click of "수령하기 없음" button
                const dateHash = today.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
                const pool = [...DELIVERY_ORDER_POOL];
                const selected = [];
                let h = dateHash;
                for (let i = 0; i < 3 && pool.length > 0; i++) {
                  const idx = h % pool.length;
                  const base = pool.splice(idx, 1)[0];
                  selected.push({ ...base, id: `delivery_${today}_${i}`, deadline: today });
                  h = (h * 1664525 + 1013904223) >>> 0;
                }
                orders = selected;
              }
              return (
                <div className="section">
                  <div className="section-title">📦 NPC 납품 주문 (일일)</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>매일 NPC 3종이 아이템 납품 요청. 완료 시 골드 + 친밀도 보너스</div>
                  {(() => {
                    // Bulk delivery button: fulfill all orders that can be completed
                    const fulfillable = orders.filter(order => {
                      const completed = (gs.deliveryOrders ?? []).find(o => o.id === order.id)?.completed;
                      if (completed) return false;
                      let have = 0;
                      if (order.itemType === 'ore') have = (gs.oreInventory ?? {})[order.item] ?? 0;
                      else if (order.itemType === 'herb') have = (gs.herbInventory ?? {})[order.item] ?? 0;
                      else if (order.itemType === 'crop') have = (gs.cropInventory ?? {})[order.item] ?? 0;
                      else if (order.itemType === 'processed') have = (gs.processedOreInventory ?? {})[order.item] ?? 0;
                      return have >= order.qty;
                    });
                    if (fulfillable.length < 2) return null;
                    return (
                      <button tabIndex={-1} className="btn-buy" style={{ width: '100%', marginBottom: 8, fontSize: 12 }}
                        onClick={() => {
                          setGs(prev => {
                            let ns = { ...prev };
                            let totalMoney = 0;
                            const updatedOrders = [...(prev.deliveryOrders?.length ? prev.deliveryOrders : orders)];
                            for (const order of fulfillable) {
                              if (order.itemType === 'ore') ns.oreInventory = { ...ns.oreInventory, [order.item]: Math.max(0, (ns.oreInventory[order.item] ?? 0) - order.qty) };
                              else if (order.itemType === 'herb') ns.herbInventory = { ...(ns.herbInventory ?? {}), [order.item]: Math.max(0, ((ns.herbInventory ?? {})[order.item] ?? 0) - order.qty) };
                              else if (order.itemType === 'crop') ns.cropInventory = { ...(ns.cropInventory ?? {}), [order.item]: Math.max(0, ((ns.cropInventory ?? {})[order.item] ?? 0) - order.qty) };
                              else if (order.itemType === 'processed') ns.processedOreInventory = { ...(ns.processedOreInventory ?? {}), [order.item]: Math.max(0, ((ns.processedOreInventory ?? {})[order.item] ?? 0) - order.qty) };
                              totalMoney += order.reward.money;
                              const idx = updatedOrders.findIndex(o => o.id === order.id);
                              if (idx >= 0) updatedOrders[idx] = { ...updatedOrders[idx], completed: true };
                              else updatedOrders.push({ ...order, completed: true });
                            }
                            ns.money = (ns.money ?? 0) + totalMoney;
                            ns.deliveryOrders = updatedOrders;
                            ns.deliveryDate = today;
                            const prevStats = prev.achStats ?? {};
                            const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + totalMoney, maxMoney: Math.max(prevStats.maxMoney ?? 0, ns.money) };
                            setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                            ns.achStats = updatedStats;
                            return ns;
                          });
                          for (const order of fulfillable) gainNpcAffinity(order.npc, order.reward.affinity);
                          const totalGold = fulfillable.reduce((s, o) => s + o.reward.money, 0);
                          advanceQuest('sell', totalGold);
                          addMsg(`📦 일괄 납품 완료! ${fulfillable.length}개 주문 → +${totalGold}G`, 'catch');
                        }}
                      >📦 일괄 납품 ({fulfillable.length}건)</button>
                    );
                  })()}
                  {orders.map((order) => {
                    const completed = (gs.deliveryOrders ?? []).find(o => o.id === order.id)?.completed;
                    let have = 0;
                    if (order.itemType === 'ore') have = (gs.oreInventory ?? {})[order.item] ?? 0;
                    else if (order.itemType === 'herb') have = (gs.herbInventory ?? {})[order.item] ?? 0;
                    else if (order.itemType === 'crop') have = (gs.cropInventory ?? {})[order.item] ?? 0;
                    else if (order.itemType === 'processed') have = (gs.processedOreInventory ?? {})[order.item] ?? 0;
                    const canFulfill = !completed && have >= order.qty;
                    const npcColor = { 채굴사: '#ffaa44', 요리사: '#ff88cc', 여관주인: '#88ccff', 상인: '#ffcc44' }[order.npc] ?? '#aaa';
                    return (
                      <div key={order.id} className="rod-card" style={{ opacity: completed ? 0.5 : 1, borderColor: completed ? 'rgba(100,255,100,0.3)' : undefined }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, color: npcColor, fontWeight: 700 }}>{order.npc}</span>
                          <span style={{ fontSize: 12 }}>→ {order.item} {order.qty}개</span>
                          {completed && <span className="badge" style={{ background: '#228822' }}>완료</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                          보유: {have}/{order.qty} · 보상: +{order.reward.money}G, 친밀도 +{order.reward.affinity}
                        </div>
                        <button tabIndex={-1} className={canFulfill ? 'btn-buy' : 'btn-dis'} disabled={!canFulfill} style={{ fontSize: 11 }}
                          onClick={() => {
                            setGs(prev => {
                              const newState = { ...prev };
                              if (order.itemType === 'ore') newState.oreInventory = { ...prev.oreInventory, [order.item]: Math.max(0, (prev.oreInventory[order.item] ?? 0) - order.qty) };
                              else if (order.itemType === 'herb') newState.herbInventory = { ...(prev.herbInventory ?? {}), [order.item]: Math.max(0, ((prev.herbInventory ?? {})[order.item] ?? 0) - order.qty) };
                              else if (order.itemType === 'crop') newState.cropInventory = { ...(prev.cropInventory ?? {}), [order.item]: Math.max(0, ((prev.cropInventory ?? {})[order.item] ?? 0) - order.qty) };
                              else if (order.itemType === 'processed') newState.processedOreInventory = { ...(prev.processedOreInventory ?? {}), [order.item]: Math.max(0, ((prev.processedOreInventory ?? {})[order.item] ?? 0) - order.qty) };
                              newState.money = prev.money + order.reward.money;
                              const savedOrders = orders.map(o => o.id === order.id ? { ...o, completed: true } : o);
                              newState.deliveryOrders = savedOrders;
                              newState.deliveryDate = today;
                              const prevStats = prev.achStats ?? {};
                              const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + order.reward.money, maxMoney: Math.max(prevStats.maxMoney ?? 0, newState.money) };
                              setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                              newState.achStats = updatedStats;
                              // Phase 12-5: delivery completion gives +10 activity points
                              newState.activityPoints = (prev.activityPoints ?? 0) + 10;
                              newState.totalPointsEarned = (prev.totalPointsEarned ?? 0) + 10;
                              return newState;
                            });
                            gainNpcAffinity(order.npc, order.reward.affinity);
                            advanceQuest('sell', order.reward.money);
                            addMsg(`📦 납품 완료! ${order.item} ${order.qty}개 → +${order.reward.money}G, ${order.npc} 친밀도 +${order.reward.affinity}`, 'catch');
                          }}>
                          {completed ? '완료됨' : canFulfill ? '납품하기' : '재료 부족'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {shopSection === '씨앗' && <div className="section">
              <div className="section-title">🌱 씨앗 구매</div>
              {Object.entries(SEEDS).map(([key, sd]) => {
                const discount = getShopDiscount(gs.npcAffinity);
                const discPrice = Math.round(sd.price * (1 - discount));
                const canBuy = gs.money >= discPrice;
                return (
                  <div key={key} className="rod-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 16 }}>🌱</span>
                      <span style={{ fontWeight: 700, color: '#88ff88' }}>{sd.name}</span>
                      <span style={{ fontSize: 11, color: '#ffcc44', marginLeft: 'auto' }}>{discPrice}G</span>
                    </div>
                    <div className="rod-meta">
                      {sd.yield.item} {sd.yield.qty[0]}~{sd.yield.qty[1]}개 수확 · 성장 {Math.round(sd.growMs / 60000)}분
                    </div>
                    <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                      style={{ marginTop: 4, fontSize: 11 }}
                      onClick={() => {
                        if (!canBuy) return;
                        // Find an empty plot and plant directly
                        const plots = stateRef.current?.farmPlots ?? [];
                        const emptyIdx = Array.from({ length: MAX_FARM_PLOTS }, (_, i) => i).find(i => !plots.some(p => p.id === i && !p.harvested));
                        if (emptyIdx === undefined) {
                          addMsg('🌱 빈 농장 자리가 없습니다!', 'error'); return;
                        }
                        const now = Date.now();
                        const newPlot = { id: emptyIdx, seed: key, plantedAt: now, harvestAt: now + sd.growMs, watered: false, harvested: false };
                        setGs(prev => ({ ...prev, money: prev.money - discPrice, farmPlots: [...(prev.farmPlots ?? []).filter(p => p.id !== emptyIdx || p.harvested), newPlot] }));
                        addMsg(`🌱 ${sd.name} 구매 & 심기 완료! (-${discPrice}G)`, 'catch');
                        gainNpcAffinity('상인', 1);
                      }}>
                      {canBuy ? `${discPrice}G 구매 & 심기` : '💰 골드 부족'}
                    </button>
                  </div>
                );
              })}
            </div>}

            {shopSection === '펫간식' && <div className="section">
              <div className="section-title">🍖 펫 간식</div>
              {!gs.activePet ? (
                <div className="empty">활성 펫이 없습니다. 펫을 장착하세요.</div>
              ) : (() => {
                const petKey = gs.activePet;
                const pet = PETS[petKey];
                const level = typeof (gs.petLevels ?? {})[petKey] === 'number' ? (gs.petLevels ?? {})[petKey] : 1;
                const exp = typeof (gs.petExp ?? {})[petKey] === 'number' ? (gs.petExp ?? {})[petKey] : 0;
                if (level >= PET_MAX_LEVEL) {
                  return <div className="empty">{pet?.icon} {pet?.name}은 이미 최대 레벨입니다!</div>;
                }
                const foodItems = [
                  { name: '작은 간식', price: 300, exp: 5, desc: 'EXP +5' },
                  { name: '특별 간식', price: 800, exp: 15, desc: 'EXP +15' },
                  { name: '전설 간식', price: 2500, exp: 50, desc: 'EXP +50' },
                ];
                return foodItems.map(food => {
                  const canBuy = gs.money >= food.price;
                  return (
                    <div key={food.name} className="rod-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🍖</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700 }}>{food.name}</span>
                          <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>{food.desc}</span>
                        </div>
                        <span style={{ color: '#ffcc44', fontSize: 12 }}>{food.price}G</span>
                      </div>
                      <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                        style={{ marginTop: 4, fontSize: 11, width: '100%' }}
                        onClick={() => {
                          if (!canBuy) return;
                          const newExp = exp + food.exp;
                          let newLevel = level;
                          for (let lv = level; lv < PET_MAX_LEVEL; lv++) {
                            if (newExp >= PET_EXP_THRESHOLDS[lv - 1]) newLevel = lv + 1;
                            else break;
                          }
                          setGs(prev => ({
                            ...prev,
                            money: prev.money - food.price,
                            petExp: { ...prev.petExp, [petKey]: newExp },
                            petLevels: { ...prev.petLevels, [petKey]: newLevel },
                          }));
                          addMsg(`${pet?.icon} ${pet?.name}에게 ${food.name}! EXP +${food.exp} (${newExp}/${PET_EXP_THRESHOLDS[newLevel - 1] ?? '최대'})`, 'catch');
                          if (newLevel > level) addMsg(`🎉 ${pet?.name} Lv.${level} → Lv.${newLevel}! 보너스 강화!`, 'legend');
                        }}>
                        {canBuy ? `${food.price}G 구매` : '💰 골드 부족'}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>}

            {shopSection === '판매' && <div className="section">
              <div className="section-title">🌾 작물 판매</div>
              {Object.entries(gs.cropInventory ?? {}).filter(([, n]) => n > 0).length === 0
                ? <div className="empty">판매할 작물 없음 (농장에서 수확)</div>
                : <div>
                    {Object.entries(gs.cropInventory ?? {}).filter(([, n]) => n > 0).map(([itemName, count]) => {
                      const baseSp = (() => {
                        for (const sd of Object.values(SEEDS)) {
                          if (sd.yield.item === itemName) return sd.yield.sellPrice;
                        }
                        return 0;
                      })();
                      const seasonCropPct = currentSeason?.cropPriceBonus ?? 0;
                      const petSellC = 1 + (gameRef.current?.petBonus?.sellBonus ?? 0);
                      const speechMultC = 1 + (gs.abilities?.화술?.value ?? 0) * 0.005;
                      const sp = Math.round(baseSp * (1 + seasonCropPct) * petSellC * speechMultC);
                      const total = sp * count;
                      return (
                        <div key={itemName} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: '#88ff88', fontWeight: 700 }}>🌾 {itemName} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>
                              {sp}G/개{seasonCropPct > 0 && <span style={{ color: currentSeason.color, fontSize: 10 }}> {currentSeason.icon}+{Math.round(seasonCropPct * 100)}%</span>}
                            </span>
                          </div>
                          <button tabIndex={-1} className="btn-buy" onClick={() => {
                            setGs(prev => {
                              const newCrop = { ...(prev.cropInventory ?? {}), [itemName]: 0 };
                              const prevStats = prev.achStats ?? {};
                              const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + total, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + total) };
                              setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                              return { ...prev, money: prev.money + total, cropInventory: newCrop, achStats: updatedStats };
                            });
                            addMsg(`💰 ${itemName} ${count}개 → ${total}G!`, 'catch');
                            grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
                            advanceQuest('sell', total);
                            gainNpcAffinity('상인', Math.max(1, Math.floor(total / 150)));
                          }}>전체 판매 ({total}G)</button>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>}
          </div>
        </div>
      )}

      {/* Appearance modal */}
      {showAppearance && appearanceDraft && (
        <div className="overlay" onClick={() => setShowAppearance(false)}>
          <div className="panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <div className="panel-head">
              <span>✂ 외모 변경 (200G)</span>
              <button tabIndex={-1} onClick={() => setShowAppearance(false)}>✕</button>
            </div>
            <div className="section">
              <div className="section-title">피부색</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#f6cc88', '#e8a878', '#c68642', '#8d5524', '#ffdab9', '#ffe0bd'].map(c => (
                  <div key={c} onClick={() => setAppearanceDraft(d => ({ ...d, skinColor: c }))}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: `3px solid ${appearanceDraft.skinColor === c ? '#fff' : 'transparent'}` }} />
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-title">머리색</div>
              <input type="color" value={appearanceDraft.hairColor}
                onChange={e => setAppearanceDraft(d => ({ ...d, hairColor: e.target.value }))}
                style={{ width: 48, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
            </div>
            <div className="section">
              <div className="section-title">옷 색상</div>
              <input type="color" value={appearanceDraft.bodyColor}
                onChange={e => setAppearanceDraft(d => ({ ...d, bodyColor: e.target.value }))}
                style={{ width: 48, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <button className={gs.money >= 200 ? 'btn-buy' : 'btn-dis'} style={{ width: '100%' }}
                disabled={gs.money < 200}
                onClick={() => {
                  if (gs.money < 200) { addMsg('💰 200G 필요', 'error'); return; }
                  setGs(prev => ({
                    ...prev,
                    money: prev.money - 200,
                    hairColor: appearanceDraft.hairColor,
                    bodyColor: appearanceDraft.bodyColor,
                    skinColor: appearanceDraft.skinColor,
                  }));
                  if (gameRef.current?.player) {
                    gameRef.current.player.hairColor = appearanceDraft.hairColor;
                    gameRef.current.player.bodyColor = appearanceDraft.bodyColor;
                    gameRef.current.player.skinColor = appearanceDraft.skinColor;
                  }
                  addMsg('✂ 외모가 변경됐습니다! (-200G)', 'catch');
                  gainNpcAffinity('여관주인', 1);
                  setShowAppearance(false);
                }}>
                {gs.money >= 200 ? '200G 변경 완료' : '💰 골드 부족'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace modal */}
      {showMarket && (
        <div className="overlay" onClick={() => setShowMarket(false)}>
          <div className="panel" style={{ maxWidth: 440, maxHeight: '82vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>🏪 경매장 (야시장)</span>
              <button tabIndex={-1} onClick={() => setShowMarket(false)}>✕</button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['전체', '내 매물', '등록'].map(t => (
                <button key={t} tabIndex={-1} onClick={() => setMarketTab(t)} style={{
                  padding: '4px 12px', borderRadius: '6px 6px 0 0', border: 'none', cursor: 'pointer', fontSize: 12,
                  background: marketTab === t ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: marketTab === t ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: marketTab === t ? 700 : 400,
                }}>{t}</button>
              ))}
            </div>

            {/* ── 전체 탭 ── */}
            {marketTab === '전체' && (
              <div className="section">
                <div className="section-title">매물 목록 ({marketListings.length}개)</div>
                {marketListings.length === 0
                  ? <div className="empty">등록된 매물이 없습니다.</div>
                  : marketListings.map(item => {
                    const typeIcon = item.itemType === 'fish' ? '🐟' : item.itemType === 'ore' ? '⛏' : '🌿';
                    const isMine = item.seller === nickname;
                    return (
                      <div key={item.id} className="rod-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{typeIcon} {item.itemName} ×{item.qty}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>판매자: {item.seller}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#ffcc44', fontWeight: 700, marginBottom: 4 }}>{item.price.toLocaleString()}G</div>
                          {!isMine && (
                            <button tabIndex={-1} className="btn-buy" style={{ fontSize: 11 }} onClick={async () => {
                              if ((gs.money ?? 0) < item.price) { addMsg('💰 골드 부족', 'error'); return; }
                              const res = await buyItem(item.id, nickname);
                              if (res.ok) {
                                const { listing } = res;
                                setGs(prev => {
                                  let next = { ...prev, money: prev.money - listing.price };
                                  if (listing.itemType === 'ore') {
                                    next = { ...next, oreInventory: { ...next.oreInventory, [listing.itemName]: (next.oreInventory[listing.itemName] ?? 0) + listing.qty } };
                                  } else if (listing.itemType === 'herb') {
                                    next = { ...next, herbInventory: { ...next.herbInventory, [listing.itemName]: (next.herbInventory[listing.itemName] ?? 0) + listing.qty } };
                                  }
                                  return next;
                                });
                                addMsg(`🏪 ${item.itemName} ×${item.qty} 구매! (-${item.price.toLocaleString()}G)`, 'catch');
                              } else addMsg(`구매 실패: ${res.err}`, 'error');
                            }}>구매</button>
                          )}
                          {isMine && <span style={{ fontSize: 11, color: '#888' }}>내 매물</span>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* ── 내 매물 탭 ── */}
            {marketTab === '내 매물' && (
              <div className="section">
                <div className="section-title">내 매물 ({myListings.length}개)</div>
                {myListings.length === 0
                  ? <div className="empty">등록한 매물이 없습니다.</div>
                  : myListings.map(item => (
                    <div key={item.id} className="rod-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.itemType === 'fish' ? '🐟' : item.itemType === 'ore' ? '⛏' : '🌿'} {item.itemName} ×{item.qty}</div>
                        <div style={{ fontSize: 11, color: '#ffcc44' }}>{item.price.toLocaleString()}G</div>
                      </div>
                      <button tabIndex={-1} className="btn-dis" style={{ fontSize: 11 }} onClick={async () => {
                        const res = await cancelListing(item.id, nickname);
                        if (res.ok) {
                          // Return item to inventory
                          setGs(prev => {
                            if (item.itemType === 'ore') {
                              return { ...prev, oreInventory: { ...prev.oreInventory, [item.itemName]: (prev.oreInventory[item.itemName] ?? 0) + item.qty } };
                            } else if (item.itemType === 'herb') {
                              return { ...prev, herbInventory: { ...prev.herbInventory, [item.itemName]: (prev.herbInventory[item.itemName] ?? 0) + item.qty } };
                            }
                            return prev;
                          });
                          addMsg(`🏪 ${item.itemName} 매물 취소 완료`, 'system');
                        } else addMsg(`취소 실패: ${res.err}`, 'error');
                      }}>취소</button>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ── 등록 탭 ── */}
            {marketTab === '등록' && (
              <div className="section">
                <div className="section-title">매물 등록</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['ore', 'herb'].map(t => (
                      <button key={t} tabIndex={-1} onClick={() => setMarketListForm(f => ({ ...f, itemType: t, itemName: '' }))} style={{
                        padding: '4px 12px', borderRadius: 6, border: `1px solid ${marketListForm.itemType === t ? '#88ccff' : 'rgba(255,255,255,0.2)'}`,
                        background: marketListForm.itemType === t ? 'rgba(100,180,255,0.15)' : 'rgba(0,0,0,0.2)',
                        color: marketListForm.itemType === t ? '#88ccff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12,
                      }}>{t === 'ore' ? '⛏ 광석' : '🌿 허브'}</button>
                    ))}
                  </div>
                  <select value={marketListForm.itemName}
                    onChange={e => setMarketListForm(f => ({ ...f, itemName: e.target.value }))}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 13 }}>
                    <option value="">아이템 선택</option>
                    {marketListForm.itemType === 'ore'
                      ? Object.entries(gs.oreInventory ?? {}).filter(([, n]) => n > 0).map(([k]) => <option key={k} value={k}>{k}</option>)
                      : Object.entries(gs.herbInventory ?? {}).filter(([, n]) => n > 0).map(([k]) => <option key={k} value={k}>{k}</option>)
                    }
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" min={1} placeholder="수량" value={marketListForm.qty}
                      onChange={e => setMarketListForm(f => ({ ...f, qty: Math.max(1, parseInt(e.target.value) || 1) }))}
                      style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                    <input type="number" min={1} placeholder="가격 (G)" value={marketListForm.price || ''}
                      onChange={e => setMarketListForm(f => ({ ...f, price: Math.max(1, parseInt(e.target.value) || 0) }))}
                      style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                  </div>
                  <button tabIndex={-1} className="btn-buy" onClick={async () => {
                    const { itemType, itemName, qty, price } = marketListForm;
                    if (!itemName) { addMsg('아이템을 선택하세요.', 'error'); return; }
                    if (price <= 0) { addMsg('가격을 입력하세요.', 'error'); return; }
                    // Deduct from inventory
                    if (itemType === 'ore') {
                      const have = gs.oreInventory[itemName] ?? 0;
                      if (have < qty) { addMsg('보유 수량 부족', 'error'); return; }
                      setGs(prev => ({ ...prev, oreInventory: { ...prev.oreInventory, [itemName]: (prev.oreInventory[itemName] ?? 0) - qty } }));
                    } else {
                      const have = gs.herbInventory[itemName] ?? 0;
                      if (have < qty) { addMsg('보유 수량 부족', 'error'); return; }
                      setGs(prev => ({ ...prev, herbInventory: { ...prev.herbInventory, [itemName]: (prev.herbInventory[itemName] ?? 0) - qty } }));
                    }
                    const res = await listItem(nickname, itemType, itemName, qty, price);
                    if (res.ok) {
                      addMsg(`🏪 ${itemName} ×${qty} 경매장 등록 완료! (${price.toLocaleString()}G)`, 'catch');
                      setMarketListForm({ itemType: 'ore', itemName: '', qty: 1, price: 0 });
                    } else {
                      addMsg(`등록 실패: ${res.err}`, 'error');
                    }
                  }}>등록하기</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guild modal */}
      {showGuild && (
        <div className="overlay" onClick={() => setShowGuild(false)}>
          <div className="panel" style={{ maxWidth: 420, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>🏰 길드 시스템</span>
              <button tabIndex={-1} onClick={() => setShowGuild(false)}>✕</button>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {(myGuildId ? ['내 길드', '채팅', '퀘스트', '경쟁', '창고', '목록'] : ['목록', '창설']).map(t => (
                <button key={t} tabIndex={-1} onClick={() => setGuildTab(t)} style={{
                  padding: '4px 12px', borderRadius: '6px 6px 0 0', border: 'none', cursor: 'pointer', fontSize: 12,
                  background: guildTab === t ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: guildTab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: guildTab === t ? 700 : 400,
                }}>
                  {t}
                </button>
              ))}
            </div>

            {/* ── 목록 탭 ── */}
            {guildTab === '목록' && (
              <div className="section">
                <div className="section-title">길드 목록 (상위 20)</div>
                {guildList.length === 0
                  ? <div className="empty">등록된 길드가 없습니다.</div>
                  : guildList.map(g => (
                    <div key={g.guildId} className="rod-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffcc44' }}>🏰 {g.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>ID: {g.guildId} · 인원 {g.memberCount}/30</div>
                        {g.notice && <div style={{ fontSize: 11, color: '#88ccff', marginTop: 2 }}>{g.notice}</div>}
                      </div>
                      {!myGuildId && (
                        <button tabIndex={-1} className="btn-buy" style={{ fontSize: 11 }} onClick={async () => {
                          const res = await joinGuild(g.guildId, nickname);
                          if (res.ok) { setMyGuildId(g.guildId); setGuildTab('내 길드'); addMsg(`🏰 ${g.name} 길드에 가입했습니다!`, 'catch'); }
                          else addMsg(`가입 실패: ${res.err}`, 'error');
                        }}>가입</button>
                      )}
                      {myGuildId === g.guildId && (
                        <span style={{ fontSize: 11, color: '#44ff88' }}>✓ 내 길드</span>
                      )}
                    </div>
                  ))
                }
                {!myGuildId && (
                  <div style={{ marginTop: 8 }}>
                    <div className="section-title">길드 ID로 가입</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={guildJoinId} onChange={e => setGuildJoinId(e.target.value)}
                        placeholder="길드 ID 입력"
                        style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                      <button tabIndex={-1} className="btn-buy" onClick={async () => {
                        if (!guildJoinId.trim()) return;
                        const res = await joinGuild(guildJoinId.trim(), nickname);
                        if (res.ok) { setMyGuildId(guildJoinId.trim()); setGuildTab('내 길드'); addMsg(`🏰 길드에 가입했습니다!`, 'catch'); setGuildJoinId(''); }
                        else addMsg(`가입 실패: ${res.err}`, 'error');
                      }}>가입</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 창설 탭 ── */}
            {guildTab === '창설' && !myGuildId && (
              <div className="section">
                <div className="section-title">새 길드 창설</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  길드 ID는 영문/숫자 조합으로 4~12자, 길드명은 최대 16자.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input value={guildJoinId} onChange={e => setGuildJoinId(e.target.value)}
                    placeholder="길드 ID (영문/숫자, 4~12자)"
                    maxLength={12}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                  <input value={guildCreateName} onChange={e => setGuildCreateName(e.target.value)}
                    placeholder="길드 이름 (최대 16자)"
                    maxLength={16}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                  <button tabIndex={-1} className="btn-buy" onClick={async () => {
                    const id = guildJoinId.trim();
                    const nm = guildCreateName.trim();
                    if (!id || id.length < 4) { addMsg('길드 ID는 4자 이상이어야 합니다.', 'error'); return; }
                    if (!/^[a-zA-Z0-9]+$/.test(id)) { addMsg('길드 ID는 영문/숫자만 가능합니다.', 'error'); return; }
                    if (!nm) { addMsg('길드 이름을 입력하세요.', 'error'); return; }
                    const res = await createGuild(id, nm, nickname);
                    if (res.ok) {
                      setMyGuildId(id);
                      setGuildTab('내 길드');
                      addMsg(`🏰 길드 "${nm}" 창설 완료!`, 'catch');
                      setGuildJoinId(''); setGuildCreateName('');
                    } else addMsg(`창설 실패: ${res.err}`, 'error');
                  }}>창설</button>
                </div>
              </div>
            )}

            {/* ── 내 길드 탭 ── */}
            {guildTab === '내 길드' && myGuildId && (
              <div className="section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#ffcc44' }}>🏰 {guildInfo?.name ?? myGuildId}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>인원: {guildInfo?.memberCount ?? '?'}/30 · 마스터: {guildInfo?.master ?? '?'}</div>
                    {guildInfo?.notice && <div style={{ fontSize: 12, color: '#88ccff', marginTop: 4 }}>📢 {guildInfo.notice}</div>}
                  </div>
                  <button tabIndex={-1} className="btn-dis" style={{ fontSize: 11 }} onClick={async () => {
                    if (!window.confirm('길드를 탈퇴하시겠습니까?')) return;
                    await leaveGuild(myGuildId, nickname);
                    setMyGuildId(null); setGuildInfo(null); setGuildMembers([]); setGuildChat([]); setGuildQuest({});
                    addMsg('길드를 탈퇴했습니다.', 'system');
                    setGuildTab('목록');
                  }}>탈퇴</button>
                </div>
                {/* Guild Level display */}
                {guildInfo && (() => {
                  const level = guildInfo.level ?? 1;
                  const xp = guildInfo.xp ?? 0;
                  const nextXP = GUILD_LEVEL_XP[level] ?? null;
                  const bonus = GUILD_LEVEL_BONUSES[level - 1];
                  return (
                    <div className="rod-card" style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#ffd700' }}>⭐ 길드 레벨 {level}</span>
                        <span style={{ fontSize: 11, color: '#aaa' }}>{xp.toLocaleString()} XP{nextXP ? ` / ${nextXP.toLocaleString()}` : ' (MAX)'}</span>
                      </div>
                      {nextXP && (
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5, marginBottom: 6 }}>
                          <div style={{ width: `${Math.min(100, (xp / nextXP) * 100)}%`, height: '100%', background: '#ffd700', borderRadius: 4 }} />
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#88ffaa' }}>보너스: {bonus?.label}</div>
                    </div>
                  );
                })()}

                <div className="section-title">길드원 ({guildMembers.length}명)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {guildMembers.map(m => (
                    <div key={m.nickname} style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 12,
                      background: m.role === 'master' ? 'rgba(255,200,0,0.2)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${m.role === 'master' ? '#ffcc44' : 'rgba(255,255,255,0.15)'}`,
                      color: m.role === 'master' ? '#ffcc44' : '#fff',
                    }}>
                      {m.role === 'master' ? '👑' : '🧑'} {m.nickname}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 채팅 탭 ── */}
            {guildTab === '채팅' && myGuildId && (
              <div className="section">
                <div className="section-title">길드 채팅</div>
                <div style={{ height: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {guildChat.length === 0
                    ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>메시지가 없습니다.</div>
                    : guildChat.map((m, i) => (
                      <div key={i} style={{ fontSize: 12 }}>
                        <span style={{ color: m.nickname === nickname ? '#88ccff' : '#ffcc44', fontWeight: 700 }}>{m.nickname}: </span>
                        <span style={{ color: '#ddd' }}>{m.message}</span>
                      </div>
                    ))
                  }
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={guildChatInput} onChange={e => setGuildChatInput(e.target.value)}
                    placeholder="메시지 입력..."
                    onKeyDown={e => { if (e.key === 'Enter' && guildChatInput.trim()) { sendGuildChat(myGuildId, nickname, guildChatInput.trim()); setGuildChatInput(''); } }}
                    style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                  <button tabIndex={-1} className="btn-buy" onClick={() => {
                    if (!guildChatInput.trim()) return;
                    sendGuildChat(myGuildId, nickname, guildChatInput.trim());
                    setGuildChatInput('');
                  }}>전송</button>
                </div>
              </div>
            )}

            {/* ── 퀘스트 탭 ── */}
            {guildTab === '퀘스트' && myGuildId && (() => {
              // goals: [{ target, reward }] — reward shown as label
              const GUILD_QUESTS = [
                { key: 'fishCaught', label: '물고기 포획', icon: '🐟',
                  milestones: [
                    { target: 100,  reward: '+300G · 구리미끼 1개' },
                    { target: 500,  reward: '+1000G · 황금미끼 1개' },
                    { target: 1000, reward: '+2500G · 전설미끼 2개' },
                  ],
                },
                { key: 'oreMined', label: '광석 채굴', icon: '⛏',
                  milestones: [
                    { target: 50,  reward: '+200G · 철광석 5개' },
                    { target: 200, reward: '+800G · 수정 3개' },
                    { target: 500, reward: '+2000G · 금광석 2개' },
                  ],
                },
              ];
              return (
                <div className="section">
                  <div className="section-title">길드 공동 퀘스트</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    낚시/채굴 시 자동으로 진행도가 오르고 마일스톤 달성 시 길드원 전체에게 보상이 지급됩니다.
                  </div>
                  {GUILD_QUESTS.map(q => {
                    const curr = guildQuest[q.key] ?? 0;
                    const nextMs = q.milestones.find(m => curr < m.target);
                    const nextTarget = nextMs?.target ?? q.milestones[q.milestones.length - 1].target;
                    const pct = Math.min(100, Math.round((curr / nextTarget) * 100));
                    const allDone = curr >= q.milestones[q.milestones.length - 1].target;
                    return (
                      <div key={q.key} className="rod-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700 }}>{q.icon} {q.label}</span>
                          <span style={{ color: allDone ? '#44ff88' : '#ffcc44', fontSize: 12 }}>
                            {curr.toLocaleString()} / {nextTarget.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: allDone ? '#44ff88' : '#ffcc44', borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                          {q.milestones.map(m => {
                            const reached = curr >= m.target;
                            return (
                              <div key={m.target} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10,
                                color: reached ? '#44ff88' : 'rgba(255,255,255,0.4)' }}>
                                <span>{reached ? '✅' : '○'} {m.target.toLocaleString()}마리/개</span>
                                <span style={{ color: reached ? '#44ff88' : '#ffcc55' }}>{m.reward}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── 경쟁 탭 ── */}
            {guildTab === '창고' && myGuildId && (() => {
              const GuildWarehouse = () => {
                const [warehouseItems, setWarehouseItems] = useState(null);
                const [whLoading, setWhLoading] = useState(false);
                const [depositType, setDepositType] = useState('fish');
                const [depositItem, setDepositItem] = useState('');
                const [depositStatus, setDepositStatus] = useState('');
                const guildLevel = guildInfo?.level ?? 1;
                const maxSlots = GUILD_WAREHOUSE_SLOTS[Math.min(guildLevel - 1, 4)];
                return (
                  <div className="section">
                    <div className="section-title">🏪 길드 공유 창고</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
                      길드 레벨 {guildLevel} · 슬롯 {warehouseItems?.length ?? '?'}/{maxSlots}
                    </div>
                    {warehouseItems === null ? (
                      <button tabIndex={-1} className="btn-buy" onClick={async () => {
                        setWhLoading(true);
                        const items = await fetchGuildWarehouse(myGuildId);
                        setWarehouseItems(items);
                        setWhLoading(false);
                      }}>{whLoading ? '불러오는 중…' : '창고 열기'}</button>
                    ) : (
                      <>
                        {warehouseItems.length === 0 && <div className="empty">창고가 비어 있습니다.</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                          {warehouseItems.map((item, i) => (
                            <div key={i} className="rod-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</span>
                                {item.qty > 1 && <span style={{ fontSize: 11, color: '#ffcc44', marginLeft: 6 }}>×{item.qty}</span>}
                                <div style={{ fontSize: 10, color: '#666' }}>by {item.addedBy}</div>
                              </div>
                              <button tabIndex={-1} className="btn-eq" style={{ fontSize: 11 }}
                                onClick={async () => {
                                  const result = await removeFromGuildWarehouse(myGuildId, i);
                                  if (result.ok) {
                                    const taken = result.item;
                                    if (taken) {
                                      // Add item to player inventory based on type
                                      setGs(prev => {
                                        if (taken.itemType === 'ore') return { ...prev, oreInventory: { ...prev.oreInventory, [taken.name]: (prev.oreInventory[taken.name] ?? 0) + (taken.qty ?? 1) } };
                                        if (taken.itemType === 'herb') return { ...prev, herbInventory: { ...(prev.herbInventory ?? {}), [taken.name]: ((prev.herbInventory ?? {})[taken.name] ?? 0) + (taken.qty ?? 1) } };
                                        if (taken.itemType === 'crop') return { ...prev, cropInventory: { ...(prev.cropInventory ?? {}), [taken.name]: ((prev.cropInventory ?? {})[taken.name] ?? 0) + (taken.qty ?? 1) } };
                                        return prev;
                                      });
                                      addMsg(`📦 창고에서 ${taken.name} ×${taken.qty ?? 1} 가져옴`, 'catch');
                                    }
                                    const updated = await fetchGuildWarehouse(myGuildId);
                                    setWarehouseItems(updated);
                                  } else addMsg(`창고 오류: ${result.err}`, 'error');
                                }}>
                                가져오기
                              </button>
                            </div>
                          ))}
                        </div>
                        {warehouseItems.length < maxSlots && (
                          <>
                            <div className="section-title">아이템 보관</div>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                              {['ore', 'herb', 'crop'].map(t => (
                                <button key={t} tabIndex={-1}
                                  onClick={() => setDepositType(t)}
                                  className={depositType === t ? 'btn-buy' : 'btn-eq'}
                                  style={{ fontSize: 11, padding: '3px 10px' }}>
                                  {{ ore: '⛏ 광석', herb: '🌿 허브', crop: '🌾 작물' }[t]}
                                </button>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input value={depositItem} onChange={e => setDepositItem(e.target.value)}
                                placeholder={`아이템명 (보유: ${depositType === 'ore' ? Object.entries(gs.oreInventory ?? {}).filter(([,v]) => v > 0).map(([k,v]) => `${k}:${v}`).join(', ') || '없음' : '입력'})`}
                                style={{ flex: 1, padding: '5px 8px', background: 'rgba(255,255,255,0.07)',
                                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 11 }}
                              />
                              <button tabIndex={-1} className="btn-buy" style={{ fontSize: 11 }}
                                onClick={async () => {
                                  const itemName = depositItem.trim();
                                  if (!itemName) return;
                                  let have = 0;
                                  if (depositType === 'ore') have = (gs.oreInventory ?? {})[itemName] ?? 0;
                                  else if (depositType === 'herb') have = (gs.herbInventory ?? {})[itemName] ?? 0;
                                  else if (depositType === 'crop') have = (gs.cropInventory ?? {})[itemName] ?? 0;
                                  if (have < 1) { setDepositStatus(`${itemName} 보유량이 부족합니다.`); return; }
                                  const result = await addToGuildWarehouse(myGuildId, guildLevel, nickname, { name: itemName, qty: 1, itemType: depositType });
                                  if (result.ok) {
                                    setGs(prev => {
                                      if (depositType === 'ore') return { ...prev, oreInventory: { ...prev.oreInventory, [itemName]: Math.max(0, (prev.oreInventory[itemName] ?? 0) - 1) } };
                                      if (depositType === 'herb') return { ...prev, herbInventory: { ...(prev.herbInventory ?? {}), [itemName]: Math.max(0, ((prev.herbInventory ?? {})[itemName] ?? 0) - 1) } };
                                      if (depositType === 'crop') return { ...prev, cropInventory: { ...(prev.cropInventory ?? {}), [itemName]: Math.max(0, ((prev.cropInventory ?? {})[itemName] ?? 0) - 1) } };
                                      return prev;
                                    });
                                    contributeGuildXP(myGuildId, 2);
                                    addMsg(`📦 ${itemName} × 1 을 길드 창고에 보관했습니다.`, 'catch');
                                    const updated = await fetchGuildWarehouse(myGuildId);
                                    setWarehouseItems(updated);
                                    setDepositItem('');
                                    setDepositStatus('');
                                  } else setDepositStatus(result.err ?? '보관 실패');
                                }}>
                                보관 (+2 XP)
                              </button>
                            </div>
                            {depositStatus && <div style={{ fontSize: 11, color: '#ff8888', marginTop: 4 }}>{depositStatus}</div>}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              };
              return <GuildWarehouse key="warehouse" />;
            })()}

            {guildTab === '경쟁' && myGuildId && (
              <div className="section">
                <div className="section-title">🏆 길드 주간 경쟁 랭킹</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  이번 주 길드별 낚시/채굴 합산 점수. 매주 초기화됩니다.
                </div>
                {guildCompetition.length === 0
                  ? <div className="empty">이번 주 기록이 없습니다.</div>
                  : guildCompetition.map((entry, i) => (
                    <div key={entry.guildId} className="rod-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, color: i === 0 ? '#ffcc44' : i === 1 ? '#cccccc' : i === 2 ? '#cc8844' : '#aaa' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                        </span>
                        <span style={{ fontWeight: entry.guildId === myGuildId ? 800 : 400, color: entry.guildId === myGuildId ? '#88ccff' : '#fff' }}>
                          🏰 {entry.guildId}
                        </span>
                      </div>
                      <span style={{ color: '#ffcc44', fontWeight: 700 }}>{entry.score.toLocaleString()}점</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank modal */}
      {showBank && (() => {
        const bankNpcAff = gs.npcAffinity?.은행원 ?? 0;
        const bankRate = 0.02 + (bankNpcAff >= 50 ? 0.01 : bankNpcAff >= 20 ? 0.005 : 0);
        const bankDep = gs.bankDeposit ?? 0;
        return (
        <div className="overlay" onClick={() => setShowBank(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>🏦 은행</span>
              <button tabIndex={-1} onClick={() => setShowBank(false)}>✕</button>
            </div>
            <div className="section">
              <div className="section-title">예금 현황</div>
              <div className="rod-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#ffcc44' }}>💰 지갑</span>
                  <span style={{ color: '#ffcc44' }}>{gs.money.toLocaleString()}G</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#44ccff' }}>🏦 예금</span>
                  <span style={{ color: '#44ccff' }}>{bankDep.toLocaleString()}G</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  이자율: {(bankRate * 100).toFixed(1)}%/시간 (최대 24시간 소급 적용)
                  {bankNpcAff >= 20 && <span style={{ color: '#66ddbb', marginLeft: 6 }}>+은행원 보너스</span>}
                  {gs.bankLastInterest && (
                    <span style={{ marginLeft: 8 }}>
                      · 다음 이자: {Math.max(0, 60 - Math.floor((Date.now() - gs.bankLastInterest) / 60000))}분 후
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="section">
              <div className="section-title">입금 / 출금</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="number" min={1} placeholder="금액 입력"
                  value={bankInput}
                  onChange={e => setBankInput(e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }}
                />
                <button tabIndex={-1} className="btn-buy" onClick={() => {
                  const amt = Math.floor(Number(bankInput));
                  if (!amt || amt <= 0) { addMsg('금액을 입력하세요.', 'error'); return; }
                  if (amt > gs.money) { addMsg('💰 지갑 잔액 부족', 'error'); return; }
                  const nowTs = Date.now();
                  setGs(prev => {
                    const prevStats = prev.achStats ?? {};
                    const updatedStats = { ...prevStats, totalDeposited: (prevStats.totalDeposited ?? 0) + amt };
                    setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                    return {
                      ...prev,
                      money: prev.money - amt,
                      bankDeposit: (prev.bankDeposit ?? 0) + amt,
                      bankLastInterest: prev.bankLastInterest ?? nowTs,
                      achStats: updatedStats,
                    };
                  });
                  advanceQuest('deposit', amt);
                  addMsg(`🏦 ${amt.toLocaleString()}G 입금 완료!`, 'catch');
                  setBankInput('');
                }}>입금</button>
                <button tabIndex={-1} className="btn-eq" onClick={() => {
                  const amt = Math.floor(Number(bankInput));
                  if (!amt || amt <= 0) { addMsg('금액을 입력하세요.', 'error'); return; }
                  if (amt > (gs.bankDeposit ?? 0)) { addMsg('🏦 예금 잔액 부족', 'error'); return; }
                  setGs(prev => {
                    const prevStats = prev.achStats ?? {};
                    const updatedStats = { ...prevStats, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + amt) };
                    setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                    return { ...prev, money: prev.money + amt, bankDeposit: (prev.bankDeposit ?? 0) - amt, achStats: updatedStats };
                  });
                  addMsg(`🏦 ${amt.toLocaleString()}G 출금 완료!`, 'catch');
                  setBankInput('');
                }}>출금</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button tabIndex={-1} className="btn-dis" style={{ fontSize: 11 }}
                  onClick={() => setBankInput(String(gs.money))}>전액 입금</button>
                <button tabIndex={-1} className="btn-dis" style={{ fontSize: 11 }}
                  onClick={() => setBankInput(String(gs.bankDeposit ?? 0))}>전액 출금</button>
              </div>
            </div>
            {bankDep > 0 && (
              <div className="section">
                <div className="section-title">이자 계산</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  1시간 후 예상 이자: +{Math.floor(bankDep * bankRate)}G<br />
                  24시간 후 누적 이자: +{Math.floor(bankDep * bankRate * 24)}G
                </div>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* Tournament panel */}
      {showTournament && (() => {
        const myRank = tournamentRanking.findIndex(e => e.nickname === nickname);
        const myEntry = myRank >= 0 ? tournamentRanking[myRank] : null;
        const MEDAL = ['🥇', '🥈', '🥉'];
        return (
          <div className="overlay" onClick={() => setShowTournament(false)}>
            <div className="panel" onClick={e => e.stopPropagation()}>
              <div className="panel-head">
                <span>🏆 주간 낚시 토너먼트</span>
                <button tabIndex={-1} onClick={() => setShowTournament(false)}>✕</button>
              </div>

              <div className="section">
                <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                  매주 리셋 · 점수 = 물고기 크기 + 희귀도 보너스<br/>
                  <span style={{ fontSize: 11 }}>보통+10 · 희귀+25 · 전설+60 · 신화+150</span>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                  {TOURNAMENT_PRIZES.map((prize, i) => (
                    <div key={i} style={{ textAlign: 'center', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 8, padding: '4px 10px' }}>
                      <div style={{ fontSize: 16 }}>{'🥇🥈🥉'[i]}</div>
                      <div style={{ fontSize: 11, color: '#ffd700', fontWeight: 700 }}>+{prize.toLocaleString()}G</div>
                    </div>
                  ))}
                </div>
                {myEntry && (
                  <div style={{ background: 'rgba(100,200,255,0.1)', border: '1px solid rgba(100,200,255,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🎣</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#7df', fontSize: 13 }}>{nickname} (내 기록)</div>
                      <div style={{ color: '#aaa', fontSize: 12 }}>
                        총 {myEntry.score.toLocaleString()}cm · {myRank + 1}위
                      </div>
                    </div>
                  </div>
                )}
                {!myEntry && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 10 }}>
                    아직 기록 없음 — 낚시하면 자동 등록!
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {tournamentRanking.length === 0 && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 16 }}>
                      이번 주 참가자 없음
                    </div>
                  )}
                  {tournamentRanking.map((entry, idx) => {
                    const isMe = entry.nickname === nickname;
                    return (
                      <div key={entry.nickname} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 7,
                        background: isMe ? 'rgba(100,200,255,0.12)' : idx < 3 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isMe ? 'rgba(100,200,255,0.35)' : idx < 3 ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                        <span style={{ fontSize: 16, minWidth: 24, textAlign: 'center' }}>
                          {idx < 3 ? MEDAL[idx] : `${idx + 1}`}
                        </span>
                        <span style={{ flex: 1, fontWeight: isMe ? 700 : 400, color: isMe ? '#7df' : idx < 3 ? '#ffd700' : '#ccc', fontSize: 13 }}>
                          {entry.nickname}
                        </span>
                        <span style={{ fontSize: 12, color: '#aaa' }}>{entry.score.toLocaleString()}cm</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settings panel */}
      {showSettings && (() => {
        const SFX_LABELS = {
          낚시시작: '낚시 시작', 포획: '물고기 포획', 채굴: '채굴',
          요리: '요리 완료', 판매: '아이템 판매', 입장: '실내 입장',
          NPC: 'NPC 대화', 레벨업: '레벨업', 수영: '수영/물',
        };
        return (
          <div className="overlay" onClick={() => setShowSettings(false)}>
            <div className="panel" onClick={e => e.stopPropagation()}>
              <div className="panel-head">
                <span>⚙️ 설정</span>
                <button tabIndex={-1} onClick={() => setShowSettings(false)}>✕</button>
              </div>

              <div className="section">
                <div className="section-title">BGM 볼륨</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <span style={{ fontSize: 13, minWidth: 28 }}>🎵</span>
                  <input type="range" min={0} max={1} step={0.05} value={bgmVol}
                    style={{ flex: 1, accentColor: '#4af' }}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      setBgmVolState(v);
                      setBgmVolume(v);
                    }}
                  />
                  <span style={{ fontSize: 12, minWidth: 36, color: '#aaa' }}>{Math.round(bgmVol * 100)}%</span>
                </div>
              </div>

              <div className="section">
                <div className="section-title">효과음 개별 설정</div>
                {Object.entries(SFX_LABELS).map(([key, label]) => {
                  const enabled = settingsState.sfx[key] !== false;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 13, color: enabled ? '#ddd' : '#666' }}>{label}</span>
                      <button tabIndex={-1}
                        onClick={() => {
                          setSfxEnabled(key, !enabled);
                          setSettingsState(s => ({ ...s, sfx: { ...s.sfx, [key]: !enabled } }));
                        }}
                        style={{
                          padding: '3px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: enabled ? 'rgba(60,180,80,0.3)' : 'rgba(180,60,60,0.3)',
                          color: enabled ? '#6f6' : '#f66',
                        }}
                      >{enabled ? 'ON' : 'OFF'}</button>
                    </div>
                  );
                })}
              </div>

              <div className="section">
                <div className="section-title">캔버스 화질</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['low', 'medium', 'high'].map(q => {
                    const labels = { low: '낮음', medium: '중간', high: '높음' };
                    const active = settingsState.canvasQuality === q;
                    return (
                      <button key={q} tabIndex={-1}
                        onClick={() => {
                          setCanvasQuality(q);
                          setSettingsState(s => ({ ...s, canvasQuality: q }));
                        }}
                        style={{
                          flex: 1, padding: '6px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
                          background: active ? 'rgba(80,160,255,0.35)' : 'rgba(255,255,255,0.06)',
                          color: active ? '#7df' : 'rgba(255,255,255,0.55)',
                          fontWeight: active ? 700 : 400,
                        }}
                      >{labels[q]}</button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  낮음: 파티클·장식 감소 / 중간: 기본 / 높음: 최대 품질 (다음 접속부터 적용)
                </div>
              </div>

              {/* Cloud save backup */}
              <div className="section">
                <div className="section-title">💾 세이브 데이터 백업</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button tabIndex={-1} className="btn-eq" style={{ fontSize: 12 }}
                    onClick={() => {
                      const key = `fishingGame_v2_${nickname}`;
                      const raw = localStorage.getItem(key);
                      if (!raw) { addMsg('저장 데이터가 없습니다.', 'error'); return; }
                      const blob = new Blob([raw], { type: 'application/octet-stream' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `tidehaven_${nickname}_backup.save`;
                      a.click(); URL.revokeObjectURL(url);
                      addMsg('💾 세이브 데이터 다운로드 완료!', 'catch');
                    }}>
                    📥 백업 다운로드
                  </button>
                  <label tabIndex={-1} className="btn-eq" style={{ fontSize: 12, cursor: 'pointer' }}>
                    📤 백업 불러오기
                    <input type="file" accept=".save,.json" style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          try {
                            const raw = ev.target.result;
                            const key = `fishingGame_v2_${nickname}`;
                            localStorage.setItem(key, raw);
                            addMsg('✅ 백업 복구 완료! 새로고침하면 적용됩니다.', 'catch');
                          } catch { addMsg('백업 파일 오류', 'error'); }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>세이브 파일을 로컬에 백업하고 복구합니다.</div>
              </div>

              {/* Push notifications */}
              <div className="section">
                <div className="section-title">🔔 푸시 알림</div>
                {(() => {
                  const supported = 'Notification' in window;
                  const permission = supported ? Notification.permission : 'unsupported';
                  return (
                    <div>
                      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                        일일 퀘스트 초기화(자정) 시 알림을 받을 수 있습니다.
                      </div>
                      {!supported && (
                        <div style={{ fontSize: 12, color: '#ff8888' }}>이 브라우저는 알림을 지원하지 않습니다.</div>
                      )}
                      {supported && permission === 'denied' && (
                        <div style={{ fontSize: 12, color: '#ff8888' }}>알림이 차단되었습니다. 브라우저 설정에서 직접 허용해주세요.</div>
                      )}
                      {supported && permission === 'granted' && (
                        <div style={{ fontSize: 12, color: '#88ffaa' }}>✅ 알림이 허용되어 있습니다. 자정에 일일 퀘스트 초기화 알림이 옵니다.</div>
                      )}
                      {supported && permission === 'default' && (
                        <button tabIndex={-1} className="btn-buy" style={{ fontSize: 12 }}
                          onClick={async () => {
                            const result = await Notification.requestPermission();
                            if (result === 'granted') {
                              new Notification('Tidehaven 🎣', {
                                body: '알림이 허용되었습니다! 매일 자정 일일 퀘스트 초기화 알림을 드립니다.',
                                icon: '/vite.svg',
                              });
                            }
                          }}>
                          알림 허용하기
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* D-3: Colorblind mode */}
              <div className="section">
                <div className="section-title">접근성</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>색약 친화 희귀도 색상 모드</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>빨강/녹색 대신 청색/주황으로 구분</div>
                  </div>
                  <button tabIndex={-1}
                    onClick={() => {
                      const next = !settingsState.colorBlindMode;
                      setColorBlindMode(next);
                      setSettingsState(s => ({ ...s, colorBlindMode: next }));
                    }}
                    style={{ padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
                      background: settingsState.colorBlindMode ? 'rgba(80,160,255,0.35)' : 'rgba(255,255,255,0.08)',
                      color: settingsState.colorBlindMode ? '#7df' : 'rgba(255,255,255,0.55)',
                      fontWeight: settingsState.colorBlindMode ? 700 : 400,
                    }}
                  >{settingsState.colorBlindMode ? 'ON' : 'OFF'}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 우편함 패널 ── */}
      {showMailbox && (() => {
        const MailboxPanel = () => {
          const [mails, setMails] = useState(null);
          const [loading, setLoading] = useState(false);
          const [sendTo, setSendTo] = useState('');
          const [sendMsg, setSendMsg] = useState('');
          const [sending, setSending] = useState(false);
          const [sendStatus, setSendStatus] = useState('');
          return (
            <div className="overlay" onClick={() => setShowMailbox(false)}>
              <div className="panel" style={{ maxWidth: 440, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div className="panel-head">
                  <span>📬 우편함</span>
                  <button tabIndex={-1} onClick={() => setShowMailbox(false)}>✕</button>
                </div>
                <div className="section">
                  <div className="section-title">받은 편지함 (최대 10개)</div>
                  {mails === null ? (
                    <button tabIndex={-1} className="btn-buy" onClick={async () => {
                      setLoading(true);
                      const result = await fetchMailbox(nickname);
                      setMails(result);
                      setLoading(false);
                    }}>{loading ? '불러오는 중…' : '편지 확인'}</button>
                  ) : mails.length === 0 ? (
                    <div className="empty">받은 편지가 없습니다.</div>
                  ) : (
                    <>
                      {[...mails].reverse().map((mail, i) => (
                        <div key={i} className="rod-card" style={{ borderColor: mail.read ? undefined : 'rgba(100,200,255,0.4)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: '#88ccff', fontSize: 12 }}>📨 {mail.from}</span>
                            <span style={{ fontSize: 10, color: '#666' }}>{new Date(mail.sentAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                          <div style={{ fontSize: 13 }}>{mail.message}</div>
                          {mail.gold > 0 && <div style={{ fontSize: 12, color: '#ffcc44', marginTop: 4 }}>💰 동봉 골드: +{mail.gold}G</div>}
                        </div>
                      ))}
                      <button tabIndex={-1} className="btn-eq" style={{ marginTop: 8, fontSize: 11 }} onClick={async () => {
                        await clearMailbox(nickname);
                        setMails([]);
                        addMsg('📬 우편함을 비웠습니다.', 'system');
                      }}>우편함 비우기</button>
                    </>
                  )}
                </div>
                <div className="section">
                  <div className="section-title">편지 보내기</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="닉네임..."
                      style={{ width: 100, padding: '5px 8px', background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12 }} />
                    <input value={sendMsg} onChange={e => setSendMsg(e.target.value.slice(0, 200))} placeholder="메시지 (최대 200자)..."
                      style={{ flex: 1, padding: '5px 8px', background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12 }} />
                  </div>
                  <button tabIndex={-1} className={sendTo.trim() && sendMsg.trim() ? 'btn-buy' : 'btn-dis'}
                    disabled={sending || !sendTo.trim() || !sendMsg.trim()}
                    onClick={async () => {
                      const to = sendTo.trim(); const msg = sendMsg.trim();
                      if (!to || !msg) return;
                      if (to === nickname) { setSendStatus('자신에게는 편지를 보낼 수 없습니다.'); return; }
                      setSending(true); setSendStatus('');
                      await sendPlayerMail(to, nickname, msg);
                      setSending(false); setSendMsg('');
                      setSendStatus(`✅ ${to}에게 편지를 보냈습니다!`);
                    }}>
                    {sending ? '전송 중…' : '보내기'}
                  </button>
                  {sendStatus && <div style={{ fontSize: 12, marginTop: 6, color: sendStatus.startsWith('✅') ? '#88ffaa' : '#ff8888' }}>{sendStatus}</div>}
                </div>
              </div>
            </div>
          );
        };
        return <MailboxPanel key="mailbox" />;
      })()}

      {/* ── 시즌 리그 패널 ── */}
      {showSeasonLeague && (() => {
        const SeasonPanel = () => {
          const [rows, setRows] = useState(null);
          const [loading, setLoading] = useState(false);
          const MEDAL = ['🥇', '🥈', '🥉'];
          const seasonLabel = (() => { const k = getSeasonKey(); const [y, m] = k.split('-'); return `${y}년 ${parseInt(m)}월`; })();
          // Season title rewards per rank
          const SEASON_REWARDS = [
            { rank: 1, title: `시즌 낚시왕`, color: '#ffd700', icon: '🏆' },
            { rank: 2, title: `시즌 고수`, color: '#c0c0c0', icon: '🥈' },
            { rank: 3, title: `시즌 강자`, color: '#cd7f32', icon: '🥉' },
          ];
          return (
            <div className="overlay" onClick={() => setShowSeasonLeague(false)}>
              <div className="panel" onClick={e => e.stopPropagation()}>
                <div className="panel-head">
                  <span>🏆 낚시 시즌 리그 — {seasonLabel}</span>
                  <button tabIndex={-1} onClick={() => setShowSeasonLeague(false)}>✕</button>
                </div>
                <div className="section">
                  <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                    매월 낚은 물고기 수로 순위 결정. 월말 상위 3명에게 전용 칭호 지급.
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                    {SEASON_REWARDS.map(r => (
                      <div key={r.rank} style={{ textAlign: 'center', background: 'rgba(255,215,0,0.08)',
                        border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, padding: '4px 10px' }}>
                        <div style={{ fontSize: 18 }}>{r.icon}</div>
                        <div style={{ fontSize: 11, color: r.color, fontWeight: 700 }}>{r.title}</div>
                      </div>
                    ))}
                  </div>
                  {rows === null ? (
                    <button tabIndex={-1} className="btn-buy" onClick={() => {
                      setLoading(true);
                      const unsub = subscribeSeasonRankings(data => {
                        setRows(data); setLoading(false); unsub();
                      });
                    }}>{loading ? '불러오는 중…' : '순위 확인'}</button>
                  ) : rows.length === 0 ? (
                    <div className="empty">이번 달 참가자가 없습니다.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {rows.map((entry, idx) => {
                        const isMe = entry.nickname === nickname;
                        return (
                          <div key={entry.nickname} className="rod-card"
                            style={{ display: 'flex', alignItems: 'center', gap: 8,
                              background: isMe ? 'rgba(100,200,255,0.1)' : undefined,
                              borderColor: isMe ? 'rgba(100,200,255,0.4)' : undefined }}>
                            <span style={{ fontSize: 18, minWidth: 24 }}>{MEDAL[idx] ?? `${idx + 1}`}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: isMe ? '#7df' : '#fff', fontSize: 13 }}>
                                {entry.nickname}{isMe ? ' (나)' : ''}
                              </div>
                              <div style={{ fontSize: 12, color: '#aaa' }}>{(entry.fishCaught ?? 0).toLocaleString()}마리</div>
                            </div>
                            {idx < 3 && <span style={{ fontSize: 11, color: SEASON_REWARDS[idx].color }}>{SEASON_REWARDS[idx].title}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        };
        return <SeasonPanel key="season" />;
      })()}

      {/* ── 오두막 패널 ── */}
      {showCottage && (
        <CottagePanel
          gs={gs} setGs={setGs} nickname={nickname}
          onClose={() => setShowCottage(false)}
          addMsg={addMsg}
        />
      )}

      {buyToast && <div className="buy-toast">✅ {buyToast}</div>}
    </>
  );
}
