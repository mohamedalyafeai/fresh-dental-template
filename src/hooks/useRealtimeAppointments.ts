import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeAppointmentsOptions {
  onNewAppointment?: (appointment: any) => void;
  onStatusChange?: (appointment: any) => void;
  onUpdate?: () => void;
}

export const useRealtimeAppointments = (options: UseRealtimeAppointmentsOptions = {}) => {
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create realtime channel for appointments
    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          const newAppointment = payload.new as any;
          
          // Show toast notification for new appointment
          toast({
            title: '🆕 موعد جديد!',
            description: `${newAppointment.patient_name} - ${newAppointment.service}`,
            duration: 5000,
          });

          options.onNewAppointment?.(newAppointment);
          options.onUpdate?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          const updatedAppointment = payload.new as any;
          const oldAppointment = payload.old as any;

          // Check if status changed
          if (oldAppointment.status !== updatedAppointment.status) {
            const statusLabels: Record<string, string> = {
              pending: 'قيد الانتظار',
              confirmed: 'مؤكد',
              completed: 'مكتمل',
              cancelled: 'ملغي',
            };

            const statusEmojis: Record<string, string> = {
              pending: '⏳',
              confirmed: '✅',
              completed: '🎉',
              cancelled: '❌',
            };

            toast({
              title: `${statusEmojis[updatedAppointment.status] || '📋'} تغيير حالة الموعد`,
              description: `${updatedAppointment.patient_name}: ${statusLabels[updatedAppointment.status] || updatedAppointment.status}`,
              duration: 4000,
            });

            options.onStatusChange?.(updatedAppointment);
          }

          options.onUpdate?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          const deletedAppointment = payload.old as any;
          
          toast({
            title: '🗑️ تم حذف موعد',
            description: deletedAppointment.patient_name,
            duration: 3000,
          });

          options.onUpdate?.();
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [toast, options.onNewAppointment, options.onStatusChange, options.onUpdate]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    },
  };
};
