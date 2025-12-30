import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Star, Shield, Award, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-smile.jpg";
import BookingModal from "./BookingModal";

const HeroSection = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Smiling patient with perfect teeth"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card/98 via-card/85 to-card/40" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-gradient-to-tl from-accent/15 to-primary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-5 py-2.5 rounded-full mb-8 animate-fade-in border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Trusted by 10,000+ Patients</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Your Smile Deserves{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Expert Care</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed animate-fade-in-up max-w-xl" style={{ animationDelay: "0.2s" }}>
            Experience exceptional dental care in a comfortable, modern environment. 
            Our team of specialists is dedicated to giving you the healthy, beautiful smile you deserve.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg" 
              onClick={() => setIsBookingOpen(true)}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/25 text-base font-semibold h-14 px-8 rounded-2xl"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-14 px-8 rounded-2xl text-base font-semibold border-2 hover:bg-muted/50"
            >
              Learn More
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">4.9 Rating</p>
                <p className="text-sm text-muted-foreground">500+ Reviews</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">20+ Years</p>
                <p className="text-sm text-muted-foreground">Experience</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Certified</p>
                <p className="text-sm text-muted-foreground">Specialists</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </section>
  );
};

export default HeroSection;