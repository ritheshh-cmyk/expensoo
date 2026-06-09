import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldInputGroupProps {
  id?: string;
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "select" | "textarea";
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  options?: FieldOption[];
  rows?: number;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
}

export function FieldInputGroup({
  id: propId,
  label,
  name,
  type = "text",
  value,
  defaultValue,
  onChange,
  onBlur,
  placeholder,
  prefixIcon,
  suffixIcon,
  helperText,
  error,
  required,
  disabled,
  readOnly,
  options = [],
  rows = 3,
  className,
  inputClassName,
  autoComplete,
}: FieldInputGroupProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const localId = React.useId();
  const id = propId || name || localId;

  const baseInputCls = cn(
    "bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50",
    "focus:border-[#d97757]/60 focus:ring-1 focus:ring-[#d97757]/30",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    error && "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20",
    prefixIcon && "pl-9",
    (suffixIcon || type === "password") && "pr-9",
    inputClassName
  );

  // Uncontrolled vs Controlled support
  const commonProps: any = {
    id,
    name,
    disabled,
    readOnly,
    placeholder,
    onBlur,
  };
  if (value !== undefined) {
    commonProps.value = value;
  } else if (defaultValue !== undefined) {
    commonProps.defaultValue = defaultValue;
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* Label */}
      <Label htmlFor={id} className={cn("text-sm font-medium", error ? "text-red-400" : "text-foreground/80")}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>

      {/* Input area */}
      <div className="relative">
        {/* Prefix icon */}
        {prefixIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none">
            {prefixIcon}
          </span>
        )}

        {type === "select" ? (
          <Select
            value={String(value ?? defaultValue ?? "")}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger id={id} className={cn(baseInputCls, "w-full")}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea
            {...commonProps}
            onChange={(e) => onChange?.(e.target.value)}
            rows={rows}
            className={cn(baseInputCls, "resize-none")}
          />
        ) : (
          <Input
            {...commonProps}
            type={type === "password" ? (showPassword ? "text" : "password") : type}
            onChange={(e) => onChange?.(e.target.value)}
            autoComplete={autoComplete}
            className={baseInputCls}
          />
        )}

        {/* Suffix icon / password toggle */}
        {type === "password" ? (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-11 w-11 text-muted-foreground/60 hover:text-foreground transition-colors flex items-center justify-center rounded-lg hover:bg-white/5"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        ) : suffixIcon ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none">
            {suffixIcon}
          </span>
        ) : null}
      </div>

      {/* Error or helper text */}
      {error ? (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground/60 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
