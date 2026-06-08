import { LoaderOne } from "./loader";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({
  className,
  text = "Loading...",
}: LoadingProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center space-y-2", className)}
    >
      <LoaderOne />
      <span className="text-muted-foreground text-sm font-medium">{text}</span>
    </div>
  );
}
