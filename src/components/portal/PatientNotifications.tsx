import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, BellOff, Check, CheckCheck, Receipt, Pill, ClipboardList, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PatientNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  patient_email: string;
  created_at: string;
}

const typeIcons: Record<string, React.ElementType> = {
  invoice: Receipt,
  prescription: Pill,
  treatment: ClipboardList,
  info: Info,
};

export const PatientNotifications = ({ userEmail }: { userEmail: string }) => {
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Realtime subscription
    const channel = supabase
      .channel('patient-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'patient_notifications',
      }, (payload) => {
        const newNotif = payload.new as PatientNotification;
        if (newNotif.patient_email === userEmail) {
          setNotifications(prev => [newNotif, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userEmail]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('patient_notifications')
      .select('*')
      .eq('patient_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as PatientNotification[]) || []);
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('patient_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('patient_notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            الإشعارات
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
              <CheckCheck className="h-3.5 w-3.5 ml-1" />
              قراءة الكل
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BellOff className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {notifications.map(notif => {
              const Icon = typeIcons[notif.type] || Info;
              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    notif.is_read
                      ? 'border-border/50 bg-background'
                      : 'border-primary/30 bg-primary/5'
                  }`}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      notif.is_read ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      <Icon className={`h-4 w-4 ${notif.is_read ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${notif.is_read ? 'text-muted-foreground' : ''}`}>{notif.title}</p>
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
