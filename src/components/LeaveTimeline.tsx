import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isWithinInterval, 
  addMonths, 
  subMonths,
  isWeekend,
  isSameDay
} from "date-fns";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface TimeOffRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  request_type: string;
  status: string;
}

const LeaveTimeline = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Fetch all employees (RLS policy allows viewing names for timeline)
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true });

      if (employeesError) throw employeesError;

      // Fetch approved time-off requests for this month
      const { data: requestsData, error: requestsError } = await supabase
        .from("time_off_requests")
        .select("*")
        .eq("status", "approved")
        .lte("start_date", format(monthEnd, "yyyy-MM-dd"))
        .gte("end_date", format(monthStart, "yyyy-MM-dd"));

      if (requestsError) throw requestsError;

      setEmployees(employeesData || []);
      setTimeOffRequests(requestsData || []);
    } catch (error) {
      console.error("Error fetching timeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeColor = (requestType: string): string => {
    switch (requestType.toLowerCase()) {
      case "vacation":
        return "bg-green-500";
      case "sick":
        return "bg-red-500";
      case "personal":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const isEmployeeOnLeave = (employeeId: string, date: Date): TimeOffRequest | null => {
    const request = timeOffRequests.find(
      (req) =>
        req.employee_id === employeeId &&
        isWithinInterval(date, {
          start: new Date(req.start_date),
          end: new Date(req.end_date),
        })
    );
    return request || null;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = new Date();

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Leave Timeline</CardTitle>
            <CardDescription>
              Visual overview of all employee leave periods
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="h-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Vacation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Sick</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Personal</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header row with dates */}
            <div className="flex border-b border-border">
              <div className="sticky left-0 z-20 bg-background border-r border-border">
                <div className="w-40 px-3 py-2 font-medium text-sm">
                  Employee
                </div>
              </div>
              <div className="flex">
                {daysInMonth.map((day) => {
                  const isWeekendDay = isWeekend(day);
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`w-12 px-1 py-2 text-center border-r border-border ${
                        isWeekendDay ? "bg-muted/30" : ""
                      } ${isToday ? "bg-primary/10" : ""}`}
                    >
                      <div className="text-xs font-medium">
                        {format(day, "dd.MM")}
                      </div>
                      <div className={`text-xs ${isWeekendDay ? "text-muted-foreground" : "text-muted-foreground"}`}>
                        {format(day, "EEE")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Employee rows */}
            {employees.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No employees found
              </div>
            ) : (
              employees.map((employee) => (
                <div key={employee.id} className="flex border-b border-border hover:bg-muted/20">
                  <div className="sticky left-0 z-10 bg-background border-r border-border">
                    <div className="w-40 px-3 py-3 text-sm truncate">
                      {employee.first_name} {employee.last_name}
                    </div>
                  </div>
                  <div className="flex">
                    {daysInMonth.map((day) => {
                      const leaveRequest = isEmployeeOnLeave(employee.id, day);
                      const isWeekendDay = isWeekend(day);
                      const isToday = isSameDay(day, today);
                      
                      return (
                        <div
                          key={day.toISOString()}
                          className={`w-12 px-1 py-3 border-r border-border ${
                            isWeekendDay ? "bg-muted/30" : ""
                          } ${isToday ? "bg-primary/10" : ""}`}
                        >
                          {leaveRequest && (
                            <div
                              className={`h-6 rounded ${getLeaveTypeColor(
                                leaveRequest.request_type
                              )}`}
                              title={`${leaveRequest.request_type} leave`}
                            ></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {employees.length > 0 && timeOffRequests.length === 0 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            No approved leave requests for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveTimeline;
