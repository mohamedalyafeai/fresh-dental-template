import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Loader2, 
  ArrowLeft,
  Search,
  UserPlus,
  Shield,
  ShieldOff,
  Users,
  Stethoscope,
  Heart,
  Mail,
  RefreshCw,
  Award,
  Star
} from 'lucide-react';
import ActivityLogSection from '@/components/ActivityLogSection';
import DoctorsList from '@/components/DoctorsList';
import { t } from '@/lib/translations';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  isAdmin: boolean;
}

const StaffManagement = () => {
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [demotingUserId, setDemotingUserId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote'>('promote');
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth?role=doctor');
      } else if (!isAdmin) {
        toast({
          title: t.common.error,
          description: 'ليس لديك صلاحيات المشرف.',
          variant: 'destructive',
        });
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at,
        isAdmin: adminUserIds.has(profile.user_id),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t.common.error,
        description: t.staff.errorLoading,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const handlePromoteUser = async (targetUser: UserWithRole) => {
    setPromotingUserId(targetUser.id);
    try {
      // Insert admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUser.id,
          role: 'admin'
        });

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        user_id: user!.id,
        action_type: 'promote',
        target_user_id: targetUser.id,
        target_user_email: targetUser.email,
        details: `Promoted ${targetUser.full_name || targetUser.email} to Doctor/Admin`
      });

      // Send email notification
      try {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user!.id)
          .maybeSingle();

        await supabase.functions.invoke('send-role-change-notification', {
          body: {
            userEmail: targetUser.email,
            userName: targetUser.full_name || targetUser.email,
            actionType: 'promote',
            adminName: adminProfile?.full_name || 'Admin'
          }
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      toast({
        title: t.staff.userPromoted,
        description: `${targetUser.full_name || targetUser.email} ${t.staff.isNowDoctor}`,
      });

      fetchUsers();
      setActivityRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: t.common.error,
        description: t.staff.errorPromoting,
        variant: 'destructive',
      });
    } finally {
      setPromotingUserId(null);
      setConfirmDialogOpen(false);
    }
  };

  const handleDemoteUser = async (targetUser: UserWithRole) => {
    // Prevent demoting yourself
    if (targetUser.id === user?.id) {
      toast({
        title: t.staff.cannotDemoteSelf,
        description: t.staff.cannotDemoteSelfDesc,
        variant: 'destructive',
      });
      return;
    }

    setDemotingUserId(targetUser.id);
    try {
      // Delete admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUser.id)
        .eq('role', 'admin');

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        user_id: user!.id,
        action_type: 'demote',
        target_user_id: targetUser.id,
        target_user_email: targetUser.email,
        details: `Demoted ${targetUser.full_name || targetUser.email} to Patient`
      });

      // Send email notification
      try {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user!.id)
          .maybeSingle();

        await supabase.functions.invoke('send-role-change-notification', {
          body: {
            userEmail: targetUser.email,
            userName: targetUser.full_name || targetUser.email,
            actionType: 'demote',
            adminName: adminProfile?.full_name || 'Admin'
          }
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      toast({
        title: t.staff.userDemoted,
        description: `${targetUser.full_name || targetUser.email} ${t.staff.isNowPatient}`,
      });

      fetchUsers();
      setActivityRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error demoting user:', error);
      toast({
        title: t.common.error,
        description: t.staff.errorDemoting,
        variant: 'destructive',
      });
    } finally {
      setDemotingUserId(null);
      setConfirmDialogOpen(false);
    }
  };

  const openConfirmDialog = (targetUser: UserWithRole, action: 'promote' | 'demote') => {
    setSelectedUser(targetUser);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const adminCount = users.filter(u => u.isAdmin).length;
  const patientCount = users.filter(u => !u.isAdmin).length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5" dir="rtl">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{t.staff.title}</h1>
                  <p className="text-xs text-muted-foreground">{t.staff.subtitle}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t.common.refresh}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.staff.totalUsers}</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.staff.doctorsAdmins}</p>
                  <p className="text-2xl font-bold">{adminCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.staff.patients}</p>
                  <p className="text-2xl font-bold">{patientCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctors List */}
        <div className="mb-8">
          <DoctorsList />
        </div>

        {/* Search and Table */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>{t.staff.allUsers}</CardTitle>
                <CardDescription>{t.staff.manageRoles}</CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.staff.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? t.staff.noUsersSearch : t.staff.noUsersFound}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">{t.staff.user}</TableHead>
                      <TableHead className="text-right">{t.staff.role}</TableHead>
                      <TableHead className="text-right">{t.staff.joined}</TableHead>
                      <TableHead className="text-left">{t.staff.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((targetUser) => (
                      <TableRow key={targetUser.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              targetUser.isAdmin ? 'bg-primary/10' : 'bg-secondary'
                            }`}>
                              {targetUser.isAdmin ? (
                                <Stethoscope className="h-5 w-5 text-primary" />
                              ) : (
                                <Heart className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{targetUser.full_name || t.staff.noName}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {targetUser.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={targetUser.isAdmin ? 'default' : 'secondary'}>
                            {targetUser.isAdmin ? (
                              <><Stethoscope className="h-3 w-3 ml-1" /> {t.staff.doctorAdmin}</>
                            ) : (
                              t.staff.patient
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(targetUser.created_at), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell className="text-left">
                          {targetUser.id === user?.id ? (
                            <Badge variant="outline">{t.common.you}</Badge>
                          ) : targetUser.isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfirmDialog(targetUser, 'demote')}
                              disabled={demotingUserId === targetUser.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {demotingUserId === targetUser.id ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              ) : (
                                <ShieldOff className="h-4 w-4 ml-2" />
                              )}
                              {t.staff.demoteToPatient}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfirmDialog(targetUser, 'promote')}
                              disabled={promotingUserId === targetUser.id}
                              className="text-primary hover:text-primary"
                            >
                              {promotingUserId === targetUser.id ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              ) : (
                                <Shield className="h-4 w-4 ml-2" />
                              )}
                              {t.staff.promoteToDoctor}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log Section */}
        <div className="mt-8">
          <ActivityLogSection refreshTrigger={activityRefreshTrigger} />
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' ? t.staff.promoteTitle : t.staff.demoteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'promote' ? (
                <>
                  سيمنح هذا <strong>{selectedUser?.full_name || selectedUser?.email}</strong> {t.staff.promoteDescription}
                </>
              ) : (
                <>
                  سيزيل هذا صلاحيات المشرف من <strong>{selectedUser?.full_name || selectedUser?.email}</strong>. {t.staff.demoteDescription}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  if (actionType === 'promote') {
                    handlePromoteUser(selectedUser);
                  } else {
                    handleDemoteUser(selectedUser);
                  }
                }
              }}
              className={actionType === 'demote' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {actionType === 'promote' ? t.staff.promote : t.staff.demote}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagement;