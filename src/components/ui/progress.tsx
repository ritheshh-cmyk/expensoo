import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  variant?: "brand" | "green" | "amber" | "red";
  label?: string;
  showPercent?: boolean;
}

const variantColour: Record<string, string> = {
  brand: "bg-[#d97757]",
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  red: "bg-red-500",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, variant = "brand", label, showPercent, ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("w-full space-y-1", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showPercent && (
            <span className="font-medium text-foreground">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        value={clamped}
        className="relative h-2 w-full overflow-hidden rounded-full bg-white/8"
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full flex-1 transition-all duration-500 ease-out rounded-full",
            variantColour[variant] ?? variantColour.brand
          )}
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});
Progress.displayName = "Progress";

export { Progress };
