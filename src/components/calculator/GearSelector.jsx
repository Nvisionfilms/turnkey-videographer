import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Camera, 
  Info, 
  Video, 
  Mic, 
  Lightbulb, 
  Monitor, 
  Headphones,
  Aperture,
  Battery,
  Disc,
  HardDrive,
  Cpu
} from "lucide-react";
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
  // Get icon for gear type
  const getGearIcon = (itemName) => {
    const name = itemName.toLowerCase();
    if (name.includes('camera') || name.includes('body')) return Camera;
    if (name.includes('lens')) return Aperture;
    if (name.includes('light') || name.includes('led')) return Lightbulb;
    if (name.includes('mic') || name.includes('audio') || name.includes('sound')) return Mic;
    if (name.includes('monitor') || name.includes('screen')) return Monitor;
    if (name.includes('drone') || name.includes('gimbal') || name.includes('stabilizer')) return Video;
    if (name.includes('battery') || name.includes('power')) return Battery;
    if (name.includes('storage') || name.includes('card') || name.includes('ssd')) return HardDrive;
    if (name.includes('recorder') || name.includes('capture')) return Disc;
    if (name.includes('computer') || name.includes('laptop')) return Cpu;
    if (name.includes('headphone')) return Headphones;
    return Camera; // Default icon
  };

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

            {/* Grid of gear cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gearCosts.map((gear) => {
                const selected = isGearSelected(gear.id);
                const GearIcon = getGearIcon(gear.item);
                const dailyCost = (gear.total_investment / amortizationDays).toFixed(2);
                
                return (
                  <div key={gear.id} className="relative">
                    {/* Gear Card Button */}
                    <button
                      type="button"
                      onClick={() => handleGearToggle(gear.id, !selected)}
                      className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-center ${
                        selected 
                          ? 'border-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] shadow-lg' 
                          : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent-primary)] hover:shadow-md'
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex justify-center mb-3">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ 
                            background: selected ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <GearIcon 
                            className="w-8 h-8" 
                            style={{ 
                              color: selected ? 'white' : 'var(--color-accent-primary)',
                              strokeWidth: 2
                            }} 
                          />
                        </div>
                      </div>
                      
                      {/* Gear Name */}
                      <h4 
                        className="text-sm font-bold mb-2 line-clamp-2" 
                        style={{ color: 'var(--color-text-primary)', minHeight: '2.5rem' }}
                      >
                        {gear.item}
                      </h4>
                      
                      {/* Investment & Daily Cost */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>Investment:</span>
                          <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                            ${gear.total_investment.toLocaleString()}
                          </span>
                        </div>
                        <div 
                          className="text-sm font-bold px-3 py-1 rounded-full inline-block"
                          style={{ 
                            background: selected ? 'rgba(37, 99, 235, 0.1)' : 'var(--color-bg-tertiary)',
                            color: selected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
                          }}
                        >
                          ${dailyCost}/day
                        </div>
                      </div>
                      
                      {/* Selected Checkmark */}
                      {selected && (
                        <div 
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--color-success)' }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
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