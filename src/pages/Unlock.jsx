
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Check, Clock, Zap, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { useUnlockStatus } from "@/components/hooks/useUnlockStatus";
import { getDeviceId } from "@/utils/deviceFingerprint";
import { getReferralCookie } from "../utils/affiliateUtils";
import { trackConversion } from "../utils/affiliateUtils";
import { apiCall, API_ENDPOINTS } from "../config/api";

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
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center mb-12 pt-8">
          <div className="inline-block px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--color-accent-primary)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-accent-primary)' }}>
              The StudioBinder of Pricing
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Stop Undercharging.<br/>Start Living.
          </h1>
          <p className="text-xl md:text-2xl mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            The pricing calculator that helped 500+ videographers<br/>hit 6-figures without burning out.
          </p>
          
          {/* ROI Calculator */}
          <div className="max-w-2xl mx-auto p-6 rounded-xl mb-8" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--color-accent-primary)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              💰 Pay Once, Price Forever
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-accent-primary)' }}>$199</div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>One-Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-success)' }}>$6,000+</div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>ROI/Year</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-accent-primary)' }}>3,000%</div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Return</div>
              </div>
            </div>
            <p className="text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              Book just 2 more gigs with better pricing = $6,000+ extra revenue
            </p>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: 'var(--color-accent-primary)' }}>★</span>
              ))}
            </div>
            <span>"Paid for itself in one booking" - Sarah M.</span>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-5xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-center mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Choose Your Plan
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Start free, upgrade when you're ready
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* FREE TIER */}
          <div className="rounded-2xl border-2 p-8" style={{ borderColor: 'var(--color-border)', background: 'white' }}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Free</h3>
              <div className="text-5xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>$0</div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Forever free</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}><strong>1 free quote</strong> with full access</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>Try all features (roles, gear, everything)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>PDF export with watermark</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>Then upgrade to continue</span>
              </li>
            </ul>

            <button
              onClick={() => window.location.href = '/#/calculator'}
              className="w-full py-3 rounded-lg font-semibold transition-all"
              style={{ 
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '2px solid var(--color-border)'
              }}
            >
              Start Free
            </button>
          </div>

          {/* PRO TIER */}
          <div className="rounded-2xl border-2 p-8 relative" style={{ borderColor: 'var(--color-accent-primary)', background: 'white', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.1)' }}>
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--color-accent-primary)', color: 'white' }}>
              MOST POPULAR
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Pro</h3>
              <div className="text-5xl font-bold mb-2" style={{ color: 'var(--color-accent-primary)' }}>$9.99</div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>per month</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}><strong>Unlimited quotes</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}><strong>No watermark</strong> on PDFs</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>Custom branding (logo, colors)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>Quote history & templates</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>Keyboard shortcuts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>Priority support</span>
              </li>
            </ul>

            <div className="space-y-4">
              {/* Monthly Subscription */}
              <div className="text-center mb-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Monthly Subscription</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Stripe Button */}
                <button
                  onClick={async () => {
                    const deviceId = await getDeviceId();
                    const currentUrl = window.location.origin;
                    const refCookie = getReferralCookie();
                    const affiliateCode = refCookie?.code || searchParams.get('ref');
                    const successUrl = `${currentUrl}/#/unlock?payment=success&device_id=${deviceId}`;
                    const cancelUrl = `${currentUrl}/#/unlock`;
                    let stripeUrl = `https://buy.stripe.com/prod_TIClNwXomLEhtB?client_reference_id=${affiliateCode || deviceId}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
                    window.location.href = stripeUrl;
                  }}
                  className="w-full py-3 rounded-lg font-semibold transition-all hover:shadow-lg text-sm"
                  style={{ 
                    background: 'var(--color-accent-primary)',
                    color: 'white'
                  }}
                >
                  Stripe
                </button>

                {/* PayPal Button */}
                <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" className="w-full">
                  <input type="hidden" name="cmd" value="_s-xclick" />
                  <input type="hidden" name="hosted_button_id" value="RCYH47CU7D4CC" />
                  <input type="hidden" name="currency_code" value="USD" />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg font-semibold transition-all hover:shadow-lg text-sm"
                    style={{ 
                      background: '#0070BA',
                      color: 'white'
                    }}
                  >
                    PayPal
                  </button>
                </form>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }}></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2" style={{ background: 'white', color: 'var(--color-text-muted)' }}>OR</span>
                </div>
              </div>

              {/* Lifetime Option */}
              <div className="text-center mb-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Pay Once, Own Forever</p>
              </div>
              
              <button
                onClick={async () => {
                  const deviceId = await getDeviceId();
                  const currentUrl = window.location.origin;
                  const refCookie = getReferralCookie();
                  const affiliateCode = refCookie?.code || searchParams.get('ref');
                  const successUrl = `${currentUrl}/#/unlock?payment=success&device_id=${deviceId}`;
                  const cancelUrl = `${currentUrl}/#/unlock`;
                  // Stripe checkout for $199 lifetime
                  let stripeUrl = `https://buy.stripe.com/prod_TXroVmftASHoID?client_reference_id=${affiliateCode || deviceId}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
                  window.location.href = stripeUrl;
                }}
                className="w-full py-4 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)',
                  color: '#000',
                  border: '2px solid #D4AF37'
                }}
              >
                <div className="text-lg">Get Lifetime Access - $199</div>
                <div className="text-xs opacity-75">Pay once, use forever</div>
              </button>
            </div>

            <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
              Monthly: Cancel anytime • Lifetime: Pay once, use forever
            </p>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-2xl mx-auto" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
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


          {/* Cancellation Information */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
            <h3 className="font-semibold text-lg mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Need to Cancel?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              You can cancel your subscription anytime:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--color-primary)' }}></div>
                <div className="flex-1">
                  <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    For PayPal:
                  </p>
                  <ol className="list-decimal list-inside text-sm space-y-1.5 ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Log in to your PayPal account</li>
                    <li>Go to Settings → Payments → Manage automatic payments</li>
                    <li>Find "Turnkey Videographer" and click "Cancel"</li>
                  </ol>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--color-primary)' }}></div>
                <div className="flex-1">
                  <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    For Stripe:
                  </p>
                  <p className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Email{' '}
                    <a 
                      href="mailto:contact@nvisionfilms.com?subject=Cancel%20Subscription" 
                      className="font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      contact@nvisionfilms.com
                    </a>
                    {' '}with "Cancel Subscription" in the subject line
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs mt-4 pt-3 border-t" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
              <strong>Note:</strong> Cancellations take effect at the end of your current billing period. You'll retain access until then. No partial refunds are provided.
            </p>
          </div>

          {/* What You Get */}
          <div>
            <h3 className="font-semibold text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
              ✨ What You Get:
            </h3>
            <ul className="space-y-3">
              {[
                { title: "Unlimited Quotes", desc: "Create as many quotes as you need, forever" },
                { title: "Professional PDF Exports", desc: "Quote & Invoice templates with signature fields" },
                { title: "Custom Branding", desc: "Add your logo, colors, and terms & conditions" },
                { title: "Keyboard Shortcuts", desc: "Power user features for 3x faster workflow" },
                { title: "Quote History", desc: "Save and recall unlimited past quotes" },
                { title: "Template Library", desc: "Quick-start templates for common projects" },
                { title: "All Future Updates", desc: "New features added automatically, forever" },
                { title: "Priority Support", desc: "Email support with faster response times" }
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</div>
                    <div className="text-sm">{item.desc}</div>
                  </div>
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
    </div>
  );
}
