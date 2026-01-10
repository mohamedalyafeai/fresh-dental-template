import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Shield, User, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BookingModal from "./BookingModal";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { t, isRTL } = useLanguage();

  const navLinks = [
    { name: t.header.home, href: "#home" },
    { name: t.header.about, href: "#about" },
    { name: t.header.services, href: "#services" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-3 group">
              <div className="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                BrightSmile
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />
              
              <a href="tel:+12345678900" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-muted/50">
                <Phone className="w-4 h-4" />
                <span className="font-medium">+1 (234) 567-8900</span>
              </a>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="default" className="gap-2">
                      <User className="w-4 h-4" />
                      {t.header.account}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                            <Shield className="w-4 h-4" />
                            {t.header.adminDashboard}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/portal" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        {t.header.myAppointments}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                      {t.header.signOut}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth?role=patient">
                  <Button variant="outline" size="default" className="gap-2">
                    <User className="w-4 h-4" />
                    {t.header.signIn}
                  </Button>
                </Link>
              )}
              
              <Button 
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 font-semibold" 
                size="default" 
                onClick={() => setIsBookingOpen(true)}
              >
                {t.header.bookAppointment}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium py-3 px-2 rounded-lg hover:bg-muted/50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="pt-4 flex flex-col gap-3 border-t border-border/50 mt-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground font-medium">{t.header.theme}</span>
                    <div className="flex gap-2">
                      <LanguageToggle />
                      <ThemeToggle />
                    </div>
                  </div>
                  
                  <a href="tel:+12345678900" className="flex items-center gap-2 text-muted-foreground py-2">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">+1 (234) 567-8900</span>
                  </a>
                  
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" size="lg" className="w-full gap-2">
                            <Shield className="w-4 h-4" />
                            {t.header.adminDashboard}
                          </Button>
                        </Link>
                      )}
                      <Link to="/portal" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="lg" className="w-full gap-2">
                          <User className="w-4 h-4" />
                          {t.header.myAppointments}
                        </Button>
                      </Link>
                      <Button variant="ghost" size="lg" className="w-full text-destructive" onClick={() => signOut()}>
                        {t.header.signOut}
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth?role=patient" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="lg" className="w-full gap-2">
                        <User className="w-4 h-4" />
                        {t.header.signIn}
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 font-semibold" 
                    size="lg" 
                    onClick={() => { setIsBookingOpen(true); setIsMenuOpen(false); }}
                  >
                    {t.header.bookAppointment}
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </>
  );
};

export default Header;
