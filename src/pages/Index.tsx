import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Plus, Mail, LogOut } from "lucide-react";
import EmployeeForm from "@/components/EmployeeForm";
import EmployeeList from "@/components/EmployeeList";
import TimeOffForm from "@/components/TimeOffForm";
import TimeOffList from "@/components/TimeOffList";
import EmployeeSelfService from "@/components/EmployeeSelfService";
import InviteEmployee from "@/components/InviteEmployee";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmployeeData, setInviteEmployeeData] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [refreshEmployees, setRefreshEmployees] = useState(0);
  const [refreshTimeOff, setRefreshTimeOff] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserProfile(data);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clean up auth state utility
  const cleanupAuthState = () => {
    // Remove standard auth tokens
    localStorage.removeItem('supabase.auth.token');
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.warn('Global sign out failed:', err);
      }
      
      // Force page reload and redirect to auth page
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Force redirect even if sign out fails
      window.location.href = '/auth';
    }
  };

  const handleEmployeeSave = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    setRefreshEmployees(prev => prev + 1);
  };

  const handleEmployeeEdit = (employee: any) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleTimeOffSave = () => {
    setShowTimeOffForm(false);
    setRefreshTimeOff(prev => prev + 1);
  };

  const handleInviteEmployee = (employee: any) => {
    setInviteEmployeeData(employee);
    setShowInviteForm(true);
  };

  const handleInviteSent = () => {
    setShowInviteForm(false);
    setInviteEmployeeData(null);
    setRefreshEmployees(prev => prev + 1);
  };

  const sendTestNotifications = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications');
      
      if (error) throw error;
      
      toast({
        title: "Notifications Check Complete",
        description: `${data.birthdays} birthday(s) and ${data.anniversaries} anniversary notification(s) processed.`,
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Error",
        description: "Failed to send notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = userProfile?.role === 'admin';

  if (showInviteForm && inviteEmployeeData) {
    return (
      <InviteEmployee
        employeeId={inviteEmployeeData.id}
        employeeName={`${inviteEmployeeData.first_name} ${inviteEmployeeData.last_name}`}
        employeeEmail={inviteEmployeeData.email}
        onInvite={handleInviteSent}
        onCancel={() => {
          setShowInviteForm(false);
          setInviteEmployeeData(null);
        }}
      />
    );
  }

  if (showEmployeeForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <EmployeeForm
          employee={editingEmployee}
          onSave={handleEmployeeSave}
          onCancel={() => {
            setShowEmployeeForm(false);
            setEditingEmployee(null);
          }}
        />
      </div>
    );
  }

  if (showTimeOffForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <TimeOffForm
          onSave={handleTimeOffSave}
          onCancel={() => setShowTimeOffForm(false)}
          currentUser={user}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with dark blue background */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src="/pixup-logo.png" 
                alt="Pixup Logo" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold">HR Management System</h1>
                <p className="text-sm text-slate-300">
                  {isAdmin 
                    ? "Manage employees, track time-off requests, and celebrate milestones"
                    : "Your employee self-service portal"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-300">Welcome back</p>
                <p className="font-medium text-white">{user.email}</p>
                <p className="text-xs text-slate-400 capitalize">{userProfile?.role || 'employee'}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="bg-white border-white text-slate-900 hover:bg-slate-100">
                <LogOut className="h-4 w-4 mr-2 text-slate-900" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-6">

        {!isAdmin && (
          <div className="mb-6">
            <Button onClick={() => setShowTimeOffForm(true)} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Request Time Off
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className="mb-6 flex gap-4">
            <Button onClick={() => setShowEmployeeForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
            <Button onClick={sendTestNotifications} variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Check Notifications
            </Button>
          </div>
        )}

        <Tabs defaultValue={isAdmin ? "employees" : "profile"} className="space-y-6">
          <TabsList className={`grid ${isAdmin ? 'grid-cols-2 w-[400px]' : 'grid-cols-2 w-[400px]'}`}>
            {isAdmin && (
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employees
              </TabsTrigger>
            )}
            {!isAdmin && (
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Profile
              </TabsTrigger>
            )}
            <TabsTrigger value="timeoff" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Off
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="employees">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Directory</CardTitle>
                  <CardDescription>
                    View and manage all employees in the organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmployeeList
                    onEdit={handleEmployeeEdit}
                    onInvite={handleInviteEmployee}
                    refresh={refreshEmployees}
                    isAdmin={isAdmin}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!isAdmin && (
            <TabsContent value="profile">
              <EmployeeSelfService user={user} />
            </TabsContent>
          )}

          <TabsContent value="timeoff">
            <Card>
              <CardHeader>
                <CardTitle>Time-Off Requests</CardTitle>
                <CardDescription>
                  {isAdmin 
                    ? "Review and manage employee time-off requests"
                    : "View and manage your time-off requests"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeOffList 
                  refresh={refreshTimeOff} 
                  isAdmin={isAdmin}
                  currentUser={user}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
