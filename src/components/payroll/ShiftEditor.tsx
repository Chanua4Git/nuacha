import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { ShiftFormData } from '@/types/payroll';

interface ShiftEditorProps {
  shifts: ShiftFormData[];
  onChange: (shifts: ShiftFormData[]) => void;
}

const DEFAULT_SHIFT: ShiftFormData = {
  shift_name: '',
  shift_hours: '',
  base_rate: 0,
  hourly_rate: undefined,
  is_default: false,
};

export const ShiftEditor: React.FC<ShiftEditorProps> = ({ shifts, onChange }) => {
  const addShift = () => {
    const newShift = { 
      ...DEFAULT_SHIFT, 
      is_default: shifts.length === 0 // First shift is default
    };
    onChange([...shifts, newShift]);
  };

  const removeShift = (index: number) => {
    const updated = shifts.filter((_, i) => i !== index);
    // If we removed the default, make the first one default
    if (updated.length > 0 && !updated.some(s => s.is_default)) {
      updated[0].is_default = true;
    }
    onChange(updated);
  };

  const updateShift = (index: number, field: keyof ShiftFormData, value: any) => {
    const updated = [...shifts];
    updated[index] = { ...updated[index], [field]: value };
    
    // If setting as default, unset others
    if (field === 'is_default' && value === true) {
      updated.forEach((s, i) => {
        if (i !== index) s.is_default = false;
      });
    }
    
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Shift Configurations</Label>
        <Button type="button" variant="outline" size="sm" onClick={addShift}>
          <Plus className="h-4 w-4 mr-1" />
          Add Shift
        </Button>
      </div>

      {shifts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          <p>No shifts configured</p>
          <p className="text-sm">Add shifts to define different pay rates for this employee</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-6">
                <div className="space-y-2">
                  <Label>Shift Name *</Label>
                  <Input
                    value={shift.shift_name}
                    onChange={(e) => updateShift(index, 'shift_name', e.target.value)}
                    placeholder="e.g., Night Shift, Weekday Day"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift Hours</Label>
                  <Input
                    value={shift.shift_hours || ''}
                    onChange={(e) => updateShift(index, 'shift_hours', e.target.value)}
                    placeholder="e.g., 5pm-6am, 8am-4pm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Base Rate (TTD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={shift.base_rate || ''}
                    onChange={(e) => updateShift(index, 'base_rate', parseFloat(e.target.value) || 0)}
                    placeholder="250.00"
                  />
                  <p className="text-xs text-muted-foreground">Flat rate for this shift</p>
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate (TTD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={shift.hourly_rate || ''}
                    onChange={(e) => updateShift(index, 'hourly_rate', parseFloat(e.target.value) || undefined)}
                    placeholder="35.00 (optional)"
                  />
                  <p className="text-xs text-muted-foreground">Optional - for hourly calculations</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {shifts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          ★ marks the default shift that will be pre-selected in Quick Pay Entry
        </p>
      )}
    </div>
  );
};
