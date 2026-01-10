import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/use-rate-limit';
import { Loader2, Mail, Lock, User, Stethoscope, Heart, Sparkles, ArrowLeft, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const defaultRole = searchParams.get('role') || 'patient';
  const modeParam = searchParams.get('mode');
  
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor'>(defaultRole as 'patient' | 'doctor');
  const [mode, setMode] = useState<AuthMode>(modeParam === 'reset' ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; confirmPassword?: string }>({});
  
  const { signIn, signUp, user, isLoading, isAdmin, resetPassword, updatePassword } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Rate limiting for authentication attempts
  const { checkRateLimit, recordAttempt, resetLimit } = useRateLimit('auth_attempts', {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 30 * 60 * 1000, // 30 minutes lockout
  });

  const getRedirectPath = () => {
    if (redirectTo === 'portal') return '/portal';
    if (redirectTo === 'admin') return '/admin';
    if (activeRole === 'doctor') return '/admin';
    return '/portal';
  };

  useEffect(() => {
    if (!isLoading && user && mode !== 'reset') {
      if (isAdmin && (redirectTo === 'admin' || activeRole === 'doctor')) {
        navigate('/admin');
      } else {
        navigate('/portal');
      }
    }
  }, [user, isLoading, navigate, redirectTo, isAdmin, activeRole, mode]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string; confirmPassword?: string } = {};
    
    if (mode !== 'reset') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = t.auth.invalidEmail;
      }
    }
    
    if (mode === 'login' || mode === 'signup' || mode === 'reset') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = t.auth.passwordMinLength;
      }
    }
    
    if (mode === 'reset') {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t.auth.passwordsNotMatch;
      }
    }
    
    if (mode === 'signup' && fullName.trim().length < 2) {
      newErrors.fullName = t.auth.nameRequired;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Check rate limit for login attempts
    if (mode === 'login') {
      const { allowed, lockoutRemaining } = checkRateLimit();
      if (!allowed) {
        toast({
          title: t.auth.tooManyAttempts,
          description: t.auth.accountLocked.replace('{minutes}', String(lockoutRemaining)),
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          recordAttempt();
          const { remainingAttempts } = checkRateLimit();
          
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: t.auth.loginFailed,
              description: `${t.auth.invalidCredentials} ${remainingAttempts > 0 ? t.auth.attemptsRemaining.replace('{count}', String(remainingAttempts)) : ''}`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: t.auth.loginFailed,
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          resetLimit();
          toast({
            title: t.auth.welcomeBack,
            description: t.auth.signedInSuccess,
          });
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName, activeRole);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: t.auth.accountExists,
              description: t.auth.accountExistsDesc,
              variant: 'destructive',
            });
          } else {
            toast({
              title: t.auth.signUpFailed,
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: t.auth.accountCreated,
            description: t.auth.welcomeTo,
          });
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: t.auth.resetFailed,
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t.auth.resetEmailSent,
            description: t.auth.checkEmail,
          });
          setMode('login');
        }
      } else if (mode === 'reset') {
        const { error } = await updatePassword(password);
        if (error) {
          toast({
            title: t.auth.updateFailed,
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t.auth.passwordUpdated,
            description: t.auth.passwordUpdatedDesc,
          });
          navigate('/portal');
        }
      }
    } catch {
      toast({
        title: t.common.error,
        description: t.auth.unexpectedError,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { allowed, lockoutRemaining } = checkRateLimit();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'login': return t.auth.signInTitle;
      case 'signup': return t.auth.signUpTitle;
      case 'forgot': return t.auth.forgotTitle;
      case 'reset': return t.auth.resetTitle;
    }
  };

  const getButtonText = () => {
    if (isSubmitting) {
      switch (mode) {
        case 'login': return t.auth.signingIn;
        case 'signup': return t.auth.creatingAccount;
        case 'forgot': return t.auth.sendingResetLink;
        case 'reset': return t.auth.updatingPassword;
      }
    }
    switch (mode) {
      case 'login': return t.auth.signIn;
      case 'signup': return t.auth.signUp;
      case 'forgot': return t.auth.sendResetLink;
      case 'reset': return t.auth.updatePassword;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Decorative elements */}
      <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl ${isRTL ? 'translate-x-1/2' : '-translate-x-1/2'} -translate-y-1/2`} />
      <div className={`absolute bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-96 h-96 bg-gradient-to-tl from-accent/20 to-transparent rounded-full blur-3xl ${isRTL ? '-translate-x-1/2' : 'translate-x-1/2'} translate-y-1/2`} />
      
      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-20 h-20 hero-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 animate-fade-in">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t.auth.brandName}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {getTitle()}
            </CardDescription>
          </div>
        </CardHeader>
        
        {/* Rate Limit Warning */}
        {!allowed && (
          <div className="px-6">
            <div className={`flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{t.auth.accountLocked.replace('{minutes}', String(lockoutRemaining))}</span>
            </div>
          </div>
        )}
        
        {/* Role Tabs - only show for login/signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="px-6 pt-2">
            <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as 'patient' | 'doctor')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="patient" className={`flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Heart className="h-4 w-4" />
                  {t.auth.patient}
                </TabsTrigger>
                <TabsTrigger value="doctor" className={`flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Stethoscope className="h-4 w-4" />
                  {t.auth.doctor}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">{t.auth.fullName}</Label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={activeRole === 'doctor' ? t.auth.doctorNamePlaceholder : t.auth.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}
            
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            )}
            
            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {mode === 'reset' ? t.auth.newPassword : t.auth.password}
                </Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}
            
            {mode === 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">{t.auth.confirmPassword}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25" 
              disabled={isSubmitting || (!allowed && mode === 'login')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {getButtonText()}
                </>
              ) : (
                getButtonText()
              )}
            </Button>
            
            {mode === 'login' && (
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => {
                  setMode('forgot');
                  setErrors({});
                }}
                disabled={isSubmitting}
              >
                {t.auth.forgotPassword}
              </Button>
            )}
            
            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted-foreground/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t.auth.or}</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setErrors({});
                  }}
                  disabled={isSubmitting}
                >
                  {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
                </Button>
              </>
            )}
            
            {(mode === 'forgot' || mode === 'reset') && (
              <Button
                type="button"
                variant="ghost"
                className={`w-full text-muted-foreground hover:text-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                onClick={() => {
                  setMode('login');
                  setErrors({});
                }}
                disabled={isSubmitting}
              >
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                {t.auth.backToSignIn}
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              className={`w-full text-muted-foreground hover:text-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t.auth.backToHome}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
