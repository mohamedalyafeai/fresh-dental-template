import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingModal from "./BookingModal";

const Footer = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <>
      <footer id="contact" className="bg-foreground text-background">
        {/* CTA Section */}
        <div className="container mx-auto px-4">
          <div className="py-16 border-b border-background/10">
            <div className="hero-gradient rounded-3xl p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready for Your Best Smile?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
                Schedule your appointment today and take the first step towards a healthier, more confident smile.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="secondary"
                  size="xl"
                  className="bg-background text-foreground hover:bg-background/90"
                  onClick={() => setIsBookingOpen(true)}
                >
                  Book Appointment
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                >
                  Call Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 hero-gradient rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">B</span>
                </div>
                <span className="text-xl font-semibold">BrightSmile</span>
              </div>
              <p className="text-background/60 mb-6">
                Providing exceptional dental care for the whole family since 2003. Your smile is our priority.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Quick Links</h3>
              <ul className="space-y-4">
                {["Home", "About Us", "Services", "Book Now"].map((link) => (
                  <li key={link}>
                    <a href={link === "Book Now" ? "#" : `#${link.toLowerCase().replace(" ", "")}`} className="text-background/60 hover:text-background transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Services</h3>
              <ul className="space-y-4">
                {["General Dentistry", "Teeth Whitening", "Root Canals", "Emergency Care", "Cosmetic Dentistry"].map((service) => (
                  <li key={service}>
                    <a href="#services" className="text-background/60 hover:text-background transition-colors">
                      {service}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-background/60">
                    123 Dental Avenue<br />
                    Suite 100<br />
                    New York, NY 10001
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                  <a href="tel:+12345678900" className="text-background/60 hover:text-background transition-colors">
                    +1 (234) 567-8900
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                  <a href="mailto:info@brightsmile.com" className="text-background/60 hover:text-background transition-colors">
                    info@brightsmile.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-background/60">
                    <p>Mon - Fri: 8:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 2:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-background/60 text-sm">
                © 2024 BrightSmile Dental. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-background/60 hover:text-background transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-background/60 hover:text-background transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-background/60 hover:text-background transition-colors">
                  Accessibility
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </>
  );
};

export default Footer;
