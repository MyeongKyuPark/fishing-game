// ── Keyboard Shortcuts Hook ───────────────────────────────────────────────────
import { useEffect } from 'react';

export function useKeyboard({ setShowInv, setShowShop, setShowStats, setShowRank, setShowQuest, setShowDex, setShowShortcuts, setShowWorldMap }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        setShowInv(false);
        setShowShop(false);
        setShowStats(false);
        setShowRank(false);
        setShowQuest(false);
        setShowDex(false);
        setShowShortcuts?.(false);
        setShowWorldMap?.(false);
      } else if (e.key === 'm' || e.key === 'M') {
        setShowWorldMap?.(v => !v);
      } else if (e.key === '?') {
        setShowShortcuts?.(v => !v);
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInv(v => !v);
      } else if (e.key === 's' || e.key === 'S') {
        setShowShop(v => !v);
      } else if (e.key === 'a' || e.key === 'A') {
        setShowStats(v => !v);
      } else if (e.key === 'q' || e.key === 'Q') {
        setShowQuest(v => !v);
      } else if (e.key === 'd' || e.key === 'D') {
        setShowDex(v => !v);
      } else if (e.key === 'r' || e.key === 'R') {
        setShowRank(v => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setShowInv, setShowShop, setShowStats, setShowRank, setShowQuest, setShowDex, setShowShortcuts, setShowWorldMap]);
}
