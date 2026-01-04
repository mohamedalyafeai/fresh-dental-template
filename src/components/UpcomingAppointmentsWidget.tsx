import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns';
import { 
  CalendarDays, 
  Clock, 
  Phone, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Loader2,
  User
} from 'lucide-react';

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
}

interface UpcomingAppointmentsWidgetProps {
  onViewAll?: () => void;
  onStatusChange?: () => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getDateLabel = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

export const UpcomingAppointmentsWidget = ({ onViewAll, onStatusChange }: UpcomingAppointmentsWidgetProps) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUpcomingAppointments = async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', today)
        .lte('appointment_date', nextWeek)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(8);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  const handleQuickConfirm = async (appointment: Appointment) => {
    setUpdatingId(appointment.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment.id);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'confirmed' } : apt
        )
      );

      toast({
        title: 'Appointment Confirmed',
        description: `${appointment.patient_name}'s appointment has been confirmed.`,
      });

      onStatusChange?.();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm appointment.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickComplete = async (appointment: Appointment) => {
    setUpdatingId(appointment.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id);

      if (error) throw error;

      setAppointments(prev => prev.filter(apt => apt.id !== appointment.id));

      toast({
        title: 'Appointment Completed',
        description: `${appointment.patient_name}'s appointment has been marked as completed.`,
      });

      onStatusChange?.();
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete appointment.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickCancel = async (appointment: Appointment) => {
    setUpdatingId(appointment.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) throw error;

      setAppointments(prev => prev.filter(apt => apt.id !== appointment.id));

      toast({
        title: 'Appointment Cancelled',
        description: `${appointment.patient_name}'s appointment has been cancelled.`,
      });

      onStatusChange?.();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Group appointments by date
  const groupedAppointments = appointments.reduce((acc, apt) => {
    const dateLabel = getDateLabel(apt.appointment_date);
    if (!acc[dateLabel]) {
      acc[dateLabel] = [];
    }
    acc[dateLabel].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const todayCount = appointments.filter(apt => isToday(parseISO(apt.appointment_date))).length;
  const tomorrowCount = appointments.filter(apt => isTomorrow(parseISO(apt.appointment_date))).length;

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription className="mt-1">
              Next 7 days • {appointments.length} scheduled
              {todayCount > 0 && (
                <Badge variant="secondary" className="ml-2">{todayCount} today</Badge>
              )}
              {tomorrowCount > 0 && (
                <Badge variant="outline" className="ml-2">{tomorrowCount} tomorrow</Badge>
              )}
            </CardDescription>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="rounded-xl">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No upcoming appointments</p>
            <p className="text-sm">All clear for the next 7 days</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAppointments).map(([dateLabel, dayAppointments]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-semibold ${dateLabel === 'Today' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{dayAppointments.length} appt{dayAppointments.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {dayAppointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{appointment.patient_name}</span>
                            <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-xs">
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointment_time}
                            </span>
                            <span className="truncate">{appointment.service}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {appointment.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                            onClick={() => handleQuickConfirm(appointment)}
                            disabled={updatingId === appointment.id}
                            title="Confirm"
                          >
                            {updatingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            onClick={() => handleQuickComplete(appointment)}
                            disabled={updatingId === appointment.id}
                            title="Mark Complete"
                          >
                            {updatingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleQuickCancel(appointment)}
                          disabled={updatingId === appointment.id}
                          title="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <a
                          href={`tel:${appointment.patient_phone}`}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Call Patient"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
