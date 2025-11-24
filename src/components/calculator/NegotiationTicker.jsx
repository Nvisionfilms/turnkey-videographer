import React from 'react';
import { TrendingDown, TrendingUp, Zap } from 'lucide-react';

export default function NegotiationTicker({ calculations, settings }) {
  if (!calculations || !calculations.total) {
    return null;
  }

  // Get base components
  const laborSubtotal = calculations.laborSubtotal || 0;
  const overhead = calculations.overhead || 0;
  const profitMargin = calculations.profitMargin || 0;
  const gearAmortized = calculations.gearAmortized || 0;
  const travelCost = calculations.travelCost || 0;
  const rentalCosts = calculations.rentalCosts || 0;
  const rushFee = calculations.rushFee || 0;
  const nonprofitDiscount = calculations.nonprofitDiscount || 0;
  const tax = calculations.tax || 0;

  // RED (Low/Minimum): Labor + Gear + Overhead ONLY (no profit)
  // Lowest cost - just covers labor, gear, and overhead
  const laborWithOverheadOnly = laborSubtotal + overhead;
  const subtotalLow = laborWithOverheadOnly + gearAmortized + travelCost + rentalCosts;
  const subtotalLowWithFees = subtotalLow + rushFee - nonprofitDiscount;
  const taxRatePercent = settings?.tax_rate_percent || 0;
  const taxTravel = settings?.tax_travel || false;
  const taxableAmountLow = taxTravel ? subtotalLowWithFees : (subtotalLowWithFees - travelCost);
  const taxLow = taxableAmountLow * (taxRatePercent / 100);
  const lowTier = subtotalLowWithFees + taxLow;
  
  // GREEN (Invoice): Current calculated total with normal profit margin
  // This uses the "Profit Margin (%)" from settings
  const midTier = calculations.total;
  
  // BLUE (Live Good/Desired): Use DESIRED profit margin from settings
  // This uses the "Desired Profit Margin (%)" field from Admin settings
  const desiredProfitPercent = settings?.desired_profit_margin_percent || 60;
  const desiredProfit = laborSubtotal * (desiredProfitPercent / 100);
  const laborWithOverheadDesiredProfit = laborSubtotal + overhead + desiredProfit;
  const subtotalHigh = laborWithOverheadDesiredProfit + gearAmortized + travelCost + rentalCosts;
  const subtotalHighWithFees = subtotalHigh + rushFee - nonprofitDiscount;
  const taxableAmountHigh = taxTravel ? subtotalHighWithFees : (subtotalHighWithFees - travelCost);
  const taxHigh = taxableAmountHigh * (taxRatePercent / 100);
  const highTier = subtotalHighWithFees + taxHigh;

  return (
    <div className="w-full overflow-hidden" style={{ background: 'var(--color-bg-card)', borderBottom: '2px solid var(--color-accent-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Low Tier - Don't go below (Overhead only, no profit) */}
          <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-sm font-bold text-red-500">Don't go below</span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#ef4444' }}>
              ${lowTier.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Overhead covered, but zero profit
            </div>
            <div className="mt-2 text-xs font-semibold text-red-400">
              Break-even only<br />Covers costs, no profit margin
            </div>
          </div>

          {/* Mid Tier - Invoice number (Current calculation) */}
          <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '2px solid #22c55e' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-500" />
              <span className="text-sm font-bold text-green-500">Invoice Number</span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#22c55e' }}>
              ${midTier.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Your current calculated quote
            </div>
            <div className="mt-2 text-xs font-semibold text-green-400">
              What you're quoting<br />Based on your settings & selections
            </div>
          </div>

          {/* High Tier - Desired profit (Live good) */}
          <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-bold text-blue-500">Live Good</span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#3b82f6' }}>
              ${highTier.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              With {Math.round(desiredProfitPercent)}% profit margin
            </div>
            <div className="mt-2 text-xs font-semibold text-blue-400">
              Premium upsell pricing<br />Maximum profit potential
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
