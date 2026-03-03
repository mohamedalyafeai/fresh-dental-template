import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, CalendarIcon, Clock, ArrowLeft, Smile, LogOut, Calendar as CalendarIcon2, Edit, XCircle, AlertCircle, Stethoscope, ClipboardList, Receipt, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import DoctorApplicationForm from '@/components/DoctorApplicationForm';
import { DoctorNameDisplay } from '@/components/DoctorNameDisplay';
import { PatientTreatmentPlans } from '@/components/portal/PatientTreatmentPlans';
import { PatientInvoices } from '@/components/portal/PatientInvoices';
import { PatientPrescriptions } from '@/components/portal/PatientPrescriptions';
 
 interface DoctorInfo {
   id: string;
   name: string;
 }

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
   doctor_id: string | null;
}

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'confirmed': return 'default';
    case 'completed': return 'secondary';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
};

const PatientPortal = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllPast, setShowAllPast] = useState(false);

  // Reschedule state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Cancel state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
 
   // Doctor filter state
   const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
   const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=portal');
    }
  }, [user, authLoading, navigate]);

  const fetchAppointments = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_email', user.email)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: t.common.error,
        description: t.portal.errorLoading,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchAppointments();
       fetchDoctors();
    }
  }, [user?.email]);
 
   const fetchDoctors = async () => {
     try {
       // Fetch available doctors from public view
       const { data: profiles, error: profilesError } = await supabase
         .from('public_doctor_profiles')
         .select('user_id');
 
       if (profilesError) throw profilesError;
 
       if (!profiles || profiles.length === 0) {
         setDoctors([]);
         return;
       }
 
       const validUserIds = profiles.filter(p => p.user_id !== null).map(p => p.user_id!);
 
       // Fetch names from profiles table
       const { data: userProfiles, error: userError } = await supabase
         .from('profiles')
         .select('user_id, full_name')
         .in('user_id', validUserIds);
 
       if (userError) throw userError;
 
       const doctorsList: DoctorInfo[] = (userProfiles || [])
         .filter(p => p.user_id && p.full_name)
         .map(p => ({
           id: p.user_id!,
           name: p.full_name || 'طبيب',
         }));
 
       setDoctors(doctorsList);
     } catch (error) {
       console.error('Error fetching doctors:', error);
     }
   };

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
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: format(newDate, 'yyyy-MM-dd'),
          appointment_time: newTime,
        })
        .eq('id', appointmentToReschedule.id);

      if (error) throw error;

      // Send notification
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'reschedule',
            patientName: appointmentToReschedule.patient_name,
            patientEmail: appointmentToReschedule.patient_email,
            service: appointmentToReschedule.service,
            originalDate: format(new Date(appointmentToReschedule.appointment_date), 'MMMM d, yyyy'),
            originalTime: appointmentToReschedule.appointment_time,
            newDate: format(newDate, 'MMMM d, yyyy'),
            newTime,
          },
        });
      } catch (emailError) {
        console.error('Failed to send notification:', emailError);
      }

      await fetchAppointments();
      toast({
        title: t.portal.appointmentRescheduled,
        description: t.portal.rescheduledTo.replace('{date}', format(newDate, 'MMM d, yyyy')).replace('{time}', newTime),
      });
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast({
        title: t.common.error,
        description: t.portal.errorReschedule,
        variant: 'destructive',
      });
    } finally {
      setIsRescheduling(false);
      setRescheduleDialogOpen(false);
      setAppointmentToReschedule(null);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!appointmentToCancel) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentToCancel.id);

      if (error) throw error;

      // Send notification
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'cancel',
            patientName: appointmentToCancel.patient_name,
            patientEmail: appointmentToCancel.patient_email,
            service: appointmentToCancel.service,
            originalDate: format(new Date(appointmentToCancel.appointment_date), 'MMMM d, yyyy'),
            originalTime: appointmentToCancel.appointment_time,
          },
        });
      } catch (emailError) {
        console.error('Failed to send notification:', emailError);
      }

      await fetchAppointments();
      toast({
        title: t.portal.appointmentCancelled,
        description: t.portal.cancelledDesc,
      });
    } catch (error) {
      console.error('Error cancelling:', error);
      toast({
        title: t.common.error,
        description: t.portal.errorCancel,
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

   const upcomingAppointmentsUnfiltered = appointments.filter(
    apt => apt.status !== 'cancelled' && apt.status !== 'completed' && new Date(apt.appointment_date) >= new Date()
  );
   const pastAppointmentsUnfiltered = appointments.filter(
    apt => apt.status === 'completed' || apt.status === 'cancelled' || new Date(apt.appointment_date) < new Date()
  ).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
   
   // Apply doctor filter
   const upcomingAppointments = selectedDoctorFilter === 'all'
     ? upcomingAppointmentsUnfiltered
     : upcomingAppointmentsUnfiltered.filter(apt => apt.doctor_id === selectedDoctorFilter);
 
   const pastAppointments = selectedDoctorFilter === 'all'
     ? pastAppointmentsUnfiltered
     : pastAppointmentsUnfiltered.filter(apt => apt.doctor_id === selectedDoctorFilter);
  
  const displayedPastAppointments = showAllPast ? pastAppointments : pastAppointments.slice(0, 5);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center">
                <Smile className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className="text-xl font-bold">{t.portal.title}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.portal.signOut}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="appointments" dir={isRTL ? 'rtl' : 'ltr'}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="appointments" className="flex items-center gap-1.5">
              <CalendarIcon2 className="h-4 w-4" />
              <span className="hidden sm:inline">المواعيد</span>
            </TabsTrigger>
            <TabsTrigger value="treatments" className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">خطط العلاج</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">الفواتير</span>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-1.5">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">الوصفات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="text-center py-12">
              <CalendarIcon2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">{t.portal.noAppointmentsTitle}</h2>
              <p className="text-muted-foreground mb-6">{t.portal.noAppointmentsDesc}</p>
              <Button variant="hero" onClick={() => navigate('/')}>
                {t.portal.bookNow}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
             {/* Doctor Filter */}
             {doctors.length > 0 && (
               <Card>
                 <CardContent className="p-4">
                   <div className={`flex items-center gap-4 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                     <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                       <Stethoscope className="h-4 w-4 text-primary" />
                       <span className="text-sm font-medium">{t.portal.filterByDoctor || 'تصفية حسب الطبيب'}:</span>
                     </div>
                     <Select value={selectedDoctorFilter} onValueChange={setSelectedDoctorFilter}>
                       <SelectTrigger className="w-[200px]">
                         <SelectValue placeholder={t.portal.allDoctors || 'جميع الأطباء'} />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">{t.portal.allDoctors || 'جميع الأطباء'}</SelectItem>
                         {doctors.map(doctor => (
                           <SelectItem key={doctor.id} value={doctor.id}>
                             {doctor.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     {selectedDoctorFilter !== 'all' && (
                       <Button variant="ghost" size="sm" onClick={() => setSelectedDoctorFilter('all')}>
                         {t.portal.clearFilter || 'مسح الفلتر'}
                       </Button>
                     )}
                   </div>
                 </CardContent>
               </Card>
             )}
 
            {/* Upcoming Appointments */}
            <div>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className="h-5 w-5 text-primary" />
                {t.portal.upcomingAppointments} ({upcomingAppointments.length})
              </h2>
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {t.portal.noUpcoming}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingAppointments.map(appointment => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                          <div className="space-y-2">
                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <h3 className="font-semibold text-lg">{appointment.service}</h3>
                              <Badge variant={getStatusBadgeVariant(appointment.status)}>
                                {appointment.status}
                              </Badge>
                            </div>
                            <div className={`flex items-center gap-4 text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <CalendarIcon className="h-4 w-4" />
                                {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}
                              </span>
                              <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Clock className="h-4 w-4" />
                                {appointment.appointment_time}
                              </span>
                            </div>
                             {appointment.doctor_id && (
                               <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                                 <DoctorNameDisplay doctorId={appointment.doctor_id} showSpecialty={false} />
                               </div>
                             )}
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleRescheduleClick(appointment)}>
                              <Edit className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t.portal.reschedule}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleCancelClick(appointment)}>
                              <XCircle className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t.portal.cancel}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            <div>
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className={`text-xl font-semibold text-muted-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CalendarIcon2 className="h-5 w-5" />
                  {t.portal.appointmentHistory} ({pastAppointments.length})
                </h2>
                {pastAppointments.length > 5 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllPast(!showAllPast)}>
                    {showAllPast ? t.portal.showLess : t.portal.showAll}
                  </Button>
                )}
              </div>
              {pastAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {t.portal.noPastAppointments}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {displayedPastAppointments.map(appointment => (
                    <Card key={appointment.id} className="opacity-80 hover:opacity-100 transition-opacity">
                      <CardContent className="p-4">
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={isRTL ? 'text-right' : ''}>
                            <h3 className="font-medium">{appointment.service}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')} • {appointment.appointment_time}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Application Section */}
            <div className="mt-8">
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Stethoscope className="h-5 w-5 text-primary" />
                {t.owner?.becomeDoctor || 'التقدم كطبيب'}
              </h2>
              <DoctorApplicationForm />
            </div>
          </div>
        )}
          </TabsContent>

          <TabsContent value="treatments">
            {user?.email && <PatientTreatmentPlans userEmail={user.email} />}
          </TabsContent>

          <TabsContent value="invoices">
            {user?.email && <PatientInvoices userEmail={user.email} />}
          </TabsContent>

          <TabsContent value="prescriptions">
            {user?.email && <PatientPrescriptions userEmail={user.email} />}
          </TabsContent>
        </Tabs>
      </main>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t.portal.rescheduleTitle}</DialogTitle>
            <DialogDescription>{t.portal.rescheduleDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.portal.newDate}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !newDate && "text-muted-foreground")}>
                    <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {newDate ? format(newDate, 'MMMM d, yyyy') : t.portal.selectDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.portal.newTime}</label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger>
                  <SelectValue placeholder={t.portal.selectTime} />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={`bg-muted rounded-lg p-3 flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {t.portal.rescheduleNote}
              </p>
            </div>
          </div>

          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>{t.common.cancel}</Button>
            <Button variant="hero" onClick={confirmReschedule} disabled={isRescheduling || !newDate || !newTime}>
              {isRescheduling ? t.portal.rescheduling : t.portal.confirmReschedule}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.portal.cancelTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.portal.cancelDesc
                .replace('{service}', appointmentToCancel?.service || '')
                .replace('{date}', appointmentToCancel ? format(new Date(appointmentToCancel.appointment_date), 'MMMM d, yyyy') : '')
                .replace('{time}', appointmentToCancel?.appointment_time || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <AlertDialogCancel>{t.portal.keepAppointment}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={isCancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCancelling ? t.portal.cancelling : t.portal.confirmCancel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientPortal;
