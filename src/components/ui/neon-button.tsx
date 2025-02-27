import React from "react";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
  "relative group border text-foreground mx-auto text-center rounded-xl transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-transparent border-[#1a1f2d] text-white hover:border-blue-400/50",
        solid:
          "bg-blue-500 hover:bg-blue-600/90 text-white border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
        ghost:
          "border-transparent bg-transparent hover:border-zinc-600 hover:bg-white/10",
      },
      size: {
        default: "px-6 py-2",
        sm: "px-4 py-1.5",
        lg: "px-8 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  neon?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, neon = true, size, variant, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          "hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "absolute h-full w-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out -inset-px rounded-xl bg-gradient-to-r from-transparent via-blue-500/10 to-transparent blur-sm",
            neon && "block"
          )}
        />
        {children}
        <span
          className={cn(
            "absolute inset-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out rounded-xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent",
            neon && "block"
          )}
        />
      </button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export { NeonButton, buttonVariants };
