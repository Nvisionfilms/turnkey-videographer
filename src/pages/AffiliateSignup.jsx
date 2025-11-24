import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, DollarSign, Users, TrendingUp, Mail } from "lucide-react";
import { AFFILIATE_CONFIG, getAllAffiliates } from "../utils/affiliateUtils";
import { useToast } from "@/components/ui/use-toast";
import { apiCall, API_ENDPOINTS } from "../config/api";

export default function AffiliateSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    paypalEmail: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.paypalEmail.trim()) {
      newErrors.paypalEmail = 'PayPal email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.paypalEmail)) {
      newErrors.paypalEmail = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await apiCall(API_ENDPOINTS.affiliateSignup, {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          paypalEmail: formData.paypalEmail
        })
      });
      
      const affiliate = response.affiliate;
      
      toast({
        title: "Welcome to the Affiliate Program! 🎉",
        description: `Your referral code is: ${affiliate.code}`,
      });
      
      // Redirect to dashboard
      navigate(`/affiliate/dashboard?code=${affiliate.code}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create affiliate account. Please try again.",
        variant: "destructive"
      });
    }
  };

  const commissionPerSale = (AFFILIATE_CONFIG.unlockPrice * AFFILIATE_CONFIG.commissionPercent / 100).toFixed(2);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Join Our Affiliate Program
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Earn {AFFILIATE_CONFIG.commissionPercent}% commission on every sale you refer
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Benefits */}
          <div className="space-y-6">
            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>
                  Why Join?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 mt-1" style={{ color: 'var(--color-accent-primary)' }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      ${commissionPerSale} Per Sale
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Earn {AFFILIATE_CONFIG.commissionPercent}% on every ${AFFILIATE_CONFIG.unlockPrice} unlock
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 mt-1" style={{ color: 'var(--color-accent-primary)' }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      30-Day Cookie Duration
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Get credit for sales up to 30 days after referral
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 mt-1" style={{ color: 'var(--color-accent-primary)' }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      ${AFFILIATE_CONFIG.minimumPayout} Minimum Payout
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Low threshold to start earning
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-1" style={{ color: 'var(--color-accent-primary)' }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      PayPal Payouts
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Fast and secure payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signup Form */}
          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--color-text-primary)' }}>
                Create Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" style={{ color: 'var(--color-text-secondary)' }}>
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    style={{ 
                      background: 'var(--color-bg-primary)', 
                      borderColor: errors.name ? 'var(--color-error)' : 'var(--color-border)',
                      color: 'var(--color-text-primary)' 
                    }}
                  />
                  {errors.name && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" style={{ color: 'var(--color-text-secondary)' }}>
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    style={{ 
                      background: 'var(--color-bg-primary)', 
                      borderColor: errors.email ? 'var(--color-error)' : 'var(--color-border)',
                      color: 'var(--color-text-primary)' 
                    }}
                  />
                  {errors.email && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" style={{ color: 'var(--color-text-secondary)' }}>
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="At least 6 characters"
                    style={{ 
                      background: 'var(--color-bg-primary)', 
                      borderColor: errors.password ? 'var(--color-error)' : 'var(--color-border)',
                      color: 'var(--color-text-primary)' 
                    }}
                  />
                  {errors.password && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="paypalEmail" style={{ color: 'var(--color-text-secondary)' }}>
                    PayPal Email *
                  </Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData({...formData, paypalEmail: e.target.value})}
                    placeholder="paypal@example.com"
                    style={{ 
                      background: 'var(--color-bg-primary)', 
                      borderColor: errors.paypalEmail ? 'var(--color-error)' : 'var(--color-border)',
                      color: 'var(--color-text-primary)' 
                    }}
                  />
                  {errors.paypalEmail && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                      {errors.paypalEmail}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    This is where we'll send your commissions
                  </p>
                </div>

                <Alert style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
                  <CheckCircle className="h-4 w-4" style={{ color: 'var(--color-accent-primary)' }} />
                  <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                    You'll get instant access to your unique referral link and dashboard
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ background: 'var(--color-accent-primary)', color: '#000' }}
                >
                  Create Affiliate Account
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Already have account */}
        <div className="text-center">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Already have an account?{' '}
            <a 
              href="/affiliate/login" 
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-accent-primary)' }}
            >
              Access your dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
