import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope } from 'lucide-react';

interface DoctorProfile {
  id: string | null;
  user_id: string | null;
  specialty: string | null;
  is_available: boolean | null;
  years_experience: number | null;
}

interface DoctorWithName {
  id: string;
  user_id: string;
  specialty: string | null;
  is_available: boolean;
  years_experience: number;
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
      // Fetch available doctor profiles from public view (excludes phone and badge_number for privacy)
      const { data: profiles, error: profilesError } = await supabase
        .from('public_doctor_profiles')
        .select('id, user_id, specialty, is_available, years_experience');

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
      const validProfiles = profiles.filter(p => p.user_id !== null);
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', validProfiles.map(p => p.user_id!));

      if (profileError) throw profileError;

      // Combine data
      const doctorsWithNames: DoctorWithName[] = validProfiles
        .filter(p => p.user_id && adminUserIds.has(p.user_id))
        .map(profile => {
          const userProfile = userProfiles?.find(up => up.user_id === profile.user_id);
          return {
            ...profile,
            id: profile.id!,
            user_id: profile.user_id!,
            is_available: profile.is_available ?? true,
            years_experience: profile.years_experience ?? 0,
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
              <span className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                doctor.is_available ? "bg-green-500" : "bg-red-500"
              )} />
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-medium">{doctor.name}</span>
              {doctor.specialty && (
                <Badge variant="secondary" className="text-xs">
                  {doctor.specialty}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
