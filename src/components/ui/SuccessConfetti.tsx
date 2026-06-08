import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useState, useEffect } from 'react';

interface SuccessConfettiProps {
  /** Flip this to true to trigger the confetti burst */
  trigger: boolean;
  /** How long (ms) to keep emitting new particles. Default: 4000 */
  duration?: number;
  /** Called after animation fully completes so parent can reset trigger */
  onDone?: () => void;
  /** Number of confetti pieces. Default: 220 */
  pieces?: number;
}

/**
 * SuccessConfetti
 * Drop-in celebration component. Mount it anywhere in the tree, pass `trigger`
 * as a boolean — when it flips to true, confetti fires for `duration` ms then fades.
 */
export function SuccessConfetti({
  trigger,
  duration = 4000,
  onDone,
  pieces = 220,
}: SuccessConfettiProps) {
  const { width, height } = useWindowSize();
  const [active, setActive] = useState(false);
  const [recycle, setRecycle] = useState(true);

  useEffect(() => {
    if (!trigger) return;

    setActive(true);
    setRecycle(true);

    // Stop emitting new particles after `duration` ms
    const stopTimer = setTimeout(() => {
      setRecycle(false);
    }, duration);

    // Fully hide after particles have fallen (extra 2.5 s)
    const hideTimer = setTimeout(() => {
      setActive(false);
      onDone?.();
    }, duration + 2500);

    return () => {
      clearTimeout(stopTimer);
      clearTimeout(hideTimer);
    };
  // Only re-run when trigger flips (not on every render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (!active) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={recycle}
      numberOfPieces={pieces}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
      colors={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']}
    />
  );
}
