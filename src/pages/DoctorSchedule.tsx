import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  Save,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import Header from '@/components/Header';

interface DoctorSchedule {
  id?: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface DayOff {
  id: string;
  doctor_id: string;
  date_off: string;
  reason: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد', labelEn: 'Sunday' },
  { value: 1, label: 'الإثنين', labelEn: 'Monday' },
  { value: 2, label: 'الثلاثاء', labelEn: 'Tuesday' },
  { value: 3, label: 'الأربعاء', labelEn: 'Wednesday' },
  { value: 4, label: 'الخميس', labelEn: 'Thursday' },
  { value: 5, label: 'الجمعة', labelEn: 'Friday' },
  { value: 6, label: 'السبت', labelEn: 'Saturday' },
];

const DoctorSchedulePage = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<{ id: string } | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dayOffReason, setDayOffReason] = useState('');
  const [isAddingDayOff, setIsAddingDayOff] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        toast({
          title: 'غير مصرح',
          description: 'يجب أن تكون طبيباً للوصول لهذه الصفحة',
          variant: 'destructive',
        });
        navigate('/admin');
        return;
      }

      setDoctorProfile(profile);
      await Promise.all([
        fetchSchedules(profile.id),
        fetchDaysOff(profile.id)
      ]);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الطبيب',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchedules = async (doctorId: string) => {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching schedules:', error);
      return;
    }

    // Initialize all days with defaults if not set
    const existingDays = new Set(data?.map(s => s.day_of_week) || []);
    const allSchedules: DoctorSchedule[] = DAYS_OF_WEEK.map(day => {
      const existing = data?.find(s => s.day_of_week === day.value);
      if (existing) {
        return existing;
      }
      return {
        doctor_id: doctorId,
        day_of_week: day.value,
        start_time: '09:00',
        end_time: '17:00',
        is_available: day.value !== 5, // Friday off by default
      };
    });

    setSchedules(allSchedules);
  };

  const fetchDaysOff = async (doctorId: string) => {
    const { data, error } = await supabase
      .from('doctor_days_off')
      .select('*')
      .eq('doctor_id', doctorId)
      .gte('date_off', new Date().toISOString().split('T')[0])
      .order('date_off');

    if (error) {
      console.error('Error fetching days off:', error);
      return;
    }

    setDaysOff(data || []);
  };

  const handleScheduleChange = (dayOfWeek: number, field: keyof DoctorSchedule, value: any) => {
    setSchedules(prev => prev.map(s => 
      s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
    ));
  };

  const saveSchedules = async () => {
    if (!doctorProfile) return;

    setIsSaving(true);
    try {
      for (const schedule of schedules) {
        if (schedule.id) {
          // Update existing
          const { error } = await supabase
            .from('doctor_schedules')
            .update({
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              is_available: schedule.is_available,
            })
            .eq('id', schedule.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('doctor_schedules')
            .insert({
              doctor_id: doctorProfile.id,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              is_available: schedule.is_available,
            });

          if (error) throw error;
        }
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user!.id,
        action_type: 'update_schedule',
        details: 'تم تحديث جدول الدوام الأسبوعي',
      });

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ جدول الدوام بنجاح',
      });

      await fetchSchedules(doctorProfile.id);
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الجدول',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addDayOff = async () => {
    if (!doctorProfile || !selectedDate) return;

    setIsAddingDayOff(true);
    try {
      const { error } = await supabase
        .from('doctor_days_off')
        .insert({
          doctor_id: doctorProfile.id,
          date_off: selectedDate.toISOString().split('T')[0],
          reason: dayOffReason || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'خطأ',
            description: 'هذا اليوم مضاف مسبقاً',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user!.id,
        action_type: 'add_day_off',
        details: `تمت إضافة يوم إجازة: ${format(selectedDate, 'dd MMM yyyy', { locale: ar })}`,
      });

      toast({
        title: 'تمت الإضافة',
        description: 'تمت إضافة يوم الإجازة',
      });

      setSelectedDate(undefined);
      setDayOffReason('');
      await fetchDaysOff(doctorProfile.id);
    } catch (error) {
      console.error('Error adding day off:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة يوم الإجازة',
        variant: 'destructive',
      });
    } finally {
      setIsAddingDayOff(false);
    }
  };

  const removeDayOff = async (id: string) => {
    if (!doctorProfile) return;

    try {
      const { error } = await supabase
        .from('doctor_days_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف يوم الإجازة',
      });

      await fetchDaysOff(doctorProfile.id);
    } catch (error) {
      console.error('Error removing day off:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف يوم الإجازة',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">إدارة جدول الدوام</h1>
            <p className="text-muted-foreground mt-1">حدد ساعات العمل وأيام الإجازة</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Schedule */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                ساعات العمل الأسبوعية
              </CardTitle>
              <CardDescription>حدد ساعات العمل لكل يوم من أيام الأسبوع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedules.map((schedule) => {
                const day = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week);
                return (
                  <div 
                    key={schedule.day_of_week}
                    className={`p-4 rounded-xl border transition-colors ${
                      schedule.is_available 
                        ? 'bg-muted/30 border-border' 
                        : 'bg-muted/10 border-border/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={schedule.is_available}
                          onCheckedChange={(checked) => 
                            handleScheduleChange(schedule.day_of_week, 'is_available', checked)
                          }
                        />
                        <span className="font-medium">{day?.label}</span>
                      </div>
                      {!schedule.is_available && (
                        <Badge variant="secondary">إجازة</Badge>
                      )}
                    </div>
                    
                    {schedule.is_available && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">من</Label>
                          <Input
                            type="time"
                            value={schedule.start_time}
                            onChange={(e) => 
                              handleScheduleChange(schedule.day_of_week, 'start_time', e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">إلى</Label>
                          <Input
                            type="time"
                            value={schedule.end_time}
                            onChange={(e) => 
                              handleScheduleChange(schedule.day_of_week, 'end_time', e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button 
                onClick={saveSchedules} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ الجدول
              </Button>
            </CardContent>
          </Card>

          {/* Days Off */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                أيام الإجازة
              </CardTitle>
              <CardDescription>أضف أيام إجازة محددة خارج الجدول الأسبوعي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>

              {selectedDate && (
                <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: ar })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedDate(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="سبب الإجازة (اختياري)"
                    value={dayOffReason}
                    onChange={(e) => setDayOffReason(e.target.value)}
                    rows={2}
                  />
                  <Button 
                    onClick={addDayOff}
                    disabled={isAddingDayOff}
                    className="w-full"
                  >
                    {isAddingDayOff ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    إضافة يوم إجازة
                  </Button>
                </div>
              )}

              {/* Upcoming Days Off */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">الإجازات القادمة</h4>
                {daysOff.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد إجازات مجدولة
                  </p>
                ) : (
                  daysOff.map((dayOff) => (
                    <div 
                      key={dayOff.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(dayOff.date_off), 'EEEE dd MMMM yyyy', { locale: ar })}
                        </p>
                        {dayOff.reason && (
                          <p className="text-sm text-muted-foreground">{dayOff.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDayOff(dayOff.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorSchedulePage;
