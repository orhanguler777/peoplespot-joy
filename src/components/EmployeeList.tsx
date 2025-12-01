import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Mail, Phone, MapPin, Send } from "lucide-react";
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
  invited_at?: string;
  user_id?: string;
  avatar_url?: string;
}

interface EmployeeListProps {
  onEdit: (employee: Employee) => void;
  onInvite?: (employee: Employee) => void;
  refresh: number;
  isAdmin: boolean;
}

const EmployeeList = ({ onEdit, onInvite, refresh, isAdmin }: EmployeeListProps) => {
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
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {employees.map((employee) => (
        <Card key={employee.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={employee.avatar_url} alt={`${employee.first_name} ${employee.last_name}`} />
                <AvatarFallback className="text-sm font-semibold">
                  {employee.first_name[0]}{employee.last_name[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex justify-between items-start flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">
                    {employee.first_name} {employee.last_name}
                  </CardTitle>
                  <CardDescription className="text-xs truncate">{employee.position}</CardDescription>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => onEdit(employee)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!employee.user_id && onInvite && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => onInvite(employee)}
                          title="Send invitation"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          handleDelete(
                            employee.id,
                            `${employee.first_name} ${employee.last_name}`
                          )
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {employee.department && (
              <Badge variant="secondary" className="text-xs">{employee.department}</Badge>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {employee.phone ? (
                  <>
                    <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{employee.phone}</span>
                  </>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>

            <div className="pt-1 border-t text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between items-center">
                <span>Start Date: {employee.job_entry_date ? format(new Date(employee.job_entry_date), "d MMM yyyy") : "-"}</span>
                <div className="flex gap-1">
                  {employee.user_id && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Active
                    </Badge>
                  )}
                  {employee.invited_at && !employee.user_id && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      Invited
                    </Badge>
                  )}
                </div>
              </div>
              <div>Birth Date: {employee.birthday ? format(new Date(employee.birthday), "d MMM yyyy") : "-"}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmployeeList;