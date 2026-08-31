import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

interface TreatmentReport {
  id: string;
  diagnosis: string | null;
  treatment_done: string;
  recommendations: string | null;
  next_visit_date: string | null;
  created_at: string;
}

export const PatientTreatmentReports = ({ userEmail }: { userEmail: string }) => {
  const [reports, setReports] = useState<TreatmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('treatment_reports')
        .select('id, diagnosis, treatment_done, recommendations, next_visit_date, created_at')
        .eq('patient_email', userEmail)
        .order('created_at', { ascending: false });
      if (error) console.error('Error loading treatment reports:', error);
      setReports((data as TreatmentReport[]) || []);
      setIsLoading(false);
    };
    if (userEmail) load();
  }, [userEmail]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          تقارير العلاج ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length === 0 && <p className="text-sm text-muted-foreground">لا توجد تقارير علاج بعد.</p>}
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl border p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ar-EG')}</p>
            {r.diagnosis && <p className="text-sm">التشخيص: {r.diagnosis}</p>}
            <p className="text-sm font-medium">العلاج: {r.treatment_done}</p>
            {r.recommendations && <p className="text-sm text-muted-foreground">التوصيات: {r.recommendations}</p>}
            {r.next_visit_date && <p className="text-xs text-muted-foreground">الزيارة القادمة: {r.next_visit_date}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PatientTreatmentReports;
