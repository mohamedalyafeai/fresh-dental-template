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
  RefreshCw
} from 'lucide-react';
import ActivityLogSection from '@/components/ActivityLogSection';

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
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
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
        title: 'Error',
        description: 'Failed to load users.',
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
        title: 'User Promoted',
        description: `${targetUser.full_name || targetUser.email} is now a doctor/admin.`,
      });

      fetchUsers();
      setActivityRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to promote user.',
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
        title: 'Cannot Demote Yourself',
        description: 'You cannot remove your own admin privileges.',
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
        title: 'User Demoted',
        description: `${targetUser.full_name || targetUser.email} is now a patient.`,
      });

      fetchUsers();
      setActivityRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error demoting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to demote user.',
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
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
                  <h1 className="text-lg font-bold">Staff Management</h1>
                  <p className="text-xs text-muted-foreground">Manage doctors and patients</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
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
                  <p className="text-sm text-muted-foreground">Total Users</p>
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
                  <p className="text-sm text-muted-foreground">Doctors/Admins</p>
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
                  <p className="text-sm text-muted-foreground">Patients</p>
                  <p className="text-2xl font-bold">{patientCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
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
                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                              <p className="font-medium">{targetUser.full_name || 'No Name'}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {targetUser.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={targetUser.isAdmin ? 'default' : 'secondary'}>
                            {targetUser.isAdmin ? 'Doctor/Admin' : 'Patient'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(targetUser.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {targetUser.id === user?.id ? (
                            <Badge variant="outline">You</Badge>
                          ) : targetUser.isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfirmDialog(targetUser, 'demote')}
                              disabled={demotingUserId === targetUser.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {demotingUserId === targetUser.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <ShieldOff className="h-4 w-4 mr-2" />
                              )}
                              Demote to Patient
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
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Shield className="h-4 w-4 mr-2" />
                              )}
                              Promote to Doctor
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' ? 'Promote to Doctor/Admin?' : 'Demote to Patient?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'promote' ? (
                <>
                  This will give <strong>{selectedUser?.full_name || selectedUser?.email}</strong> admin access to manage appointments, patients, and staff.
                </>
              ) : (
                <>
                  This will remove admin privileges from <strong>{selectedUser?.full_name || selectedUser?.email}</strong>. They will only have patient access.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
              {actionType === 'promote' ? 'Promote' : 'Demote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagement;