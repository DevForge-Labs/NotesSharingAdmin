import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleReturn = async () => {
    // Force a signout before returning to login in case any session persists
    try {
      await logout();
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#09090b] text-white relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] bg-destructive/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <Card className="border-destructive/20 bg-card/60 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center text-destructive mb-4 border border-destructive/25 animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Admin Privilege Check Failed
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your authenticated Google account is not registered in the administrator database (`admins` directory). 
            </p>
            <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-xs text-destructive/80 text-left flex gap-2">
              <Mail className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Security Compliance Info:</span>
                <p className="mt-0.5">Please request access from system administrators by providing your Google UID.</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/10 pt-6 pb-8">
            <Button 
              variant="outline" 
              onClick={handleReturn}
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-white border-border/40 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login Screen
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
