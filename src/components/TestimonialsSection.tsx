import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote, Sparkles } from "lucide-react";

const testimonials = [
  {
    name: "Jennifer Adams",
    role: "Patient for 5 years",
    content: "I've been coming to BrightSmile for years and couldn't be happier. The staff is always friendly, the office is immaculate, and Dr. Roberts truly cares about his patients. My whole family comes here now!",
    rating: 5,
    avatar: "JA",
  },
  {
    name: "Marcus Thompson",
    role: "First-time patient",
    content: "I was terrified of dentists, but the team here made me feel completely at ease. They explained everything before doing it and checked on me constantly. I actually look forward to my appointments now!",
    rating: 5,
    avatar: "MT",
  },
  {
    name: "Sarah Chen",
    role: "Invisalign Patient",
    content: "Dr. Mitchell did an amazing job with my Invisalign treatment. She was thorough, professional, and my teeth look incredible now. Worth every penny! The results exceeded my expectations.",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Robert Williams",
    role: "Emergency Patient",
    content: "Had a dental emergency on a weekend and they got me in within an hour. The care was exceptional and they followed up multiple times to check on me. This is what healthcare should be.",
    rating: 5,
    avatar: "RW",
  },
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What Our <span className="text-gradient">Patients Say</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Don't just take our word for it. Here's what our patients have to say about their experience at BrightSmile Dental.
          </p>
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-background rounded-3xl p-8 md:p-12 card-shadow-xl border border-border/50">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8 w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center shadow-lg">
              <Quote className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="relative pt-4">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed mb-8 font-medium">
                "{testimonials[currentIndex].content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">
                      {testimonials[currentIndex].name}
                    </p>
                    <p className="text-muted-foreground">
                      {testimonials[currentIndex].role}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevious}
                    className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-primary/30 transition-all duration-300"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-primary/30 transition-all duration-300"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
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
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          {[
            { value: "4.9/5", label: "Average Rating" },
            { value: "500+", label: "5-Star Reviews" },
            { value: "10K+", label: "Happy Patients" },
            { value: "99%", label: "Recommend Us" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-2xl bg-background/50 border border-border/50">
              <p className="text-2xl md:text-3xl font-bold text-gradient mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
