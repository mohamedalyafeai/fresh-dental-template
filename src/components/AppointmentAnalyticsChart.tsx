import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, subWeeks, parseISO, isWithinInterval } from 'date-fns';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface AppointmentAnalyticsChartProps {
  appointments: Appointment[];
}

const CHART_COLORS = {
  completed: 'hsl(var(--chart-1))',
  confirmed: 'hsl(var(--chart-2))',
  pending: 'hsl(var(--chart-3))',
  cancelled: 'hsl(var(--chart-4))',
  total: 'hsl(var(--primary))',
};

const STATUS_COLORS = {
  completed: '#10b981',
  confirmed: '#3b82f6',
  pending: '#f59e0b',
  cancelled: '#ef4444',
};

export const AppointmentAnalyticsChart = ({ appointments }: AppointmentAnalyticsChartProps) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Calculate daily data for the last 14 days
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayAppointments = appointments.filter(apt => apt.appointment_date === dayStr);
      
      return {
        date: format(day, 'MMM d'),
        fullDate: dayStr,
        total: dayAppointments.length,
        completed: dayAppointments.filter(a => a.status === 'completed').length,
        confirmed: dayAppointments.filter(a => a.status === 'confirmed').length,
        pending: dayAppointments.filter(a => a.status === 'pending').length,
        cancelled: dayAppointments.filter(a => a.status === 'cancelled').length,
      };
    });
  }, [appointments]);

  // Calculate weekly data for the last 8 weeks
  const weeklyData = useMemo(() => {
    const weeks = eachWeekOfInterval({
      start: subWeeks(new Date(), 7),
      end: new Date(),
    });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const weekAppointments = appointments.filter(apt => {
        const aptDate = parseISO(apt.appointment_date);
        return isWithinInterval(aptDate, { start: weekStart, end: weekEnd });
      });
      
      return {
        date: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd')}`,
        week: format(weekStart, 'MMM d'),
        total: weekAppointments.length,
        completed: weekAppointments.filter(a => a.status === 'completed').length,
        confirmed: weekAppointments.filter(a => a.status === 'confirmed').length,
        pending: weekAppointments.filter(a => a.status === 'pending').length,
        cancelled: weekAppointments.filter(a => a.status === 'cancelled').length,
      };
    });
  }, [appointments]);

  const chartData = viewMode === 'daily' ? dailyData : weeklyData;

  // Calculate trends
  const currentPeriodTotal = chartData.slice(-7).reduce((sum, d) => sum + d.total, 0);
  const previousPeriodTotal = chartData.slice(0, 7).reduce((sum, d) => sum + d.total, 0);
  const trendPercentage = previousPeriodTotal > 0 
    ? Math.round(((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100)
    : 0;
  const isPositiveTrend = trendPercentage >= 0;

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    return [
      { name: 'Completed', value: completed, color: STATUS_COLORS.completed },
      { name: 'Confirmed', value: confirmed, color: STATUS_COLORS.confirmed },
      { name: 'Pending', value: pending, color: STATUS_COLORS.pending },
      { name: 'Cancelled', value: cancelled, color: STATUS_COLORS.cancelled },
    ].filter(item => item.value > 0);
  }, [appointments]);

  // Booking trends by day of week
  const dayOfWeekData = useMemo(() => {
    const daysMap: Record<string, number> = {
      'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
    };

    appointments.forEach(apt => {
      const dayName = format(parseISO(apt.appointment_date), 'EEE');
      daysMap[dayName] = (daysMap[dayName] || 0) + 1;
    });

    return Object.entries(daysMap).map(([day, count]) => ({
      day,
      appointments: count,
    }));
  }, [appointments]);

  // Peak hours analysis
  const peakHoursData = useMemo(() => {
    const hoursMap: Record<string, number> = {};

    appointments.forEach(apt => {
      const hour = apt.appointment_time.split(':')[0] + ':00';
      const hourLabel = apt.appointment_time.includes('AM') ? apt.appointment_time.split(' ')[0].split(':')[0] + ' AM' : apt.appointment_time;
      hoursMap[hourLabel] = (hoursMap[hourLabel] || 0) + 1;
    });

    return Object.entries(hoursMap)
      .map(([hour, count]) => ({ hour, appointments: count }))
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 6);
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Trend Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Period</p>
                <p className="text-3xl font-bold">{currentPeriodTotal}</p>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                isPositiveTrend ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {isPositiveTrend ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(trendPercentage)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs previous {viewMode === 'daily' ? '7 days' : '4 weeks'}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-3xl font-bold">
                  {dailyData.length > 0 ? (dailyData.reduce((sum, d) => sum + d.total, 0) / dailyData.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">appointments per day</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold">
                  {appointments.length > 0 
                    ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">of all appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Booking Trends</CardTitle>
              <CardDescription>Appointment volume over time</CardDescription>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'daily' | 'weekly')}>
              <TabsList className="rounded-xl">
                <TabsTrigger value="daily" className="rounded-lg">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey={viewMode === 'daily' ? 'date' : 'week'} 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#totalGradient)" 
                  name="Total"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Bar Chart */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Appointments by status over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-7)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey={viewMode === 'daily' ? 'date' : 'week'} 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill={STATUS_COLORS.completed} name="Completed" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="confirmed" stackId="a" fill={STATUS_COLORS.confirmed} name="Confirmed" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" stackId="a" fill={STATUS_COLORS.pending} name="Pending" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cancelled" stackId="a" fill={STATUS_COLORS.cancelled} name="Cancelled" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Busiest Days */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Busiest Days</CardTitle>
            <CardDescription>Appointment distribution by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="appointments" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Appointments"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Overall appointment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>Most popular appointment times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peakHoursData.length > 0 ? peakHoursData.map((item, index) => (
                <div key={item.hour} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.hour}</span>
                      <span className="text-sm text-muted-foreground">{item.appointments} appts</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(item.appointments / Math.max(...peakHoursData.map(h => h.appointments))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-8">No appointment data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
