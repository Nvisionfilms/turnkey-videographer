import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function GearSelector({ 
  gearCosts, 
  selectedGear, 
  onGearChange, 
  settings,
  gearEnabled,
  onGearEnabledChange,
  cardClassName, 
  cardHeaderClassName, 
  cardTitleClassName, 
  labelClassName, 
  textMutedClassName,
  checkboxHoverBgClassName 
}) {
  const handleGearToggle = (gearId, checked) => {
    if (checked) {
      onGearChange([...selectedGear, gearId]);
    } else {
      onGearChange(selectedGear.filter(id => id !== gearId));
    }
  };

  const isGearSelected = (gearId) => selectedGear.includes(gearId);

  const totalInvestment = gearCosts
    .filter(g => selectedGear.includes(g.id))
    .reduce((sum, g) => sum + g.total_investment, 0);

  const amortizationDays = settings?.gear_amortization_days || 180;
  const dailyRate = totalInvestment / amortizationDays;

  return (
    <Card className={cardClassName || "shadow-md border-slate-200"}>
      <CardHeader className={cardHeaderClassName || "bg-slate-50 border-b border-slate-200"}>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-lg ${cardTitleClassName || ""}`}>
            <Camera className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            Gear & Equipment
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="gear-enabled" className={`text-sm ${labelClassName || ""}`}>
              Include Gear
            </Label>
            <Switch
              id="gear-enabled"
              checked={gearEnabled}
              onCheckedChange={onGearEnabledChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {gearEnabled ? (
          <>
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(var(--color-accent-primary-rgb), 0.1)' }}>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-accent-primary)' }} />
                <div className="flex-1">
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-accent-primary)' }}>
                    Gear Amortization: ${dailyRate.toFixed(2)}/day
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Total investment: ${totalInvestment.toLocaleString()} ÷ {amortizationDays} days = ${dailyRate.toFixed(2)} per job-day
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {gearCosts.map((gear) => {
                const selected = isGearSelected(gear.id);
                
                return (
                  <div 
                    key={gear.id} 
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${checkboxHoverBgClassName || "hover:bg-slate-50"}`}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => handleGearToggle(gear.id, checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label className={`font-medium ${labelClassName || "text-slate-900"}`}>
                        {gear.item}
                      </Label>
                      <p className={`text-xs mt-0.5 ${textMutedClassName || "text-slate-500"}`}>
                        Investment: ${gear.total_investment.toLocaleString()} → ${(gear.total_investment / amortizationDays).toFixed(2)}/day
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
            <p className={`text-sm ${textMutedClassName || ""}`}>
              Gear costs are currently disabled. Toggle "Include Gear" above to add equipment charges.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}