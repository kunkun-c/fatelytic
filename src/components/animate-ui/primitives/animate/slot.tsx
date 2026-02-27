'use client';

import * as React from 'react';
import { motion, isMotionComponent, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type AnyProps = Record<string, unknown>;

const motionComponentCache = new WeakMap<
  object,
  React.ElementType
>();
const motionTagCache = new Map<string, React.ElementType>();

function getCachedMotionComponent(type: React.ElementType): React.ElementType {
  if (typeof type === 'string') {
    const cached = motionTagCache.get(type);
    if (cached) return cached;

    const created = motion.create(type as unknown as React.ElementType);
    motionTagCache.set(type, created);
    return created;
  }

  const cached = motionComponentCache.get(type as unknown as object);
  if (cached) return cached;

  const created = motion.create(type);
  motionComponentCache.set(type as unknown as object, created);
  return created;
}

type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLMotionProps<keyof HTMLElementTagNameMap>,
  'ref' | 'children'
> & { ref?: React.Ref<T> };

type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: React.ReactElement })
  | (Base & { asChild?: false | undefined });

type SlotProps<T extends HTMLElement = HTMLElement> = {
  children?: React.ReactNode;
} & DOMMotionProps<T>;

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
}

function mergeProps<T extends HTMLElement>(
  childProps: AnyProps,
  slotProps: DOMMotionProps<T>,
): AnyProps {
  const merged: AnyProps = {};

  // Merge regular props
  Object.keys(childProps).forEach(key => {
    if (!key.startsWith('while') && key !== 'initial' && key !== 'animate' && key !== 'exit' && key !== 'variants' && key !== 'transition') {
      merged[key] = childProps[key];
    }
  });

  // Merge slot props (including animation props)
  Object.keys(slotProps).forEach(key => {
    merged[key] = slotProps[key];
  });

  // Special handling for className
  if (childProps.className || slotProps.className) {
    merged.className = cn(
      childProps.className as string,
      slotProps.className as string,
    );
  }

  // Special handling for style
  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }

  return merged;
}

const Slot = React.forwardRef<HTMLElement, SlotProps<HTMLElement>>(
  ({ children, ...props }, ref) => {
    const isAlreadyMotion = React.useMemo(() => {
      if (!React.isValidElement(children)) return false;
      return (
        typeof children.type === 'object' &&
        children.type !== null &&
        isMotionComponent(children.type)
      );
    }, [children]);

    const Base = React.useMemo(() => {
      if (!React.isValidElement(children)) return null;
      return isAlreadyMotion
        ? (children.type as React.ElementType)
        : getCachedMotionComponent(children.type as React.ElementType);
    }, [isAlreadyMotion, children]);

    if (!React.isValidElement(children)) return null;

    const childRef = (children as unknown as { ref?: React.Ref<HTMLElement> }).ref;
    const childProps = children.props as AnyProps;

    const mergedProps = mergeProps(childProps, props);

    return (
      <Base {...mergedProps} ref={mergeRefs(childRef, ref)} />
    );
  }
);

export {
  Slot,
  type SlotProps,
  type WithAsChild,
  type DOMMotionProps,
  type AnyProps,
};
