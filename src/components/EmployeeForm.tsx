import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CleanDatePicker } from "@/components/ui/clean-date-picker";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department?: string;
  job_entry_date: string;
  birthday: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}

interface EmployeeFormProps {
  employee?: Employee;
  onSave: () => void;
  onCancel: () => void;
}

const jobTitles = [
  "Other",
  "Frontend Developer / Engineer", 
  "Backend Developer / Engineer",
  "Full Stack Developer",
  "Mobile Developer",
  "DevOps Engineer / Site Reliability Engineer",
  "QA Engineer / Test Automation Engineer",
  "UI/UX Designer",
  "Product Manager / Owner",
  "Technical Lead / Team Lead",
  "Technical PM & QA Lead",
  "CTO (Chief Technology Officer)",
  "Sales Development Representative",
  "Account Executive", 
  "Account Manager",
  "Customer Success Manager",
  "Head of Sales / Sales Director",
  "Marketing Manager / Specialist",
  "Digital Marketing Manager",
  "Content Writer / Copywriter",
  "SEO/SEM Specialist",
  "Community Manager",
  "Creative Designer",
  "CMO (Chief Marketing Officer)",
  "HR / People Ops Manager",
  "Recruiter / Talent Acquisition",
  "Office Manager / Admin",
  "Finance Manager / Controller",
  "Legal / Compliance Officer",
  "Customer Support / Helpdesk",
  "CEO (Chief Executive Officer)",
  "COO (Chief Operating Officer)",
  "CFO (Chief Financial Officer)",
  "Board Members / Advisors"
];

const departments = [
  "Technical / Engineering",
  "Product",
  "Quality Assurance",
  "Design / UI-UX",
  "Sales",
  "Marketing",
  "Customer Success",
  "Human Resources (HR) / People Operations",
  "Finance",
  "Legal & Compliance",
  "Operations / Administration",
  "Executive / Leadership"
];

const EmployeeForm = ({ employee, onSave, onCancel }: EmployeeFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Check if employee position is a custom one (not in predefined list)
  const isCustomPosition = employee?.position && !jobTitles.includes(employee.position);
  
  const [customPosition, setCustomPosition] = useState(isCustomPosition ? employee.position : "");
  const [formData, setFormData] = useState<Employee>({
    first_name: employee?.first_name || "",
    last_name: employee?.last_name || "",
    email: employee?.email || "",
    position: isCustomPosition ? "Other" : (employee?.position || ""),
    department: employee?.department || "",
    job_entry_date: employee?.job_entry_date || "",
    birthday: employee?.birthday || "",
    phone: employee?.phone || "",
    address: employee?.address || "",
    avatar_url: employee?.avatar_url || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalFormData = {
        ...formData,
        position: formData.position === "Other" ? customPosition : formData.position
      };

      if (employee?.id) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update(finalFormData)
          .eq("id", employee.id);

        if (error) throw error;
        toast({ title: "Employee updated successfully!" });
      } else {
        // Create new employee
        const { error } = await supabase.from("employees").insert([finalFormData]);

        if (error) throw error;
        toast({ title: "Employee added successfully!" });
      }

      onSave();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "Error",
        description: "Failed to save employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{employee ? "Edit Employee" : "Add New Employee"}</CardTitle>
        <CardDescription>
          {employee
            ? "Update employee information"
            : "Enter the details for the new employee"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          {employee?.id && (
            <div className="flex justify-center">
              <AvatarUpload
                currentAvatarUrl={formData.avatar_url}
                employeeId={employee.id}
                onAvatarUpdate={(url) => setFormData({ ...formData, avatar_url: url })}
                fallbackText={`${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`}
                size="lg"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => {
                  setFormData({ ...formData, position: value });
                  if (value !== "Other") {
                    setCustomPosition("");
                  }
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.position === "Other" && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom position"
                    value={customPosition}
                    onChange={(e) => setCustomPosition(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Starting Date</Label>
              <CleanDatePicker
                date={formData.job_entry_date ? new Date(formData.job_entry_date) : undefined}
                onSelect={(date) =>
                  setFormData({
                    ...formData,
                    job_entry_date: date ? format(date, "yyyy-MM-dd") : "",
                  })
                }
                placeholder="Select starting date"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Birthday</Label>
              <CleanDatePicker
                date={formData.birthday ? new Date(formData.birthday) : undefined}
                onSelect={(date) =>
                  setFormData({
                    ...formData,
                    birthday: date ? format(date, "yyyy-MM-dd") : "",
                  })
                }
                placeholder="Select birthday"
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : employee ? "Update" : "Add Employee"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmployeeForm;