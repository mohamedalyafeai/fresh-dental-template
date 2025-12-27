import { Sparkles, Stethoscope, Siren, Heart, Crown, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Stethoscope,
    title: "General Dentistry",
    description: "Comprehensive exams, cleanings, fillings, and preventive care to keep your smile healthy.",
    features: ["Regular Checkups", "Professional Cleaning", "Dental Fillings", "X-Rays & Diagnosis"],
  },
  {
    icon: Sparkles,
    title: "Teeth Whitening",
    description: "Professional whitening treatments for a brighter, more confident smile.",
    features: ["In-Office Whitening", "Take-Home Kits", "Long-Lasting Results", "Safe & Effective"],
  },
  {
    icon: Heart,
    title: "Root Canal Therapy",
    description: "Gentle root canal treatments to save damaged teeth and relieve pain.",
    features: ["Pain-Free Procedure", "Tooth Preservation", "Advanced Technology", "Quick Recovery"],
  },
  {
    icon: Siren,
    title: "Emergency Care",
    description: "Same-day emergency appointments for urgent dental issues and injuries.",
    features: ["Same-Day Service", "Trauma Care", "Pain Relief", "24/7 Availability"],
  },
  {
    icon: Crown,
    title: "Dental Crowns",
    description: "Custom-made crowns and bridges to restore damaged or missing teeth.",
    features: ["Natural Appearance", "Durable Materials", "Perfect Fit", "Quick Turnaround"],
  },
  {
    icon: Smile,
    title: "Cosmetic Dentistry",
    description: "Veneers, bonding, and smile makeovers for your dream smile.",
    features: ["Porcelain Veneers", "Dental Bonding", "Smile Design", "Full Makeovers"],
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider mb-4 block">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Complete Dental Care
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From routine cleanings to advanced procedures, we offer a full range of dental services 
            to meet all your oral health needs under one roof.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group bg-card rounded-2xl p-8 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 hero-gradient rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <service.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="xl">
            View All Services
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
