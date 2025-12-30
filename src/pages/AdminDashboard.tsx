import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Loader2, 
  CalendarIcon, 
  Filter, 
  LogOut, 
  RefreshCw, 
  Sparkles,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trash2,
  Edit,
  MoreHorizontal,
  List,
  CalendarDays,
  ListPlus,
  Phone,
  Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppointmentCalendar } from '@/components/AppointmentCalendar';
import '@/styles/calendar.css';

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

interface WaitlistEntry {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  service: string;
  preferred_date: string;
  notes: string | null;
  status: string;
  created_at: string;
}

const SERVICES = [
  'All Services',
  'General Checkup',
  'Teeth Cleaning',
  'Teeth Whitening',
  'Dental Implants',
  'Root Canal',
  'Braces & Orthodontics',
];

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM',
];

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

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

const AdminDashboard = () => {
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedService, setSelectedService] = useState('All Services');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState('appointments');
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Reschedule state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth?role=doctor');
      } else if (!isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (selectedDate) {
        query = query.eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'));
      }

      if (selectedService && selectedService !== 'All Services') {
        query = query.eq('service', selectedService);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWaitlist = async () => {
    setIsLoadingWaitlist(true);
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('*')
        .eq('status', 'waiting')
        .order('preferred_date', { ascending: true });

      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setIsLoadingWaitlist(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchAppointments();
      fetchWaitlist();
    }
  }, [user, isAdmin, selectedDate, selectedService]);

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
      );

      toast({
        title: 'Status Updated',
        description: `Appointment marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const removeFromWaitlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('waiting_list')
        .update({ status: 'removed' })
        .eq('id', id);

      if (error) throw error;

      setWaitlist(prev => prev.filter(w => w.id !== id));
      toast({
        title: 'Removed from Waitlist',
        description: 'Entry has been removed from the waiting list.',
      });
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from waitlist.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedService('All Services');
  };

  // Delete appointment
  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentToDelete.id);

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-admin-notification", {
          body: {
            type: "cancel",
            patientName: appointmentToDelete.patient_name,
            patientEmail: appointmentToDelete.patient_email,
            service: appointmentToDelete.service,
            originalDate: format(new Date(appointmentToDelete.appointment_date), "MMMM d, yyyy"),
            originalTime: appointmentToDelete.appointment_time,
          },
        });
      } catch (emailError) {
        console.error("Failed to send cancellation notification:", emailError);
      }

      setAppointments(prev => prev.filter(apt => apt.id !== appointmentToDelete.id));
      
      toast({
        title: 'Appointment Deleted',
        description: `Appointment for ${appointmentToDelete.patient_name} has been deleted and notified.`,
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete appointment.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  // Reschedule appointment
  const handleRescheduleClick = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setNewDate(new Date(appointment.appointment_date));
    setNewTime(appointment.appointment_time);
    setRescheduleDialogOpen(true);
  };

  const confirmReschedule = async () => {
    if (!appointmentToReschedule || !newDate || !newTime) return;
    
    setIsRescheduling(true);
    try {
      const originalDate = format(new Date(appointmentToReschedule.appointment_date), "MMMM d, yyyy");
      const originalTime = appointmentToReschedule.appointment_time;

      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: format(newDate, 'yyyy-MM-dd'),
          appointment_time: newTime,
        })
        .eq('id', appointmentToReschedule.id);

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-admin-notification", {
          body: {
            type: "reschedule",
            patientName: appointmentToReschedule.patient_name,
            patientEmail: appointmentToReschedule.patient_email,
            service: appointmentToReschedule.service,
            originalDate,
            originalTime,
            newDate: format(newDate, "MMMM d, yyyy"),
            newTime,
          },
        });
      } catch (emailError) {
        console.error("Failed to send reschedule notification:", emailError);
      }

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentToReschedule.id
            ? { ...apt, appointment_date: format(newDate, 'yyyy-MM-dd'), appointment_time: newTime }
            : apt
        )
      );
      
      toast({
        title: 'Appointment Rescheduled',
        description: `Appointment for ${appointmentToReschedule.patient_name} has been rescheduled and notified.`,
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reschedule appointment.',
        variant: 'destructive',
      });
    } finally {
      setIsRescheduling(false);
      setRescheduleDialogOpen(false);
      setAppointmentToReschedule(null);
      setNewDate(undefined);
      setNewTime('');
    }
  };

  const handleCalendarReschedule = async (id: string, newDateStr: string, newTimeStr: string) => {
    const appointment = appointments.find(apt => apt.id === id);
    if (!appointment) return;

    try {
      const originalDate = format(new Date(appointment.appointment_date), "MMMM d, yyyy");
      const originalTime = appointment.appointment_time;

      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDateStr,
          appointment_time: newTimeStr,
        })
        .eq('id', id);

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-admin-notification", {
          body: {
            type: "reschedule",
            patientName: appointment.patient_name,
            patientEmail: appointment.patient_email,
            service: appointment.service,
            originalDate,
            originalTime,
            newDate: format(new Date(newDateStr), "MMMM d, yyyy"),
            newTime: newTimeStr,
          },
        });
      } catch (emailError) {
        console.error("Failed to send notification:", emailError);
      }

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === id
            ? { ...apt, appointment_date: newDateStr, appointment_time: newTimeStr }
            : apt
        )
      );

      toast({
        title: 'Appointment Rescheduled',
        description: `Appointment for ${appointment.patient_name} has been rescheduled.`,
      });
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast({
        title: 'Error',
        description: 'Failed to reschedule appointment.',
        variant: 'destructive',
      });
    }
  };

  // Stats
  const totalAppointments = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const waitlistCount = waitlist.length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 hero-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage appointments & waitlist</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total</p>
                  <p className="text-3xl font-bold">{totalAppointments}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pending</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Confirmed</p>
                  <p className="text-3xl font-bold">{confirmedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Completed</p>
                  <p className="text-3xl font-bold">{completedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Waitlist</p>
                  <p className="text-3xl font-bold">{waitlistCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <ListPlus className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/80 backdrop-blur-sm border shadow-sm p-1 rounded-2xl">
            <TabsTrigger value="appointments" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="waitlist" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
              Waiting List {waitlistCount > 0 && <Badge variant="secondary" className="ml-2">{waitlistCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            {/* Filters */}
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Filters
                </CardTitle>
                <CardDescription>Filter appointments by date and service type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[200px] justify-start rounded-xl">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP') : 'All dates'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Service</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger className="w-[200px] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICES.map(service => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                    Clear Filters
                  </Button>

                  <Button variant="outline" onClick={fetchAppointments} className="rounded-xl">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>

                  <div className="flex gap-1 border rounded-xl p-1 bg-muted/50">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-lg"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                      className="rounded-lg"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <AppointmentCalendar
                appointments={appointments}
                onReschedule={handleCalendarReschedule}
              />
            )}

            {/* Appointments Table */}
            {viewMode === 'list' && (
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Appointments</CardTitle>
                  <CardDescription>
                    {isLoading ? 'Loading...' : `${appointments.length} appointment(s) found`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No appointments found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.map(appointment => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{appointment.patient_name}</p>
                                  {appointment.notes && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                      {appointment.notes}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{appointment.service}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {appointment.appointment_time}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{appointment.patient_email}</p>
                                  <p className="text-muted-foreground">{appointment.patient_phone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(appointment.status)}>
                                  {appointment.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={appointment.status}
                                    onValueChange={value => updateAppointmentStatus(appointment.id, value)}
                                    disabled={updatingId === appointment.id}
                                  >
                                    <SelectTrigger className="w-[120px] rounded-lg">
                                      {updatingId === appointment.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <SelectValue />
                                      )}
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STATUS_OPTIONS.map(status => (
                                        <SelectItem key={status} value={status}>
                                          {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleRescheduleClick(appointment)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Reschedule
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteClick(appointment)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="waitlist">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListPlus className="h-5 w-5 text-orange-500" />
                      Waiting List
                    </CardTitle>
                    <CardDescription>
                      Patients waiting for available slots
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={fetchWaitlist} className="rounded-xl">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingWaitlist ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : waitlist.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ListPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No one on the waiting list</p>
                    <p className="text-sm">Patients will appear here when all slots are booked</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {waitlist.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-semibold">{entry.patient_name}</p>
                            <p className="text-sm text-muted-foreground">{entry.service}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(entry.preferred_date), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {entry.patient_email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {entry.patient_phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-lg"
                            onClick={() => removeFromWaitlist(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the appointment for{' '}
              <span className="font-medium">{appointmentToDelete?.patient_name}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Reschedule appointment for{' '}
              <span className="font-medium">{appointmentToReschedule?.patient_name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-xl">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">New Time</Label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleDialogOpen(false)}
              disabled={isRescheduling}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={isRescheduling || !newDate || !newTime}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl"
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;