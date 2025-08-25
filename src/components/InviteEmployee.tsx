import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send } from "lucide-react";

interface InviteEmployeeProps {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  onInvite: () => void;
  onCancel: () => void;
}

const InviteEmployee = ({ employeeId, employeeName, employeeEmail, onInvite, onCancel }: InviteEmployeeProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: employeeEmail,
    subject: `Welcome to HR System - ${employeeName}`,
    message: `Hello ${employeeName},

You have been added to our HR Management System. Please create your account using the following information:

Email: ${employeeEmail}

Once you create your account, you'll be able to:
- Update your personal information
- Request time off
- View your employment details

Please click the link below to get started:
${window.location.origin}/auth

Best regards,
HR Team`
  });

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the edge function to send the invitation email
      const { data, error } = await supabase.functions.invoke('send-employee-invitation', {
        body: {
          employeeId,
          employeeName,
          employeeEmail: inviteData.email,
          subject: inviteData.subject,
          message: inviteData.message,
        },
      });

      if (error) throw error;

      // Update the employee record to mark as invited
      const { error: updateError } = await supabase
        .from("employees")
        .update({ invited_at: new Date().toISOString() })
        .eq("id", employeeId);

      if (updateError) throw updateError;

      toast({
        title: "Invitation Sent",
        description: `Invitation email has been sent to ${inviteData.email}`,
      });

      onInvite();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
      console.error("Error sending invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Employee Invitation
            </CardTitle>
            <CardDescription>
              Send an invitation email to {employeeName} to join the HR system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={inviteData.subject}
                  onChange={(e) => setInviteData({ ...inviteData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={inviteData.message}
                  onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteEmployee;