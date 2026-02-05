 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { Badge } from '@/components/ui/badge';
 import { Stethoscope, Loader2 } from 'lucide-react';
 
 interface DoctorInfo {
   name: string;
   specialty: string | null;
 }
 
 // Cache for doctor info to avoid repeated queries
 const doctorCache = new Map<string, DoctorInfo>();
 
 interface DoctorNameDisplayProps {
   doctorId: string | null;
   showSpecialty?: boolean;
   className?: string;
 }
 
 export const DoctorNameDisplay = ({ doctorId, showSpecialty = true, className = '' }: DoctorNameDisplayProps) => {
   const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
   const [isLoading, setIsLoading] = useState(false);
 
   useEffect(() => {
     if (!doctorId) {
       setDoctor(null);
       return;
     }
 
     // Check cache first
     const cached = doctorCache.get(doctorId);
     if (cached) {
       setDoctor(cached);
       return;
     }
 
     fetchDoctorInfo();
   }, [doctorId]);
 
   const fetchDoctorInfo = async () => {
     if (!doctorId) return;
 
     setIsLoading(true);
     try {
       // Fetch doctor profile - doctor_id in appointments stores user_id
       const { data: profile, error: profileError } = await supabase
         .from('public_doctor_profiles')
         .select('specialty')
         .eq('user_id', doctorId)
         .single();
 
       if (profileError && profileError.code !== 'PGRST116') {
         console.error('Error fetching doctor profile:', profileError);
       }
 
       // Fetch user's name from profiles
       const { data: userProfile, error: userError } = await supabase
         .from('profiles')
         .select('full_name')
         .eq('user_id', doctorId)
         .single();
 
       if (userError && userError.code !== 'PGRST116') {
         console.error('Error fetching user profile:', userError);
       }
 
       const doctorInfo: DoctorInfo = {
         name: userProfile?.full_name || 'طبيب',
         specialty: profile?.specialty || null,
       };
 
       // Cache the result
       doctorCache.set(doctorId, doctorInfo);
       setDoctor(doctorInfo);
     } catch (error) {
       console.error('Error fetching doctor info:', error);
     } finally {
       setIsLoading(false);
     }
   };
 
   if (!doctorId) {
     return (
       <span className={`text-muted-foreground text-sm ${className}`}>
         غير محدد
       </span>
     );
   }
 
   if (isLoading) {
     return (
       <span className={`flex items-center gap-1 text-muted-foreground ${className}`}>
         <Loader2 className="h-3 w-3 animate-spin" />
       </span>
     );
   }
 
   if (!doctor) {
     return (
       <span className={`text-muted-foreground text-sm ${className}`}>
         غير محدد
       </span>
     );
   }
 
   return (
     <div className={`flex items-center gap-2 ${className}`}>
       <Stethoscope className="h-4 w-4 text-primary" />
       <span className="font-medium">{doctor.name}</span>
       {showSpecialty && doctor.specialty && (
         <Badge variant="secondary" className="text-xs">
           {doctor.specialty}
         </Badge>
       )}
     </div>
   );
 };
 
 // Export a function to clear cache if needed
 export const clearDoctorCache = () => {
   doctorCache.clear();
 };