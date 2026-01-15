import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { patientNoteSchema } from '@/lib/validation';
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
  Mail,
  Send,
  TrendingUp,
  Settings,
  BarChart3,
  DollarSign,
  Activity,
  UserCircle,
  History,
  FileText,
  Search,
  ChevronRight,
  Eye,
  Printer,
  Plus,
  StickyNote,
  MessageSquare,
  Download,
  FileDown,
  User,
  Stethoscope
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import PrintablePatientReport from '@/components/PrintablePatientReport';
import { UpcomingAppointmentsWidget } from '@/components/UpcomingAppointmentsWidget';
import { AppointmentAnalyticsChart } from '@/components/AppointmentAnalyticsChart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppointmentCalendar } from '@/components/AppointmentCalendar';
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import { DoctorSelect } from '@/components/DoctorSelect';
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
  doctor_id: string | null;
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

interface Patient {
  email: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string | null;
  appointments: Appointment[];
}

interface PatientNote {
  id: string;
  patient_email: string;
  patient_name: string;
  note_content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  
  // Patient history state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientHistoryDialogOpen, setPatientHistoryDialogOpen] = useState(false);
  
  // Patient notes state
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  
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
  const [isNotifyingWaitlist, setIsNotifyingWaitlist] = useState(false);
  const [isSendingSMSReminders, setIsSendingSMSReminders] = useState(false);

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

  // Process patients from appointments
  useEffect(() => {
    if (appointments.length > 0) {
      const patientMap = new Map<string, Patient>();
      
      appointments.forEach(apt => {
        const existing = patientMap.get(apt.patient_email);
        if (existing) {
          existing.appointments.push(apt);
          existing.totalVisits++;
          if (!existing.lastVisit || apt.appointment_date > existing.lastVisit) {
            existing.lastVisit = apt.appointment_date;
          }
        } else {
          patientMap.set(apt.patient_email, {
            email: apt.patient_email,
            name: apt.patient_name,
            phone: apt.patient_phone,
            totalVisits: 1,
            lastVisit: apt.appointment_date,
            appointments: [apt],
          });
        }
      });
      
      setPatients(Array.from(patientMap.values()).sort((a, b) => 
        (b.lastVisit || '').localeCompare(a.lastVisit || '')
      ));
    }
  }, [appointments]);

  // Fetch patient notes when patient is selected
  const fetchPatientNotes = async (patientEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_email', patientEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatientNotes(data || []);
    } catch (error) {
      console.error('Error fetching patient notes:', error);
      setPatientNotes([]);
    }
  };

  // Save a new patient note
  const savePatientNote = async () => {
    if (!selectedPatient || !newNote.trim()) return;
    
    // Validate note content
    const result = patientNoteSchema.safeParse({ note_content: newNote.trim() });
    if (!result.success) {
      toast({
        title: 'Validation Error',
        description: result.error.errors[0]?.message || 'Invalid note content',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSavingNote(true);
    try {
      const { error } = await supabase
        .from('patient_notes')
        .insert({
          patient_email: selectedPatient.email,
          patient_name: selectedPatient.name,
          note_content: result.data.note_content,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: 'Note Saved',
        description: 'Patient note has been saved successfully.',
      });

      setNewNote('');
      fetchPatientNotes(selectedPatient.email);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save patient note.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete a patient note
  const deletePatientNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('patient_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Note Deleted',
        description: 'Patient note has been deleted.',
      });

      if (selectedPatient) {
        fetchPatientNotes(selectedPatient.email);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note.',
        variant: 'destructive',
      });
    }
  };

  // Print patient report
  const handlePrintReport = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  // Export patient data to CSV
  const exportPatientToCSV = (patient: Patient) => {
    const headers = ['Date', 'Time', 'Service', 'Status', 'Notes'];
    const rows = patient.appointments.map(apt => [
      apt.appointment_date,
      apt.appointment_time,
      apt.service,
      apt.status,
      apt.notes?.replace(/,/g, ';') || ''
    ]);
    
    const csvContent = [
      `Patient Report - ${patient.name}`,
      `Email: ${patient.email}`,
      `Phone: ${patient.phone}`,
      `Total Visits: ${patient.totalVisits}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${patient.name.replace(/\s+/g, '_')}_patient_report.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: 'CSV Exported',
      description: `Patient report for ${patient.name} has been downloaded.`,
    });
  };

  // Export all patients to CSV
  const exportAllPatientsToCSV = () => {
    const headers = ['Patient Name', 'Email', 'Phone', 'Total Visits', 'Last Visit', 'Completed', 'Upcoming', 'Cancelled'];
    const rows = patients.map(patient => [
      patient.name,
      patient.email,
      patient.phone,
      patient.totalVisits.toString(),
      patient.lastVisit || 'N/A',
      patient.appointments.filter(a => a.status === 'completed').length.toString(),
      patient.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length.toString(),
      patient.appointments.filter(a => a.status === 'cancelled').length.toString()
    ]);
    
    const csvContent = [
      `All Patients Report - Generated on ${format(new Date(), 'MMMM d, yyyy')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `all_patients_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: 'CSV Exported',
      description: `All ${patients.length} patient records have been exported.`,
    });
  };

  // Export all appointments to CSV
  const exportAllAppointmentsToCSV = () => {
    const headers = ['Patient Name', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Notes', 'Created At'];
    const rows = appointments.map(apt => [
      apt.patient_name,
      apt.patient_email,
      apt.patient_phone,
      apt.service,
      apt.appointment_date,
      apt.appointment_time,
      apt.status,
      apt.notes?.replace(/,/g, ';') || '',
      format(new Date(apt.created_at), 'yyyy-MM-dd HH:mm')
    ]);
    
    const csvContent = [
      `Appointments Report - Generated on ${format(new Date(), 'MMMM d, yyyy')}`,
      selectedDate ? `Filtered by Date: ${format(selectedDate, 'MMMM d, yyyy')}` : '',
      selectedService !== 'All Services' ? `Filtered by Service: ${selectedService}` : '',
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].filter(line => line !== '').join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appointments_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: 'CSV Exported',
      description: `${appointments.length} appointments have been exported.`,
    });
  };

  // Generate and download PDF report for patient
  const exportPatientToPDF = (patient: Patient) => {
    const completedCount = patient.appointments.filter(a => a.status === 'completed').length;
    const upcomingCount = patient.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
    const cancelledCount = patient.appointments.filter(a => a.status === 'cancelled').length;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Report - ${patient.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0891b2; }
          .logo { font-size: 24px; font-weight: bold; color: #0891b2; }
          .subtitle { color: #666; margin-top: 5px; }
          .patient-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .patient-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .patient-contact { color: #666; font-size: 14px; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .stat-box { flex: 1; padding: 15px; text-align: center; border-radius: 8px; }
          .stat-box.completed { background: #d1fae5; color: #059669; }
          .stat-box.upcoming { background: #dbeafe; color: #2563eb; }
          .stat-box.cancelled { background: #fee2e2; color: #dc2626; }
          .stat-number { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 12px; margin-top: 5px; }
          .section-title { font-size: 16px; font-weight: bold; margin: 20px 0 10px; color: #0891b2; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f8fafc; font-weight: 600; }
          .status { padding: 3px 8px; border-radius: 4px; font-size: 12px; }
          .status.completed { background: #d1fae5; color: #059669; }
          .status.confirmed { background: #dbeafe; color: #2563eb; }
          .status.pending { background: #fef3c7; color: #d97706; }
          .status.cancelled { background: #fee2e2; color: #dc2626; }
          .notes-section { margin-top: 20px; }
          .note-item { padding: 10px; border-left: 3px solid #fbbf24; background: #fefce8; margin-bottom: 10px; }
          .note-date { font-size: 11px; color: #666; margin-top: 5px; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🦷 BrightSmile Dental</div>
          <div class="subtitle">Patient Medical Report</div>
        </div>
        
        <div class="patient-info">
          <div class="patient-name">${patient.name}</div>
          <div class="patient-contact">
            📧 ${patient.email} &nbsp;&nbsp; 📞 ${patient.phone}
          </div>
        </div>
        
        <div class="stats">
          <div class="stat-box completed">
            <div class="stat-number">${completedCount}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-box upcoming">
            <div class="stat-number">${upcomingCount}</div>
            <div class="stat-label">Upcoming</div>
          </div>
          <div class="stat-box cancelled">
            <div class="stat-number">${cancelledCount}</div>
            <div class="stat-label">Cancelled</div>
          </div>
        </div>
        
        ${patientNotes.length > 0 ? `
        <div class="notes-section">
          <div class="section-title">📝 Doctor Notes</div>
          ${patientNotes.map(note => `
            <div class="note-item">
              ${note.note_content}
              <div class="note-date">${format(new Date(note.created_at), 'MMMM d, yyyy h:mm a')}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <div class="section-title">📅 Appointment History</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Service</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${patient.appointments
              .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
              .map(apt => `
                <tr>
                  <td>${format(new Date(apt.appointment_date), 'MMM d, yyyy')}</td>
                  <td>${apt.appointment_time}</td>
                  <td>${apt.service}</td>
                  <td><span class="status ${apt.status}">${apt.status}</span></td>
                  <td>${apt.notes || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')} | BrightSmile Dental Clinic
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    toast({
      title: 'PDF Ready',
      description: `Patient report for ${patient.name} is ready for printing/saving as PDF.`,
    });
  };

  // Realtime appointments subscription
  useRealtimeAppointments({
    onUpdate: () => {
      if (user && isAdmin) {
        fetchAppointments();
        fetchWaitlist();
      }
    },
  });

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

  // Send SMS reminders for tomorrow's appointments
  const sendSMSReminders = async () => {
    setIsSendingSMSReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-reminder', {});

      if (error) throw error;

      toast({
        title: 'تم إرسال التذكيرات!',
        description: `تم معالجة ${data.processed} موعد. ${data.results?.filter((r: any) => r.status === 'sent').length || 0} تذكير تم إرساله بنجاح.`,
      });
    } catch (error) {
      console.error('Error sending SMS reminders:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال تذكيرات SMS.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingSMSReminders(false);
    }
  };

  // Notify waitlist patients for a specific date
  const notifyWaitlistPatients = async (preferredDate: string) => {
    setIsNotifyingWaitlist(true);
    try {
      // Get booked slots for this date
      const { data: bookedAppointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', preferredDate)
        .neq('status', 'cancelled');

      const bookedTimes = bookedAppointments?.map(a => a.appointment_time) || [];
      const availableSlots = TIME_SLOTS.filter(slot => !bookedTimes.includes(slot));

      if (availableSlots.length === 0) {
        toast({
          title: 'No Available Slots',
          description: 'There are no available slots for this date.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('notify-waitlist', {
        body: { date: preferredDate, availableSlots }
      });

      if (error) throw error;

      toast({
        title: 'Notifications Sent!',
        description: `${data.totalNotified} patient(s) have been notified about available slots.`,
      });

      // Refresh the waitlist
      fetchWaitlist();
    } catch (error) {
      console.error('Error notifying waitlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to notify waitlist patients.',
        variant: 'destructive',
      });
    } finally {
      setIsNotifyingWaitlist(false);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background" dir="rtl">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">لوحة التحكم</h1>
                <p className="text-sm text-muted-foreground">إدارة المواعيد وقائمة الانتظار</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/profile')} className="rounded-xl">
              <User className="h-4 w-4 ml-2" />
              ملفي الشخصي
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/staff')} className="rounded-xl">
              <Users className="h-4 w-4 ml-2" />
              إدارة الموظفين
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">الإجمالي</p>
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
                  <p className="text-sm text-muted-foreground font-medium">قيد الانتظار</p>
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
                  <p className="text-sm text-muted-foreground font-medium">مؤكد</p>
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
                  <p className="text-sm text-muted-foreground font-medium">مكتمل</p>
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
                  <p className="text-sm text-muted-foreground font-medium">قائمة الانتظار</p>
                  <p className="text-3xl font-bold">{waitlistCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <ListPlus className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments Widget */}
        <div className="mb-8">
          <UpcomingAppointmentsWidget 
            onViewAll={() => setActiveTab('appointments')}
            onStatusChange={fetchAppointments}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/80 backdrop-blur-sm border shadow-sm p-1 rounded-2xl flex-wrap">
            <TabsTrigger value="appointments" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
              المواعيد
            </TabsTrigger>
            <TabsTrigger value="patients" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
              <UserCircle className="h-4 w-4 ml-2" />
              المرضى
            </TabsTrigger>
            <TabsTrigger value="waitlist" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
              قائمة الانتظار {waitlistCount > 0 && <Badge variant="secondary" className="mr-2">{waitlistCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
              <BarChart3 className="h-4 w-4 ml-2" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
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

                  <Button
                    variant="outline"
                    onClick={sendSMSReminders}
                    disabled={isSendingSMSReminders}
                    className="rounded-xl"
                  >
                    {isSendingSMSReminders ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Phone className="h-4 w-4 mr-2" />
                    )}
                    إرسال تذكيرات SMS
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-xl">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={exportAllAppointmentsToCSV}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export to CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                            <TableHead>المريض</TableHead>
                            <TableHead>الخدمة</TableHead>
                            <TableHead>التاريخ والوقت</TableHead>
                            <TableHead>الطبيب المعالج</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.map(appointment => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{appointment.patient_name}</p>
                                  <p className="text-xs text-muted-foreground">{appointment.patient_email}</p>
                                  {appointment.notes && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                      📝 {appointment.notes}
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
                                <DoctorSelect
                                  value={appointment.doctor_id || undefined}
                                  onValueChange={async (doctorId) => {
                                    try {
                                      const { error } = await supabase
                                        .from('appointments')
                                        .update({ doctor_id: doctorId || null })
                                        .eq('id', appointment.id);
                                      
                                      if (error) throw error;
                                      
                                      setAppointments(prev =>
                                        prev.map(apt =>
                                          apt.id === appointment.id
                                            ? { ...apt, doctor_id: doctorId || null }
                                            : apt
                                        )
                                      );
                                      
                                      toast({
                                        title: 'تم التحديث',
                                        description: 'تم تعيين الطبيب للموعد',
                                      });
                                    } catch (error) {
                                      console.error('Error assigning doctor:', error);
                                      toast({
                                        title: 'خطأ',
                                        description: 'فشل في تعيين الطبيب',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                />
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

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-primary" />
                      Patient Records
                    </CardTitle>
                    <CardDescription>
                      View patient history and appointment records
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search patients..."
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        className="pl-9 w-[250px] rounded-xl"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-xl">
                          <Download className="h-4 w-4 mr-2" />
                          Export All
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportAllPatientsToCSV}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Export All Patients to CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No patient records found</p>
                    <p className="text-sm">Patient records will appear once appointments are booked</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {patients
                      .filter(patient => 
                        patient.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        patient.email.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        patient.phone.includes(patientSearchQuery)
                      )
                      .map(patient => (
                        <div 
                          key={patient.email} 
                          className="flex items-center justify-between p-4 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedPatient(patient);
                            fetchPatientNotes(patient.email);
                            setPatientHistoryDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                              <UserCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{patient.name}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {patient.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {patient.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="rounded-lg">
                                  <History className="h-3 w-3 mr-1" />
                                  {patient.totalVisits} visit{patient.totalVisits !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              {patient.lastVisit && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last: {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                            variant="default"
                            size="sm"
                            className="rounded-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            onClick={() => notifyWaitlistPatients(entry.preferred_date)}
                            disabled={isNotifyingWaitlist}
                          >
                            {isNotifyingWaitlist ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Notify
                          </Button>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AppointmentAnalyticsChart appointments={appointments} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Clinic Settings
                  </CardTitle>
                  <CardDescription>Manage your clinic preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Clinic Name</Label>
                    <Input defaultValue="BrightSmile Dental" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input defaultValue="+1 (234) 567-8900" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue="info@brightsmile.com" className="rounded-xl" />
                  </div>
                  <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Working Hours
                  </CardTitle>
                  <CardDescription>Configure appointment availability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Opens At</Label>
                      <Input defaultValue="9:00 AM" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Closes At</Label>
                      <Input defaultValue="5:00 PM" className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Appointment Duration (minutes)</Label>
                    <Input type="number" defaultValue="30" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Appointments per Day</Label>
                    <Input type="number" defaultValue="15" className="rounded-xl" />
                  </div>
                  <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    Update Schedule
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Configure email and SMS reminders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Confirmation Emails</p>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Send email when appointment is booked</p>
                    </div>
                    <div className="p-4 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">SMS Reminders</p>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Send SMS 24 hours before appointment</p>
                    </div>
                    <div className="p-4 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Waitlist Notifications</p>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Notify patients when slots open</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

      {/* Patient History Dialog */}
      <Dialog open={patientHistoryDialogOpen} onOpenChange={(open) => {
        setPatientHistoryDialogOpen(open);
        if (!open) {
          setNewNote('');
          setPatientNotes([]);
        }
      }}>
        <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Patient History
                </DialogTitle>
                <DialogDescription>
                  Complete appointment history and notes for {selectedPatient?.name}
                </DialogDescription>
              </div>
              {selectedPatient && (
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportPatientToCSV(selectedPatient)}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export to CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportPatientToPDF(selectedPatient)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export to PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintReport}
                    className="rounded-xl"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6 py-4">
              {/* Patient Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedPatient.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {selectedPatient.phone}
                    </span>
                  </div>
                </div>
                <Badge className="rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  {selectedPatient.totalVisits} Total Visits
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {selectedPatient.appointments.filter(a => a.status === 'completed').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {selectedPatient.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {selectedPatient.appointments.filter(a => a.status === 'cancelled').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </div>
              </div>

              {/* Doctor Notes Section */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-amber-500" />
                  Doctor Notes
                </h4>
                
                {/* Add New Note */}
                <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                  <Textarea
                    placeholder="Add a note about this patient (treatment observations, recommendations, follow-up reminders, etc.)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px] rounded-xl resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={savePatientNote}
                      disabled={!newNote.trim() || isSavingNote}
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      {isSavingNote ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Note
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Existing Notes */}
                {patientNotes.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {patientNotes.map(note => (
                      <div 
                        key={note.id} 
                        className="p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{note.note_content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deletePatientNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes yet. Add your first note above.
                  </p>
                )}
              </div>

              {/* Appointment History */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Appointment History
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedPatient.appointments
                    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
                    .map(apt => (
                      <div 
                        key={apt.id} 
                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            apt.status === 'completed' ? 'bg-emerald-500/10' :
                            apt.status === 'confirmed' ? 'bg-primary/10' :
                            apt.status === 'cancelled' ? 'bg-destructive/10' :
                            'bg-amber-500/10'
                          }`}>
                            {apt.status === 'completed' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> :
                             apt.status === 'confirmed' ? <CalendarDays className="h-5 w-5 text-primary" /> :
                             apt.status === 'cancelled' ? <XCircle className="h-5 w-5 text-destructive" /> :
                             <Clock className="h-5 w-5 text-amber-500" />}
                          </div>
                          <div>
                            <p className="font-medium">{apt.service}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.appointment_date), 'MMMM d, yyyy')} at {apt.appointment_time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadgeVariant(apt.status)}>
                            {apt.status}
                          </Badge>
                          {apt.notes && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPatientHistoryDialogOpen(false)}
              className="rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print View (Hidden until print) */}
      {showPrintView && selectedPatient && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-auto print:static">
          <PrintablePatientReport patient={selectedPatient} patientNotes={patientNotes} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;