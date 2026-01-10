import { Sparkles, Stethoscope, Siren, Heart, Crown, Smile, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const ServicesSection = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    {
      icon: Stethoscope,
      titleKey: 'generalDentistry' as const,
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Sparkles,
      titleKey: 'teethWhitening' as const,
      color: "from-amber-400 to-orange-500",
    },
    {
      icon: Heart,
      titleKey: 'rootCanal' as const,
      color: "from-rose-500 to-pink-600",
    },
    {
      icon: Siren,
      titleKey: 'emergencyCare' as const,
      color: "from-red-500 to-red-600",
    },
    {
      icon: Crown,
      titleKey: 'dentalCrowns' as const,
      color: "from-purple-500 to-violet-600",
    },
    {
      icon: Smile,
      titleKey: 'cosmeticDentistry' as const,
      color: "from-teal-400 to-emerald-500",
    },
  ];

  return (
    <section id="services" className="py-20 md:py-28 bg-background relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 ${isRTL ? '-left-40' : '-right-40'} w-80 h-80 bg-primary/5 rounded-full blur-3xl`} />
        <div className={`absolute -bottom-40 ${isRTL ? '-right-40' : '-left-40'} w-80 h-80 bg-accent/5 rounded-full blur-3xl`} />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            {t.servicesSection.badge}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.servicesSection.title}{" "}
            <span className="text-gradient">{t.servicesSection.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.servicesSection.subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const serviceData = t.servicesSection[service.titleKey];
            return (
              <div
                key={service.titleKey}
                className="group bg-card rounded-2xl p-8 card-shadow hover:card-shadow-hover transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-primary/20"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon with gradient background */}
                <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {serviceData.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {serviceData.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {serviceData.features.map((feature: string) => (
                    <li key={feature} className={`flex items-center gap-3 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Learn more link */}
                <a 
                  href="#contact" 
                  className={`inline-flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {t.servicesSection.learnMore}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </a>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25 rounded-xl px-8"
          >
            {t.servicesSection.viewAllServices}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
