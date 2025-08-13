import { useState } from 'react';
import { format, addDays, addMonths, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateMode = 'single' | 'multiple' | 'recurring';
export type RecurrencePattern = 'weekly' | 'weekdays' | 'weekends' | 'monthly' | 'yearly';

interface RecurringDateSelectorProps {
  mode: DateMode;
  onModeChange: (mode: DateMode) => void;
  singleDate?: Date;
  onSingleDateChange: (date: Date | undefined) => void;
  multipleDates: Date[];
  onMultipleDatesChange: (dates: Date[]) => void;
  recurrencePattern?: RecurrencePattern;
  onRecurrencePatternChange: (pattern: RecurrencePattern) => void;
  recurrenceStartDate?: Date;
  onRecurrenceStartDateChange: (date: Date | undefined) => void;
  recurrenceEndDate?: Date;
  onRecurrenceEndDateChange: (date: Date | undefined) => void;
  onGeneratedDatesChange: (dates: Date[]) => void;
}

const RecurringDateSelector = ({
  mode,
  onModeChange,
  singleDate,
  onSingleDateChange,
  multipleDates,
  onMultipleDatesChange,
  recurrencePattern,
  onRecurrencePatternChange,
  recurrenceStartDate,
  onRecurrenceStartDateChange,
  recurrenceEndDate,
  onRecurrenceEndDateChange,
  onGeneratedDatesChange
}: RecurringDateSelectorProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const generateRecurringDates = () => {
    if (!recurrencePattern || !recurrenceStartDate || !recurrenceEndDate) return [];

    const dates: Date[] = [];
    let currentDate = startOfDay(recurrenceStartDate);
    const endDate = startOfDay(recurrenceEndDate);

    while (currentDate <= endDate) {
      switch (recurrencePattern) {
        case 'weekly':
          dates.push(new Date(currentDate));
          currentDate = addDays(currentDate, 7);
          break;
        case 'weekdays':
          if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
            dates.push(new Date(currentDate));
          }
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekends':
          if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            dates.push(new Date(currentDate));
          }
          currentDate = addDays(currentDate, 1);
          break;
        case 'monthly':
          dates.push(new Date(currentDate));
          currentDate = addMonths(currentDate, 1);
          break;
        case 'yearly':
          dates.push(new Date(currentDate));
          currentDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
          break;
      }
    }

    onGeneratedDatesChange(dates);
    return dates;
  };

  const handleMultipleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = multipleDates.some(d => 
      d.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      onMultipleDatesChange(multipleDates.filter(d => 
        d.toDateString() !== date.toDateString()
      ));
    } else {
      onMultipleDatesChange([...multipleDates, date]);
    }
  };

  const removeMultipleDate = (dateToRemove: Date) => {
    onMultipleDatesChange(multipleDates.filter(d => 
      d.toDateString() !== dateToRemove.toDateString()
    ));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Date Type</Label>
        <Select value={mode} onValueChange={onModeChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Date</SelectItem>
            <SelectItem value="multiple">Multiple Specific Dates</SelectItem>
            <SelectItem value="recurring">Recurring Pattern</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'single' && (
        <div>
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !singleDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {singleDate ? format(singleDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]">
              <Calendar
                mode="single"
                selected={singleDate}
                onSelect={onSingleDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {mode === 'multiple' && (
        <div>
          <Label>Select Multiple Dates</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-1"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {multipleDates.length > 0 
                  ? `${multipleDates.length} dates selected` 
                  : "Select dates"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]">
              <Calendar
                mode="single"
                onSelect={handleMultipleDateSelect}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          {multipleDates.length > 0 && (
            <div className="mt-2 space-y-2">
              <Label className="text-sm text-muted-foreground">Selected Dates:</Label>
              <div className="flex flex-wrap gap-2">
                {multipleDates.map((date, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {format(date, "MMM d")}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeMultipleDate(date)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'recurring' && (
        <div className="space-y-4">
          <div>
            <Label>Recurrence Pattern</Label>
            <Select value={recurrencePattern} onValueChange={onRecurrencePatternChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly (same day each week)</SelectItem>
                <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                <SelectItem value="monthly">Monthly (same date each month)</SelectItem>
                <SelectItem value="yearly">Yearly (same date each year)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !recurrenceStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurrenceStartDate ? format(recurrenceStartDate, "PPP") : <span>Start</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]">
                  <Calendar
                    mode="single"
                    selected={recurrenceStartDate}
                    onSelect={onRecurrenceStartDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !recurrenceEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : <span>End</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]">
                  <Calendar
                    mode="single"
                    selected={recurrenceEndDate}
                    onSelect={onRecurrenceEndDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {recurrencePattern && recurrenceStartDate && recurrenceEndDate && (
            <div>
              <Button 
                onClick={generateRecurringDates}
                variant="outline"
                className="w-full mt-2"
              >
                Generate {generateRecurringDates().length} Expense Entries
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringDateSelector;