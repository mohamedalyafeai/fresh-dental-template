import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Stethoscope, FileText, CalendarDays, Plus } from 'lucide-react';

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
}

interface TreatmentReport {
  id: string;
  patient_name: string;
  patient_email: string;
  diagnosis: string | null;
  treatment_done: string;
  recommendations: string | null;
  next_visit_date: string | null;
  created_at: string;
}

const emptyForm = {
  diagnosis: '',
  treatment_done: '',
  recommendations: '',
  next_visit_date: '',
};

export const DoctorWorkspace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<TreatmentReport[]>([]);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [apptRes, reportRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', user.id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true }),
        supabase
          .from('treatment_reports')
          .select('*')
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (apptRes.error) throw apptRes.error;
      if (reportRes.error) throw reportRes.error;

      setAppointments((apptRes.data as Appointment[]) || []);
      setReports((reportRes.data as TreatmentReport[]) || []);
    } catch (error) {
      console.error('Doctor workspace load error:', error);
      toast({ title: 'خطأ', description: 'تعذر تحميل بيانات الطبيب', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openReportDialog = (appointment: Appointment) => {
    setActiveAppointment(appointment);
    setForm(emptyForm);
  };

  const submitReport = async () => {
    if (!user || !activeAppointment) return;
    if (!form.treatment_done.trim()) {
      toast({ title: 'خطأ', description: 'يرجى كتابة العلاج المُنفّذ', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('treatment_reports').insert({
        appointment_id: activeAppointment.id,
        patient_email: activeAppointment.patient_email,
        patient_name: activeAppointment.patient_name,
        doctor_id: user.id,
        diagnosis: form.diagnosis || null,
        treatment_done: form.treatment_done,
        recommendations: form.recommendations || null,
        next_visit_date: form.next_visit_date || null,
      });
      if (error) throw error;

      await supabase.from('patient_notifications').insert({
        patient_email: activeAppointment.patient_email,
        title: 'تقرير علاج جديد',
        message: `تم رفع تقرير علاج جديد بعد زيارتك (${activeAppointment.service}).`,
        type: 'treatment',
        related_id: activeAppointment.id,
      });

      await supabase.from('appointments').update({ status: 'completed' }).eq('id', activeAppointment.id);

      toast({ title: 'تم الحفظ', description: 'تم رفع تقرير العلاج بنجاح' });
      setActiveAppointment(null);
      setForm(emptyForm);
      fetchData();
    } catch (error) {
      console.error('Report save error:', error);
      toast({ title: 'خطأ', description: 'تعذر حفظ التقرير', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter((a) => a.appointment_date >= today && a.status !== 'cancelled');
  const past = appointments.filter((a) => a.appointment_date < today || a.status === 'completed');

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            مرضاي المحجوزون ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 && (
            <p className="text-muted-foreground text-sm">لا توجد مواعيد محجوزة لك حالياً.</p>
          )}
          {upcoming.map((appt) => (
            <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{appt.patient_name}</span>
                  <Badge variant={appt.status === 'completed' ? 'secondary' : 'outline'}>{appt.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{appt.patient_email}</p>
                <p className="text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {appt.appointment_date} — {appt.appointment_time} — {appt.service}
                </p>
                {appt.notes && <p className="text-xs text-muted-foreground">ملاحظات: {appt.notes}</p>}
              </div>
              <Dialog
                open={activeAppointment?.id === appt.id}
                onOpenChange={(open) => (open ? openReportDialog(appt) : setActiveAppointment(null))}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-1" />
                    رفع تقرير علاج
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>تقرير علاج — {appt.patient_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>التشخيص</Label>
                      <Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
                    </div>
                    <div>
                      <Label>العلاج المُنفّذ *</Label>
                      <Textarea
                        value={form.treatment_done}
                        onChange={(e) => setForm({ ...form, treatment_done: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>التوصيات</Label>
                      <Textarea
                        value={form.recommendations}
                        onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>تاريخ الزيارة القادمة</Label>
                      <Input
                        type="date"
                        value={form.next_visit_date}
                        onChange={(e) => setForm({ ...form, next_visit_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={submitReport} disabled={isSaving}>
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      حفظ التقرير
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            تقارير العلاج التي رفعتها ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 && <p className="text-muted-foreground text-sm">لم ترفع أي تقرير بعد.</p>}
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.patient_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
              {r.diagnosis && <p className="text-sm">التشخيص: {r.diagnosis}</p>}
              <p className="text-sm">العلاج: {r.treatment_done}</p>
              {r.recommendations && <p className="text-sm text-muted-foreground">التوصيات: {r.recommendations}</p>}
              {r.next_visit_date && <p className="text-xs text-muted-foreground">الزيارة القادمة: {r.next_visit_date}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <p className="text-xs text-muted-foreground">عدد الزيارات السابقة: {past.length}</p>
      )}
    </div>
  );
};

export default DoctorWorkspace;
