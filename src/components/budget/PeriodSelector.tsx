import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface PeriodSelection {
  type: PeriodType;
  startDate: Date;
  endDate: Date;
  displayName: string;
}

interface PeriodSelectorProps {
  value: PeriodSelection;
  onChange: (period: PeriodSelection) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const getCurrentPeriod = (type: PeriodType, offset: number = 0): PeriodSelection => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let displayName: string;

    switch (type) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
        displayName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        break;
      
      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const targetQuarter = currentQuarter + offset;
        const year = now.getFullYear() + Math.floor(targetQuarter / 4);
        const quarter = ((targetQuarter % 4) + 4) % 4;
        
        startDate = new Date(year, quarter * 3, 1);
        endDate = new Date(year, quarter * 3 + 3, 0);
        displayName = `Q${quarter + 1} ${year}`;
        break;
      
      case 'yearly':
        startDate = new Date(now.getFullYear() + offset, 0, 1);
        endDate = new Date(now.getFullYear() + offset, 11, 31);
        displayName = `${now.getFullYear() + offset}`;
        break;
      
      case 'custom':
        startDate = customStartDate || now;
        endDate = customEndDate || now;
        displayName = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
        break;
      
      default:
        return getCurrentPeriod('monthly', 0);
    }

    return { type, startDate, endDate, displayName };
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (value.type === 'custom') return;
    
    const offset = direction === 'prev' ? -1 : 1;
    let currentOffset = 0;

    // Calculate current offset based on current period
    const currentPeriod = getCurrentPeriod(value.type, 0);
    if (value.startDate.getTime() !== currentPeriod.startDate.getTime()) {
      // Find the offset
      for (let i = -12; i <= 12; i++) {
        const testPeriod = getCurrentPeriod(value.type, i);
        if (testPeriod.startDate.getTime() === value.startDate.getTime()) {
          currentOffset = i;
          break;
        }
      }
    }

    const newPeriod = getCurrentPeriod(value.type, currentOffset + offset);
    onChange(newPeriod);
  };

  const handleTypeChange = (newType: PeriodType) => {
    if (newType === 'custom') {
      const period: PeriodSelection = {
        type: 'custom',
        startDate: customStartDate || new Date(),
        endDate: customEndDate || new Date(),
        displayName: 'Custom Range'
      };
      onChange(period);
    } else {
      onChange(getCurrentPeriod(newType, 0));
    }
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate && value.type === 'custom') {
      const period: PeriodSelection = {
        type: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
        displayName: `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d, yyyy')}`
      };
      onChange(period);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Select value={value.type} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="quarterly">Quarterly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {value.type !== 'custom' ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePeriod('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[140px] text-center">
            {value.displayName}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePeriod('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "MMM d, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={(date) => {
                  setCustomStartDate(date);
                  if (date) handleCustomDateChange();
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "MMM d, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={(date) => {
                  setCustomEndDate(date);
                  if (date) handleCustomDateChange();
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}