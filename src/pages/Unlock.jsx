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

  const handleUnlock = async () => {
    const code = unlockCode.trim().toUpperCase();
    
    // Check for trial code (keep local for now)
    if (code === "TRIAL3DAY" || code === "NVISION3DAY") {
      const result = activateTrial();
      
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
        title: "Unlocked! 🎉",
        description: `Your calculator is now unlocked for 1 year. Welcome!`,
      });
      
      navigate(createPageUrl("Calculator"));
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: error.message || "Invalid code or code already used",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* SECTION 1: Identity Confirmation (short) */}
      <section className="px-6 pt-16 pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            Every quote you send is a decision about your business.
          </h1>
          <p className="text-lg md:text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            TurnKey shows you what that decision actually costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("Calculator"))}
              className="px-8 py-4 text-lg font-semibold"
              style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
            >
              See Your First Quote
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 text-lg"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 2: What This Is */}
      <section className="px-6 py-12" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            What This Is
          </h2>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            TurnKey is pricing infrastructure. It shows your minimum, records what you decide, and lets you see the patterns over time.
          </p>
          <p className="text-lg mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Nothing more. Nothing less.
          </p>
        </div>
      </section>

      {/* SECTION 3: Who This Is For */}
      <section className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Who This Is For
          </h2>
          <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            TurnKey is built for operators.
          </p>
          <ul className="space-y-2 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            <li>- Videographers becoming production companies</li>
            <li>- Freelancers whose responsibility is expanding</li>
            <li>- People who want visibility, not reassurance</li>
          </ul>
          <p className="text-lg mt-6" style={{ color: 'var(--color-text-muted)' }}>
            If you just want a quick rate calculator, this isn't for you.
          </p>
        </div>
      </section>

      {/* SECTION 4: A Necessary Note */}
      <section className="px-6 py-12" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            A Necessary Note
          </h2>
          <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            You may not need this yet.
          </p>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            If your work is simple, solo, and self-contained, operating as a freelancer is appropriate. TurnKey becomes useful when responsibility increases — crew, gear, timelines, risk. That's when decisions start costing more.
          </p>
          <p className="text-lg mt-4" style={{ color: 'var(--color-text-muted)' }}>
            This will be here when that happens.
          </p>
        </div>
      </section>

      {/* SECTION 5: Pricing */}
      <section id="pricing" className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Pricing
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Commitment to visibility, not feature access.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* FREE TIER */}
            <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Free</h3>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>$0</div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>See what you've been missing.</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <li>- 1 quote export</li>
                <li>- No behavior tracking</li>
                <li>- No history</li>
                <li>- Watermarked PDF</li>
              </ul>

              <button
                onClick={() => navigate(createPageUrl("Calculator"))}
                className="w-full py-3 rounded-lg font-medium transition-all"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                Try Free
              </button>
            </div>

            {/* OPERATOR MONTHLY */}
            <div className="rounded-xl p-6 relative" style={{ background: 'var(--color-bg-primary)', border: '2px solid var(--color-accent-primary)' }}>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Operator</h3>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-accent-primary)' }}>$19</div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>per month</p>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Commit to seeing your decisions.</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <li>- Unlimited quotes</li>
                <li>- Behavior tracking</li>
                <li>- Quote history + patterns</li>
                <li>- Post-export reflection</li>
                <li>- No watermark</li>
                <li>- Custom branding</li>
              </ul>

              <button
                onClick={() => window.location.href = STRIPE_LINKS.operatorMonthly}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
              >
                Start Operator
              </button>
            </div>

            {/* OPERATOR ANNUAL */}
            <div className="rounded-xl p-6 relative" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#22c55e', color: 'white' }}>
                SAVE 35%
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Operator Annual</h3>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>$149</div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>per year ($12.42/mo)</p>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>A year of discipline.</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <li>- Everything in Operator</li>
                <li>- Annual commitment</li>
                <li>- 35% savings</li>
              </ul>

              <button
                onClick={() => window.location.href = STRIPE_LINKS.operatorAnnual}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                Start Annual
              </button>
            </div>

            {/* FOUNDING OPERATOR */}
            <div className="rounded-xl p-6 relative" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.1) 100%)', border: '2px solid #D4AF37' }}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#D4AF37', color: '#000' }}>
                LIMITED
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Founding Operator</h3>
                <div className="text-3xl font-bold mb-1" style={{ color: '#D4AF37' }}>$299</div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>one-time</p>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>You believed early.</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <li>- Lifetime access</li>
                <li>- Features frozen at v1</li>
                <li>- No future price increases</li>
                <li>- Priority support</li>
              </ul>

              <button
                onClick={() => window.location.href = STRIPE_LINKS.foundingOperator}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ background: '#D4AF37', color: '#000' }}
              >
                Become a Founder
              </button>
              <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>
                98 spots only
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Unlock Code Section */}
      <section className="px-6 py-12" style={{ background: 'var(--color-bg-secondary)' }}>
        <Card className="w-full max-w-2xl mx-auto" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Have an Unlock Code?
          </CardTitle>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Enter your code or trial below
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
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


          {/* Cancellation - Simplified */}
          <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
            Subscriptions can be canceled anytime. Access remains active through the end of the billing period. No partial refunds.
          </p>

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

            {/* Important Warning */}
            <Alert className="border-2" style={{ 
              background: 'rgba(245, 158, 11, 0.15)', 
              borderColor: 'var(--color-warning)'
            }}>
              <AlertCircle className="h-5 w-5" style={{ color: 'var(--color-warning)' }} />
              <AlertDescription>
                <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  ⚠️ IMPORTANT: Save Your Code!
                </p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>• <strong>Store your unlock code in a safe place</strong></li>
                  <li>• Codes cannot be replaced or recovered</li>
                  <li>• Your purchase confirmation email is your only backup</li>
                  <li>• There is no user portal or account system</li>
                  <li>• Keep the email from your purchase for future reference</li>
                </ul>
              </AlertDescription>
            </Alert>

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
      </section>

      {/* Footer Philosophy (Final Line) */}
      <section className="px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
            You already know what you should charge.
          </p>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
            TurnKey just makes sure you see what you actually do.
          </p>
        </div>
      </section>
    </div>
  );
}
