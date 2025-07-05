
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Key, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useMobile } from "@/hooks/useMobile";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
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
