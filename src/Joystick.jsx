import { useEffect, useRef } from 'react';

const RADIUS = 44; // max handle travel from center

export default function Joystick({ gameRef }) {
  const baseRef = useRef(null);
  const handleRef = useRef(null);
  const activeId = useRef(null);

  useEffect(() => {
    const base = baseRef.current;
    if (!base) return;

    const clearKeys = () => {
      const g = gameRef.current;
      if (!g) return;
      g.keys.ArrowLeft = false;
      g.keys.ArrowRight = false;
      g.keys.ArrowUp = false;
      g.keys.ArrowDown = false;
    };

    const applyDir = (dx, dy) => {
      const g = gameRef.current;
      if (!g) return;
      const dead = RADIUS * 0.2;
      g.keys.ArrowLeft  = dx < -dead;
      g.keys.ArrowRight = dx > dead;
      g.keys.ArrowUp    = dy < -dead;
      g.keys.ArrowDown  = dy > dead;
    };

    const center = () => {
      const r = base.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };

    const moveHandle = (dx, dy) => {
      const len = Math.sqrt(dx * dx + dy * dy);
      const scale = len > RADIUS ? RADIUS / len : 1;
      const cx = dx * scale, cy = dy * scale;
      if (handleRef.current)
        handleRef.current.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
      applyDir(cx, cy);
    };

    const onStart = (e) => {
      e.preventDefault();
      if (activeId.current !== null) return;
      const t = e.changedTouches[0];
      activeId.current = t.identifier;
      const { cx, cy } = center();
      moveHandle(t.clientX - cx, t.clientY - cy);
    };

    const onMove = (e) => {
      e.preventDefault();
      const t = Array.from(e.changedTouches).find(x => x.identifier === activeId.current);
      if (!t) return;
      const { cx, cy } = center();
      moveHandle(t.clientX - cx, t.clientY - cy);
    };

    const onEnd = (e) => {
      const t = Array.from(e.changedTouches).find(x => x.identifier === activeId.current);
      if (!t) return;
      activeId.current = null;
      if (handleRef.current)
        handleRef.current.style.transform = 'translate(-50%, -50%)';
      clearKeys();
    };

    base.addEventListener('touchstart', onStart, { passive: false });
    base.addEventListener('touchmove', onMove, { passive: false });
    base.addEventListener('touchend', onEnd, { passive: false });
    base.addEventListener('touchcancel', onEnd, { passive: false });

    return () => {
      base.removeEventListener('touchstart', onStart);
      base.removeEventListener('touchmove', onMove);
      base.removeEventListener('touchend', onEnd);
      base.removeEventListener('touchcancel', onEnd);
      clearKeys();
    };
  }, [gameRef]);

  return (
    <div ref={baseRef} className="joystick-base">
      <div ref={handleRef} className="joystick-handle" />
    </div>
  );
}
