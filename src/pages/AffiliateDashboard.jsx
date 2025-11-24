import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, DollarSign, Users, MousePointerClick, TrendingUp, ExternalLink } from "lucide-react";
import { 
  generateReferralUrl,
  canRequestPayout,
  AFFILIATE_CONFIG 
} from "../utils/affiliateUtils";
import { useToast } from "@/components/ui/use-toast";
import { apiCall, API_ENDPOINTS } from "../config/api";

export default function AffiliateDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/affiliate/login');
      return;
    }

    const fetchAffiliateData = async () => {
      try {
        // Fetch affiliate data
        const affiliateData = await apiCall(API_ENDPOINTS.getAffiliate(code));
        setAffiliate(affiliateData);

        // Fetch conversions
        const conversionsData = await apiCall(API_ENDPOINTS.getConversions(code));
        setConversions(conversionsData);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load affiliate data",
          variant: "destructive"
        });
        navigate('/affiliate/login');
      }
    };

    fetchAffiliateData();
  }, [searchParams, navigate, toast]);

  const copyReferralLink = () => {
    const url = generateReferralUrl(affiliate.code);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  if (!affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  const referralUrl = generateReferralUrl(affiliate.code);
  const conversionRate = affiliate.totalClicks > 0 
    ? ((affiliate.totalConversions / affiliate.totalClicks) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Welcome back, {affiliate.name}!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Your affiliate code: <span className="font-mono font-semibold" style={{ color: 'var(--color-accent-primary)' }}>{affiliate.code}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MousePointerClick className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {affiliate.totalClicks}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Clicks</p>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {affiliate.totalConversions}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Conversions</p>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {conversionRate}%
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Conversion Rate</p>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  ${affiliate.totalEarnings.toFixed(2)}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Earnings</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Referral Link */}
          <div className="md:col-span-2 space-y-6">
            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-md font-mono text-sm"
                    style={{ 
                      background: 'var(--color-bg-primary)', 
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid'
                    }}
                  />
                  <Button
                    onClick={copyReferralLink}
                    style={{ background: 'var(--color-accent-primary)', color: '#000' }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this amazing videographer calculator!&url=${encodeURIComponent(referralUrl)}`, '_blank')}
                    style={{ 
                      background: 'var(--color-bg-primary)', 
                      borderColor: 'var(--color-border)', 
                      color: 'var(--color-text-primary)' 
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank')}
                    style={{ 
                      background: 'var(--color-bg-primary)', 
                      borderColor: 'var(--color-border)', 
                      color: 'var(--color-text-primary)' 
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </Button>
                </div>

                <Alert style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
                  <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                    Share this link to earn {AFFILIATE_CONFIG.commissionPercent}% commission on every sale!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Recent Conversions */}
            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>
                  Recent Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversions.length === 0 ? (
                  <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                    No conversions yet. Keep sharing your link!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {conversions.slice(0, 10).map(conversion => (
                      <div 
                        key={conversion.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: 'var(--color-bg-primary)' }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            ${conversion.commission.toFixed(2)} earned
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(conversion.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            background: conversion.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                            color: conversion.status === 'paid' ? 'var(--color-success)' : 'var(--color-accent-primary)'
                          }}
                        >
                          {conversion.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Earnings Summary */}
          <div className="space-y-6">
            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>
                  Earnings Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Pending Payout
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-accent-primary)' }}>
                    ${affiliate.pendingPayout.toFixed(2)}
                  </p>
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Total Paid Out
                  </p>
                  <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    ${affiliate.paidOut.toFixed(2)}
                  </p>
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    PayPal Email
                  </p>
                  <p className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>
                    {affiliate.paypalEmail}
                  </p>
                </div>

                {canRequestPayout(affiliate) ? (
                  <Alert style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--color-success)' }}>
                    <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                      You've reached the ${AFFILIATE_CONFIG.minimumPayout} minimum! Payout will be processed soon.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
                    <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                      ${(AFFILIATE_CONFIG.minimumPayout - affiliate.pendingPayout).toFixed(2)} more to reach minimum payout
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>
                  Commission Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="flex justify-between">
                  <span>Commission Rate:</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {AFFILIATE_CONFIG.commissionPercent}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Per Sale:</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    ${(AFFILIATE_CONFIG.unlockPrice * AFFILIATE_CONFIG.commissionPercent / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cookie Duration:</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {AFFILIATE_CONFIG.cookieDurationDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min Payout:</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    ${AFFILIATE_CONFIG.minimumPayout}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
