import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, FileText, Check } from "lucide-react";
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
  { id: "general", name: "General Dentistry", duration: "30 min" },
  { id: "whitening", name: "Teeth Whitening", duration: "60 min" },
  { id: "rootcanal", name: "Root Canal Therapy", duration: "90 min" },
  { id: "emergency", name: "Emergency Care", duration: "45 min" },
  { id: "crowns", name: "Dental Crowns", duration: "60 min" },
  { id: "cosmetic", name: "Cosmetic Dentistry", duration: "45 min" },
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
  const { toast } = useToast();

  const resetForm = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setFormData({ name: "", email: "", phone: "", notes: "" });
    setIsConfirmed(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    setIsSubmitting(true);
    
    try {
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

      setIsConfirmed(true);
      toast({
        title: "Appointment Booked!",
        description: "We'll send you a confirmation email shortly.",
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

  if (isConfirmed) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-8">
            <div className="w-20 h-20 hero-gradient rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Appointment Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for booking with BrightSmile Dental.
            </p>
            <div className="bg-muted rounded-xl p-6 text-left mb-6">
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
            <Button variant="hero" size="lg" onClick={handleClose}>
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
          <DialogTitle className="text-2xl">Book an Appointment</DialogTitle>
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
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step >= s
                    ? "hero-gradient text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 h-1 rounded-full",
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
                    "p-4 rounded-xl border-2 text-left transition-all",
                    selectedService === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <p className="font-medium text-foreground">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.duration}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="hero"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
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
                      "w-full justify-start text-left font-normal h-12",
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                      selectedTime === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="hero"
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Patient Information */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Information</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" /> Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" /> Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific concerns or requests..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted rounded-xl p-4 mt-6">
              <h4 className="font-medium text-foreground mb-2">Appointment Summary</h4>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{selectedServiceData?.name}</span>
                </p>
                <p className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "MMMM d, yyyy")}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={!canProceedStep3 || isSubmitting}
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
