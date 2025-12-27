import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Jennifer Adams",
    role: "Patient for 5 years",
    content: "I've been coming to BrightSmile for years and couldn't be happier. The staff is always friendly, the office is immaculate, and Dr. Roberts truly cares about his patients. My whole family comes here now!",
    rating: 5,
  },
  {
    name: "Marcus Thompson",
    role: "First-time patient",
    content: "I was terrified of dentists, but the team here made me feel completely at ease. They explained everything before doing it and checked on me constantly. I actually look forward to my appointments now!",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    role: "Invisalign Patient",
    content: "Dr. Mitchell did an amazing job with my Invisalign treatment. She was thorough, professional, and my teeth look incredible now. Worth every penny! The results exceeded my expectations.",
    rating: 5,
  },
  {
    name: "Robert Williams",
    role: "Emergency Patient",
    content: "Had a dental emergency on a weekend and they got me in within an hour. The care was exceptional and they followed up multiple times to check on me. This is what healthcare should be.",
    rating: 5,
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
    <section id="testimonials" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider mb-4 block">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What Our Patients Say
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Don't just take our word for it. Here's what our patients have to say about their experience at BrightSmile Dental.
          </p>
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-background rounded-3xl p-8 md:p-12 card-shadow">
            {/* Quote Icon */}
            <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Quote className="w-8 h-8 text-primary" />
            </div>

            {/* Content */}
            <div className="relative">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed mb-8">
                "{testimonials[currentIndex].content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-lg">
                    {testimonials[currentIndex].name}
                  </p>
                  <p className="text-muted-foreground">
                    {testimonials[currentIndex].role}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevious}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
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
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "bg-border hover:bg-muted-foreground"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
