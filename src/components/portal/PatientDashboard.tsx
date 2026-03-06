import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CalendarCheck, CalendarClock, Receipt, Pill, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  unpaidInvoices: number;
  totalDue: number;
  activePrescriptions: number;
  activeTreatmentPlans: number;
}

export const PatientDashboard = ({ userEmail }: { userEmail: string }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userEmail]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [appointmentsRes, invoicesRes, prescriptionsRes, treatmentPlansRes] = await Promise.all([
        supabase.from('appointments').select('status, appointment_date').eq('patient_email', userEmail),
        supabase.from('invoices').select('status, total, amount_paid').eq('patient_email', userEmail),
        supabase.from('prescriptions').select('status').eq('patient_email', userEmail),
        supabase.from('treatment_plans').select('status').eq('patient_email', userEmail),
      ]);

      const appointments = appointmentsRes.data || [];
      const invoices = invoicesRes.data || [];
      const prescriptions = prescriptionsRes.data || [];
      const treatmentPlans = treatmentPlansRes.data || [];

      const today = new Date().toISOString().split('T')[0];

      setStats({
        totalAppointments: appointments.length,
        upcomingAppointments: appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed' && a.appointment_date >= today).length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        unpaidInvoices: invoices.filter(i => i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue').length,
        totalDue: invoices.reduce((sum, i) => sum + (i.total - (i.amount_paid || 0)), 0),
        activePrescriptions: prescriptions.filter(p => p.status === 'active').length,
        activeTreatmentPlans: treatmentPlans.filter(tp => tp.status === 'planned' || tp.status === 'in_progress').length,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      icon: CalendarClock,
      label: 'المواعيد القادمة',
      value: stats.upcomingAppointments,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: CalendarCheck,
      label: 'المواعيد المكتملة',
      value: stats.completedAppointments,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      icon: Receipt,
      label: 'فواتير مستحقة',
      value: stats.unpaidInvoices,
      color: stats.unpaidInvoices > 0 ? 'text-destructive' : 'text-green-500',
      bg: stats.unpaidInvoices > 0 ? 'bg-destructive/10' : 'bg-green-500/10',
      subtitle: stats.totalDue > 0 ? `${stats.totalDue.toFixed(2)} ر.س` : undefined,
    },
    {
      icon: Pill,
      label: 'وصفات فعّالة',
      value: stats.activePrescriptions,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: TrendingUp,
      label: 'خطط علاج نشطة',
      value: stats.activeTreatmentPlans,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      icon: AlertTriangle,
      label: 'إجمالي المواعيد',
      value: stats.totalAppointments,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center space-y-2">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mx-auto`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{card.label}</p>
            {card.subtitle && (
              <p className={`text-xs font-semibold ${card.color}`}>{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
