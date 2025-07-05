import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Shield } from "lucide-react";

export const IntentionalitySettings = () => {
  const [trackedApps, setTrackedApps] = useState([
    { name: "Instagram", icon: "📸", enabled: true, popupEnabled: true },
    { name: "TikTok", icon: "🎵", enabled: true, popupEnabled: true },
    { name: "YouTube", icon: "▶️", enabled: true, popupEnabled: false },
    { name: "Twitter/X", icon: "🐦", enabled: true, popupEnabled: true },
    { name: "Facebook", icon: "👥", enabled: false, popupEnabled: false },
    { name: "Reddit", icon: "🤖", enabled: true, popupEnabled: false },
  ]);

  const [newAppName, setNewAppName] = useState("");
  const [showAddApp, setShowAddApp] = useState(false);

  const toggleAppTracking = (index: number) => {
    const updated = [...trackedApps];
    updated[index].enabled = !updated[index].enabled;
    if (!updated[index].enabled) {
      updated[index].popupEnabled = false;
    }
    setTrackedApps(updated);
  };

  const togglePopup = (index: number) => {
    const updated = [...trackedApps];
    updated[index].popupEnabled = !updated[index].popupEnabled;
    setTrackedApps(updated);
  };

  const addCustomApp = () => {
    if (newAppName.trim()) {
      setTrackedApps([...trackedApps, {
        name: newAppName.trim(),
        icon: "📱",
        enabled: true,
        popupEnabled: true
      }]);
      setNewAppName("");
      setShowAddApp(false);
    }
  };

  const removeApp = (index: number) => {
    setTrackedApps(trackedApps.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Card className="p-4 shadow-soft bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-800">Privacy First</span>
        </div>
        <p className="text-sm text-green-700">
          All your app usage data stays private and secure. Data is processed locally when possible, 
          and you have full control over what gets tracked.
        </p>
      </Card>

      {/* App Tracking Settings */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tracked Apps</h3>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowAddApp(!showAddApp)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add App
          </Button>
        </div>

        {showAddApp && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <Label htmlFor="newApp" className="text-sm font-medium">
              Add Custom App
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="newApp"
                placeholder="App name (e.g., Snapchat)"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomApp()}
              />
              <Button size="sm" onClick={addCustomApp}>
                Add
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setShowAddApp(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {trackedApps.map((app, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{app.icon}</span>
                  <div>
                    <div className="font-medium">{app.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Track usage and patterns
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={app.enabled}
                    onCheckedChange={() => toggleAppTracking(index)}
                  />
                  {index >= 6 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeApp(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {app.enabled && (
                <div className="ml-12 pl-4 border-l-2 border-muted">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Intentionality Pop-ups</div>
                      <div className="text-xs text-muted-foreground">
                        Ask "Why are you opening this?" before the app opens
                      </div>
                    </div>
                    <Switch
                      checked={app.popupEnabled}
                      onCheckedChange={() => togglePopup(index)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Popup Customization */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">Pop-up Options</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Available Response Options</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">😴 Habit/Boredom</Badge>
              <Badge variant="outline">📝 Post Something</Badge>
              <Badge variant="outline">📰 Check Updates</Badge>
              <Badge variant="outline">💬 Message Someone</Badge>
              <Badge variant="outline">🎯 Specific Purpose</Badge>
              <Badge variant="outline">🤷 Mindless Scroll</Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Smart Timing</div>
                <div className="text-xs text-muted-foreground">
                  Only show pop-ups during frequent usage periods
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Gentle Reminders</div>
                <div className="text-xs text-muted-foreground">
                  "Take a breath" prompts during long sessions
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Weekend Mode</div>
                <div className="text-xs text-muted-foreground">
                  Reduce pop-ups on weekends
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">Data & Privacy</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Local Processing</div>
              <div className="text-xs text-muted-foreground">
                Keep all data on your device when possible
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Anonymous Analytics</div>
              <div className="text-xs text-muted-foreground">
                Help improve the app with anonymous usage patterns
              </div>
            </div>
            <Switch />
          </div>

          <div className="pt-4">
            <Button variant="outline" size="sm" className="w-full">
              Export My Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};