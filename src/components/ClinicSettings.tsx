import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Phone, Mail, MapPin, Clock, Save } from 'lucide-react';
import { t } from '@/lib/translations';

interface ClinicSettingsData {
  id: string;
  clinic_name: string;
  clinic_logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  working_hours_weekday_start: string | null;
  working_hours_weekday_end: string | null;
  working_hours_saturday_start: string | null;
  working_hours_saturday_end: string | null;
  sunday_closed: boolean | null;
}

const ClinicSettings = () => {
  const { isOwner } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ClinicSettingsData | null>(null);
  
  // Form state
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [weekdayStart, setWeekdayStart] = useState('08:00');
  const [weekdayEnd, setWeekdayEnd] = useState('18:00');
  const [saturdayStart, setSaturdayStart] = useState('09:00');
  const [saturdayEnd, setSaturdayEnd] = useState('14:00');
  const [sundayClosed, setSundayClosed] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setClinicName(data.clinic_name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setWeekdayStart(data.working_hours_weekday_start || '08:00');
        setWeekdayEnd(data.working_hours_weekday_end || '18:00');
        setSaturdayStart(data.working_hours_saturday_start || '09:00');
        setSaturdayEnd(data.working_hours_saturday_end || '14:00');
        setSundayClosed(data.sunday_closed ?? true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isOwner) {
      toast({
        title: t.common.error,
        description: 'فقط مالك العيادة يمكنه تعديل الإعدادات',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        clinic_name: clinicName,
        phone,
        email,
        address,
        working_hours_weekday_start: weekdayStart,
        working_hours_weekday_end: weekdayEnd,
        working_hours_saturday_start: saturdayStart,
        working_hours_saturday_end: saturdayEnd,
        sunday_closed: sundayClosed,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('clinic_settings')
          .update(updateData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_settings')
          .insert(updateData);

        if (error) throw error;
      }

      toast({
        title: t.common.success,
        description: 'تم حفظ إعدادات العيادة بنجاح',
      });

      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t.common.error,
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>معلومات العيادة</CardTitle>
              <CardDescription>تحديث معلومات العيادة الأساسية</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              اسم العيادة
            </label>
            <Input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="BrightSmile Dental"
              disabled={!isOwner}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                رقم الهاتف
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@clinic.com"
                disabled={!isOwner}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              العنوان
            </label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Dental Avenue, Suite 100, New York, NY 10001"
              rows={2}
              disabled={!isOwner}
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>ساعات العمل</CardTitle>
              <CardDescription>تحديد أوقات العمل للعيادة</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weekdays */}
          <div className="space-y-3">
            <h4 className="font-medium">الإثنين - الجمعة</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">من</label>
                <Input
                  type="time"
                  value={weekdayStart}
                  onChange={(e) => setWeekdayStart(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">إلى</label>
                <Input
                  type="time"
                  value={weekdayEnd}
                  onChange={(e) => setWeekdayEnd(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
            </div>
          </div>

          {/* Saturday */}
          <div className="space-y-3">
            <h4 className="font-medium">السبت</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">من</label>
                <Input
                  type="time"
                  value={saturdayStart}
                  onChange={(e) => setSaturdayStart(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">إلى</label>
                <Input
                  type="time"
                  value={saturdayEnd}
                  onChange={(e) => setSaturdayEnd(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
            </div>
          </div>

          {/* Sunday */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">الأحد</h4>
              <p className="text-sm text-muted-foreground">مغلق</p>
            </div>
            <Switch
              checked={sundayClosed}
              onCheckedChange={setSundayClosed}
              disabled={!isOwner}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {isOwner && (
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          حفظ الإعدادات
        </Button>
      )}
    </div>
  );
};

export default ClinicSettings;
