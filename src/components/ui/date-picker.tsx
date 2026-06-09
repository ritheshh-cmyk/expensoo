"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ── Single date picker ────────────────────────────────────────────────────────
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", disabled, disabledDates, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 430);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    // Format to yyyy-MM-dd for native date input
    const formattedValue = value ? format(value, "yyyy-MM-dd") : "";
    return (
      <input
        type="date"
        value={formattedValue}
        onChange={(e) => {
          const d = e.target.value ? new Date(e.target.value) : undefined;
          onChange(d);
        }}
        disabled={disabled}
        className={cn(
          "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-foreground",
          "focus:border-[#d97757]/60 focus:ring-1 focus:ring-[#d97757]/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20",
            "focus-visible:border-[#d97757]/60 focus-visible:ring-[#d97757]/30",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          {value ? format(value, "MMMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-white/10 bg-[#0c0c14]/95 backdrop-blur-2xl"
        align="start"
      >
        <DayPicker
          mode="single"
          selected={value}
          onSelect={(date) => { onChange(date); setOpen(false); }}
          disabled={disabledDates}
          className="p-3"
          classNames={{
            months: "flex flex-col sm:flex-row gap-4",
            month: "space-y-3",
            caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
            caption_label: "text-foreground",
            nav: "flex items-center gap-1",
            nav_button: cn(
              "h-7 w-7 rounded-md border border-white/10 bg-white/5",
              "hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors",
              "inline-flex items-center justify-center"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground/60 rounded-md w-9 font-normal text-[0.8rem] text-center",
            row: "flex w-full mt-1",
            cell: "h-9 w-9 text-center text-sm p-0 relative",
            day: cn(
              "h-9 w-9 rounded-md hover:bg-white/10 transition-colors",
              "font-normal text-foreground aria-selected:opacity-100"
            ),
            day_selected: "bg-[#d97757] text-white hover:bg-[#d97757]/90 font-medium",
            day_today: "text-[#d97757] font-semibold",
            day_outside: "opacity-30",
            day_disabled: "opacity-20 cursor-not-allowed",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Date range picker ─────────────────────────────────────────────────────────
interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({ value, onChange, placeholder = "Pick date range", disabled, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`
      : format(value.from, "MMM d, yyyy")
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-white/10 bg-[#0c0c14]/95 backdrop-blur-2xl"
        align="start"
      >
        <DayPicker
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          className="p-3"
          classNames={{
            months: "flex flex-col sm:flex-row gap-4",
            month: "space-y-3",
            caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
            caption_label: "text-foreground",
            nav: "flex items-center gap-1",
            nav_button: cn(
              "h-7 w-7 rounded-md border border-white/10 bg-white/5",
              "hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors",
              "inline-flex items-center justify-center"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground/60 rounded-md w-9 font-normal text-[0.8rem] text-center",
            row: "flex w-full mt-1",
            cell: "h-9 w-9 text-center text-sm p-0 relative",
            day: "h-9 w-9 rounded-md hover:bg-white/10 transition-colors font-normal text-foreground",
            day_selected: "bg-[#d97757] text-white hover:bg-[#d97757]/90 font-medium",
            day_range_middle: "bg-[#d97757]/15 rounded-none",
            day_range_start: "bg-[#d97757] text-white rounded-l-md",
            day_range_end: "bg-[#d97757] text-white rounded-r-md",
            day_today: "text-[#d97757] font-semibold",
            day_outside: "opacity-30",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
