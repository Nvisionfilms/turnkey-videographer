
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Check, Clock, Zap } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { useUnlockStatus } from "@/components/hooks/useUnlockStatus";
import { getDeviceId } from "@/utils/deviceFingerprint";

export default function Unlock() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [unlockCode, setUnlockCode] = useState("");
  const [email, setEmail] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  
  // Use the new hook for unlock status management
  const { hasUsedTrialBefore, activateTrial, activateSubscription, subscriptionDetails, activateDirectUnlock } = useUnlockStatus();
  const trialAlreadyUsed = hasUsedTrialBefore();

  // Get device ID on mount
  useEffect(() => {
    getDeviceId().then(id => setDeviceId(id));
  }, []);

  // Check for payment success from Stripe redirect
  useEffect(() => {
    const checkPaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      const paymentSuccess = searchParams.get('payment');
      
      if (sessionId || paymentSuccess === 'success') {
        setIsCheckingPayment(true);
        
        // Activate direct unlock (payment verified by Stripe redirect)
        const result = await activateDirectUnlock(email || 'customer@email.com');
        
        if (result.success) {
          toast({
            title: "Payment Successful!",
            description: "Your calculator is now unlocked. Redirecting...",
          });
          
          // Redirect to calculator after short delay
          setTimeout(() => {
            navigate(createPageUrl("/"));
          }, 2000);
        }
        
        setIsCheckingPayment(false);
      }
    };
    
    checkPaymentSuccess();
  }, [searchParams, navigate, toast, activateDirectUnlock, email]);

  // Format code as user types (auto-add dashes)
  const formatCode = (value) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Add dashes at appropriate positions for NV-XXXX-XXXX-XXXX-XXXX format
    if (cleaned.startsWith('NV')) {
      const parts = [];
      parts.push(cleaned.substring(0, 2)); // NV
      if (cleaned.length > 2) parts.push(cleaned.substring(2, 6)); // First 4
      if (cleaned.length > 6) parts.push(cleaned.substring(6, 10)); // Second 4
      if (cleaned.length > 10) parts.push(cleaned.substring(10, 14)); // Third 4
      if (cleaned.length > 14) parts.push(cleaned.substring(14, 18)); // Fourth 4
      return parts.join('-');
    }
    
    return cleaned;
  };

  const handleCodeChange = (e) => {
    const formatted = formatCode(e.target.value);
    setUnlockCode(formatted);
  };

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
    // Call the hook's activateSubscription method with email
    const result = activateSubscription(code, email); 
    
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

            {/* Payment Options */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* PayPal Option */}
              <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" className="w-full">
                <input type="hidden" name="cmd" value="_s-xclick" />
                <input type="hidden" name="hosted_button_id" value="RCYH47CU7D4CC" />
                <input type="hidden" name="currency_code" value="USD" />
                <button
                  type="submit"
                  className="w-full px-6 py-4 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ 
                    background: '#0070BA',
                    color: 'white'
                  }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.805.681l-.856 5.424a.634.634 0 0 1-.629.533H7.769a.38.38 0 0 1-.377-.443l1.234-7.828.002-.011.002-.011 1.053-6.666a.952.952 0 0 1 .944-.808h3.288c1.527 0 2.739.193 3.593.53.797.315 1.387.794 1.743 1.417z"/>
                    <path d="M9.43 5.508a.895.895 0 0 1 .887-.758h5.762c.917 0 1.683.145 2.288.415.155.07.302.145.441.226.18.105.345.22.495.346a3.32 3.32 0 0 1 .305.29c.105.115.197.24.277.374.14.234.245.494.318.776.14.544.17 1.165.082 1.856-.745 3.748-3.232 5.03-6.388 5.03h-.506a.79.79 0 0 0-.79.67l-.855 5.424a.624.624 0 0 1-.617.523H7.775a.375.375 0 0 1-.372-.436L9.43 5.508z"/>
                  </svg>
                  PayPal
                </button>
              </form>

              {/* Stripe Option */}
              <button
                onClick={async () => {
                  const deviceId = await getDeviceId();
                  const currentUrl = window.location.origin;
                  const successUrl = `${currentUrl}/#/unlock?payment=success&device_id=${deviceId}`;
                  const cancelUrl = `${currentUrl}/#/unlock`;
                  
                  // Redirect to Stripe with success/cancel URLs
                  window.location.href = `https://buy.stripe.com/fZu7sLh1l3YsanfaNIcIE03?client_reference_id=${deviceId}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
                }}
                className="w-full px-6 py-4 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                style={{ 
                  background: '#635BFF',
                  color: 'white'
                }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
                Stripe
              </button>
            </div>

            <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
              After payment, your calculator will be instantly unlocked on this device
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
              <Label htmlFor="email" style={{ color: 'var(--color-text-secondary)' }}>
                Email (Optional - for subscription tracking)
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="mt-2"
                style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Optional: Enter the email you used for subscription purchase
              </p>
            </div>
            
            <div>
              <Label htmlFor="unlock_code" style={{ color: 'var(--color-text-secondary)' }}>
                Enter Unlock or Trial Code
              </Label>
              <Input
                id="unlock_code"
                type="text"
                value={unlockCode}
                onChange={handleCodeChange}
                placeholder={trialAlreadyUsed ? "NV-XXXX-XXXX-XXXX-XXXX" : "TRIAL3DAY or NV-XXXX-XXXX-XXXX-XXXX"}
                className="mt-2 font-mono text-lg tracking-wider"
                style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock();
                }}
                maxLength={22}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Format: NV-XXXX-XXXX-XXXX-XXXX (dashes added automatically)
              </p>
            </div>
            <Button
              onClick={handleUnlock}
              className="w-full py-6 text-lg font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-secondary) 100%)' }}
              disabled={!unlockCode.trim()}
            >
              Activate Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
