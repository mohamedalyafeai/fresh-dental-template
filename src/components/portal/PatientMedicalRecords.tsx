import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, AlertTriangle, Pill, FileText } from 'lucide-react';

interface MedicalRecord {
  id: string;
  blood_type: string | null;
  chronic_diseases: string | null;
  surgical_history: string | null;
  family_history: string | null;
  notes: string | null;
}

interface Allergy {
  id: string;
  allergy_name: string;
  severity: string;
  notes: string | null;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  is_current: boolean;
  start_date: string | null;
  notes: string | null;
}

export const PatientMedicalRecords = ({ userEmail }: { userEmail: string }) => {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [recRes, allRes, medRes] = await Promise.all([
          supabase.from('medical_records').select('*').eq('patient_email', userEmail).maybeSingle(),
          supabase.from('patient_allergies').select('*').eq('patient_email', userEmail),
          supabase.from('patient_medications').select('*').eq('patient_email', userEmail).eq('is_current', true),
        ]);
        setRecord(recRes.data);
        setAllergies(allRes.data || []);
        setMedications(medRes.data || []);
      } catch (e) {
        console.error('Error fetching medical records:', e);
      } finally {
        setIsLoading(false);
      }
    };
    if (userEmail) fetchAll();
  }, [userEmail]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const severityColor = (s: string) => {
    switch (s) {
      case 'severe': return 'destructive';
      case 'moderate': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Medical History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-destructive" />
            التاريخ المرضي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {record ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.blood_type && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">فصيلة الدم</p>
                  <p className="font-semibold text-lg">{record.blood_type}</p>
                </div>
              )}
              {record.chronic_diseases && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">الأمراض المزمنة</p>
                  <p className="text-sm">{record.chronic_diseases}</p>
                </div>
              )}
              {record.surgical_history && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">التاريخ الجراحي</p>
                  <p className="text-sm">{record.surgical_history}</p>
                </div>
              )}
              {record.family_history && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">التاريخ العائلي</p>
                  <p className="text-sm">{record.family_history}</p>
                </div>
              )}
              {record.notes && (
                <div className="bg-muted/50 rounded-lg p-3 md:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm">{record.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">لا يوجد سجل طبي بعد</p>
          )}
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            الحساسية ({allergies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergies.map(a => (
                <div key={a.id} className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                  <span className="font-medium">{a.allergy_name}</span>
                  <Badge variant={severityColor(a.severity) as any}>
                    {a.severity === 'severe' ? 'حاد' : a.severity === 'moderate' ? 'متوسط' : 'خفيف'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">لا توجد حساسية مسجلة</p>
          )}
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-primary" />
            الأدوية الحالية ({medications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length > 0 ? (
            <div className="space-y-3">
              {medications.map(m => (
                <div key={m.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{m.medication_name}</span>
                    <Badge variant="outline">فعّال</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-x-4 rtl:space-x-reverse">
                    {m.dosage && <span>الجرعة: {m.dosage}</span>}
                    {m.frequency && <span>التكرار: {m.frequency}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">لا توجد أدوية حالية</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
