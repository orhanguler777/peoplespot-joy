import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Plus, Mail } from "lucide-react";
import EmployeeForm from "@/components/EmployeeForm";
import EmployeeList from "@/components/EmployeeList";
import TimeOffForm from "@/components/TimeOffForm";
import TimeOffList from "@/components/TimeOffList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [refreshEmployees, setRefreshEmployees] = useState(0);
  const [refreshTimeOff, setRefreshTimeOff] = useState(0);

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
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">HR Management System</h1>
          <p className="text-xl text-muted-foreground">
            Manage employees, track time-off requests, and celebrate milestones
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button onClick={() => setShowEmployeeForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
          <Button onClick={() => setShowTimeOffForm(true)} variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Request Time Off
          </Button>
          <Button onClick={sendTestNotifications} variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Check Notifications
          </Button>
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="timeoff" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Off
            </TabsTrigger>
          </TabsList>

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
                  refresh={refreshEmployees}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeoff">
            <Card>
              <CardHeader>
                <CardTitle>Time-Off Requests</CardTitle>
                <CardDescription>
                  Review and manage employee time-off requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeOffList refresh={refreshTimeOff} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
