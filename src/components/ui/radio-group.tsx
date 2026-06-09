"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & { label?: string }
>(({ className, label, children, ...props }, ref) => (
  <label className="flex items-center gap-3 cursor-pointer min-h-[44px] group select-none">
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "h-4 w-4 rounded-full border border-white/20 shrink-0",
        "ring-offset-background focus:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#d97757]/60 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-[#d97757] data-[state=checked]:bg-[#d97757]/10",
        "transition-colors",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-[#d97757] block" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
    {(label || children) && (
      <span className="text-sm text-foreground/80 group-data-[state=checked]:text-foreground">
        {label ?? children}
      </span>
    )}
  </label>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
