import { Sparkles, Award, Users, Clock, ShieldCheck } from "lucide-react";
import dentist1 from "@/assets/dentist-1.jpg";
import dentist2 from "@/assets/dentist-2.jpg";
import hygienist1 from "@/assets/hygienist-1.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutSection = () => {
  const { t, isRTL } = useLanguage();

  const teamMembers = [
    {
      name: t.about.doctor1Name,
      role: t.about.doctor1Role,
      image: dentist1,
      description: t.about.doctor1Desc,
      specialties: [t.about.implants, t.about.cosmetic],
    },
    {
      name: t.about.doctor2Name,
      role: t.about.doctor2Role,
      image: dentist2,
      description: t.about.doctor2Desc,
      specialties: [t.about.invisalign, t.about.braces],
    },
    {
      name: t.about.doctor3Name,
      role: t.about.doctor3Role,
      image: hygienist1,
      description: t.about.doctor3Desc,
      specialties: [t.about.cleaning, t.about.prevention],
    },
  ];

  const stats = [
    { icon: Users, value: "10K+", label: t.about.happyPatients },
    { icon: Award, value: "20+", label: t.about.yearsExperience },
    { icon: Clock, value: "15+", label: t.about.expertStaff },
    { icon: ShieldCheck, value: "98%", label: t.about.satisfactionRate },
  ];

  const features = [
    t.about.feature1,
    t.about.feature2,
    t.about.feature3,
    t.about.feature4,
  ];

  return (
    <section id="about" className="py-20 md:py-28 bg-card relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            {t.about.badge}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.about.title} <span className="text-gradient">{t.about.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.about.subtitle}
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className="group bg-background rounded-3xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-72 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                
                {/* Specialties badges */}
                <div className={`absolute bottom-4 ${isRTL ? 'right-4' : 'left-4'} flex gap-2`}>
                  {member.specialties.map((specialty) => (
                    <span 
                      key={specialty} 
                      className="px-3 py-1 rounded-full bg-white/90 text-xs font-medium text-foreground backdrop-blur-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {member.name}
                </h3>
                <p className="text-primary font-medium text-sm mb-3">
                  {member.role}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {member.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-3xl p-8 md:p-12 border border-border/50">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                {t.about.missionTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4 text-lg">
                {t.about.missionPara1}
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {t.about.missionPara2}
              </p>
              
              {/* Features list */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card rounded-2xl p-6 text-center card-shadow hover:card-shadow-hover transition-all duration-300 group">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl hero-gradient flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.value}</p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
