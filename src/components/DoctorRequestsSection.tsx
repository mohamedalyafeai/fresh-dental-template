import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Stethoscope,
  RefreshCw,
  FileText
} from 'lucide-react';
import { t } from '@/lib/translations';

interface DoctorRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  years_experience: number | null;
  badge_number: string | null;
  bio: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface DoctorRequestsSectionProps {
  refreshTrigger?: number;
}

const DoctorRequestsSection = ({ refreshTrigger }: DoctorRequestsSectionProps) => {
  const { user, isOwner } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DoctorRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching doctor requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  const handleApprove = async (request: DoctorRequest) => {
    if (!isOwner) {
      toast({
        title: t.common.error,
        description: t.owner.onlyOwnerCanApprove,
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(request.id);
    try {
      // First, grant admin role to the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: 'admin'
        });

      if (roleError) throw roleError;

      // Create doctor profile
      const { error: profileError } = await supabase
        .from('doctor_profiles')
        .insert({
          user_id: request.user_id,
          specialty: request.specialty,
          years_experience: request.years_experience || 0,
          badge_number: request.badge_number,
          bio: request.bio,
          is_available: true
        });

      if (profileError) throw profileError;

      // Update request status
      const { error: updateError } = await supabase
        .from('doctor_requests')
        .update({
          status: 'approved',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user!.id,
        action_type: 'approve_doctor',
        target_user_id: request.user_id,
        target_user_email: request.email,
        details: `Approved doctor request for ${request.full_name}`
      });

      toast({
        title: t.owner.requestApproved,
        description: `${request.full_name} ${t.owner.isNowDoctor}`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: t.common.error,
        description: t.owner.errorApproving,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setConfirmApproveOpen(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !isOwner) return;

    setProcessingId(selectedRequest.id);
    try {
      const { error } = await supabase
        .from('doctor_requests')
        .update({
          status: 'rejected',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user!.id,
        action_type: 'reject_doctor',
        target_user_id: selectedRequest.user_id,
        target_user_email: selectedRequest.email,
        details: `Rejected doctor request for ${selectedRequest.full_name}. Reason: ${rejectionReason}`
      });

      toast({
        title: t.owner.requestRejected,
        description: `${t.owner.rejectedRequest} ${selectedRequest.full_name}`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: t.common.error,
        description: t.owner.errorRejecting,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
    }
  };

  const openRejectDialog = (request: DoctorRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const openApproveConfirm = (request: DoctorRequest) => {
    setSelectedRequest(request);
    setConfirmApproveOpen(true);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

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

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {t.owner.doctorRequests}
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {pendingRequests.length} {t.owner.pendingLabel}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{t.owner.doctorRequestsDesc}</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t.common.refresh}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.owner.noRequests}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t.owner.applicant}</TableHead>
                  <TableHead className="text-right">{t.owner.specialty}</TableHead>
                  <TableHead className="text-right">{t.owner.experience}</TableHead>
                  <TableHead className="text-right">{t.owner.status}</TableHead>
                  <TableHead className="text-right">{t.owner.date}</TableHead>
                  {isOwner && <TableHead className="text-left">{t.staff.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{request.full_name}</p>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{request.specialty || '-'}</TableCell>
                    <TableCell>{request.years_experience || 0} {t.owner.years}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(request.created_at), 'dd MMM yyyy', { locale: ar })}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-left">
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openApproveConfirm(request)}
                              disabled={processingId === request.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <><CheckCircle className="h-4 w-4 ml-1" /> {t.owner.approve}</>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openRejectDialog(request)}
                              disabled={processingId === request.id}
                            >
                              <XCircle className="h-4 w-4 ml-1" /> {t.owner.reject}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {request.status === 'rejected' && request.rejection_reason && (
                              <span title={request.rejection_reason}>{t.owner.seeReason}</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.owner.confirmApprove}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.owner.confirmApproveDesc} <strong>{selectedRequest?.full_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleApprove(selectedRequest)}
              className="bg-green-600 hover:bg-green-700"
            >
              {t.owner.approve}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{t.owner.rejectRequest}</DialogTitle>
            <DialogDescription>
              {t.owner.rejectRequestDesc} <strong>{selectedRequest?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={t.owner.rejectionReasonPlaceholder}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId !== null}
            >
              {processingId ? <Loader2 className="h-4 w-4 animate-spin" /> : t.owner.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DoctorRequestsSection;
