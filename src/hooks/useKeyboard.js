// ── Keyboard Shortcuts Hook ───────────────────────────────────────────────────
import { useEffect } from 'react';

export function useKeyboard({ setShowInv, setShowShop, setShowStats, setShowRank, setShowQuest, setShowDex }) {
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
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setShowInv, setShowShop, setShowStats, setShowRank, setShowQuest, setShowDex]);
}
