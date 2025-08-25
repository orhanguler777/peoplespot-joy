import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Calendar, Save, User as UserIcon } from "lucide-react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department: string | null;
  phone: string | null;
  address: string | null;
  birthday: string;
  job_entry_date: string;
  avatar_url?: string;
}

interface EmployeeSelfServiceProps {
  user: User;
}

const EmployeeSelfService = ({ user }: EmployeeSelfServiceProps) => {
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newProfileData, setNewProfileData] = useState({
    first_name: "",
    last_name: "",
    email: user.email || "",
    position: "",
    department: "",
    phone: "",
    address: "",
    birthday: "",
    job_entry_date: "",
  });

  useEffect(() => {
    fetchEmployeeData();
  }, [user]);

  const fetchEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEmployee(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch your employee data.",
        variant: "destructive",
      });
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("employees")
        .update({
          first_name: employee.first_name,
          last_name: employee.last_name,
          phone: employee.phone,
          address: employee.address,
        })
        .eq("id", employee.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update your profile.",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          first_name: newProfileData.first_name,
          last_name: newProfileData.last_name,
          email: newProfileData.email,
          position: newProfileData.position,
          department: newProfileData.department || null,
          phone: newProfileData.phone || null,
          address: newProfileData.address || null,
          birthday: newProfileData.birthday,
          job_entry_date: newProfileData.job_entry_date,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setEmployee(data);
      toast({
        title: "Profile Created",
        description: "Your employee profile has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create your profile.",
        variant: "destructive",
      });
      console.error("Error creating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Please fill in your employee information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newProfileData.first_name}
                  onChange={(e) => setNewProfileData({ ...newProfileData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newProfileData.last_name}
                  onChange={(e) => setNewProfileData({ ...newProfileData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newProfileData.email}
                  onChange={(e) => setNewProfileData({ ...newProfileData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={newProfileData.position}
                  onChange={(e) => setNewProfileData({ ...newProfileData, position: e.target.value })}
                  placeholder="e.g. Software Developer"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newProfileData.department}
                  onChange={(e) => setNewProfileData({ ...newProfileData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newProfileData.phone}
                  onChange={(e) => setNewProfileData({ ...newProfileData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday *</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={newProfileData.birthday}
                  onChange={(e) => setNewProfileData({ ...newProfileData, birthday: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_entry_date">Start Date *</Label>
                <Input
                  id="job_entry_date"
                  type="date"
                  value={newProfileData.job_entry_date}
                  onChange={(e) => setNewProfileData({ ...newProfileData, job_entry_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newProfileData.address}
                onChange={(e) => setNewProfileData({ ...newProfileData, address: e.target.value })}
                placeholder="Enter your address"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Creating Profile..." : "Create Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          My Profile
        </CardTitle>
        <CardDescription>
          Update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatarUrl={employee.avatar_url}
              employeeId={employee.id}
              onAvatarUpdate={(url) => setEmployee({ ...employee, avatar_url: url })}
              fallbackText={`${employee.first_name[0]}${employee.last_name[0]}`}
              size="lg"
            />
          </div>

          <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={employee.first_name}
                onChange={(e) => setEmployee({ ...employee, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={employee.last_name}
                onChange={(e) => setEmployee({ ...employee, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Read Only)</Label>
              <Input
                id="email"
                value={employee.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position (Read Only)</Label>
              <Input
                id="position"
                value={employee.position}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department (Read Only)</Label>
              <Input
                id="department"
                value={employee.department || "Not assigned"}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={employee.phone || ""}
                onChange={(e) => setEmployee({ ...employee, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday (Read Only)</Label>
              <Input
                id="birthday"
                value={new Date(employee.birthday).toLocaleDateString()}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_entry_date">Start Date (Read Only)</Label>
              <Input
                id="job_entry_date"
                value={new Date(employee.job_entry_date).toLocaleDateString()}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={employee.address || ""}
              onChange={(e) => setEmployee({ ...employee, address: e.target.value })}
              placeholder="Enter your address"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeSelfService;