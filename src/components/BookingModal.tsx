import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, FileText, Check, AlertCircle, Loader2, ListPlus } from "lucide-react";
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

const services = [
  { id: "general", name: "General Dentistry", duration: "30 min", icon: "🦷" },
  { id: "whitening", name: "Teeth Whitening", duration: "60 min", icon: "✨" },
  { id: "rootcanal", name: "Root Canal Therapy", duration: "90 min", icon: "🔧" },
  { id: "emergency", name: "Emergency Care", duration: "45 min", icon: "🚨" },
  { id: "crowns", name: "Dental Crowns", duration: "60 min", icon: "👑" },
  { id: "cosmetic", name: "Cosmetic Dentistry", duration: "45 min", icon: "💎" },
];

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal = ({ isOpen, onClose }: BookingModalProps) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isWaitlistConfirmed, setIsWaitlistConfirmed] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const { toast } = useToast();

  // Fetch booked slots when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate) {
        setBookedSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("appointment_time")
          .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
          .neq("status", "cancelled");

        if (error) throw error;

        const slots = data?.map(apt => apt.appointment_time) || [];
        setBookedSlots(slots);
        
        if (selectedTime && slots.includes(selectedTime)) {
          setSelectedTime(null);
        }
      } catch (error) {
        console.error("Error fetching booked slots:", error);
        setBookedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate]);

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
        title: "Added to Waiting List!",
        description: "We'll contact you if a slot becomes available.",
      });
    } catch (error) {
      console.error("Waitlist error:", error);
      toast({
        title: "Failed to Join Waiting List",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
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
          title: "Time Slot Unavailable",
          description: "This time slot was just booked by someone else. Please select a different time.",
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
            appointmentDate: format(selectedDate, "MMMM d, yyyy"),
            appointmentTime: selectedTime,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      setIsConfirmed(true);
      toast({
        title: "Appointment Booked!",
        description: "We've sent you a confirmation email.",
      });
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Something went wrong. Please try again.",
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
  const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
  const allSlotsBooked = selectedDate && !isLoadingSlots && availableSlots.length === 0;

  // Waitlist confirmation screen
  if (isWaitlistConfirmed) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
              <ListPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Added to Waiting List!</h2>
            <p className="text-muted-foreground mb-6">
              We'll notify you when a slot becomes available.
            </p>
            <div className="bg-muted/50 rounded-2xl p-6 text-left mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium text-foreground">{selectedServiceData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred Date:</span>
                  <span className="font-medium text-foreground">{selectedDate && format(selectedDate, "MMMM d, yyyy")}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              We'll contact you at {formData.email} when a slot opens up.
            </p>
            <Button 
              size="lg" 
              onClick={handleClose}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isConfirmed) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-8">
            <div className="w-20 h-20 hero-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25 animate-scale-in">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Appointment Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for booking with BrightSmile Dental.
            </p>
            <div className="bg-muted/50 rounded-2xl p-6 text-left mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium text-foreground">{selectedServiceData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{selectedDate && format(selectedDate, "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium text-foreground">{selectedTime}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email has been sent to {formData.email}
            </p>
            <Button 
              size="lg" 
              onClick={handleClose}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Book an Appointment</DialogTitle>
          <DialogDescription>
            Schedule your visit in just a few steps
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
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
            <h3 className="font-semibold text-lg">Select a Service</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all group hover:border-primary/50",
                    selectedService === service.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.duration}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Select Date</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 rounded-xl",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Pick a date"}
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
              <h3 className="font-semibold text-lg mb-3">Select Time</h3>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Checking availability...</span>
                </div>
              ) : allSlotsBooked ? (
                <div className="text-center py-8 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
                  <p className="font-semibold text-foreground mb-1">No available slots for this date</p>
                  <p className="text-sm text-muted-foreground mb-4">All time slots are booked. You can join the waiting list or select a different date.</p>
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="border-amber-500 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950"
                  >
                    <ListPlus className="w-4 h-4 mr-2" />
                    Join Waiting List
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => !isBooked && setSelectedTime(time)}
                        disabled={isBooked}
                        className={cn(
                          "py-3 px-3 rounded-xl border text-sm font-medium transition-all",
                          isBooked
                            ? "border-border bg-muted text-muted-foreground cursor-not-allowed line-through opacity-50"
                            : selectedTime === time
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
              {bookedSlots.length > 0 && availableSlots.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Crossed out times are already booked
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!allSlotsBooked && !canProceedStep2}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {allSlotsBooked ? "Continue to Waitlist" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Patient Information */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {allSlotsBooked ? "Join Waiting List" : "Your Information"}
            </h3>
            
            {allSlotsBooked && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You're joining the waiting list for {selectedDate && format(selectedDate, "MMMM d, yyyy")}. 
                  We'll contact you if a slot becomes available.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2 font-medium">
                  <User className="w-4 h-4 text-primary" /> Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2 font-medium">
                  <Mail className="w-4 h-4 text-primary" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2 font-medium">
                  <Phone className="w-4 h-4 text-primary" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="flex items-center gap-2 mb-2 font-medium">
                  <FileText className="w-4 h-4 text-primary" /> Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific concerns or requests..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-2xl p-5 mt-6">
              <h4 className="font-semibold text-foreground mb-3">
                {allSlotsBooked ? "Waiting List Request" : "Appointment Summary"}
              </h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{selectedServiceData?.name}</span>
                </p>
                <p className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{allSlotsBooked ? "Preferred Date:" : "Date:"}</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "MMMM d, yyyy")}</span>
                </p>
                {!allSlotsBooked && selectedTime && (
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={allSlotsBooked ? handleJoinWaitlist : handleSubmit}
                disabled={!canProceedStep3 || isSubmitting}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {allSlotsBooked ? "Joining..." : "Booking..."}
                  </>
                ) : (
                  allSlotsBooked ? "Join Waiting List" : "Confirm Booking"
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