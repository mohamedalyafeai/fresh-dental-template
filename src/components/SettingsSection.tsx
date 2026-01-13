import { Settings, Globe, Moon, Sun, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";

const SettingsSection = () => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

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
    {
      icon: Bell,
      titleKey: 'notifications',
      descriptionKey: 'notificationsDesc',
      action: <Switch />,
    },
    {
      icon: Shield,
      titleKey: 'privacy',
      descriptionKey: 'privacyDesc',
      action: (
        <Button variant="outline" size="sm">
          {t.settings.manage}
        </Button>
      ),
    },
  ];

  return (
    <section id="settings" className="py-20 bg-muted/30 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Settings className="w-4 h-4" />
            {t.settings.badge}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.settings.title}{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t.settings.titleHighlight}
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t.settings.subtitle}
          </p>
        </div>

        {/* Settings Cards */}
        <div className="max-w-3xl mx-auto grid gap-4">
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
    </section>
  );
};

export default SettingsSection;
