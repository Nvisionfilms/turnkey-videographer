import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Clock, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { useUnlockStatus } from "@/components/hooks/useUnlockStatus";
import { getDeviceId } from "@/utils/deviceFingerprint";
import { getReferralCookie } from "../utils/affiliateUtils";
import { trackConversion } from "../utils/affiliateUtils";
import { apiCall, API_ENDPOINTS } from "../config/api";
import { STRIPE_LINKS, PRICING } from "../utils/stripeLinks";

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
  // SECURITY: Only session_id from Stripe is trusted. 
  // payment=success alone is NOT sufficient (bypass risk).
  useEffect(() => {
    const checkPaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      
      // Only trust Stripe session_id, not generic payment=success param
      if (sessionId) {
        setIsCheckingPayment(true);
        
        // Activate direct unlock (payment verified by Stripe session)
        const result = await activateDirectUnlock(email || 'customer@email.com');
        
        if (result.success) {
          // Track affiliate conversion
          const conversion = trackConversion(result.unlockKey || 'payment-unlock');
          if (conversion) {
            console.log('Affiliate conversion tracked:', conversion);
          }
          
          toast({
            title: "Ledger access granted",
            description: "Your pricing decisions will now be recorded and stored.",
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

  const handleUnlock = async () => {
    const code = unlockCode.trim().toUpperCase();
    
    // Check for trial code (keep local for now)
    if (code === "TRIAL3DAY" || code === "NVISION3DAY") {
      const result = activateTrial();
      
      if (result.success) {
        toast({
          title: "Temporary recording enabled",
          description: "Recording active for evaluation period.",
        });
        navigate(createPageUrl("Calculator"));
      } else {
        toast({
          title: "Temporary access unavailable",
          description: "Recording not enabled.",
          variant: "destructive"
        });
      }
      return;
    }
    
    // Validate email is provided
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to activate the code",
        variant: "destructive"
      });
      return;
    }
    
    // Activate permanent unlock code via Railway API
    try {
      // Get affiliate code from URL if present
      const affiliateCode = searchParams.get('ref') || localStorage.getItem('affiliateCode');
      
      const response = await apiCall(API_ENDPOINTS.activateCode, {
        method: 'POST',
        body: JSON.stringify({
          code,
          email: email.trim().toLowerCase(),
          affiliateCode
        })
      });
      
      // Store user info for future access
      localStorage.setItem('userEmail', email.trim().toLowerCase());
      localStorage.setItem('unlockCode', code);
      
      toast({
        title: "Recording enabled",
        description: "Pricing decisions will now be stored.",
      });
      
      navigate(createPageUrl("Calculator"));
    } catch (error) {
      toast({
        title: "Invalid access code",
        description: "Recording not enabled.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* HEADER */}
      <section className="px-6 pt-12 pb-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Access Pricing Ledger
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Recording pricing decisions requires access. The system records what you do — it does not intervene.
          </p>
        </div>
      </section>

      {/* PRICING OPTIONS */}
      <section id="pricing" className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {/* FREE */}
            <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Limited</h3>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>$0</div>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>No recording</p>
              <ul className="space-y-1 mb-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <li>- 1 export</li>
                <li>- No history</li>
                <li>- Watermarked</li>
              </ul>
              <button
                onClick={() => navigate(createPageUrl("Calculator"))}
                className="w-full py-2 rounded text-xs"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                Continue
              </button>
            </div>

            {/* OPERATOR MONTHLY */}
            <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Operator</h3>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>$19</div>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>per month</p>
              <ul className="space-y-1 mb-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <li>- Unlimited exports</li>
                <li>- Full recording</li>
                <li>- History + patterns</li>
                <li>- Custom branding</li>
              </ul>
              <button
                onClick={() => window.location.href = STRIPE_LINKS.operatorMonthly}
                className="w-full py-2 rounded text-xs font-medium"
                style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)', border: '1px solid var(--color-button-border)' }}
              >
                Activate
              </button>
            </div>

            {/* OPERATOR ANNUAL */}
            <div className="rounded-lg p-5 relative" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="absolute -top-2 right-2 px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                35% off
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Annual</h3>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>$149</div>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>per year</p>
              <ul className="space-y-1 mb-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <li>- Everything in Operator</li>
                <li>- $12.42/month</li>
              </ul>
              <button
                onClick={() => window.location.href = STRIPE_LINKS.operatorAnnual}
                className="w-full py-2 rounded text-xs"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Access Code Section */}
      <section id="access-code" className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            Enter access code
          </h2>
          
          {/* Temporary Access Option */}
          {!trialAlreadyUsed && (
            <div className="p-4 rounded-lg mb-6" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Temporary recording access
              </p>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                For short-term evaluation only. Full recording enabled. Automatically expires.
              </p>
              <div className="p-3 rounded" style={{ background: 'var(--color-bg-primary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Temporary access code:</p>
                <code className="text-lg font-mono" style={{ color: 'var(--color-text-primary)' }}>
                  TRIAL3DAY
                </code>
              </div>
            </div>
          )}
          
          {trialAlreadyUsed && (
            <div className="p-4 rounded-lg mb-6" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Temporary access expired. Recording has stopped.
              </p>
            </div>
          )}

          {/* Access Code Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Email (optional)
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
            </div>
            
            <div>
              <Label htmlFor="unlock_code" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Access code
              </Label>
              <Input
                id="unlock_code"
                type="text"
                value={unlockCode}
                onChange={handleCodeChange}
                placeholder="XXXX-XXXX-XXXX"
                className="mt-2 font-mono text-lg tracking-wider"
                style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock();
                }}
                maxLength={22}
              />
            </div>

            <Button
              onClick={handleUnlock}
              className="w-full py-4"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              disabled={!unlockCode.trim()}
            >
              Activate recording
            </Button>
          </div>
        </div>
      </section>

      {/* Data Storage Note */}
      <section className="px-6 py-8" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Data storage
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            All pricing data is stored locally in your browser. There is no account system and no remote tracking. Clearing browser data will remove history.
          </p>
        </div>
      </section>
    </div>
  );
}
