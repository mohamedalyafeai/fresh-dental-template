import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, FileText, Check, AlertCircle, Loader2, ListPlus, LogIn, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDoctorAvailability } from "@/hooks/useDoctorAvailability";
import { bookingFormSchema } from "@/lib/validation";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal = ({ isOpen, onClose }: BookingModalProps) => {
  const { t, isRTL, language } = useLanguage();
  const dateLocale = language === 'ar' ? arLocale : enUS;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const services = [
  { id: "general", name: t.booking.services.general, duration: "30", icon: "🦷" },
  { id: "whitening", name: t.booking.services.whitening, duration: "60", icon: "✨" },
  { id: "rootcanal", name: t.booking.services.rootcanal, duration: "90", icon: "🔧" },
  { id: "emergency", name: t.booking.services.emergency, duration: "45", icon: "🚨" },
  { id: "crowns", name: t.booking.services.crowns, duration: "60", icon: "👑" },
  { id: "cosmetic", name: t.booking.services.cosmetic, duration: "45", icon: "💎" },
];

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
  ];

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isWaitlistConfirmed, setIsWaitlistConfirmed] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<string | undefined>();
  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState<string[]>(timeSlots);
  
  const { checkDateAvailability, isLoading: isCheckingAvailability } = useDoctorAvailability();

  // Validate form data
  const validateForm = (): boolean => {
    const result = bookingFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  // Auto-fill user data from profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setFormData(prev => ({
          ...prev,
          name: profile?.full_name || user.user_metadata?.full_name || "",
          email: profile?.email || user.email || "",
        }));
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user metadata
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
        }));
      }
    };

    if (isOpen && user) {
      fetchUserProfile();
    }
  }, [isOpen, user]);

  // Fetch booked slots and check doctor availability when date changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate) {
        setBookedSlots([]);
        setDoctorAvailableSlots(timeSlots);
        setUnavailableReason(undefined);
        return;
      }

      setIsLoadingSlots(true);
      try {
        // Check doctor availability for this date
        const { availableSlots: doctorSlots, unavailableReason: reason } = await checkDateAvailability(selectedDate, timeSlots);
        setDoctorAvailableSlots(doctorSlots);
        setUnavailableReason(reason);

        // Fetch already booked slots
        const { data, error } = await supabase
          .from("appointments")
          .select("appointment_time")
          .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
          .neq("status", "cancelled");

        if (error) throw error;

        const slots = data?.map(apt => apt.appointment_time) || [];
        setBookedSlots(slots);
        
        if (selectedTime && (slots.includes(selectedTime) || !doctorSlots.includes(selectedTime))) {
          setSelectedTime(null);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        setBookedSlots([]);
        setDoctorAvailableSlots(timeSlots);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, checkDateAvailability]);

  const handleLoginRedirect = () => {
    onClose();
    navigate('/auth');
  };

  // Show login required screen if user is not authenticated
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
              <LogIn className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t.booking.loginRequired}</h2>
            <p className="text-muted-foreground mb-6">
              {t.booking.loginRequiredDesc}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                onClick={handleLoginRedirect}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity w-full"
              >
                <LogIn className="w-4 h-4 ml-2" />
                {t.booking.loginToBook}
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={handleLoginRedirect}
                className="w-full"
              >
                {t.booking.createAccount}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const resetForm = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setFormData({ name: "", email: "", phone: "", notes: "" });
    setIsConfirmed(false);
    setIsWaitlistConfirmed(false);
    setBookedSlots([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleJoinWaitlist = async () => {
    if (!selectedService || !selectedDate) return;
    
    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: t.common?.error || "Error",
        description: "Please fix the form errors",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("waiting_list").insert({
        patient_name: formData.name.trim(),
        patient_email: formData.email.trim(),
        patient_phone: formData.phone.trim(),
        service: selectedService,
        preferred_date: format(selectedDate, "yyyy-MM-dd"),
        notes: formData.notes.trim() || null,
      });

      if (error) throw error;

      setIsWaitlistConfirmed(true);
      toast({
        title: t.booking.waitlistSuccess,
        description: t.booking.waitlistSuccessDesc,
      });
    } catch (error) {
      console.error("Waitlist error:", error);
      toast({
        title: t.booking.waitlistFailed,
        description: t.booking.tryAgain,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: t.common?.error || "Error",
        description: "Please fix the form errors",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: existingBooking, error: checkError } = await supabase
        .from("appointments")
        .select("id")
        .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
        .eq("appointment_time", selectedTime)
        .neq("status", "cancelled")
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingBooking) {
        toast({
          title: t.booking.slotUnavailable,
          description: t.booking.slotJustBooked,
          variant: "destructive",
        });
        const { data } = await supabase
          .from("appointments")
          .select("appointment_time")
          .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
          .neq("status", "cancelled");
        setBookedSlots(data?.map(apt => apt.appointment_time) || []);
        setSelectedTime(null);
        setStep(2);
        return;
      }

      const { error } = await supabase.from("appointments").insert({
        patient_name: formData.name.trim(),
        patient_email: formData.email.trim(),
        patient_phone: formData.phone.trim(),
        service: selectedService,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: selectedTime,
        notes: formData.notes.trim() || null,
      });

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-confirmation-email", {
          body: {
            patientName: formData.name.trim(),
            patientEmail: formData.email.trim(),
            service: selectedServiceData?.name || selectedService,
            appointmentDate: format(selectedDate, "d MMMM yyyy", { locale: dateLocale }),
            appointmentTime: selectedTime,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      setIsConfirmed(true);
      toast({
        title: t.booking.bookingSuccess,
        description: t.booking.bookingSuccessDesc,
      });
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: t.booking.bookingFailed,
        description: t.booking.tryAgain,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = selectedService !== null;
  const canProceedStep2 = selectedDate !== undefined && selectedTime !== null;
  const canProceedStep3 = formData.name.trim() && formData.email.trim() && formData.phone.trim();

  const selectedServiceData = services.find(s => s.id === selectedService);
  // Filter slots: must be in doctor's available hours AND not already booked
  const availableSlots = doctorAvailableSlots.filter(slot => !bookedSlots.includes(slot));
  const allSlotsBooked = selectedDate && !isLoadingSlots && availableSlots.length === 0;
  const clinicClosed = selectedDate && !isLoadingSlots && doctorAvailableSlots.length === 0;

  // Waitlist confirmation screen
  if (isWaitlistConfirmed) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
              <ListPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t.booking.addedToWaitlist}</h2>
            <p className="text-muted-foreground mb-6">
              {t.booking.willNotify}
            </p>
            <div className="bg-muted/50 rounded-2xl p-6 text-right mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{selectedServiceData?.name}</span>
                  <span className="text-muted-foreground">{t.booking.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{selectedDate && format(selectedDate, "d MMMM yyyy", { locale: dateLocale })}</span>
                  <span className="text-muted-foreground">{t.booking.preferredDate}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t.booking.willContact.replace("{email}", formData.email)}
            </p>
            <Button 
              size="lg" 
              onClick={handleClose}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {t.booking.done}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isConfirmed) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="text-center py-8">
            <div className="w-20 h-20 hero-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25 animate-scale-in">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t.booking.appointmentConfirmed}</h2>
            <p className="text-muted-foreground mb-6">
              {t.booking.thankYou}
            </p>
            <div className="bg-muted/50 rounded-2xl p-6 text-right mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{selectedServiceData?.name}</span>
                  <span className="text-muted-foreground">{t.booking.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{selectedDate && format(selectedDate, "d MMMM yyyy", { locale: dateLocale })}</span>
                  <span className="text-muted-foreground">{t.booking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{selectedTime}</span>
                  <span className="text-muted-foreground">{t.booking.time}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t.booking.confirmationSent.replace("{email}", formData.email)}
            </p>
            <Button 
              size="lg" 
              onClick={handleClose}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {t.booking.done}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right">{t.booking.title}</DialogTitle>
          <DialogDescription className="text-right">
            {t.booking.subtitle}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4" dir="ltr">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  step >= s
                    ? "hero-gradient text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-16 h-1 rounded-full transition-all",
                    step > s ? "hero-gradient" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-right">{t.booking.selectService}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-right transition-all group hover:border-primary/50",
                    selectedService === service.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.duration} {t.booking.duration}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-start pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {t.booking.continue}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-right">{t.booking.selectDate}</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal h-12 rounded-xl flex-row-reverse",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: dateLocale }) : t.booking.pickDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date() || date.getDay() === 0
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-right">{t.booking.selectTime}</h3>
              {isLoadingSlots || isCheckingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="mr-2 text-muted-foreground">{t.booking.checkingAvailability}</span>
                </div>
              ) : clinicClosed ? (
                <div className="text-center py-8 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-500" />
                  <p className="font-semibold text-foreground mb-1">
                    {language === 'ar' ? 'غير متاح' : 'Not Available'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {unavailableReason || (language === 'ar' ? 'لا يوجد أطباء متاحين في هذا اليوم' : 'No doctors available on this day')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="border-amber-500 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950"
                  >
                    <ListPlus className="w-4 h-4 ml-2" />
                    {t.booking.joinWaitlistButton}
                  </Button>
                </div>
              ) : allSlotsBooked ? (
                <div className="text-center py-8 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
                  <p className="font-semibold text-foreground mb-1">{t.booking.noSlotsTitle}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t.booking.noSlotsDescription}</p>
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="border-amber-500 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950"
                  >
                    <ListPlus className="w-4 h-4 ml-2" />
                    {t.booking.joinWaitlistButton}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isOutsideWorkingHours = !doctorAvailableSlots.includes(time);
                    const isDisabled = isBooked || isOutsideWorkingHours;
                    return (
                      <button
                        key={time}
                        onClick={() => !isDisabled && setSelectedTime(time)}
                        disabled={isDisabled}
                        className={cn(
                          "py-3 px-3 rounded-xl border text-sm font-medium transition-all",
                          isDisabled
                            ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            : selectedTime === time
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "border-border hover:border-primary/50 hover:bg-muted/50",
                          isBooked && "line-through"
                        )}
                        title={isOutsideWorkingHours ? (language === 'ar' ? 'خارج ساعات العمل' : 'Outside working hours') : isBooked ? (language === 'ar' ? 'محجوز' : 'Booked') : ''}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
              {bookedSlots.length > 0 && availableSlots.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1 flex-row-reverse justify-end">
                  <AlertCircle className="h-3 w-3" />
                  {t.booking.bookedSlotsNote}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4 flex-row-reverse">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                {t.booking.back}
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!allSlotsBooked && !clinicClosed && !canProceedStep2}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {allSlotsBooked ? t.booking.continueToWaitlist : t.booking.continue}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Patient Information */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-right">
              {allSlotsBooked ? t.booking.joinWaitlistTitle : t.booking.yourInfo}
            </h3>
            
            {allSlotsBooked && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300 text-right">
                  {t.booking.waitlistNote.replace("{date}", selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: dateLocale }) : "")}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2 font-medium flex-row-reverse justify-end">
                  <User className="w-4 h-4 text-primary" /> {t.booking.fullName}
                </Label>
                <Input
                  id="name"
                  placeholder={t.booking.namePlaceholder}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 rounded-xl text-right"
                  dir="rtl"
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1 text-right">{formErrors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2 font-medium flex-row-reverse justify-end">
                  <Mail className="w-4 h-4 text-primary" /> {t.booking.emailAddress}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.booking.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 rounded-xl text-left"
                  dir="ltr"
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive mt-1 text-right">{formErrors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2 font-medium flex-row-reverse justify-end">
                  <Phone className="w-4 h-4 text-primary" /> {t.booking.phoneNumber}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t.booking.phonePlaceholder}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 rounded-xl text-left"
                  dir="ltr"
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive mt-1 text-right">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes" className="flex items-center gap-2 mb-2 font-medium flex-row-reverse justify-end">
                  <FileText className="w-4 h-4 text-primary" /> {t.booking.additionalNotes}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={t.booking.notesPlaceholder}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="rounded-xl text-right"
                  dir="rtl"
                  maxLength={500}
                />
                {formErrors.notes && (
                  <p className="text-sm text-destructive mt-1 text-right">{formErrors.notes}</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-2xl p-5 mt-6">
              <h4 className="font-semibold text-foreground mb-3 text-right">
                {allSlotsBooked ? t.booking.waitlistRequest : t.booking.appointmentSummary}
              </h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 flex-row-reverse justify-end">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{t.booking.service}</span>
                  <span className="font-medium">{selectedServiceData?.name}</span>
                </p>
                <p className="flex items-center gap-2 flex-row-reverse justify-end">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{allSlotsBooked ? t.booking.preferredDate : t.booking.date}</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "d MMMM yyyy", { locale: dateLocale })}</span>
                </p>
                {!allSlotsBooked && selectedTime && (
                  <p className="flex items-center gap-2 flex-row-reverse justify-end">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{t.booking.time}</span>
                    <span className="font-medium">{selectedTime}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 flex-row-reverse">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                {t.booking.back}
              </Button>
              <Button
                onClick={allSlotsBooked ? handleJoinWaitlist : handleSubmit}
                disabled={!canProceedStep3 || isSubmitting}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {allSlotsBooked ? t.booking.joining : t.booking.booking}
                  </>
                ) : (
                  allSlotsBooked ? t.booking.joinWaitlist : t.booking.confirmBooking
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;