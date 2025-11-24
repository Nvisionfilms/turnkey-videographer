import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  canRequestPayout,
  AFFILIATE_CONFIG 
} from "../utils/affiliateUtils";
import { useToast } from "@/components/ui/use-toast";
import { DollarSign, Users, TrendingUp, Check, Trash2 } from "lucide-react";
import { apiCall, API_ENDPOINTS } from "../config/api";

export default function AdminAffiliates() {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [payoutAmounts, setPayoutAmounts] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const affiliatesData = await apiCall(API_ENDPOINTS.getAllAffiliates);
      setAffiliates(affiliatesData);
      
      // Load conversions for all affiliates
      const allConversions = [];
      for (const affiliate of affiliatesData) {
        const conversionsData = await apiCall(API_ENDPOINTS.getConversions(affiliate.code));
        allConversions.push(...conversionsData);
      }
      setConversions(allConversions);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load affiliate data",
        variant: "destructive"
      });
    }
  };

  const handleMarkPaid = async (affiliateId, amount) => {
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payout amount",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiCall(API_ENDPOINTS.markPayout(affiliateId), {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      
      setPayoutAmounts({ ...payoutAmounts, [affiliateId]: '' });
      loadData();
      
      toast({
        title: "Payout Marked Complete",
        description: `$${amount} marked as paid`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark payout",
        variant: "destructive"
      });
    }
  };

  const totalPending = affiliates.reduce((sum, a) => sum + a.pendingPayout, 0);
  const totalPaid = affiliates.reduce((sum, a) => sum + a.paidOut, 0);
  const totalConversions = conversions.length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Affiliate Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Manage affiliates and process payouts
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {affiliates.length}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Affiliates</p>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {totalConversions}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Conversions</p>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  ${totalPending.toFixed(2)}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pending Payouts</p>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Check className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  ${totalPaid.toFixed(2)}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Paid Out</p>
            </CardContent>
          </Card>
        </div>

        {/* Affiliates List */}
        <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--color-text-primary)' }}>
              Affiliates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {affiliates.length === 0 ? (
              <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                No affiliates yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Code
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Email
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Clicks
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Conversions
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Pending
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Paid Out
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map(affiliate => (
                      <tr 
                        key={affiliate.id}
                        className="border-b hover:bg-opacity-50"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {affiliate.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {affiliate.paypalEmail}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm" style={{ color: 'var(--color-accent-primary)' }}>
                            {affiliate.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {affiliate.email}
                        </td>
                        <td className="py-3 px-4 text-right text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {affiliate.totalClicks}
                        </td>
                        <td className="py-3 px-4 text-right text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {affiliate.totalConversions}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span 
                            className="font-semibold"
                            style={{ color: canRequestPayout(affiliate) ? 'var(--color-success)' : 'var(--color-text-primary)' }}
                          >
                            ${affiliate.pendingPayout.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          ${affiliate.paidOut.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {affiliate.pendingPayout > 0 && (
                            <div className="flex items-center gap-2 justify-end">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Amount"
                                value={payoutAmounts[affiliate.id] || ''}
                                onChange={(e) => setPayoutAmounts({ ...payoutAmounts, [affiliate.id]: e.target.value })}
                                className="w-24 h-8 text-sm"
                                style={{ 
                                  background: 'var(--color-bg-primary)', 
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)' 
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(affiliate.id, payoutAmounts[affiliate.id])}
                                style={{ background: 'var(--color-success)', color: '#fff' }}
                              >
                                Mark Paid
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PayPal Payout Info */}
        <Card className="mt-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--color-text-primary)' }}>
              PayPal Payout Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <p>1. Log into PayPal at <a href="https://paypal.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-accent-primary)' }}>paypal.com</a></p>
            <p>2. Go to "Send & Request" → "Send Money"</p>
            <p>3. Use the PayPal emails listed above for each affiliate</p>
            <p>4. After sending payment, enter the amount and click "Mark Paid"</p>
            <p className="pt-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Your PayPal: {AFFILIATE_CONFIG.paypalEmail}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
