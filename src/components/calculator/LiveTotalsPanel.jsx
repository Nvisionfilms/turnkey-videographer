import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LiveTotalsPanel({ calculations, settings }) {
  if (!calculations) {
    return (
      <Card className="shadow-lg sticky top-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)' }}>
        <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
            <AlertCircle className="h-4 w-4" style={{ color: 'var(--color-accent-primary)' }} />
            <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
              Select a pricing model and add services to see quote totals.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const calc = calculations;

  return (
    <Card className="shadow-lg sticky top-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)' }}>
      <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
          Quote Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Line Items */}
        {calc.lineItems && calc.lineItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>Services:</h4>
            {calc.lineItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>{item.description}</span>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="pt-2" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
              <div className="flex justify-between text-sm font-semibold">
                <span style={{ color: 'var(--color-text-secondary)' }}>Labor Costs</span>
                <span style={{ color: 'var(--color-text-primary)' }}>${calc.laborSubtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Operations Fee (Overhead & Profit Combined) */}
        {(calc.overhead > 0 || calc.profitMargin > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Operations Fee ({((settings?.overhead_percent || 0) + (settings?.profit_margin_percent || 0))}%)
              </span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                ${((calc.overhead || 0) + (calc.profitMargin || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Additional Costs */}
        <div className="space-y-3">
          {calc.gearAmortized > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Gear (Amortized)</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                ${calc.gearAmortized.toFixed(2)}
              </span>
            </div>
          )}
          
          {calc.travelCost > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Travel</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                ${calc.travelCost.toFixed(2)}
              </span>
            </div>
          )}
          
          {calc.rentalCosts > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Rentals</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                ${calc.rentalCosts.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="pt-3" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
            <div className="flex justify-between text-sm font-semibold">
              <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
              <span style={{ color: 'var(--color-text-primary)' }}>${calc.subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Adjustments */}
        {(calc.rushFee > 0 || calc.nonprofitDiscount > 0) && (
          <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
            {calc.rushFee > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-warning)' }}>Rush Fee ({settings?.rush_fee_percent || 0}%)</span>
                <span className="font-medium" style={{ color: 'var(--color-warning)' }}>
                  +${calc.rushFee.toFixed(2)}
                </span>
              </div>
            )}
            
            {calc.nonprofitDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-success)' }}>Discount ({settings?.nonprofit_discount_percent || 0}%)</span>
                <span className="font-medium" style={{ color: 'var(--color-success)' }}>
                  -${calc.nonprofitDiscount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tax & Total */}
        <div className="space-y-3 pt-3" style={{ borderTop: '2px solid var(--color-border-dark)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Tax ({settings?.tax_rate_percent || 0}%)
            </span>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              ${calc.tax.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between text-xl font-bold pt-2" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
            <span style={{ color: 'var(--color-accent-primary)' }}>TOTAL</span>
            <span style={{ color: 'var(--color-accent-primary)' }}>${calc.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Deposit Info - Only show if enabled and deposit > 0 */}
        {settings?.deposit_enabled !== false && calc.depositDue > 0 && (
          <div className="p-4 rounded-lg space-y-2" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Deposit Due ({settings?.deposit_percent || 50}%)
              </span>
              <span className="font-bold" style={{ color: 'var(--color-accent-primary)' }}>
                ${calc.depositDue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Balance Due</span>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                ${calc.balanceDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Applied Multipliers Info */}
        {calc.appliedMultipliers && (
          <div className="text-xs space-y-1 pt-3" style={{ borderTop: '1px solid var(--color-border-dark)', color: 'var(--color-text-muted)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-accent-primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Applied Adjustments:</span>
            </div>
            {calc.appliedMultipliers.experience && calc.appliedMultipliers.experience !== 1.0 && (
              <div className="flex justify-between">
                <span>Experience Level</span>
                <span>{(calc.appliedMultipliers.experience * 100).toFixed(0)}%</span>
              </div>
            )}
            {calc.appliedMultipliers.industry && calc.appliedMultipliers.industry !== 1.0 && (
              <div className="flex justify-between">
                <span>Industry Index</span>
                <span>{(calc.appliedMultipliers.industry * 100).toFixed(0)}%</span>
              </div>
            )}
            {calc.appliedMultipliers.region && calc.appliedMultipliers.region !== 1.0 && (
              <div className="flex justify-between">
                <span>Region Multiplier</span>
                <span>{(calc.appliedMultipliers.region * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}