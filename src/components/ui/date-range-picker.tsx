import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  date: DateRange | undefined;
  onSelect: (range: DateRange) => void;
  className?: string;
  align?: "center" | "start" | "end";
}

export function DateRangePicker({
  date,
  onSelect,
  className,
  align = "start",
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={onSelect}
        numberOfMonths={2}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            onSelect({ from: sevenDaysAgo, to: today });
          }}
        >
          Last 7 days
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            onSelect({ from: thirtyDaysAgo, to: today });
          }}
        >
          Last 30 days
        </Button>
      </div>
    </div>
  );
} 