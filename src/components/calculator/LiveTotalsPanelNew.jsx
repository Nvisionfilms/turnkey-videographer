import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function LiveTotalsPanel({ calculations, settings, formData, dayRates, onUpdateCustomPrice, onUpdateDiscount }) {
  const { toast } = useToast();
  if (!calculations) {
    return (
      <Card className="shadow-lg sticky top-6" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <CardContent className="p-6">
          <Alert style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
            <AlertCircle className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
              Select crew and schedule to see scope total.
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

        {/* Scope Summary - Contract Block */}
        <div className="pt-6 pb-4" style={{ borderTop: '2px solid var(--color-border)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Scope Summary
          </div>
          
          <div className="space-y-2 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {/* Crew Scope Total */}
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>Crew Scope Total</span>
              <span style={{ color: 'var(--color-text-primary)' }}>${(calc.laborSubtotal || 0).toLocaleString()}</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Labor cost for defined crew and schedule.
            </div>
            
            {/* Responsibility Add-Ons */}
            <div className="flex justify-between pt-2">
              <span style={{ color: 'var(--color-text-secondary)' }}>Responsibility Add-Ons</span>
              <span style={{ color: 'var(--color-text-primary)' }}>${((calc.gearAmortized || 0) + (calc.travelCost || 0) + (calc.rentalCost || 0)).toLocaleString()}</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Gear, travel, rentals, and other scope items.
            </div>
            
            {/* Complexity Multiplier */}
            <div className="flex justify-between pt-2">
              <span style={{ color: 'var(--color-text-secondary)' }}>Complexity Multiplier</span>
              <span style={{ color: 'var(--color-text-primary)' }}>${(calc.operationsFee || 0).toLocaleString()}</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Overhead and margin applied to scope.
            </div>
            
            {/* Scope-Locked Total */}
            <div className="flex justify-between pt-3 mt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Scope-Locked Total</span>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>${(calc.total || 0).toLocaleString()}</span>
            </div>
          </div>
          
          {/* Footer clause */}
          <div className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
            Based on defined scope and constraints.
          </div>
        </div>

        {/* Clear Custom Price Button - minimal */}
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
                title: "Price Reset",
                description: "Reverted to scope-locked total",
              });
            }}
          >
            Reset to scope total
          </Button>
        )}

        {/* Keyboard Shortcuts - minimal reference */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Shortcuts
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            <div className="flex items-center justify-between gap-2">
              <span>Export</span>
              <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+E</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Copy</span>
              <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+C</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>New</span>
              <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+N</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Save</span>
              <kbd className="px-2 py-1 rounded font-mono" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>Ctrl+S</kbd>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
