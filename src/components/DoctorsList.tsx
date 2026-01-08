import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Stethoscope,
  Award,
  Star,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { t } from '@/lib/translations';

interface Doctor {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  specialty?: string;
  badge?: string;
}

// Doctor specialty badges with unique icons and colors
const DOCTOR_SPECIALTIES = [
  { key: 'seniorDentist', icon: Star, color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  { key: 'orthodontist', icon: Award, color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { key: 'implantSpecialist', icon: Sparkles, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { key: 'endodontist', icon: GraduationCap, color: 'bg-green-500/10 text-green-600 border-green-200' },
  { key: 'prosthodontist', icon: Award, color: 'bg-rose-500/10 text-rose-600 border-rose-200' },
  { key: 'periodontist', icon: Star, color: 'bg-teal-500/10 text-teal-600 border-teal-200' },
  { key: 'oralSurgeon', icon: Stethoscope, color: 'bg-red-500/10 text-red-600 border-red-200' },
  { key: 'generalDentist', icon: Stethoscope, color: 'bg-primary/10 text-primary border-primary/20' },
  { key: 'pediatricDentist', icon: Sparkles, color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
  { key: 'cosmeticDentist', icon: Star, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
];

// Function to generate a consistent specialty for a doctor based on their ID
const getDoctorSpecialty = (doctorId: string): typeof DOCTOR_SPECIALTIES[0] => {
  // Use a simple hash of the doctor ID to assign a consistent specialty
  let hash = 0;
  for (let i = 0; i < doctorId.length; i++) {
    const char = doctorId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % DOCTOR_SPECIALTIES.length;
  return DOCTOR_SPECIALTIES[index];
};

// Generate unique badge number for doctor
const getDoctorBadgeNumber = (doctorId: string): string => {
  let hash = 0;
  for (let i = 0; i < doctorId.length; i++) {
    hash = doctorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const num = Math.abs(hash % 9000) + 1000;
  return `DR-${num}`;
};

interface DoctorsListProps {
  onSelectDoctor?: (doctor: Doctor) => void;
  selectedDoctorId?: string;
  showSelection?: boolean;
}

const DoctorsList = ({ onSelectDoctor, selectedDoctorId, showSelection = false }: DoctorsListProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      // Fetch all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (!adminRoles || adminRoles.length === 0) {
        setDoctors([]);
        return;
      }

      const adminUserIds = adminRoles.map(r => r.user_id);

      // Fetch profiles for admins
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at')
        .in('user_id', adminUserIds);

      if (profilesError) throw profilesError;

      const doctorsData: Doctor[] = (profiles || []).map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at,
      }));

      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t.staff.doctorsList}</CardTitle>
            <CardDescription>{doctors.length} {t.staff.doctorsAdmins}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {doctors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t.staff.noDoctors}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {doctors.map((doctor) => {
                const specialty = getDoctorSpecialty(doctor.id);
                const badgeNumber = getDoctorBadgeNumber(doctor.id);
                const SpecialtyIcon = specialty.icon;
                const isSelected = selectedDoctorId === doctor.id;

                return (
                  <div
                    key={doctor.id}
                    onClick={() => showSelection && onSelectDoctor?.(doctor)}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border transition-all
                      ${showSelection ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5' : ''}
                      ${isSelected ? 'border-primary bg-primary/10' : 'border-border/50 bg-secondary/30'}
                    `}
                  >
                    {/* Avatar with unique gradient based on specialty */}
                    <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                          {getInitials(doctor.full_name, doctor.email)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Unique badge indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <SpecialtyIcon className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold truncate">
                          {doctor.full_name || t.staff.noName}
                        </p>
                        {/* Unique doctor badge number */}
                        <Badge variant="outline" className="text-xs font-mono">
                          {badgeNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {doctor.email}
                      </p>
                      {/* Specialty badge */}
                      <Badge className={`${specialty.color} border text-xs`}>
                        <SpecialtyIcon className="h-3 w-3 ml-1" />
                        {t.doctorBadges[specialty.key as keyof typeof t.doctorBadges]}
                      </Badge>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorsList;
