import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check, DollarSign, Percent } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function LiveTotalsPanel({ calculations, settings, formData, onUpdateCustomPrice, onUpdateDiscount }) {
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
  
  // Get crew info
  const crewInfo = formData?.selected_roles?.length > 0 
    ? formData.selected_roles.map(r => r.role_name || r.role_id).join(' + ')
    : 'None';
  
  // Get hours
  const hours = formData?.custom_hours || calc?.hours || 8;
  
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
  
  // Get lighting info  
  const lightingInfo = formData?.selected_gear_items?.length > 0
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

          {/* Lighting */}
          <div className="rounded-lg p-3 border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>LIGHTING</div>
            <div className="mt-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {lightingInfo}
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
              navigator.clipboard.writeText(calc.total?.toFixed(2) || '0');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              toast({
                title: "Copied!",
                description: `$${calc.total?.toFixed(2)} copied to clipboard`,
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
