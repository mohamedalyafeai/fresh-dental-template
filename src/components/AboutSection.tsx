import dentist1 from "@/assets/dentist-1.jpg";
import dentist2 from "@/assets/dentist-2.jpg";
import hygienist1 from "@/assets/hygienist-1.jpg";

const teamMembers = [
  {
    name: "Dr. Michael Roberts",
    role: "Lead Dentist & Founder",
    image: dentist1,
    description: "20+ years of experience in restorative and cosmetic dentistry.",
  },
  {
    name: "Dr. Sarah Mitchell",
    role: "Orthodontist",
    image: dentist2,
    description: "Specialist in Invisalign and traditional braces treatments.",
  },
  {
    name: "Emma Johnson",
    role: "Dental Hygienist",
    image: hygienist1,
    description: "Passionate about preventive care and patient education.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider mb-4 block">
            About Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Meet Our Expert Team
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            At BrightSmile Dental, we combine cutting-edge technology with compassionate care. 
            Our team of experienced professionals is dedicated to making every visit comfortable and effective.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className="group bg-background rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-72 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-primary font-medium text-sm mb-3">
                  {member.role}
                </p>
                <p className="text-muted-foreground">
                  {member.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="mt-20 bg-muted rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Our Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We believe everyone deserves access to quality dental care. Our mission is to provide 
                exceptional, personalized treatment in a warm and welcoming environment.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                From routine cleanings to complex procedures, we use the latest technology 
                and techniques to ensure the best possible outcomes for our patients.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-6 text-center card-shadow">
                <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">10K+</p>
                <p className="text-muted-foreground">Happy Patients</p>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center card-shadow">
                <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">20+</p>
                <p className="text-muted-foreground">Years Experience</p>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center card-shadow">
                <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">15+</p>
                <p className="text-muted-foreground">Expert Staff</p>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center card-shadow">
                <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">98%</p>
                <p className="text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
