import * as React from "react";

import {
  Button as AnimateUIButton,
  buttonVariants,
} from "@/components/animate-ui/components/buttons/button";

import type { VariantProps } from "class-variance-authority";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  hoverScale?: number;
  tapScale?: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <AnimateUIButton {...(props as unknown as React.ComponentProps<typeof AnimateUIButton>)} ref={ref} />;
});

Button.displayName = "Button";

export { Button, buttonVariants };
