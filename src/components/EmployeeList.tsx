import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department?: string;
  job_entry_date: string;
  birthday: string;
  phone?: string;
  address?: string;
}

interface EmployeeListProps {
  onEdit: (employee: Employee) => void;
  refresh: number;
}

const EmployeeList = ({ onEdit, refresh }: EmployeeListProps) => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("first_name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [refresh]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);

      if (error) throw error;
      
      setEmployees(employees.filter((emp) => emp.id !== id));
      toast({ title: "Employee deleted successfully!" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading employees...</div>;
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No employees found. Add your first employee!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <Card key={employee.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {employee.first_name} {employee.last_name}
                </CardTitle>
                <CardDescription>{employee.position}</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(employee)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleDelete(
                      employee.id,
                      `${employee.first_name} ${employee.last_name}`
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {employee.department && (
              <Badge variant="secondary">{employee.department}</Badge>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              
              {employee.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              
              {employee.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">{employee.address}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground">
              <div>Started: {format(new Date(employee.job_entry_date), "MMM d, yyyy")}</div>
              <div>Birthday: {format(new Date(employee.birthday), "MMM d, yyyy")}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmployeeList;