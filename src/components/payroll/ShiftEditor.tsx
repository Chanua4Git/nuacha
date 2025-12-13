import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { ShiftFormData } from '@/types/payroll';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LabelOverrides {
  title?: string;
  shiftName?: string;
  shiftHours?: string;
  baseRate?: string;
  hourlyRate?: string;
  addButton?: string;
  emptyStateTitle?: string;
  emptyStateDesc?: string;
}

interface ShiftEditorProps {
  shifts: ShiftFormData[];
  onChange: (shifts: ShiftFormData[]) => void;
  labelOverrides?: LabelOverrides;
  hideHoursField?: boolean;
  hideHourlyRate?: boolean;
}

const SHIFT_NAME_OPTIONS = [
  'Day Shift',
  'Night Shift',
  'Extended Day',
  'Weekend Day Shift',
];

const SHIFT_HOURS_OPTIONS = [
  '8am-4pm',
  '8am-6pm',
  '5pm-5am',
  '5pm-6am',
  '6pm-6am',
  '9am-5pm',
];

const OTHER_VALUE = '__other__';

const DEFAULT_SHIFT: ShiftFormData = {
  shift_name: '',
  shift_hours: '',
  base_rate: 0,
  hourly_rate: undefined,
  is_default: false,
};

export const ShiftEditor: React.FC<ShiftEditorProps> = ({ 
  shifts, 
  onChange, 
  labelOverrides,
  hideHoursField = false,
  hideHourlyRate = false,
}) => {
  // Merge default labels with overrides
  const labels = {
    title: labelOverrides?.title || 'Shift Configurations',
    shiftName: labelOverrides?.shiftName || 'Shift Name',
    shiftHours: labelOverrides?.shiftHours || 'Shift Hours',
    baseRate: labelOverrides?.baseRate || 'Base Rate (TTD)',
    hourlyRate: labelOverrides?.hourlyRate || 'Hourly Rate (TTD)',
    addButton: labelOverrides?.addButton || 'Add Shift',
    emptyStateTitle: labelOverrides?.emptyStateTitle || 'No shifts configured',
    emptyStateDesc: labelOverrides?.emptyStateDesc || 'Add shifts to define different pay rates for this employee',
  };
  // Track which shifts are using "Other" for custom input
  const [customNameFlags, setCustomNameFlags] = React.useState<Record<number, boolean>>({});
  const [customHoursFlags, setCustomHoursFlags] = React.useState<Record<number, boolean>>({});

  // Initialize custom flags based on existing data
  React.useEffect(() => {
    const nameFlags: Record<number, boolean> = {};
    const hoursFlags: Record<number, boolean> = {};
    
    shifts.forEach((shift, index) => {
      if (shift.shift_name && !SHIFT_NAME_OPTIONS.includes(shift.shift_name)) {
        nameFlags[index] = true;
      }
      if (shift.shift_hours && !SHIFT_HOURS_OPTIONS.includes(shift.shift_hours)) {
        hoursFlags[index] = true;
      }
    });
    
    setCustomNameFlags(nameFlags);
    setCustomHoursFlags(hoursFlags);
  }, [shifts.length]); // Only re-run when shifts array length changes

  const addShift = () => {
    const newShift = { 
      ...DEFAULT_SHIFT, 
      is_default: shifts.length === 0
    };
    onChange([...shifts, newShift]);
  };

  const removeShift = (index: number) => {
    const updated = shifts.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(s => s.is_default)) {
      updated[0].is_default = true;
    }
    // Clean up custom flags
    const newNameFlags = { ...customNameFlags };
    const newHoursFlags = { ...customHoursFlags };
    delete newNameFlags[index];
    delete newHoursFlags[index];
    setCustomNameFlags(newNameFlags);
    setCustomHoursFlags(newHoursFlags);
    onChange(updated);
  };

  const updateShift = (index: number, field: keyof ShiftFormData, value: any) => {
    const updated = [...shifts];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'is_default' && value === true) {
      updated.forEach((s, i) => {
        if (i !== index) s.is_default = false;
      });
    }
    
    onChange(updated);
  };

  const handleNameSelectChange = (index: number, value: string) => {
    if (value === OTHER_VALUE) {
      setCustomNameFlags({ ...customNameFlags, [index]: true });
      updateShift(index, 'shift_name', '');
    } else {
      setCustomNameFlags({ ...customNameFlags, [index]: false });
      updateShift(index, 'shift_name', value);
    }
  };

  const handleHoursSelectChange = (index: number, value: string) => {
    if (value === OTHER_VALUE) {
      setCustomHoursFlags({ ...customHoursFlags, [index]: true });
      updateShift(index, 'shift_hours', '');
    } else {
      setCustomHoursFlags({ ...customHoursFlags, [index]: false });
      updateShift(index, 'shift_hours', value);
    }
  };

  const getNameSelectValue = (shift: ShiftFormData, index: number): string => {
    if (customNameFlags[index]) return OTHER_VALUE;
    if (SHIFT_NAME_OPTIONS.includes(shift.shift_name)) return shift.shift_name;
    if (shift.shift_name) return OTHER_VALUE;
    return '';
  };

  const getHoursSelectValue = (shift: ShiftFormData, index: number): string => {
    if (customHoursFlags[index]) return OTHER_VALUE;
    if (SHIFT_HOURS_OPTIONS.includes(shift.shift_hours || '')) return shift.shift_hours || '';
    if (shift.shift_hours) return OTHER_VALUE;
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{labels.title}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addShift}>
          <Plus className="h-4 w-4 mr-1" />
          {labels.addButton}
        </Button>
      </div>

      {shifts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          <p>{labels.emptyStateTitle}</p>
          <p className="text-sm">{labels.emptyStateDesc}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shifts.map((shift, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Default</span>
                  <Switch
                    checked={shift.is_default}
                    onCheckedChange={(checked) => updateShift(index, 'is_default', checked)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeShift(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className={`grid grid-cols-1 ${hideHoursField ? '' : 'md:grid-cols-2'} gap-3 pt-6`}>
                <div className="space-y-2">
                  <Label>{labels.shiftName} *</Label>
                  {hideHoursField ? (
                    // For contract workers, always use custom input (no predefined shift names)
                    <Input
                      value={shift.shift_name}
                      onChange={(e) => updateShift(index, 'shift_name', e.target.value)}
                      placeholder="e.g., Full Property, Quick Trim, Regular Visit"
                    />
                  ) : (
                    <>
                      <Select
                        value={getNameSelectValue(shift, index)}
                        onValueChange={(value) => handleNameSelectChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift name..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_NAME_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                          <SelectItem value={OTHER_VALUE}>Other (custom)</SelectItem>
                        </SelectContent>
                      </Select>
                      {customNameFlags[index] && (
                        <Input
                          value={shift.shift_name}
                          onChange={(e) => updateShift(index, 'shift_name', e.target.value)}
                          placeholder="Enter custom shift name"
                          className="mt-2"
                        />
                      )}
                    </>
                  )}
                </div>
                {!hideHoursField && (
                  <div className="space-y-2">
                    <Label>{labels.shiftHours}</Label>
                    <Select
                      value={getHoursSelectValue(shift, index)}
                      onValueChange={(value) => handleHoursSelectChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift hours..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFT_HOURS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_VALUE}>Other (custom)</SelectItem>
                      </SelectContent>
                    </Select>
                    {customHoursFlags[index] && (
                      <Input
                        value={shift.shift_hours || ''}
                        onChange={(e) => updateShift(index, 'shift_hours', e.target.value)}
                        placeholder="e.g., 7am-3pm"
                        className="mt-2"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-1 ${hideHourlyRate ? '' : 'md:grid-cols-2'} gap-3`}>
                <div className="space-y-2">
                  <Label>{labels.baseRate} *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={shift.base_rate || ''}
                    onChange={(e) => updateShift(index, 'base_rate', parseFloat(e.target.value) || 0)}
                    placeholder="250.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    {hideHoursField ? 'Amount for this service' : 'Flat rate for this shift'}
                  </p>
                </div>
                {!hideHourlyRate && (
                  <div className="space-y-2">
                    <Label>{labels.hourlyRate}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shift.hourly_rate || ''}
                      onChange={(e) => updateShift(index, 'hourly_rate', parseFloat(e.target.value) || undefined)}
                      placeholder="35.00 (optional)"
                    />
                    <p className="text-xs text-muted-foreground">Optional - for hourly calculations</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {shifts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          ★ marks the default {hideHoursField ? 'service' : 'shift'} that will be pre-selected in Quick Pay Entry
        </p>
      )}
    </div>
  );
};
