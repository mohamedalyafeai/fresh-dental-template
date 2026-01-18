import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Stethoscope, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { t } from '@/lib/translations';

interface DoctorRequest {
  id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

const SPECIALTIES = [
  { value: 'general', label: t.doctorBadges.generalDentist },
  { value: 'orthodontist', label: t.doctorBadges.orthodontist },
  { value: 'implant', label: t.doctorBadges.implantSpecialist },
  { value: 'endodontist', label: t.doctorBadges.endodontist },
  { value: 'prosthodontist', label: t.doctorBadges.prosthodontist },
  { value: 'periodontist', label: t.doctorBadges.periodontist },
  { value: 'oralSurgeon', label: t.doctorBadges.oralSurgeon },
  { value: 'pediatric', label: t.doctorBadges.pediatricDentist },
  { value: 'cosmetic', label: t.doctorBadges.cosmeticDentist },
];

const DoctorApplicationForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [existingRequest, setExistingRequest] = useState<DoctorRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [specialty, setSpecialty] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    fetchExistingRequest();
  }, [user]);

  const fetchExistingRequest = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingRequest(data);
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Get user profile for name and email
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('doctor_requests')
        .insert({
          user_id: user.id,
          full_name: profile?.full_name || user.email || '',
          email: profile?.email || user.email || '',
          specialty: SPECIALTIES.find(s => s.value === specialty)?.label || specialty,
          years_experience: parseInt(yearsExperience) || 0,
          badge_number: badgeNumber,
          bio: bio,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: t.owner.requestSubmitted,
        description: t.owner.requestSubmittedDesc,
      });

      fetchExistingRequest();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: t.common.error,
        description: 'فشل في إرسال الطلب',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 ml-1" />{t.owner.pending}</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 ml-1" />{t.owner.approved}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />{t.owner.rejected}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show existing request status
  if (existingRequest) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t.owner.requestStatus}</CardTitle>
              <CardDescription>{t.owner.becomeDoctorDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{t.owner.status}:</span>
              {getStatusBadge(existingRequest.status)}
            </div>
            
            {existingRequest.status === 'pending' && (
              <p className="text-sm text-muted-foreground bg-yellow-500/10 p-4 rounded-lg">
                {t.owner.alreadyRequested}
              </p>
            )}
            
            {existingRequest.status === 'rejected' && existingRequest.rejection_reason && (
              <div className="bg-destructive/10 p-4 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-1">سبب الرفض:</p>
                <p className="text-sm text-muted-foreground">{existingRequest.rejection_reason}</p>
              </div>
            )}
            
            {existingRequest.status === 'approved' && (
              <p className="text-sm text-green-600 bg-green-500/10 p-4 rounded-lg">
                تمت الموافقة على طلبك! أنت الآن طبيب في العيادة.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show application form
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>{t.owner.becomeDoctor}</CardTitle>
            <CardDescription>{t.owner.becomeDoctorDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.doctorProfile.specialty}</label>
              <Select value={specialty} onValueChange={setSpecialty} required>
                <SelectTrigger>
                  <SelectValue placeholder={t.doctorProfile.selectSpecialty} />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.doctorProfile.yearsExperience}</label>
              <Input
                type="number"
                min="0"
                max="50"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="5"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.doctorProfile.badgeNumber}</label>
            <Input
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="DR-12345"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.doctorProfile.bio}</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.doctorProfile.bioPlaceholder}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Send className="h-4 w-4 ml-2" />
            )}
            {t.owner.submitRequest}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DoctorApplicationForm;
