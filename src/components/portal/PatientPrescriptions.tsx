import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pill } from 'lucide-react';
import { format } from 'date-fns';

interface Prescription {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'فعالة', variant: 'default' },
  completed: { label: 'مكتملة', variant: 'secondary' },
  cancelled: { label: 'ملغاة', variant: 'destructive' },
};

export const PatientPrescriptions = ({ userEmail }: { userEmail: string }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<Record<string, PrescriptionItem[]>>({});
  const [expandedRx, setExpandedRx] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, [userEmail]);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_email', userEmail)
      .order('created_at', { ascending: false });
    setPrescriptions(data || []);
    setIsLoading(false);
  };

  const loadItems = async (rxId: string) => {
    if (prescriptionItems[rxId]) {
      setExpandedRx(expandedRx === rxId ? null : rxId);
      return;
    }
    const { data } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('prescription_id', rxId);
    setPrescriptionItems(prev => ({ ...prev, [rxId]: data || [] }));
    setExpandedRx(rxId);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Pill className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد وصفات طبية حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map(rx => {
        const st = statusMap[rx.status] || statusMap.active;
        const items = prescriptionItems[rx.id] || [];
        const isExpanded = expandedRx === rx.id;

        return (
          <Card key={rx.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadItems(rx.id)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  وصفة بتاريخ {format(new Date(rx.created_at), 'yyyy/MM/dd')}
                </CardTitle>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              {rx.diagnosis && <p className="text-sm text-muted-foreground">التشخيص: {rx.diagnosis}</p>}
            </CardHeader>
            <CardContent>
              {isExpanded && items.length > 0 && (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <p className="font-semibold text-sm">{item.medication_name}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>الجرعة: {item.dosage}</span>
                        <span>التكرار: {item.frequency}</span>
                        <span>المدة: {item.duration}</span>
                      </div>
                      {item.instructions && <p className="text-xs text-muted-foreground">تعليمات: {item.instructions}</p>}
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">لا توجد أدوية مسجلة</p>
              )}
              {rx.notes && <p className="text-xs text-muted-foreground mt-2">ملاحظات: {rx.notes}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
