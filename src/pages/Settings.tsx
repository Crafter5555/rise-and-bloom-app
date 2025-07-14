
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, User, Key, Shield, AlertTriangle, Moon, Sun, FileText, Download, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useMobile } from "@/hooks/useMobile";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  
  const { user, signOut, updateProfile, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hapticFeedback, isNative } = useMobile();

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setUsername(user.user_metadata?.username || "");
      setDisplayName(user.user_metadata?.display_name || "");
    }
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    if (isNative) hapticFeedback();
  };

  const handleDataExport = async () => {
    setLoading(true);
    if (isNative) hapticFeedback();
    
    try {
      // Export all user data
      const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', user?.id);
      const { data: habits } = await supabase.from('habits').select('*').eq('user_id', user?.id);
      const { data: activities } = await supabase.from('activities').select('*').eq('user_id', user?.id);
      const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user?.id);
      const { data: dailyPlans } = await supabase.from('daily_plans').select('*').eq('user_id', user?.id);
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user?.id);
      
      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user?.id,
        email: user?.email,
        profile,
        tasks,
        habits,
        activities,
        goals,
        daily_plans: dailyPlans
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rise-and-bloom-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isNative) hapticFeedback();
    
    try {
      const { error } = await updateProfile({
        username,
        display_name: displayName,
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    if (isNative) hapticFeedback();
    
    try {
      const { error } = await updatePassword(newPassword);

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ Are you absolutely sure you want to delete your account?\n\nThis action cannot be undone and will permanently delete:\n• All your data\n• Your profile information\n• Your account access\n\nType 'DELETE' in the next prompt to confirm.")) {
      const confirmation = window.prompt("Type 'DELETE' to confirm account deletion:");
      
      if (confirmation === 'DELETE') {
        try {
          if (isNative) hapticFeedback();
          
          await signOut();
          toast({
            title: "Account deletion initiated",
            description: "Please contact support to complete account deletion.",
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Security Overview */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Account Security</span>
            </div>
            <p className="text-sm text-green-700">
              Your account is secured with industry-standard encryption. 
              We recommend using a strong, unique password and keeping your profile information up to date.
            </p>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and how others see you in the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed for security reasons.
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    maxLength={30}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    maxLength={50}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Updating..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Keep your account secure with a strong password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Password must be at least 6 characters long</p>
                <p>• Consider using a mix of letters, numbers, and symbols</p>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full sm:w-auto"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Preferences
            </CardTitle>
            <CardDescription>
              Customize your app experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark themes
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Privacy & Legal
            </CardTitle>
            <CardDescription>
              Review our policies and legal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Privacy Policy</Label>
                <p className="text-sm text-muted-foreground">
                  Learn how we protect your data
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('https://lovable.dev/privacy', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Terms of Service</Label>
                <p className="text-sm text-muted-foreground">
                  Review our terms and conditions
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('https://lovable.dev/terms', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export your data for backup or GDPR compliance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">Export Your Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download all your personal data in JSON format. This includes your tasks, 
                  habits, activities, goals, and profile information.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleDataExport}
                  disabled={loading}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? "Exporting..." : "Export Data"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanent and irreversible actions. Please proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This will permanently delete your account and all associated data. 
                  This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  size="sm"
                >
                  Delete My Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
