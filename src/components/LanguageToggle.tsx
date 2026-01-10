import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-9 w-9"
      title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <span className="text-sm font-semibold">
        {language === 'ar' ? 'EN' : 'ع'}
      </span>
      <span className="sr-only">
        {language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      </span>
    </Button>
  );
};
