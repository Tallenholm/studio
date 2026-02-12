
'use client';

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  value: number;
  type?: 'number' | 'currency';
  duration?: number;
}

// Ease-out function: starts fast, then slows down
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function AnimatedCounter({ value, type = 'number', duration = 1500 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const animationFrameId = useRef<number>();

  useEffect(() => {
    if (!inView) return;

    let startTimestamp: number | null = null;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      setCount(easedProgress * value);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(step);
      } else {
        // Ensure final value is exact
        setCount(value);
      }
    };
    
    animationFrameId.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [inView, value, duration]);
  
  const formatValue = (val: number) => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return Math.round(val).toLocaleString();
  }

  return <span ref={ref}>{formatValue(count)}</span>;
}
