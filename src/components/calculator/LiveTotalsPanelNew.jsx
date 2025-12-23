import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check, DollarSign, Percent } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function LiveTotalsPanel({ calculations, settings, formData, dayRates, onUpdateCustomPrice, onUpdateDiscount }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  if (!calculations) {
    return (
      <Card className="shadow-lg sticky top-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
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
  
  // Get crew info with proper role name resolution
  const crewInfo = formData?.selected_roles?.length > 0 
    ? formData.selected_roles.map(r => {
        // Try to get role name from the role data or look it up
        if (r.role_name) return r.role_name;
        
        // Look up the actual role name from dayRates
        if (dayRates) {
          const rate = dayRates.find(dr => dr.id === r.role_id);
          return rate ? rate.role : r.role_id;
        }
        
        return r.role_id;
      }).join(' + ')
    : 'None';
  
  // Calculate total accumulated crew hours (all crew members × their hours)
  const calculateAccumulatedCrewHours = () => {
    if (!formData?.selected_roles || formData.selected_roles.length === 0) {
      return 0;
    }
    
    // Use settings-based hours or defaults
    const fullDayHours = settings?.full_day_hours || 10;
    const halfDayHours = settings?.half_day_hours || 6;
    
    let totalHours = 0;
    
    formData.selected_roles.forEach(role => {
      const crewQty = role.crew_qty || role.quantity || 1;
      const fullDays = role.full_days || 0;
      const halfDays = role.half_days || 0;
      
      if (formData.day_type === 'custom') {
        const customHours = formData.custom_hours || fullDayHours;
        const totalDays = fullDays + halfDays;
        totalHours += crewQty * totalDays * customHours;
      } else {
        totalHours += crewQty * (fullDays * fullDayHours + halfDays * halfDayHours);
      }
    });
    
    return totalHours;
  };
  
  const hours = calculateAccumulatedCrewHours();
  
  // Get camera info - find the selected camera from cameras array, or use default
  let cameraInfo = 'None';
  if (formData?.cameras && formData.cameras.length > 0) {
    let selectedCam;
    if (formData.selected_camera) {
      selectedCam = formData.cameras.find(c => c.id === formData.selected_camera);
    }
    // If no camera selected, use the default one
    if (!selectedCam) {
      selectedCam = formData.cameras.find(c => c.is_default);
    }
    if (selectedCam) {
      cameraInfo = selectedCam.model; // Just show model (e.g., "FX3")
    }
  }
  
  // Get package type - "Crew" if crew-only, "Content" if from deliverables
  const packageType = formData?.deliverable_estimate ? 'Content' : 'Crew';
  
  // Get package info (gear included or not)
  const packageInfo = formData?.selected_gear_items?.length > 0
    ? 'Included'
    : 'None';

  return (
    <Card className="shadow-lg lg:sticky lg:top-6" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6 pb-4" style={{ borderBottom: '2px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Quote Summary</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {formData?.project_title || 'Commercial Shoot'}
          </p>
        </div>

        {/* 2x2 Grid - Key Info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Crew */}
          <div className="rounded-lg p-3 border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>CREW</div>
            <div className="mt-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {crewInfo}
            </div>
          </div>

          {/* Hours */}
          <div className="rounded-lg p-3 border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>HOURS</div>
            <div className="mt-1 font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {hours}
            </div>
          </div>

          {/* Camera */}
          <div className="rounded-lg p-3 border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>CAMERA</div>
            <div className="mt-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {cameraInfo}
            </div>
          </div>

          {/* Package */}
          <div className="rounded-lg p-3 border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>PACKAGE</div>
            <div className="mt-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {packageType}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="pt-6 pb-4" style={{ borderTop: '2px solid var(--color-border)', borderBottom: '2px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>TOTAL</div>
            {formData?.custom_discount_percent > 0 && (
              <div className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(212, 175, 55, 0.2)', color: 'var(--color-accent-primary)' }}>
                {formData.custom_discount_percent}% Discount
              </div>
            )}
            {formData?.custom_price_override && !formData?.custom_discount_percent && (
              <div className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(212, 175, 55, 0.2)', color: 'var(--color-accent-primary)' }}>
                Custom Price
              </div>
            )}
          </div>
          
          {/* Calculation breakdown */}
          {calc.laborSubtotal > 0 && (
            <div className="text-[10px] space-y-0.5 mb-2" style={{ color: 'var(--color-text-muted)' }}>
              <div className="flex justify-between">
                <span>Crew Cost:</span>
                <span>${calc.laborSubtotal?.toLocaleString() || '0'}</span>
              </div>
              {calc.operationsFee > 0 && (
                <div className="flex justify-between">
                  <span>+ Service Fee ({settings?.overhead_percent + settings?.profit_margin_percent || 30}%):</span>
                  <span>${calc.operationsFee?.toLocaleString() || '0'}</span>
                </div>
              )}
              {calc.gearAmortized > 0 && (
                <div className="flex justify-between">
                  <span>+ Gear:</span>
                  <span>${calc.gearAmortized?.toFixed(2) || '0'}</span>
                </div>
              )}
              {calc.tax > 0 && (
                <div className="flex justify-between">
                  <span>+ Tax:</span>
                  <span>${calc.tax?.toFixed(2) || '0'}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 font-medium" style={{ borderTop: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <span>Minimum Price:</span>
                <span>${calc.negotiationLow?.toLocaleString() || '0'}</span>
              </div>
            </div>
          )}
          
          <div className="text-4xl font-bold mt-2" style={{ color: 'var(--color-accent-primary)' }}>
            ${calc.total?.toLocaleString() || '0'}
          </div>
        </div>

        {/* Clear Custom Price Button */}
        {formData?.custom_price_override && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => {
              if (onUpdateCustomPrice) {
                onUpdateCustomPrice(null);
              }
              if (onUpdateDiscount) {
                onUpdateDiscount(0);
              }
              toast({
                title: "Custom Price Cleared",
                description: "Reverted to calculated total",
              });
            }}
          >
            ✕ Clear Custom Price
          </Button>
        )}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="default"
            className="w-full h-10"
            style={{ 
              background: 'var(--color-bg-secondary)', 
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              fontWeight: '600'
            }}
            onClick={() => {
              // Build full invoice text for copy/paste
              const lines = [];
              lines.push(`Quote Summary`);
              lines.push(`Project: ${formData?.project_title || 'Untitled'}`);
              if (formData?.client_name) lines.push(`Client: ${formData.client_name}`);
              lines.push('');
              lines.push('LINE ITEMS:');
              
              // Add line items
              if (calc.lineItems && calc.lineItems.length > 0) {
                calc.lineItems.forEach(item => {
                  if (item.isSection) {
                    lines.push(`\n${item.description}`);
                  } else {
                    const amount = Number(item.amount || 0);
                    lines.push(`  ${item.description}: $${amount.toFixed(2)}`);
                  }
                });
              }
              
              lines.push('');
              lines.push(`TOTAL: $${(calc.total || 0).toFixed(2)}`);
              
              if (calc.depositDue > 0) {
                lines.push(`Deposit Due: $${calc.depositDue.toFixed(2)}`);
                lines.push(`Balance Due: $${calc.balanceDue.toFixed(2)}`);
              }
              
              const fullText = lines.join('\n');
              navigator.clipboard.writeText(fullText);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              toast({
                title: "Copied!",
                description: "Full quote copied to clipboard",
              });
            }}
          >
            <span className="flex items-center gap-1">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>Ctrl+C</span>
          </Button>
          
          <Button
            variant="outline"
            size="default"
            className="w-full h-10"
            style={{ 
              background: 'var(--color-bg-secondary)', 
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              fontWeight: '600'
            }}
            onClick={() => {
              // Round the CURRENT displayed total (so you can round multiple times)
              const currentTotal = calc.total;
              const rounded = Math.ceil(currentTotal / 100) * 100;
              
              console.log('Round clicked:', { currentTotal, rounded });
              
              if (onUpdateCustomPrice) {
                onUpdateCustomPrice(rounded);
              }
              // Clear discount when rounding since we're setting a new custom price
              if (onUpdateDiscount) {
                onUpdateDiscount(0);
              }
              navigator.clipboard.writeText(rounded.toFixed(2));
              toast({
                title: "Rounded & Applied!",
                description: `$${currentTotal.toLocaleString()} → $${rounded.toLocaleString()}`,
              });
            }}
          >
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>Round</span>
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>Ctrl+R</span>
          </Button>
        </div>

        {/* Quick Discount Buttons */}
        <div className="mt-2 flex gap-2">
          {[5, 10, 15].map(percent => (
            <Button
              key={percent}
              variant="ghost"
              size="default"
              className="flex-1 text-sm h-10"
              style={{ 
                color: 'var(--color-accent-primary)',
                background: 'rgba(212, 175, 55, 0.05)'
              }}
              onClick={() => {
                const currentDiscount = formData?.custom_discount_percent || 0;
                const newTotalDiscount = currentDiscount + percent;
                
                // Apply discount to ORIGINAL total (before any custom pricing)
                const baseTotal = calc.originalTotal || calc.total;
                const discounted = baseTotal * (1 - newTotalDiscount / 100);
                
                if (onUpdateCustomPrice) {
                  onUpdateCustomPrice(discounted);
                }
                if (onUpdateDiscount) {
                  onUpdateDiscount(newTotalDiscount);
                }
                
                navigator.clipboard.writeText(discounted.toFixed(2));
                toast({
                  title: `${newTotalDiscount}% Total Discount`,
                  description: `New total: $${discounted.toLocaleString()}`,
                });
              }}
            >
              <div className="w-full flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  <span>-{percent}%</span>
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  {percent === 5 ? '1' : percent === 10 ? '2' : '3'}
                </span>
              </div>
            </Button>
          ))}
        </div>

        {/* Negotiation Range Buttons */}
        {calc.negotiationLow && calc.negotiationHigh && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Negotiation Range
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                onClick={() => {
                  if (onUpdateCustomPrice) {
                    onUpdateCustomPrice(calc.negotiationLow);
                  }
                  if (onUpdateDiscount) {
                    onUpdateDiscount(0);
                  }
                  toast({
                    title: "Low Price Applied",
                    description: `Set to $${calc.negotiationLow.toLocaleString()} (Junior rate)`,
                  });
                }}
              >
                <div className="text-center">
                  <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Low</div>
                  <div className="font-semibold">${calc.negotiationLow.toLocaleString()}</div>
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-primary)'
                }}
                onClick={() => {
                  if (onUpdateCustomPrice) {
                    onUpdateCustomPrice(calc.negotiationHigh);
                  }
                  if (onUpdateDiscount) {
                    onUpdateDiscount(0);
                  }
                  toast({
                    title: "High Price Applied",
                    description: `Set to $${calc.negotiationHigh.toLocaleString()} (Premium rate)`,
                  });
                }}
              >
                <div className="text-center">
                  <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>High</div>
                  <div className="font-semibold">${calc.negotiationHigh.toLocaleString()}</div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Deposit Info (if enabled) */}
        {settings?.deposit_enabled !== false && calc.depositDue > 0 && (
          <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)', border: '1px solid' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>Deposit Due ({settings?.deposit_percent || 50}%)</span>
              <span className="font-semibold" style={{ color: 'var(--color-accent-primary)' }}>
                ${calc.depositDue?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span style={{ color: 'var(--color-text-muted)' }}>Balance Due</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                ${calc.balanceDue?.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Here's the truth section */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <p>
              I hit <span className="font-bold" style={{ color: 'var(--color-accent-primary)' }}>100K without burning out</span>.
            </p>
            
            <p>
              Not because I worked harder. Not because I got lucky.
            </p>
            
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Because I finally valued my time.
            </p>
            
            <p>
              I built this calculator because I was tired of watching talented creatives undercharge, overwork, and wonder why they're exhausted.
            </p>
            
            <p>
              This isn't a course. It's not a masterclass. It's not going to teach you cinematography.
            </p>
            
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              It's just a tool that gives you a number you can trust.
            </p>
          </div>

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Keyboard Shortcuts
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="flex items-center justify-between gap-2">
                <span>Save Quote</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+S</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Export PDF</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+E</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>New Quote</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+N</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Duplicate Quote</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+D</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Round Price</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+R</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Copy Total</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+C</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Discount 5%</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>1</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Discount 10%</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>2</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Discount 15%</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>3</kbd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Clear Custom Price</span>
                <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Esc</kbd>
              </div>
            </div>
            <div className="mt-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Tip: use <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Cmd</kbd> on Mac instead of Ctrl.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
