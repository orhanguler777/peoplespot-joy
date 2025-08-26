import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CleanDatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: (date: Date) => boolean;
  required?: boolean;
}

export function CleanDatePicker({
  date,
  onSelect,
  placeholder = "Select date",
  className,
  disabled,
  required = false,
}: CleanDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(
    date ? format(date, "yyyy-MM-dd") : ""
  );

  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "yyyy-MM-dd"));
    } else {
      setInputValue("");
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    if (selectedDate) {
      setInputValue(format(selectedDate, "yyyy-MM-dd"));
    } else {
      setInputValue("");
    }
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value) {
      const parsedDate = new Date(value + "T00:00:00");
      if (!isNaN(parsedDate.getTime())) {
        onSelect(parsedDate);
      }
    } else {
      onSelect(undefined);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        type="date"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-0 hover:bg-transparent"
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={disabled}
            defaultMonth={date}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}