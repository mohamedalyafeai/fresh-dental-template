import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Stethoscope, Download, FileSpreadsheet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { t } from '@/lib/translations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const OwnerAnalytics = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, cancelled: 0, pending: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [patientGrowth, setPatientGrowth] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [appointmentChange, setAppointmentChange] = useState(0);
  const [doctorPerformance, setDoctorPerformance] = useState<any[]>([]);
  const [invoiceStats, setInvoiceStats] = useState({ totalPaid: 0, totalDue: 0, totalInvoices: 0 });

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [appointmentsRes, invoicesRes, profilesRes] = await Promise.all([
        supabase.from('appointments').select('*').order('created_at', { ascending: true }),
        supabase.from('invoices').select('*'),
        supabase.from('profiles').select('user_id, full_name'),
      ]);

      const appointments = appointmentsRes.data || [];
      const invoices = invoicesRes.data || [];
      const profiles = profilesRes.data || [];
      const now = new Date();

      const thisMonth = appointments.filter(a => { const d = new Date(a.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
      const lastMonthDate = subMonths(now, 1);
      const lastMonth = appointments.filter(a => { const d = new Date(a.created_at); return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear(); });

      setStats({
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        pending: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
      });

      if (lastMonth.length > 0) setAppointmentChange(Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100));

      const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
      const totalDue = invoices.reduce((s, i) => s + (i.total - (i.amount_paid || 0)), 0);
      setInvoiceStats({ totalPaid, totalDue, totalInvoices: invoices.length });
      setTotalRevenue(totalPaid);

      const monthly: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const md = subMonths(now, i);
        const ms = startOfMonth(md);
        const me = endOfMonth(md);
        const monthInvoices = invoices.filter(inv => { const d = new Date(inv.created_at); return d >= ms && d <= me; });
        const monthAppts = appointments.filter(a => { const d = new Date(a.created_at); return d >= ms && d <= me; });
        monthly.push({
          month: format(md, 'MMM', { locale: ar }),
          appointments: monthAppts.length,
          revenue: monthInvoices.reduce((s, i) => s + (i.amount_paid || 0), 0),
          invoiced: monthInvoices.reduce((s, i) => s + i.total, 0),
        });
      }
      setMonthlyData(monthly);

      const curRevenue = monthly[monthly.length - 1]?.revenue || 0;
      const prevRevenue = monthly[monthly.length - 2]?.revenue || 0;
      if (prevRevenue > 0) setRevenueChange(Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100));

      const sc: Record<string, number> = {};
      appointments.forEach(a => { sc[a.service] = (sc[a.service] || 0) + 1; });
      setServiceData(Object.entries(sc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6));

      const pm: Record<string, Set<string>> = {};
      appointments.forEach(a => { const mk = format(new Date(a.created_at), 'yyyy-MM'); if (!pm[mk]) pm[mk] = new Set(); pm[mk].add(a.patient_email); });
      const growth: any[] = [];
      for (let i = 5; i >= 0; i--) { const md = subMonths(now, i); growth.push({ month: format(md, 'MMM', { locale: ar }), patients: pm[format(md, 'yyyy-MM')]?.size || 0 }); }
      setPatientGrowth(growth);

      // Doctor performance
      const doctorMap: Record<string, { name: string; appointments: number; completed: number; revenue: number }> = {};
      appointments.forEach(a => {
        if (!a.doctor_id) return;
        if (!doctorMap[a.doctor_id]) {
          const profile = profiles.find(p => p.user_id === a.doctor_id);
          doctorMap[a.doctor_id] = { name: profile?.full_name || 'طبيب', appointments: 0, completed: 0, revenue: 0 };
        }
        doctorMap[a.doctor_id].appointments++;
        if (a.status === 'completed') doctorMap[a.doctor_id].completed++;
      });
      Object.keys(doctorMap).forEach(did => {
        const doctorPatients = appointments.filter(a => a.doctor_id === did && a.status === 'completed').map(a => a.patient_email);
        const doctorInvoices = invoices.filter(i => doctorPatients.includes(i.patient_email));
        doctorMap[did].revenue = doctorInvoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
      });
      setDoctorPerformance(Object.values(doctorMap).sort((a, b) => b.completed - a.completed));

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({ title: t.common.error, description: 'فشل في تحميل التحليلات', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(18);
    doc.text('Clinic Analytics Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);

    // Summary stats
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `${totalRevenue.toLocaleString()} SAR`],
        ['Total Due', `${invoiceStats.totalDue.toLocaleString()} SAR`],
        ['Total Appointments', stats.total.toString()],
        ['Completed', stats.completed.toString()],
        ['Completion Rate', `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`],
      ],
    });

    // Doctor Performance
    if (doctorPerformance.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Doctor', 'Appointments', 'Completed', 'Revenue (SAR)']],
        body: doctorPerformance.map(d => [d.name, d.appointments, d.completed, d.revenue.toLocaleString()]),
      });
    }

    doc.save('clinic-analytics-report.pdf');
    toast({ title: 'تم التصدير', description: 'تم تحميل التقرير بصيغة PDF' });
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', totalRevenue],
      ['Total Due', invoiceStats.totalDue],
      ['Total Appointments', stats.total],
      ['Completed', stats.completed],
      ['Cancelled', stats.cancelled],
      ['Pending', stats.pending],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

    // Monthly data
    if (monthlyData.length > 0) {
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData.map(m => ({
        Month: m.month,
        Appointments: m.appointments,
        Revenue: m.revenue,
        Invoiced: m.invoiced,
      })));
      XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly');
    }

    // Doctor performance
    if (doctorPerformance.length > 0) {
      const docSheet = XLSX.utils.json_to_sheet(doctorPerformance.map(d => ({
        Doctor: d.name,
        Appointments: d.appointments,
        Completed: d.completed,
        Revenue: d.revenue,
      })));
      XLSX.utils.book_append_sheet(wb, docSheet, 'Doctors');
    }

    // Services
    if (serviceData.length > 0) {
      const svcSheet = XLSX.utils.json_to_sheet(serviceData.map(s => ({ Service: s.name, Count: s.value })));
      XLSX.utils.book_append_sheet(wb, svcSheet, 'Services');
    }

    XLSX.writeFile(wb, 'clinic-analytics-report.xlsx');
    toast({ title: 'تم التصدير', description: 'تم تحميل التقرير بصيغة Excel' });
  };

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={exportToPDF} className="gap-2">
          <Download className="h-4 w-4" />
          تصدير PDF
        </Button>
        <Button variant="outline" onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          تصدير Excel
        </Button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات المحصّلة</p>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} ر.س</p>
                <div className={`flex items-center text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {revenueChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(revenueChange)}% عن الشهر الماضي
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مبالغ مستحقة</p>
                <p className="text-2xl font-bold text-destructive">{invoiceStats.totalDue.toLocaleString()} ر.س</p>
                <p className="text-sm text-muted-foreground">{invoiceStats.totalInvoices} فاتورة</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><DollarSign className="h-6 w-6 text-destructive" /></div>
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
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Calendar className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نسبة الإكمال</p>
                <p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
                <p className="text-sm text-muted-foreground">{stats.completed} مكتمل من {stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-accent" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Appointments Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>اتجاه الإيرادات الشهرية</CardTitle>
            <CardDescription>المبالغ المحصّلة vs المفوترة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value.toLocaleString()} ر.س`, name === 'revenue' ? 'محصّل' : 'مفوتر']} />
                  <Legend formatter={(value) => value === 'revenue' ? 'محصّل' : 'مفوتر'} />
                  <Bar dataKey="invoiced" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>اتجاه المواعيد</CardTitle>
            <CardDescription>عدد المواعيد الشهرية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'المواعيد']} />
                  <Area type="monotone" dataKey="appointments" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorAppts)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Performance & Service Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              أداء الأطباء
            </CardTitle>
            <CardDescription>مقارنة أداء الأطباء حسب المواعيد والإيرادات</CardDescription>
          </CardHeader>
          <CardContent>
            {doctorPerformance.length > 0 ? (
              <div className="space-y-4">
                {doctorPerformance.map((doc, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{doc.name}</span>
                      <span className="text-sm text-primary font-bold">{doc.revenue.toLocaleString()} ر.س</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">المواعيد</p>
                        <p className="font-bold">{doc.appointments}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">المكتملة</p>
                        <p className="font-bold text-green-600">{doc.completed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">نسبة الإكمال</p>
                        <p className="font-bold">{doc.appointments > 0 ? Math.round((doc.completed / doc.appointments) * 100) : 0}%</p>
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${doc.appointments > 0 ? (doc.completed / doc.appointments) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد بيانات أطباء بعد</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>توزيع الخدمات</CardTitle>
            <CardDescription>أكثر الخدمات طلباً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {serviceData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Growth */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            نمو المرضى
          </CardTitle>
          <CardDescription>عدد المرضى الفريدون شهرياً</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
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
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'المرضى']} />
                <Area type="monotone" dataKey="patients" stroke="#10b981" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Financial Comparison - Monthly vs Previous */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            مقارنة الإيرادات الشهرية
          </CardTitle>
          <CardDescription>مقارنة المبالغ المحصّلة والمفوترة شهرياً</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value.toLocaleString()} ر.س`, name === 'revenue' ? 'محصّل' : name === 'invoiced' ? 'مفوتر' : name]} />
                <Legend formatter={(value) => value === 'revenue' ? 'محصّل' : value === 'invoiced' ? 'مفوتر' : value === 'appointments' ? 'مواعيد' : value} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="revenue" />
                <Bar dataKey="invoiced" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="invoiced" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Summary comparison */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {monthlyData.length >= 2 && (() => {
              const current = monthlyData[monthlyData.length - 1];
              const previous = monthlyData[monthlyData.length - 2];
              const revenueGrowth = previous.revenue > 0 ? Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100) : 0;
              const appointmentGrowth = previous.appointments > 0 ? Math.round(((current.appointments - previous.appointments) / previous.appointments) * 100) : 0;
              return (
                <>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">إيرادات الشهر الحالي</p>
                    <p className="text-xl font-bold">{current.revenue.toLocaleString()} ر.س</p>
                    <p className={`text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-destructive'}`}>{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">إيرادات الشهر السابق</p>
                    <p className="text-xl font-bold">{previous.revenue.toLocaleString()} ر.س</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">نمو المواعيد</p>
                    <p className="text-xl font-bold">{current.appointments}</p>
                    <p className={`text-sm ${appointmentGrowth >= 0 ? 'text-green-600' : 'text-destructive'}`}>{appointmentGrowth >= 0 ? '+' : ''}{appointmentGrowth}%</p>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerAnalytics;
