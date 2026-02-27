'use client';

import * as React from 'react';
import { motion, type Transition, type HTMLMotionProps, type TargetAndTransition } from 'motion/react';

import { cn } from '@/lib/utils';

type RevealProps = HTMLMotionProps<'div'> & {
  asChild?: boolean;
  delay?: number;
  duration?: number;
  once?: boolean;
  margin?: string;
  from?: 'up' | 'down' | 'left' | 'right' | 'none';
  offset?: number;
  blur?: number;
  transition?: Transition;
};

function Reveal({
  className,
  delay = 0,
  duration = 0.45,
  once = true,
  margin = '0px 0px -10% 0px',
  from = 'up',
  offset = 18,
  blur = 0,
  transition,
  ...props
}: RevealProps) {
  const initial: TargetAndTransition = React.useMemo(() => {
    const base: TargetAndTransition = {
      opacity: 0,
      ...(blur > 0 ? { filter: `blur(${blur}px)` } : {}),
    };

    if (from === 'up') return { ...base, y: offset };
    if (from === 'down') return { ...base, y: -offset };
    if (from === 'left') return { ...base, x: offset };
    if (from === 'right') return { ...base, x: -offset };
    return base;
  }, [blur, from, offset]);

  const animate: TargetAndTransition = React.useMemo(
    () => ({ opacity: 1, x: 0, y: 0, ...(blur > 0 ? { filter: 'blur(0px)' } : {}) }),
    [blur],
  );

  const finalTransition: Transition =
    transition ??
    ({
      type: 'spring',
      stiffness: 120,
      damping: 18,
      mass: 0.6,
      delay,
      duration,
    } satisfies Transition);

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once, margin }}
      transition={finalTransition}
      className={cn(className)}
      {...props}
    />
  );
}

export { Reveal, type RevealProps };
