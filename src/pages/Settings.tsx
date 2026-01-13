import { useState, useEffect } from "react";
import { Settings, Globe, Moon, Sun, Bell, Shield, Mail, Calendar, Megaphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SettingsPage = () => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  // Notification preferences (stored in localStorage)
  const [appointmentReminders, setAppointmentReminders] = useState(() => {
    return localStorage.getItem('appointmentReminders') !== 'false';
  });
  const [promotionalEmails, setPromotionalEmails] = useState(() => {
    return localStorage.getItem('promotionalEmails') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('appointmentReminders', String(appointmentReminders));
  }, [appointmentReminders]);

  useEffect(() => {
    localStorage.setItem('promotionalEmails', String(promotionalEmails));
  }, [promotionalEmails]);

  const settingsOptions = [
    {
      icon: Globe,
      titleKey: 'language',
      descriptionKey: 'languageDesc',
      action: (
        <div className="flex gap-2">
          <Button
            variant={language === 'ar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('ar')}
            className="min-w-[70px]"
          >
            العربية
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
            className="min-w-[70px]"
          >
            English
          </Button>
        </div>
      ),
    },
    {
      icon: theme === 'dark' ? Moon : Sun,
      titleKey: 'theme',
      descriptionKey: 'themeDesc',
      action: (
        <div className="flex gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
            className="min-w-[70px]"
          >
            {t.settings.light}
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
            className="min-w-[70px]"
          >
            {t.settings.dark}
          </Button>
        </div>
      ),
    },
  ];

  const emailSettings = [
    {
      icon: Calendar,
      titleKey: 'appointmentReminders',
      descriptionKey: 'appointmentRemindersDesc',
      checked: appointmentReminders,
      onChange: setAppointmentReminders,
    },
    {
      icon: Megaphone,
      titleKey: 'promotionalEmails',
      descriptionKey: 'promotionalEmailsDesc',
      checked: promotionalEmails,
      onChange: setPromotionalEmails,
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Link>

          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Settings className="w-4 h-4" />
              {t.settings.badge}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t.settings.title}{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t.settings.titleHighlight}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t.settings.subtitle}
            </p>
          </div>

          {/* General Settings */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {t.settings.generalSettings}
            </h2>
            <div className="grid gap-4">
              {settingsOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-4 hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {t.settings[option.titleKey as keyof typeof t.settings]}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t.settings[option.descriptionKey as keyof typeof t.settings]}
                        </p>
                      </div>
                    </div>
                    {option.action}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Notification Settings */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {t.settings.emailNotifications}
            </h2>
            <div className="grid gap-4">
              {emailSettings.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-4 hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {t.settings[option.titleKey as keyof typeof t.settings]}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t.settings[option.descriptionKey as keyof typeof t.settings]}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={option.checked} 
                      onCheckedChange={option.onChange}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t.settings.privacySettings}
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-4 hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {t.settings.privacy}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.privacyDesc}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {t.settings.manage}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;
