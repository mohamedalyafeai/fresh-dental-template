import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Loader2, 
  Shield, 
  ShieldOff, 
  Clock,
  User,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_user_email: string | null;
  details: string | null;
  created_at: string;
  admin_email?: string;
}

interface ActivityLogSectionProps {
  refreshTrigger?: number;
}

const ActivityLogSection = ({ refreshTrigger }: ActivityLogSectionProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Fetch admin emails for each log
      const logsWithAdminEmails = await Promise.all(
        (logsData || []).map(async (log) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', log.user_id)
            .maybeSingle();
          
          return {
            ...log,
            admin_email: profile?.email || 'Unknown Admin'
          };
        })
      );

      setLogs(logsWithAdminEmails);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'promote':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'demote':
        return <ShieldOff className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'promote':
        return <Badge className="bg-primary/10 text-primary border-primary/20">ترقية</Badge>;
      case 'demote':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">تخفيض</Badge>;
      default:
        return <Badge variant="secondary">{actionType}</Badge>;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">سجل النشاطات</CardTitle>
              <CardDescription>متابعة جميع التغييرات على أدوار المستخدمين</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد نشاطات مسجلة بعد</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getActionBadge(log.action_type)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{log.admin_email}</span>
                      {' '}
                      {log.action_type === 'promote' ? 'قام بترقية' : 'قام بتخفيض'}
                      {' '}
                      <span className="font-medium text-primary">{log.target_user_email}</span>
                      {' '}
                      {log.action_type === 'promote' ? 'إلى دكتور/مشرف' : 'إلى مريض'}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogSection;
