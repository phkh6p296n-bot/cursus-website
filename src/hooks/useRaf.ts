import { useEffect, useRef } from 'react';

/** Calls cb(dtSeconds) every animation frame while active. */
export function useRaf(cb: (dt: number) => void, active: boolean) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    let last = performance.now();
    let id = requestAnimationFrame(function loop(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      cbRef.current(dt);
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [active]);
}
