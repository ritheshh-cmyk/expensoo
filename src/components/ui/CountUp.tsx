import React, { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  separator?: string;
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 0.8,
  className = '',
  separator = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  
  // Sanitize input props to ensure they are finite numbers
  const targetValue = Number(to);
  const startValue = Number(from);
  const safeTo = Number.isFinite(targetValue) ? targetValue : 0;
  const safeFrom = Number.isFinite(startValue) ? startValue : 0;

  const motionValue = useMotionValue(direction === 'down' ? safeTo : safeFrom);
  
  // Make spring physics snappier and faster
  const damping = 12 + duration * 4;
  const stiffness = 220 / duration;

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
    mass: 1,
  });
  
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === 'down' ? safeFrom : safeTo);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, delay, motionValue, direction, safeFrom, safeTo]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        const val = typeof latest === 'number' && Number.isFinite(latest) ? latest : 0;
        const formattedNumber = Intl.NumberFormat('en-US', {
          useGrouping: !!separator,
        }).format(Math.floor(val));
        
        ref.current.textContent = separator 
          ? formattedNumber.replace(/,/g, separator)
          : Math.floor(val).toString();
      }
    });
  }, [springValue, separator]);

  return (
    <span ref={ref} className={className}>
      {direction === 'down' ? safeTo : safeFrom}
    </span>
  );
}
