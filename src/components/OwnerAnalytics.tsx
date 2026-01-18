import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { t } from '@/lib/translations';

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
}

interface MonthlyData {
  month: string;
  appointments: number;
  revenue: number;
}

interface ServiceData {
  name: string;
  value: number;
}

// Estimated revenue per service (in currency units)
const SERVICE_PRICES: Record<string, number> = {
  'General Dentistry': 150,
  'Teeth Whitening': 300,
  'Root Canal': 800,
  'Emergency Care': 200,
  'Dental Crowns': 1200,
  'Cosmetic Dentistry': 500,
  'طب الأسنان العام': 150,
  'تبييض الأسنان': 300,
  'علاج قناة الجذر': 800,
  'الرعاية الطارئة': 200,
  'تيجان الأسنان': 1200,
  'طب الأسنان التجميلي': 500,
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const OwnerAnalytics = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AppointmentStats>({ total: 0, completed: 0, cancelled: 0, pending: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [patientGrowth, setPatientGrowth] = useState<{ month: string; patients: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [appointmentChange, setAppointmentChange] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch all appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate stats
      const now = new Date();
      const thisMonth = appointments?.filter(a => {
        const date = new Date(a.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }) || [];
      
      const lastMonth = appointments?.filter(a => {
        const date = new Date(a.created_at);
        const lastMonthDate = subMonths(now, 1);
        return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
      }) || [];

      setStats({
        total: appointments?.length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
        pending: appointments?.filter(a => a.status === 'pending' || a.status === 'confirmed').length || 0,
      });

      // Calculate appointment change
      if (lastMonth.length > 0) {
        setAppointmentChange(Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100));
      }

      // Monthly data for last 6 months
      const monthly: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthAppointments = appointments?.filter(a => {
          const date = new Date(a.created_at);
          return date >= monthStart && date <= monthEnd;
        }) || [];

        const revenue = monthAppointments.reduce((sum, a) => {
          if (a.status === 'completed') {
            return sum + (SERVICE_PRICES[a.service] || 200);
          }
          return sum;
        }, 0);

        monthly.push({
          month: format(monthDate, 'MMM', { locale: ar }),
          appointments: monthAppointments.length,
          revenue,
        });
      }
      setMonthlyData(monthly);

      // Calculate total revenue and change
      const currentMonthRevenue = monthly[monthly.length - 1]?.revenue || 0;
      const lastMonthRevenue = monthly[monthly.length - 2]?.revenue || 0;
      setTotalRevenue(monthly.reduce((sum, m) => sum + m.revenue, 0));
      if (lastMonthRevenue > 0) {
        setRevenueChange(Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100));
      }

      // Service breakdown
      const serviceCount: Record<string, number> = {};
      appointments?.forEach(a => {
        serviceCount[a.service] = (serviceCount[a.service] || 0) + 1;
      });
      setServiceData(
        Object.entries(serviceCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
      );

      // Patient growth - unique patients per month
      const patientsByMonth: Record<string, Set<string>> = {};
      appointments?.forEach(a => {
        const monthKey = format(new Date(a.created_at), 'yyyy-MM');
        if (!patientsByMonth[monthKey]) {
          patientsByMonth[monthKey] = new Set();
        }
        patientsByMonth[monthKey].add(a.patient_email);
      });

      const growth: { month: string; patients: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        growth.push({
          month: format(monthDate, 'MMM', { locale: ar }),
          patients: patientsByMonth[monthKey]?.size || 0,
        });
      }
      setPatientGrowth(growth);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: t.common.error,
        description: 'فشل في تحميل التحليلات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                <div className={`flex items-center text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {revenueChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(revenueChange)}% عن الشهر الماضي
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المواعيد</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <div className={`flex items-center text-sm ${appointmentChange >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {appointmentChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(appointmentChange)}% عن الشهر الماضي
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المواعيد المكتملة</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% نسبة الإكمال
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المرضى الفريدون</p>
                <p className="text-2xl font-bold">{patientGrowth.reduce((sum, p) => sum + p.patients, 0)}</p>
                <p className="text-sm text-muted-foreground">آخر 6 أشهر</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>اتجاه الإيرادات</CardTitle>
            <CardDescription>الإيرادات الشهرية خلال الأشهر الستة الماضية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'الإيرادات']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Trend */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>اتجاه المواعيد</CardTitle>
            <CardDescription>عدد المواعيد الشهرية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'المواعيد']}
                  />
                  <Bar dataKey="appointments" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Distribution */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>توزيع الخدمات</CardTitle>
            <CardDescription>أكثر الخدمات طلباً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Patient Growth */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>نمو المرضى</CardTitle>
            <CardDescription>عدد المرضى الجدد شهرياً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientGrowth}>
                  <defs>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'المرضى']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="patients" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorPatients)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerAnalytics;
