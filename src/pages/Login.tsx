import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Login: React.FC = () => {
  const { loginWithGoogle, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in failed. Please verify network settings or retry.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground transition-colors duration-200">
      {/* Left visual panel - Dark gradient mesh (Linear/Vercel inspired) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#09090b] relative items-center justify-center overflow-hidden border-r border-border/10">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-[250px] w-[250px] bg-violet-500/10 rounded-full blur-[80px]" />
        
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

        <div className="relative z-10 p-12 max-w-lg text-white">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent font-heading">
              NotesSharing
            </span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 font-heading">
            Admin console for academic resources.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed mb-8">
            Manage course materials, verify syllabus compliance, review pyqs, and audit user activity in real-time.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Secure Control Panel</p>
                <p className="text-xs text-muted-foreground mt-0.5">Role-based administrative credentials with audit trail logs.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fine print */}
        <div className="absolute bottom-6 left-12 text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} NotesSharing Foundation. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-accent/5">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border bg-card/60 backdrop-blur-md shadow-2xl">
            <CardHeader className="space-y-1">
              <div className="lg:hidden flex items-center gap-2 mb-4 justify-center">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent font-heading">
                  NotesSharing
                </span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-center lg:text-left">
                Admin Authentication
              </CardTitle>
              <CardDescription className="text-center lg:text-left">
                Sign in with your corporate credential credentials to access the panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {errorMsg && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 text-center font-medium animate-fade-in">
                  {errorMsg}
                </div>
              )}

              {/* Continue with Google button */}
              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full flex items-center justify-center gap-3 h-11 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5 shrink-0" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 text-center border-t border-border/50 pt-4 mt-4">
              <span className="text-xs text-muted-foreground">
                Authorized administrators only. Session logins are audited.
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
