import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TestimonialsSection = () => {
  const { t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      key: 'testimonial1',
      avatar: isRTL ? 'ج.آ' : 'JA',
    },
    {
      key: 'testimonial2',
      avatar: isRTL ? 'م.ط' : 'MT',
    },
    {
      key: 'testimonial3',
      avatar: isRTL ? 'س.ت' : 'SC',
    },
    {
      key: 'testimonial4',
      avatar: isRTL ? 'ر.و' : 'RW',
    },
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonialKey = testimonials[currentIndex].key as keyof typeof t.testimonials;
  const currentTestimonial = t.testimonials[currentTestimonialKey] as { name: string; role: string; content: string };

  const trustIndicators = [
    { value: "4.9/5", labelKey: 'averageRating' as const },
    { value: "500+", labelKey: 'fiveStarReviews' as const },
    { value: "10K+", labelKey: 'happyPatients' as const },
    { value: "99%", labelKey: 'recommendUs' as const },
  ];

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-card relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 ${isRTL ? 'right-10' : 'left-10'} w-64 h-64 bg-primary/5 rounded-full blur-3xl`} />
        <div className={`absolute bottom-20 ${isRTL ? 'left-10' : 'right-10'} w-64 h-64 bg-accent/5 rounded-full blur-3xl`} />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            {t.testimonials.badge}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.testimonials.title} <span className="text-gradient">{t.testimonials.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.testimonials.subtitle}
          </p>
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-background rounded-3xl p-8 md:p-12 card-shadow-xl border border-border/50">
            {/* Quote Icon */}
            <div className={`absolute -top-6 ${isRTL ? 'right-8' : 'left-8'} w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center shadow-lg`}>
              <Quote className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="relative pt-4">
              {/* Stars */}
              <div className={`flex gap-1 mb-6 ${isRTL ? 'justify-end' : ''}`}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed mb-8 font-medium">
                "{currentTestimonial.content}"
              </blockquote>

              {/* Author */}
              <div className={`flex items-center justify-between flex-wrap gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-semibold text-foreground text-lg">
                      {currentTestimonial.name}
                    </p>
                    <p className="text-muted-foreground">
                      {currentTestimonial.role}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevious}
                    className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-primary/30 transition-all duration-300"
                    aria-label={t.testimonials.previousTestimonial}
                  >
                    <ChevronLeft className={`w-5 h-5 text-foreground ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-primary/30 transition-all duration-300"
                    aria-label={t.testimonials.nextTestimonial}
                  >
                    <ChevronRight className={`w-5 h-5 text-foreground ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-gradient-to-r from-primary to-accent"
                      : "w-2 bg-border hover:bg-muted-foreground"
                  }`}
                  aria-label={`${t.testimonials.goToTestimonial} ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          {trustIndicators.map((stat) => (
            <div key={stat.labelKey} className="text-center p-4 rounded-2xl bg-background/50 border border-border/50">
              <p className="text-2xl md:text-3xl font-bold text-gradient mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{t.testimonials[stat.labelKey]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
