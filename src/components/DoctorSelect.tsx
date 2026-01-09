import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope } from 'lucide-react';

interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string | null;
  badge_number: string | null;
  is_available: boolean;
  years_experience: number;
}

interface DoctorWithName extends DoctorProfile {
  name: string;
  email: string;
}

interface DoctorSelectProps {
  value?: string;
  onValueChange: (doctorId: string | undefined) => void;
  disabled?: boolean;
}

export const DoctorSelect = ({ value, onValueChange, disabled }: DoctorSelectProps) => {
  const [doctors, setDoctors] = useState<DoctorWithName[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      // Fetch available doctor profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('is_available', true);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setDoctors([]);
        return;
      }

      // Fetch user info for each doctor
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(userRoles?.map(r => r.user_id) || []);

      // Fetch profiles for admin users
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', profiles.map(p => p.user_id));

      if (profileError) throw profileError;

      // Combine data
      const doctorsWithNames: DoctorWithName[] = profiles
        .filter(p => adminUserIds.has(p.user_id))
        .map(profile => {
          const userProfile = userProfiles?.find(up => up.user_id === profile.user_id);
          return {
            ...profile,
            name: userProfile?.full_name || 'طبيب',
            email: userProfile?.email || '',
          };
        });

      setDoctors(doctorsWithNames);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">جاري تحميل الأطباء...</span>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Stethoscope className="h-4 w-4" />
        <span>لا يوجد أطباء متاحين حالياً</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={(v) => onValueChange(v === 'none' ? undefined : v)} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="اختر الطبيب المعالج" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">بدون طبيب محدد</span>
        </SelectItem>
        {doctors.map((doctor) => (
          <SelectItem key={doctor.id} value={doctor.user_id}>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-medium">{doctor.name}</span>
              {doctor.specialty && (
                <Badge variant="secondary" className="text-xs">
                  {doctor.specialty}
                </Badge>
              )}
              {doctor.badge_number && (
                <span className="text-xs text-muted-foreground font-mono">
                  {doctor.badge_number}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
