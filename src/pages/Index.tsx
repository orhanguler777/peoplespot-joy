import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Plus, Mail, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EmployeeForm from "@/components/EmployeeForm";
import EmployeeList from "@/components/EmployeeList";
import TimeOffForm from "@/components/TimeOffForm";
import TimeOffList from "@/components/TimeOffList";
import EmployeeSelfService from "@/components/EmployeeSelfService";
import InviteEmployee from "@/components/InviteEmployee";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  console.log('Index render started', { 
    timestamp: Date.now(),
    loading: undefined, // will be set below
    user: undefined, // will be set below
    showEmployeeForm: undefined, // will be set below
    showTimeOffForm: undefined, // will be set below
    showInviteForm: undefined, // will be set below
  });

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
  const [notificationTime, setNotificationTime] = useState<string>('19:35');
  const [notificationTimezone, setNotificationTimezone] = useState<string>('Europe/Istanbul');
  const [notificationLoading, setNotificationLoading] = useState<boolean>(false);

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

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchNotificationSettings();
    }
  }, [userProfile?.role]);

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
      
      // Use React Router navigation instead of window.location
      navigate('/auth', { replace: true });
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Use React Router navigation even if sign out fails
      navigate('/auth', { replace: true });
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
      
      let detailedMessage = `${data.birthdays} birthday(s) and ${data.anniversaries} anniversary notification(s) processed.`;
      
      if (data.birthdayDetails && data.birthdayDetails.length > 0) {
        const birthdayNames = data.birthdayDetails.map((emp: any) => `${emp.name} (${emp.position})`).join(', ');
        detailedMessage += `\n🎂 Birthdays: ${birthdayNames}`;
      }
      
      if (data.anniversaryDetails && data.anniversaryDetails.length > 0) {
        const anniversaryNames = data.anniversaryDetails.map((emp: any) => `${emp.name} (${emp.position})`).join(', ');
        detailedMessage += `\n🏆 Anniversaries: ${anniversaryNames}`;
      }
      
      toast({
        title: "Notifications Check Complete",
        description: detailedMessage,
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

  const fetchNotificationSettings = async () => {
    // Add defensive check to ensure only admins can fetch settings
    if (!userProfile?.role || userProfile.role !== 'admin') {
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('notification_time, timezone')
        .limit(1)
        .single();
      if (!error && data) {
        setNotificationTime(String(data.notification_time).slice(0, 5));
        setNotificationTimezone(data.timezone || 'Europe/Istanbul');
      }
    } catch (e) {
      console.warn('Could not load notification settings', e);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setNotificationLoading(true);
      const { error } = await supabase.rpc('set_notification_time', {
        p_time: `${notificationTime}:00`,
        p_timezone: notificationTimezone,
      });
      if (error) throw error;
      toast({
        title: 'Notification time updated',
        description: `Daily emails scheduled at ${notificationTime} (${notificationTimezone}).`,
      });
    } catch (e: any) {
      console.error('Failed to update notification time', e);
      toast({
        title: 'Error',
        description: `Could not update notification time. ${e?.message || ''}`.trim(),
        variant: 'destructive',
      });
    } finally {
      setNotificationLoading(false);
    }
  };

  console.log('Index render state:', { 
    loading, 
    user: !!user, 
    userProfile: !!userProfile,
    showEmployeeForm, 
    showTimeOffForm, 
    showInviteForm,
    inviteEmployeeData: !!inviteEmployeeData
  });

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

  // Render different components based on state
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

  // Main dashboard UI
  return (
    <div className="min-h-screen bg-background">
      {/* Header with dark blue background */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/b0cbec1a-8a8d-4f30-86da-432e07c925a8.png" 
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

        <Tabs defaultValue={isAdmin ? "employees" : "profile"} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className={`grid ${isAdmin ? 'grid-cols-3 w-[520px]' : 'grid-cols-2 w-[400px]'}`}>
              {isAdmin && (
                <TabsTrigger value="employees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Employees
                </TabsTrigger>
              )}
              <TabsTrigger value="timeoff" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time Off
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              )}
              {!isAdmin && (
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  My Profile
                </TabsTrigger>
              )}
            </TabsList>
            
            {isAdmin && (
              <div className="flex gap-4">
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
          </div>

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

          {isAdmin && (
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Set daily email time (Europe/Istanbul, GMT+3)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-4 max-w-md">
                    <div className="flex-1">
                      <Label htmlFor="notify-time">Send time</Label>
                      <Input id="notify-time" type="time" value={notificationTime} onChange={(e) => setNotificationTime(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-1">Timezone: {notificationTimezone}</p>
                    </div>
                    <Button onClick={saveNotificationSettings} disabled={notificationLoading}>
                      {notificationLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
