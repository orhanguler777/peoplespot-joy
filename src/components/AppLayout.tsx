import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: User;
  userProfile?: any;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
}

const AppLayout = ({ 
  children, 
  user, 
  userProfile, 
  showBackButton = false, 
  onBack,
  title = "HR Management System"
}: AppLayoutProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Global sign out failed:', err);
      }
      
      toast({ title: "Signed out successfully" });
      navigate('/auth', { replace: true });
    } catch (error: any) {
      console.error('Sign out error:', error);
      navigate('/auth', { replace: true });
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header with dark blue background */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={onBack}
                    className="text-white hover:bg-slate-800 p-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <img 
                  src="/lovable-uploads/b0cbec1a-8a8d-4f30-86da-432e07c925a8.png" 
                  alt="Pixup Logo" 
                  className="h-12 sm:h-16 w-auto"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  {isAdmin 
                    ? "Manage employees, track time-off requests, and celebrate milestones"
                    : "Your employee self-service portal"
                  }
                </p>
              </div>
            </div>
            {user && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-slate-300">Welcome back</p>
                  <p className="font-medium text-white text-sm sm:text-base">{user.email}</p>
                  <p className="text-xs text-slate-400 capitalize">{userProfile?.role || 'employee'}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut} 
                  className="bg-white border-white text-slate-900 hover:bg-slate-100 w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2 text-slate-900" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;