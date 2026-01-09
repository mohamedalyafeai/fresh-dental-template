import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, User, Stethoscope, Phone, Award, Save, BadgeCheck } from 'lucide-react';

interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string | null;
  bio: string | null;
  phone: string | null;
  years_experience: number;
  badge_number: string | null;
  avatar_url: string | null;
  is_available: boolean;
}

const DoctorProfilePage = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    specialty: '',
    bio: '',
    phone: '',
    years_experience: 0,
    is_available: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth?role=doctor');
      } else if (!isAdmin) {
        toast({
          title: 'غير مصرح',
          description: 'هذه الصفحة مخصصة للأطباء فقط',
          variant: 'destructive',
        });
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchProfile();
    }
  }, [user, isAdmin]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          specialty: data.specialty || '',
          bio: data.bio || '',
          phone: data.phone || '',
          years_experience: data.years_experience || 0,
          is_available: data.is_available ?? true,
        });
      } else {
        // Create new profile if doesn't exist
        const badgeNumber = `DR-${Date.now().toString(36).toUpperCase()}`;
        const { data: newProfile, error: insertError } = await supabase
          .from('doctor_profiles')
          .insert({
            user_id: user.id,
            badge_number: badgeNumber,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الملف الشخصي',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({
          specialty: formData.specialty || null,
          bio: formData.bio || null,
          phone: formData.phone || null,
          years_experience: formData.years_experience,
          is_available: formData.is_available,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث الملف الشخصي بنجاح',
      });
      
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ التغييرات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const specialties = [
    'طبيب أسنان عام',
    'أخصائي تقويم',
    'أخصائي زراعة',
    'أخصائي علاج الجذور',
    'أخصائي تركيبات',
    'أخصائي لثة',
    'جراح الفم والوجه',
    'طبيب أسنان أطفال',
    'طبيب تجميل الأسنان',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30" dir="rtl">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">الملف الشخصي للطبيب</h1>
                <p className="text-sm text-muted-foreground">تحديث معلوماتك وتخصصك</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              العودة للوحة التحكم
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Badge Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary rounded-2xl">
                  <BadgeCheck className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الشارة الطبية</p>
                  <p className="text-2xl font-bold text-primary font-mono tracking-wider">
                    {profile?.badge_number || 'غير محدد'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلومات الطبيب
              </CardTitle>
              <CardDescription>
                أكمل ملفك الشخصي ليظهر للمرضى عند حجز المواعيد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Specialty */}
              <div className="space-y-2">
                <Label>التخصص</Label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">اختر التخصص</option>
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Years of Experience */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  سنوات الخبرة
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+966 5XX XXX XXXX"
                  dir="ltr"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label>نبذة عنك</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="اكتب نبذة مختصرة عن خبراتك ومؤهلاتك..."
                  rows={4}
                />
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium">متاح للمواعيد</p>
                  <p className="text-sm text-muted-foreground">
                    عند التعطيل، لن يتمكن المرضى من اختيارك للمواعيد الجديدة
                  </p>
                </div>
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfilePage;
