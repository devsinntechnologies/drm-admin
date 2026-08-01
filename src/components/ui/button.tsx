import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-primary)] text-[#ffffff] shadow-[0_10px_20px_rgba(0,24,64,0.18)] hover:bg-[var(--brand-primary-hover)]",
        secondary:
          "bg-[var(--brand-secondary)] text-[#ffffff] shadow-[0_10px_20px_rgba(0,80,248,0.22)] hover:bg-[var(--brand-secondary-hover)]",
        outline:
          "border border-[#d7e1ed] bg-white text-[#0f172a] shadow-[0_8px_16px_rgba(15,23,42,0.06)] hover:bg-[#f4f8fc]",
        soft:
          "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] hover:bg-[var(--brand-secondary-soft)]",
        ghost: "text-[#334155] hover:bg-[#f8fafc] hover:text-[#111827]",
        destructive: "bg-[#dc2626] text-[#ffffff] hover:bg-[#b91c1c]",
        link: "text-[var(--brand-secondary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
