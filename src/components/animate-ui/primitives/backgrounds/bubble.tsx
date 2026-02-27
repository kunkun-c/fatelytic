'use client';

import * as React from 'react';
import { motion, type SpringOptions } from 'motion/react';

import { cn } from '@/lib/utils';

export type BubbleColors = {
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  sixth: string;
};

export type BubbleBackgroundProps = React.ComponentProps<'div'> & {
  interactive?: boolean;
  transition?: SpringOptions;
  colors?: BubbleColors;
};

const DEFAULT_COLORS: BubbleColors = {
  first: '59,130,246',
  second: '168,85,247',
  third: '34,211,238',
  fourth: '244,114,182',
  fifth: '251,191,36',
  sixth: '99,102,241',
};

const DEFAULT_TRANSITION: SpringOptions = { stiffness: 100, damping: 20 };

function BubbleBackground({
  className,
  interactive = false,
  transition = DEFAULT_TRANSITION,
  colors = DEFAULT_COLORS,
  ...props
}: BubbleBackgroundProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      const inside = relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1;
      const x = inside ? relX - 0.5 : 0;
      const y = inside ? relY - 0.5 : 0;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setOffset({ x: x * 24, y: y * 24 });
      });
    };

    const onLeave = () => setOffset({ x: 0, y: 0 });

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [interactive]);

  const bubbles = React.useMemo(
    () => [
      { x: '10%', y: '20%', size: 220, color: colors.first, delay: 0 },
      { x: '70%', y: '10%', size: 260, color: colors.second, delay: 0.4 },
      { x: '85%', y: '55%', size: 220, color: colors.third, delay: 0.2 },
      { x: '25%', y: '65%', size: 300, color: colors.fourth, delay: 0.6 },
      { x: '50%', y: '45%', size: 240, color: colors.fifth, delay: 0.3 },
      { x: '5%', y: '80%', size: 280, color: colors.sixth, delay: 0.5 },
    ],
    [colors]
  );

  return (
    <div
      ref={ref}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      {...props}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ x: offset.x, y: offset.y }}
        transition={transition}
      >
        {bubbles.map((b, idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full blur-2xl"
            style={{
              left: b.x,
              top: b.y,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 30% 30%, rgba(${b.color}, 0.55), rgba(${b.color}, 0) 70%)`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              y: [0, -18, 0],
              x: [0, 10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 9 + idx * 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: b.delay,
            }}
          />
        ))}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
    </div>
  );
}

export { BubbleBackground, DEFAULT_COLORS, DEFAULT_TRANSITION };
