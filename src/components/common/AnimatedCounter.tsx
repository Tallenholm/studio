
'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  value: number;
  type?: 'number' | 'currency';
  duration?: number;
}

export default function AnimatedCounter({ value, type = 'number', duration = 1000 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const end = value;
    if (start === end) return;

    const totalFrames = Math.round(duration / (1000 / 60));
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentVal = start + (end - start) * progress;

      setCount(currentVal);

      if (frame === totalFrames) {
        clearInterval(counter);
        setCount(end); // Ensure it ends on the exact value
      }
    }, duration / totalFrames);

    return () => clearInterval(counter);
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
