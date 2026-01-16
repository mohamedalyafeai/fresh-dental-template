import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Clock, 
  RefreshCw, 
  Loader2,
  Timer,
  CheckCircle,
  XCircle,
  Phone
} from 'lucide-react';

interface ScheduledJob {
  id: string;
  job_name: string;
  schedule: string;
  enabled: boolean | null;
  last_run: string | null;
  last_status: string | null;
  created_at: string;
  updated_at: string;
}

const formatCronSchedule = (schedule: string): string => {
  // Parse common cron expressions
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `Daily at ${displayHour}:${minuteNum.toString().padStart(2, '0')} ${period} UTC`;
  }
  
  return schedule;
};

const getJobIcon = (jobName: string) => {
  if (jobName.toLowerCase().includes('sms')) {
    return <Phone className="h-4 w-4" />;
  }
  return <Timer className="h-4 w-4" />;
};

const getJobDisplayName = (jobName: string): string => {
  const nameMap: Record<string, string> = {
    'sms_appointment_reminder': 'SMS Appointment Reminders',
  };
  return nameMap[jobName] || jobName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const ScheduledJobsSection = () => {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching scheduled jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled jobs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleJobEnabled = async (job: ScheduledJob) => {
    setUpdatingJobId(job.id);
    try {
      const newEnabled = !job.enabled;
      const { error } = await supabase
        .from('scheduled_jobs')
        .update({ enabled: newEnabled })
        .eq('id', job.id);

      if (error) throw error;

      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, enabled: newEnabled } : j
      ));

      toast({
        title: newEnabled ? 'Job Enabled' : 'Job Disabled',
        description: `${getJobDisplayName(job.job_name)} has been ${newEnabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingJobId(null);
    }
  };

  const triggerJobNow = async (job: ScheduledJob) => {
    setUpdatingJobId(job.id);
    try {
      // For SMS reminder job, trigger the edge function directly
      if (job.job_name === 'sms_appointment_reminder') {
        const { error } = await supabase.functions.invoke('send-sms-reminder-scheduled', {
          body: {}
        });

        if (error) throw error;

        // Update last_run in the database
        await supabase
          .from('scheduled_jobs')
          .update({ 
            last_run: new Date().toISOString(),
            last_status: 'success'
          })
          .eq('id', job.id);

        setJobs(prev => prev.map(j => 
          j.id === job.id ? { 
            ...j, 
            last_run: new Date().toISOString(),
            last_status: 'success'
          } : j
        ));

        toast({
          title: 'Job Triggered',
          description: `${getJobDisplayName(job.job_name)} has been executed successfully.`,
        });
      }
    } catch (error) {
      console.error('Error triggering job:', error);
      
      // Update last_status to failed
      await supabase
        .from('scheduled_jobs')
        .update({ 
          last_run: new Date().toISOString(),
          last_status: 'failed'
        })
        .eq('id', job.id);

      setJobs(prev => prev.map(j => 
        j.id === job.id ? { 
          ...j, 
          last_run: new Date().toISOString(),
          last_status: 'failed'
        } : j
      ));

      toast({
        title: 'Error',
        description: 'Failed to trigger job.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingJobId(null);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Scheduled Jobs
            </CardTitle>
            <CardDescription>Manage automated tasks and cron jobs</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchJobs}
            disabled={isLoading}
            className="rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Timer className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled jobs configured</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Job Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getJobIcon(job.job_name)}
                        <span className="font-medium">{getJobDisplayName(job.job_name)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatCronSchedule(job.schedule)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.last_status === 'success' ? (
                        <Badge variant="default" className="bg-emerald-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : job.last_status === 'failed' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Never Run</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {job.last_run ? (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(job.last_run), 'MMM d, yyyy h:mm a')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={job.enabled ?? true}
                        onCheckedChange={() => toggleJobEnabled(job)}
                        disabled={updatingJobId === job.id}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerJobNow(job)}
                        disabled={updatingJobId === job.id || !job.enabled}
                        className="rounded-lg"
                      >
                        {updatingJobId === job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Run Now
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-4 p-4 rounded-xl bg-muted/30 border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            SMS Reminder Information
          </h4>
          <p className="text-sm text-muted-foreground">
            The SMS reminder job automatically sends text message reminders to patients with appointments 
            scheduled for the next day. Reminders are sent daily at the configured time (6:00 PM UTC by default).
            Only appointments with valid phone numbers and status "confirmed" or "pending" will receive reminders.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
