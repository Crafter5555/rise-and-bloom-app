import { useEntitlementGate } from '@/hooks/useEntitlementGate';
import { PaywallModal } from './PaywallModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AIInsightsFeatureGate({ children }: { children: React.ReactNode }) {
  const {
    hasAccess,
    loading,
    showPaywall,
    setShowPaywall,
    featureName,
    requiredTier,
    currentTier
  } = useEntitlementGate('ai_insights');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <Card className="border-2 border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <CardTitle>AI-Powered Insights</CardTitle>
              </div>
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Get personalized recommendations and behavior analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                This feature requires a {requiredTier === 'coach_plus' ? 'Coach+' : 'Premium'} subscription.
                You're currently on the {currentTier === 'free' ? 'Free' : currentTier} plan.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-muted rounded-lg mb-4">
              <p className="text-sm font-medium">What you'll unlock:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>AI-powered behavior analysis and pattern recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Personalized recommendations based on your data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Predictive analytics for goal achievement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Smart notifications and habit reminders</span>
                </li>
              </ul>
            </div>

            <Button
              className="w-full"
              onClick={() => setShowPaywall(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Access AI Insights
            </Button>
          </CardContent>
        </Card>

        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          featureName={featureName}
          requiredTier={requiredTier}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        featureName={featureName}
        requiredTier={requiredTier}
      />
    </>
  );
}

export function AdvancedAnalyticsFeatureGate({ children }: { children: React.ReactNode }) {
  const {
    hasAccess,
    requireAccess,
    showPaywall,
    setShowPaywall,
    featureName,
    requiredTier
  } = useEntitlementGate('advanced_analytics');

  const handleFeatureClick = () => {
    if (!requireAccess('read')) {
      return;
    }
  };

  if (!hasAccess) {
    return (
      <>
        <Card className="border-2 border-dashed cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setShowPaywall(true)}>
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1">Advanced Analytics Locked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unlock correlations, predictions, and deep insights
            </p>
            <Button size="sm">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          featureName={featureName}
          requiredTier={requiredTier}
        />
      </>
    );
  }

  return <>{children}</>;
}

export function CoachSessionsFeatureGate({ children }: { children: React.ReactNode }) {
  const {
    hasAccess,
    loading,
    showPaywall,
    setShowPaywall,
    featureName,
    requiredTier
  } = useEntitlementGate('coach_sessions');

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded"></div>;
  }

  if (!hasAccess) {
    return (
      <>
        <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <CardTitle>1-on-1 Coach Sessions</CardTitle>
            </div>
            <CardDescription>
              Get personalized guidance from certified wellness coaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Book Your Session</p>
                  <p className="text-xs text-muted-foreground">Schedule at your convenience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Video Consultation</p>
                  <p className="text-xs text-muted-foreground">45-minute 1-on-1 session</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Custom Action Plan</p>
                  <p className="text-xs text-muted-foreground">Personalized strategies for your goals</p>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => setShowPaywall(true)}
            >
              Upgrade to Coach+
            </Button>
          </CardContent>
        </Card>
        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          featureName={featureName}
          requiredTier={requiredTier}
        />
      </>
    );
  }

  return <>{children}</>;
}
