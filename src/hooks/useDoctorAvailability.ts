import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, getDay } from 'date-fns';

interface DoctorSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface DayOff {
  date_off: string;
}

interface AvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  availableSlots: string[];
}

// Convert 12-hour format to 24-hour format for comparison
const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12);
  }
  
  return `${hours.padStart(2, '0')}:${minutes}`;
};

// Check if a time slot falls within working hours
const isTimeInRange = (time: string, startTime: string, endTime: string): boolean => {
  const time24 = convertTo24Hour(time);
  return time24 >= startTime && time24 < endTime;
};

export const useDoctorAvailability = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Check availability for all doctors on a specific date
  const checkDateAvailability = useCallback(async (
    date: Date,
    allTimeSlots: string[]
  ): Promise<{ availableSlots: string[]; unavailableReason?: string }> => {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.

      // Fetch all doctor schedules for this day of week
      const { data: schedules, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('doctor_id, day_of_week, start_time, end_time, is_available')
        .eq('day_of_week', dayOfWeek);

      if (scheduleError) {
        console.error('Error fetching schedules:', scheduleError);
        return { availableSlots: allTimeSlots }; // Fallback to all slots
      }

      // Fetch all days off for this date
      const { data: daysOff, error: daysOffError } = await supabase
        .from('doctor_days_off')
        .select('doctor_id, date_off')
        .eq('date_off', dateStr);

      if (daysOffError) {
        console.error('Error fetching days off:', daysOffError);
        return { availableSlots: allTimeSlots };
      }

      // Get unique doctor IDs from schedules
      const doctorIdsWithSchedule = new Set(schedules?.map(s => s.doctor_id) || []);
      const doctorIdsOnDayOff = new Set(daysOff?.map(d => d.doctor_id) || []);

      // Find available doctors (have schedule for this day AND not on day off)
      const availableDoctors = schedules?.filter(s => 
        s.is_available && !doctorIdsOnDayOff.has(s.doctor_id)
      ) || [];

      if (availableDoctors.length === 0) {
        // Check if all doctors are on day off
        if (daysOff && daysOff.length > 0) {
          return { 
            availableSlots: [], 
            unavailableReason: 'جميع الأطباء في إجازة في هذا اليوم' 
          };
        }
        
        // Check if no doctors work on this day
        const anyDoctorWorksThisDay = schedules?.some(s => s.is_available);
        if (!anyDoctorWorksThisDay) {
          return { 
            availableSlots: [], 
            unavailableReason: 'العيادة مغلقة في هذا اليوم' 
          };
        }

        return { availableSlots: allTimeSlots }; // No schedule restrictions
      }

      // Find the union of all working hours across available doctors
      let earliestStart = '23:59';
      let latestEnd = '00:00';

      availableDoctors.forEach(schedule => {
        if (schedule.start_time < earliestStart) {
          earliestStart = schedule.start_time;
        }
        if (schedule.end_time > latestEnd) {
          latestEnd = schedule.end_time;
        }
      });

      // Filter time slots that fall within at least one doctor's working hours
      const availableSlots = allTimeSlots.filter(slot => {
        return availableDoctors.some(schedule => 
          isTimeInRange(slot, schedule.start_time, schedule.end_time)
        );
      });

      return { availableSlots };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { availableSlots: allTimeSlots };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check availability for a specific doctor on a date (all time slots)
  const checkDoctorAvailability = useCallback(async (
    date: Date,
    allTimeSlots: string[],
    doctorId?: string
  ): Promise<{ availableSlots: string[]; unavailableReason?: string }> => {
    // If no doctor specified, use the general availability check
    if (!doctorId) {
      return checkDateAvailability(date, allTimeSlots);
    }

    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = getDay(date);

      // Check if doctor has a day off
      const { data: dayOff, error: dayOffError } = await supabase
        .from('doctor_days_off')
        .select('id, reason')
        .eq('doctor_id', doctorId)
        .eq('date_off', dateStr)
        .maybeSingle();

      if (dayOffError) {
        console.error('Error checking day off:', dayOffError);
      }

      if (dayOff) {
        return {
          availableSlots: [],
          unavailableReason: dayOff.reason || 'الطبيب في إجازة في هذا اليوم'
        };
      }

      // Check doctor's schedule for this day
      const { data: schedule, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('start_time, end_time, is_available')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();

      if (scheduleError) {
        console.error('Error checking schedule:', scheduleError);
        return { availableSlots: allTimeSlots };
      }

      if (!schedule) {
        // No schedule set, assume all slots available
        return { availableSlots: allTimeSlots };
      }

      if (!schedule.is_available) {
        return {
          availableSlots: [],
          unavailableReason: 'الطبيب لا يعمل في هذا اليوم'
        };
      }

      // Filter time slots that fall within the doctor's working hours
      const availableSlots = allTimeSlots.filter(slot => 
        isTimeInRange(slot, schedule.start_time, schedule.end_time)
      );

      if (availableSlots.length === 0) {
        return {
          availableSlots: [],
          unavailableReason: `ساعات عمل الطبيب: ${schedule.start_time} - ${schedule.end_time}`
        };
      }

      return { availableSlots };
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      return { availableSlots: allTimeSlots };
    } finally {
      setIsLoading(false);
    }
  }, [checkDateAvailability]);

  return {
    isLoading,
    checkDateAvailability,
    checkDoctorAvailability
  };
};
