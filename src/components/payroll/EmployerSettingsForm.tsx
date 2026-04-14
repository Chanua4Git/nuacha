import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { EmployerSettings } from '@/types/payroll';

export const EmployerSettingsForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<EmployerSettings>>({
    trade_name: '',
    employer_reg_no: '',
    service_centre_code: '',
    address: '',
    telephone: '',
  });

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employer_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data as unknown as EmployerSettings);
      }
    } catch (error) {
      console.error('Error fetching employer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        trade_name: settings.trade_name || null,
        employer_reg_no: settings.employer_reg_no || null,
        service_centre_code: settings.service_centre_code || null,
        address: settings.address || null,
        telephone: settings.telephone || null,
      };

      const { error } = await supabase
        .from('employer_settings' as any)
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;

      toast({ title: 'Saved', description: 'Employer settings updated successfully.' });
      await fetchSettings();
    } catch (error) {
      console.error('Error saving employer settings:', error);
      toast({ title: 'Error', description: 'Failed to save employer settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Employer / Business Details
        </CardTitle>
        <CardDescription>
          These details are used to pre-fill NIS forms (NI 184 & NI 187).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trade_name">Trade / Business Name</Label>
            <Input
              id="trade_name"
              value={settings.trade_name || ''}
              onChange={(e) => setSettings({ ...settings, trade_name: e.target.value })}
              placeholder="e.g. ABC Services Ltd"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer_reg_no">Employer Registration No. (NIS)</Label>
            <Input
              id="employer_reg_no"
              value={settings.employer_reg_no || ''}
              onChange={(e) => setSettings({ ...settings, employer_reg_no: e.target.value })}
              placeholder="e.g. 12345"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="service_centre_code">Service Centre Code</Label>
            <Input
              id="service_centre_code"
              value={settings.service_centre_code || ''}
              onChange={(e) => setSettings({ ...settings, service_centre_code: e.target.value })}
              placeholder="e.g. SC01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone">Telephone</Label>
            <Input
              id="telephone"
              value={settings.telephone || ''}
              onChange={(e) => setSettings({ ...settings, telephone: e.target.value })}
              placeholder="+1 868 123 4567"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={settings.address || ''}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            placeholder="Business address"
            rows={2}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Employer Details</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
