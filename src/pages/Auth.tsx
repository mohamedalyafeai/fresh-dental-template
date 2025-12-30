import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, Stethoscope, Heart, Sparkles } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const defaultRole = searchParams.get('role') || 'patient';
  
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor'>(defaultRole as 'patient' | 'doctor');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  
  const { signIn, signUp, user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getRedirectPath = () => {
    if (redirectTo === 'portal') return '/portal';
    if (redirectTo === 'admin') return '/admin';
    if (activeRole === 'doctor') return '/admin';
    return '/portal';
  };

  useEffect(() => {
    if (!isLoading && user) {
      // If user is admin and trying to access admin, allow it
      if (isAdmin && (redirectTo === 'admin' || activeRole === 'doctor')) {
        navigate('/admin');
      } else {
        navigate('/portal');
      }
    }
  }, [user, isLoading, navigate, redirectTo, isAdmin, activeRole]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin && fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login Failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login Failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Account Exists',
              description: 'An account with this email already exists. Please log in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign Up Failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account Created!',
            description: 'Welcome to BrightSmile Dental.',
          });
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-accent/20 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-20 h-20 hero-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 animate-fade-in">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BrightSmile Dental
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </CardDescription>
          </div>
        </CardHeader>
        
        {/* Role Tabs */}
        <div className="px-6 pt-2">
          <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as 'patient' | 'doctor')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="patient" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Heart className="h-4 w-4" />
                Patient
              </TabsTrigger>
              <TabsTrigger value="doctor" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Stethoscope className="h-4 w-4" />
                Doctor
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={activeRole === 'doctor' ? "Dr. John Smith" : "John Smith"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              disabled={isSubmitting}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </Button>
            
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={() => navigate('/')}
            >
              ← Back to home
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;