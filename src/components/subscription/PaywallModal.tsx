import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles, Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  requiredTier?: string;
}

const tierFeatures = {
  free: [
    { name: 'Basic Planning', included: true },
    { name: 'Tasks & Habits', included: true },
    { name: 'Basic Statistics', included: true },
    { name: 'Daily Check-ins', included: true },
    { name: 'AI Insights', included: false },
    { name: 'Guided Journeys', included: false },
    { name: 'Media Library', included: false },
    { name: 'Advanced Analytics', included: false },
    { name: 'Coach Sessions', included: false },
  ],
  premium: [
    { name: 'Everything in Free', included: true },
    { name: 'AI-Powered Insights', included: true },
    { name: 'Guided Journeys', included: true },
    { name: 'Audio/Video Library', included: true },
    { name: 'Advanced Analytics', included: true },
    { name: 'Digital Wellbeing Center', included: true },
    { name: 'Priority Support', included: true },
    { name: '1-on-1 Coach Sessions', included: false },
    { name: 'Custom Programs', included: false },
  ],
  coach_plus: [
    { name: 'Everything in Premium', included: true },
    { name: '4 Coach Sessions/Month', included: true },
    { name: 'Custom Coach Programs', included: true },
    { name: 'Exclusive Coach Content', included: true },
    { name: '24/7 Priority Support', included: true },
    { name: 'Progress Reviews', included: true },
    { name: 'Personalized Plans', included: true },
  ]
};

export function PaywallModal({ open, onOpenChange, featureName, requiredTier }: PaywallModalProps) {
  const { tier, isTrial } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (selectedTier: 'premium' | 'coach_plus') => {
    setLoading(true);
    try {
      window.location.href = `/settings?tab=subscription&upgrade=${selectedTier}`;
    } catch (error) {
      console.error('Error navigating to upgrade:', error);
      setLoading(false);
    }
  };

  const handleRedeemPoints = () => {
    window.location.href = '/settings?tab=subscription&redeem=true';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {featureName ? `Unlock ${featureName}` : 'Upgrade Your Plan'}
          </DialogTitle>
          {featureName && (
            <p className="text-muted-foreground">
              This feature requires a {requiredTier === 'coach_plus' ? 'Coach+' : 'Premium'} subscription
            </p>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className={tier === 'free' ? 'border-2 border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-slate-500" />
                  <CardTitle>Free</CardTitle>
                </div>
                {tier === 'free' && <Badge variant="outline">Current</Badge>}
              </div>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold mt-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tierFeatures.free.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <span className={!feature.included ? 'text-muted-foreground' : ''}>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          <Card className={tier === 'premium' ? 'border-2 border-primary' : 'border-2 border-blue-500 relative'}>
            {tier !== 'coach_plus' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <CardTitle>Premium</CardTitle>
                </div>
                {tier === 'premium' && <Badge variant="outline">Current</Badge>}
                {isTrial && <Badge variant="secondary">Trial</Badge>}
              </div>
              <CardDescription>Unlock your full potential</CardDescription>
              <div className="text-3xl font-bold mt-4">
                $9.99<span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tierFeatures.premium.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <span className={!feature.included ? 'text-muted-foreground' : ''}>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => handleUpgrade('premium')}
                disabled={loading || tier === 'premium' || tier === 'coach_plus'}
              >
                {tier === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={handleRedeemPoints}
                className="text-xs"
              >
                Redeem Points for Discount
              </Button>
            </CardFooter>
          </Card>

          <Card className={tier === 'coach_plus' ? 'border-2 border-primary' : 'border-2 border-amber-500 relative'}>
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500">
              Best Value
            </Badge>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <CardTitle>Coach+</CardTitle>
                </div>
                {tier === 'coach_plus' && <Badge variant="outline">Current</Badge>}
              </div>
              <CardDescription>1-on-1 coaching & support</CardDescription>
              <div className="text-3xl font-bold mt-4">
                $29.99<span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tierFeatures.coach_plus.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => handleUpgrade('coach_plus')}
                disabled={loading || tier === 'coach_plus'}
              >
                {tier === 'coach_plus' ? 'Current Plan' : 'Upgrade to Coach+'}
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={handleRedeemPoints}
                className="text-xs"
              >
                Redeem Points for Discount
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Flexible Payment Options</h3>
          <p className="text-sm text-muted-foreground">
            Start with a 7-day free trial. Cancel anytime. Use your dedication points to unlock discounts or extended trials.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
