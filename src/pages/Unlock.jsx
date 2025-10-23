
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Check, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { useUnlockStatus } from "@/components/hooks/useUnlockStatus"; // New import

export default function Unlock() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unlockCode, setUnlockCode] = useState("");
  
  // Use the new hook for unlock status management
  const { hasUsedTrialBefore, activateTrial, activateSubscription } = useUnlockStatus();
  const trialAlreadyUsed = hasUsedTrialBefore();

  const handleUnlock = () => {
    const code = unlockCode.trim().toUpperCase();
    
    // Check for trial code
    if (code === "TRIAL3DAY" || code === "NVISION3DAY") {
      const result = activateTrial(); // Call the hook's activateTrial method
      
      if (result.success) {
        toast({
          title: "3-Day Trial Activated!",
          description: result.message,
        });
        navigate(createPageUrl("Calculator"));
      } else {
        toast({
          title: "Trial Already Used",
          description: result.message,
          variant: "destructive"
        });
      }
      return;
    }
    
    // Check for permanent unlock code (subscription confirmation)
    // Call the hook's activateSubscription method
    const result = activateSubscription(code); 
    
    if (result.success) {
      toast({
        title: "Unlocked!",
        description: result.message,
      });
      navigate(createPageUrl("Calculator"));
    } else {
      toast({
        title: "Invalid Code",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1d29 100%)' }}>
      <Card className="max-w-2xl w-full border-0 shadow-2xl" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <CardHeader className="text-center pb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
            <Lock className="w-8 h-8" style={{ color: 'var(--color-accent-primary)' }} />
          </div>
          <CardTitle className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Unlock Unlimited Access
          </CardTitle>
          <p className="text-lg mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            You've used your free quote. Subscribe for unlimited calculations or try a 3-day trial.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Trial Option */}
          <div className={`p-6 rounded-lg border ${trialAlreadyUsed ? 'opacity-50' : ''}`} style={{ background: 'rgba(139, 92, 246, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6" style={{ color: 'var(--color-accent-primary)' }} />
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                  Try 3-Day Free Trial
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {trialAlreadyUsed ? "Trial already used - One trial per device" : "Get full access for 72 hours - no payment required"}
                </p>
              </div>
            </div>
            {!trialAlreadyUsed && (
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Trial Code:</p>
                <code className="text-2xl font-bold tracking-wider" style={{ color: 'var(--color-accent-primary)' }}>
                  TRIAL3DAY
                </code>
              </div>
            )}
            {trialAlreadyUsed && (
              <Alert style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--color-warning)' }}>
                <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Trial Used:</strong> You've already activated your 3-day trial. Please subscribe for continued access.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Subscription Option */}
          <div className="p-6 rounded-lg border" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6" style={{ color: 'var(--color-accent-primary)' }} />
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                  Monthly Subscription
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  $9.99/month - Cancel anytime
                </p>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--color-accent-primary)' }}>
                $9.99
                <span className="text-lg font-normal" style={{ color: 'var(--color-text-secondary)' }}>/month</span>
              </div>
            </div>

            {/* PayPal Subscribe Button */}
            <div className="flex justify-center">
              <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
                <input type="hidden" name="cmd" value="_s-xclick" />
                <input type="hidden" name="hosted_button_id" value="RCYH47CU7D4CC" />
                <input type="hidden" name="currency_code" value="USD" />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:shadow-lg flex items-center gap-2"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-secondary) 100%)',
                    color: 'var(--color-button-text)'
                  }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.805.681l-.856 5.424a.634.634 0 0 1-.629.533H7.769a.38.38 0 0 1-.377-.443l1.234-7.828.002-.011.002-.011 1.053-6.666a.952.952 0 0 1 .944-.808h3.288c1.527 0 2.739.193 3.593.53.797.315 1.387.794 1.743 1.417z"/>
                    <path d="M9.43 5.508a.895.895 0 0 1 .887-.758h5.762c.917 0 1.683.145 2.288.415.155.07.302.145.441.226.18.105.345.22.495.346a3.32 3.32 0 0 1 .305.29c.105.115.197.24.277.374.14.234.245.494.318.776.14.544.17 1.165.082 1.856-.745 3.748-3.232 5.03-6.388 5.03h-.506a.79.79 0 0 0-.79.67l-.855 5.424a.624.624 0 0 1-.617.523H7.775a.375.375 0 0 1-.372-.436L9.43 5.508z"/>
                  </svg>
                  Subscribe with PayPal
                </button>
              </form>
            </div>

            <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
              After subscribing, you'll receive an unlock code via email within 24 hours
            </p>
          </div>

          {/* What You Get */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              What You Get:
            </h3>
            <ul className="space-y-2">
              {[
                "Unlimited quote calculations",
                "All premium features",
                "Regular updates & improvements",
                "Professional PDF exports",
                "Custom branding options",
                "Priority email support"
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                  <Check className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Unlock Code Input */}
          <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <Label htmlFor="unlock_code" style={{ color: 'var(--color-text-secondary)' }}>
                Enter Unlock or Trial Code
              </Label>
              <Input
                id="unlock_code"
                type="text"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                placeholder={trialAlreadyUsed ? "Enter subscription code" : "TRIAL3DAY or subscription code"}
                className="mt-2"
                style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock();
                }}
              />
            </div>
            <Button
              onClick={handleUnlock}
              className="w-full py-6 text-lg font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-secondary) 100%)' }}
            >
              Activate Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
