'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

import { Slot, type WithAsChild } from '@/components/animate-ui/primitives/animate/slot';

// Standard button props without motion types
type BaseButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  hoverScale?: number;
  tapScale?: number;
};

type MotionProps = Omit<HTMLMotionProps<'button'>, 'children' | 'ref'>;

type ButtonProps =
  | (BaseButtonProps &
      MotionProps & {
        asChild: true;
        children: React.ReactElement;
      })
  | (BaseButtonProps &
      MotionProps & {
        asChild?: false | undefined;
        children?: React.ReactNode;
      });

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      hoverScale = 1.05,
      tapScale = 0.95,
      asChild = false,
      children,
      className,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    // Filter props for Slot component (remove motion-specific props)
    const filteredProps = asChild
      ? Object.fromEntries(
          Object.entries(props).filter(([key]) => {
            // Filter out motion-specific props
            const motionProps = [
              'whileTap',
              'whileHover',
              'whileFocus',
              'whileInView',
              'whileDrag',
              'animate',
              'initial',
              'exit',
              'variants',
              'transition',
              'layout',
              'layoutId',
              'layoutScroll',
              'layoutRoot',
              'drag',
              'dragConstraints',
              'dragElastic',
              'dragMomentum',
              'dragPropagation',
              'dragListener',
              'onAnimationStart',
              'onAnimationComplete',
              'onUpdate',
              'onDragStart',
              'onDrag',
              'onDragEnd',
              'transformTemplate',
              'ref',
              'children',
            ];
            return !motionProps.includes(key);
          }),
        )
      : props;

    // Only apply animations when not using asChild to avoid conflicts
    const animationProps = asChild
      ? {}
      : {
          whileTap: { scale: tapScale },
          whileHover: { scale: hoverScale },
        };

    if (asChild) {
      return (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={className}
          onClick={onClick}
          {...filteredProps}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref as unknown as React.Ref<HTMLButtonElement>}
        className={className}
        disabled={disabled}
        onClick={onClick}
        {...animationProps}
        {...filteredProps}
      >
        {children}
      </motion.button>
    );
  },
);

export { Button, type ButtonProps };
