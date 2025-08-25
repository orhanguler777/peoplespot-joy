import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface TimeOffRequest {
  id: string;
  employee_id: string;
  request_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: string;
  created_at: string;
  employees: {
    first_name: string;
    last_name: string;
  } | null;
}

interface TimeOffListProps {
  refresh: number;
  isAdmin: boolean;
  currentUser: SupabaseUser;
}

const TimeOffList = ({ refresh, isAdmin, currentUser }: TimeOffListProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from("time_off_requests")
        .select(`
          *,
          employees!time_off_requests_employee_id_fkey (
            first_name,
            last_name
          )
        `);

      // If not admin, only show their own requests
      if (!isAdmin) {
        // First get the employee record for this user
        const { data: employeeData } = await supabase
          .from("employees")
          .select("id")
          .eq("user_id", currentUser.id)
          .single();

        if (employeeData) {
          query = query.eq("employee_id", employeeData.id);
        } else {
          // No employee record found, show empty array
          setRequests([]);
          return;
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error("Error fetching time-off requests:", error);
      toast({
        title: "Error",
        description: "Failed to load time-off requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [refresh]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("time_off_requests")
        .update({ 
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq("id", id);

      if (error) throw error;

      setRequests(requests.map(req => 
        req.id === id ? { ...req, status } : req
      ));

      toast({ 
        title: `Request ${status}!`,
        description: `Time-off request has been ${status}.`
      });
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "approved":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "vacation":
        return "bg-blue-100 text-blue-800";
      case "sick":
        return "bg-red-100 text-red-800";
      case "personal":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading time-off requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No time-off requests found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {request.employees?.first_name || 'Unknown'} {request.employees?.last_name || 'Employee'}
                </CardTitle>
                <CardDescription>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(request.request_type)}`}>
                    {request.request_type.charAt(0).toUpperCase() + request.request_type.slice(1)}
                  </span>
                </CardDescription>
              </div>
              <Badge variant={getStatusColor(request.status)}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(request.start_date), "MMM d, yyyy")} -{" "}
                {format(new Date(request.end_date), "MMM d, yyyy")}
              </span>
              <span className="text-muted-foreground">
                ({request.days_requested} days)
              </span>
            </div>

            {request.reason && (
              <div className="text-sm">
                <span className="font-medium">Reason: </span>
                {request.reason}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Requested on {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>

            {request.status === "pending" && isAdmin && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(request.id, "approved")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange(request.id, "rejected")}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TimeOffList;