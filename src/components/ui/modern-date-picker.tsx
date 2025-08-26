import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ModernDatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: (date: Date) => boolean;
  fromYear?: number;
  toYear?: number;
}

export function ModernDatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  className,
  disabled,
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10,
}: ModernDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={disabled}
          fromYear={fromYear}
          toYear={toYear}
          defaultMonth={date}
          initialFocus
          captionLayout="dropdown-buttons"
        />
      </PopoverContent>
    </Popover>
  );
}