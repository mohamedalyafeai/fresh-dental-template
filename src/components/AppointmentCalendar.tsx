import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, User, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onReschedule: (id: string, newDate: string, newTime: string) => Promise<void>;
}

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM',
];

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return '#22c55e';
    case 'completed': return '#6b7280';
    case 'cancelled': return '#ef4444';
    default: return '#f59e0b';
  }
};

export const AppointmentCalendar = ({ appointments, onReschedule }: AppointmentCalendarProps) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const events: CalendarEvent[] = useMemo(() => {
    return appointments
      .filter(apt => apt.status !== 'cancelled')
      .map(apt => {
        const { hours, minutes } = parseTime(apt.appointment_time);
        const start = new Date(apt.appointment_date);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);

        return {
          id: apt.id,
          title: `${apt.patient_name} - ${apt.service}`,
          start,
          end,
          resource: apt,
        };
      });
  }, [appointments]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setNewDate(new Date(event.resource.appointment_date));
    setNewTime(event.resource.appointment_time);
    setIsDialogOpen(true);
  }, []);

  const handleEventDrop = useCallback(async ({ event, start }: { event: CalendarEvent; start: Date }) => {
    const newDateStr = format(start, 'yyyy-MM-dd');
    const timeStr = format(start, 'h:mm a').toUpperCase().replace(/^0/, '');
    
    // Find closest valid time slot
    const closestSlot = TIME_SLOTS.reduce((closest, slot) => {
      const slotTime = parseTime(slot);
      const eventTime = { hours: start.getHours(), minutes: start.getMinutes() };
      const slotDiff = Math.abs((slotTime.hours * 60 + slotTime.minutes) - (eventTime.hours * 60 + eventTime.minutes));
      const closestTime = parseTime(closest);
      const closestDiff = Math.abs((closestTime.hours * 60 + closestTime.minutes) - (eventTime.hours * 60 + eventTime.minutes));
      return slotDiff < closestDiff ? slot : closest;
    }, TIME_SLOTS[0]);

    await onReschedule(event.id, newDateStr, closestSlot);
  }, [onReschedule]);

  const handleReschedule = async () => {
    if (!selectedEvent || !newDate || !newTime) return;
    
    setIsRescheduling(true);
    try {
      await onReschedule(selectedEvent.id, format(newDate, 'yyyy-MM-dd'), newTime);
      setIsDialogOpen(false);
      setSelectedEvent(null);
    } finally {
      setIsRescheduling(false);
    }
  };

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: getStatusColor(event.resource.status),
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      fontSize: '12px',
      padding: '2px 6px',
    },
  }), []);

  return (
    <>
      <div className="h-[600px] bg-card rounded-lg p-4 border">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          defaultView={Views.WEEK}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          min={new Date(2024, 0, 1, 9, 0, 0)}
          max={new Date(2024, 0, 1, 18, 0, 0)}
          onSelectEvent={handleEventClick}
          onEventDrop={handleEventDrop}
          draggableAccessor={() => true}
          eventPropGetter={eventStyleGetter}
          selectable
          popup
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>View or reschedule this appointment</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedEvent.resource.patient_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedEvent.resource.patient_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedEvent.resource.patient_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedEvent.resource.service}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Reschedule to:</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("flex-1 justify-start", !newDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDate ? format(newDate, 'MMM d, yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={newDate}
                        onSelect={setNewDate}
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Select value={newTime} onValueChange={setNewTime}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleReschedule} disabled={isRescheduling}>
              {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
