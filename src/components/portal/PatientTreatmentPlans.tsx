import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ClipboardList } from 'lucide-react';

interface TreatmentPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  total_cost: number | null;
  created_at: string;
}

interface PlanItem {
  id: string;
  procedure_name: string;
  description: string | null;
  status: string;
  cost: number | null;
  tooth_number: number | null;
  step_order: number;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  planned: { label: 'مخطط', variant: 'outline' },
  in_progress: { label: 'قيد التنفيذ', variant: 'default' },
  completed: { label: 'مكتمل', variant: 'secondary' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
  pending: { label: 'معلق', variant: 'outline' },
};

export const PatientTreatmentPlans = ({ userEmail }: { userEmail: string }) => {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [planItems, setPlanItems] = useState<Record<string, PlanItem[]>>({});
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, [userEmail]);

  const fetchPlans = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('patient_email', userEmail)
      .order('created_at', { ascending: false });
    setPlans(data || []);
    setIsLoading(false);
  };

  const loadItems = async (planId: string) => {
    if (planItems[planId]) {
      setExpandedPlan(expandedPlan === planId ? null : planId);
      return;
    }
    const { data } = await supabase
      .from('treatment_plan_items')
      .select('*')
      .eq('plan_id', planId)
      .order('step_order');
    setPlanItems(prev => ({ ...prev, [planId]: data || [] }));
    setExpandedPlan(planId);
  };

  const getProgress = (items: PlanItem[]) => {
    if (!items.length) return 0;
    return Math.round((items.filter(i => i.status === 'completed').length / items.length) * 100);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد خطط علاج حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map(plan => {
        const items = planItems[plan.id] || [];
        const progress = getProgress(items);
        const isExpanded = expandedPlan === plan.id;
        const st = statusMap[plan.status] || statusMap.planned;

        return (
          <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadItems(plan.id)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.title}</CardTitle>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">التكلفة الإجمالية</span>
                <span className="font-semibold">{plan.total_cost?.toFixed(2) || '0.00'} ر.س</span>
              </div>
              {isExpanded && items.length > 0 && (
                <>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{progress}% مكتمل</p>
                  <div className="space-y-2 mt-2">
                    {items.map(item => {
                      const ist = statusMap[item.status] || statusMap.pending;
                      return (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                          <div>
                            <span className="font-medium">{item.step_order}. {item.procedure_name}</span>
                            {item.tooth_number && <span className="text-muted-foreground mr-2"> (سن {item.tooth_number})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{item.cost?.toFixed(2) || '0'} ر.س</span>
                            <Badge variant={ist.variant} className="text-xs">{ist.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
