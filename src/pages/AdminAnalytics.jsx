import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AFFILIATE_CONFIG 
} from "../utils/affiliateUtils";
import { apiCall, API_ENDPOINTS } from "../config/api";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  MousePointerClick,
  Eye,
  FileText,
  Unlock,
  UserPlus,
  Activity,
  Calendar,
  BarChart3,
  LogIn
} from "lucide-react";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [affiliates, setAffiliates] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    totalCommissionsPaid: 0,
    totalCommissionsPending: 0,
    conversionRate: 0,
    avgRevenuePerAffiliate: 0,
    topAffiliates: []
  });

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminEmail = localStorage.getItem('adminEmail');
    
    if (adminToken && adminEmail === 'nvisionmg@gmail.com') {
      setIsAdmin(true);
      loadAnalytics();
    } else {
      setIsAdmin(false);
    }
  }, []);

  const loadAnalytics = async () => {
    try {
      // Fetch from Railway API instead of localStorage
      const affiliateData = await apiCall(API_ENDPOINTS.getAllAffiliates);
      setAffiliates(affiliateData);
      
      // For now, conversions will be empty until we have data
      // TODO: Add getAllConversions API endpoint
      const conversionData = [];
      setConversions(conversionData);

      // Calculate stats
      const totalClicks = affiliateData.reduce((sum, a) => sum + (a.total_clicks || 0), 0);
      const totalConversions = affiliateData.reduce((sum, a) => sum + (a.total_conversions || 0), 0);
      const totalRevenue = totalConversions * AFFILIATE_CONFIG.unlockPrice;
      const totalCommissionsPaid = affiliateData.reduce((sum, a) => sum + (a.paid_out || 0), 0);
      const totalCommissionsPending = affiliateData.reduce((sum, a) => sum + (a.pending_payout || 0), 0);
      const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;
      const avgRevenuePerAffiliate = affiliateData.length > 0 ? (totalRevenue / affiliateData.length).toFixed(2) : 0;

      // Top affiliates by conversions
      const topAffiliates = [...affiliateData]
        .sort((a, b) => (b.total_conversions || 0) - (a.total_conversions || 0))
        .slice(0, 5);

      setStats({
        totalAffiliates: affiliateData.length,
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCommissionsPaid,
        totalCommissionsPending,
        conversionRate,
        avgRevenuePerAffiliate,
        topAffiliates
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAffiliates([]);
      setConversions([]);
    }
  };

  // Get user activity stats from localStorage
  const getUserStats = () => {
    const unlocked = localStorage.getItem('nvision_unlocked') === 'true';
    const freeQuoteUsed = localStorage.getItem('nvision_free_quote_used') === 'true';
    const trialUsed = localStorage.getItem('nvision_trial_used') === 'true';
    const quoteHistory = JSON.parse(localStorage.getItem('nvision_quote_history') || '[]');
    
    return {
      unlocked,
      freeQuoteUsed,
      trialUsed,
      totalQuotesSaved: quoteHistory.length
    };
  };

  const userStats = getUserStats();

  // Show login prompt if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <Card className="max-w-md w-full" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="w-16 h-16" style={{ color: 'var(--color-accent-primary)' }} />
            </div>
            <CardTitle className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
              Affiliates Dashboard
            </CardTitle>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Please sign in to view affiliate analytics
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => navigate('/affiliate/login')}
              className="w-full"
              style={{ background: 'var(--color-accent-primary)', color: '#000' }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            👥 Admin Affiliates Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Complete overview of affiliate program, revenue, and user activity
          </p>
        </div>

        {/* Revenue Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            💰 Revenue Overview
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                    ${stats.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Revenue</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {stats.totalConversions} sales × ${AFFILIATE_CONFIG.unlockPrice}
                </p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ${stats.totalCommissionsPending.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pending Commissions</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Owed to affiliates
                </p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ${stats.totalCommissionsPaid.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Commissions Paid</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Total paid out
                </p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                    ${(stats.totalRevenue - stats.totalCommissionsPaid - stats.totalCommissionsPending).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Net Profit</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  After commissions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Affiliate Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            👥 Affiliate Performance
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {stats.totalAffiliates}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Affiliates</p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <MousePointerClick className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {stats.totalClicks}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Clicks</p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <UserPlus className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {stats.totalConversions}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Conversions</p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {stats.conversionRate}%
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Conversion Rate</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            📈 User Activity (This Browser)
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Unlock className="w-5 h-5" style={{ color: userStats.unlocked ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {userStats.unlocked ? 'Yes' : 'No'}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Calculator Unlocked</p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {userStats.freeQuoteUsed ? 'Used' : 'Available'}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Free Quote Status</p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {userStats.trialUsed ? 'Used' : 'Available'}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Trial Status</p>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {userStats.totalQuotesSaved}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Quotes Saved</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Performing Affiliates */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            🏆 Top Performing Affiliates
          </h2>
          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              {stats.topAffiliates.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                  No affiliate data yet
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.topAffiliates.map((affiliate, index) => (
                    <div 
                      key={affiliate.id}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ background: 'var(--color-bg-primary)' }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{ 
                            background: index === 0 ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
                            color: index === 0 ? '#000' : 'var(--color-text-primary)'
                          }}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {affiliate.name}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {affiliate.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: 'var(--color-success)' }}>
                          {affiliate.total_conversions || 0} sales
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          ${((affiliate.pending_payout || 0) + (affiliate.paid_out || 0)).toFixed(2)} earned
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversions */}
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            🎯 Recent Conversions
          </h2>
          <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <CardContent className="p-6">
              {conversions.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                  No conversions yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Affiliate
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Revenue
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Commission
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversions.slice(0, 10).map((conversion) => {
                        const affiliate = affiliates.find(a => a.code === conversion.affiliateCode);
                        return (
                          <tr 
                            key={conversion.id}
                            className="border-b"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {new Date(conversion.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {affiliate?.name || 'Unknown'}
                            </td>
                            <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                              ${AFFILIATE_CONFIG.unlockPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              ${conversion.commission.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
