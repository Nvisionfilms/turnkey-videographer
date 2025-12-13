import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Award, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ExperienceLevelSelector({ 
  selectedLevel, 
  onLevelChange, 
  customMultiplier, 
  onCustomMultiplierChange,
  experienceLevels,
  cardClassName,
  cardHeaderClassName,
  cardTitleClassName,
  labelClassName,
  textMutedClassName,
  inputClassName,
  checkboxHoverBgClassName
}) {
  const levels = experienceLevels || { Junior: 0.65, Standard: 1.0, Senior: 1.35 };
  
  // Check if custom multiplier matches any preset
  const currentPresetMatch = Object.entries(levels).find(([_, mult]) => 
    Math.abs(mult - customMultiplier) < 0.01
  );
  
  const isCustom = !currentPresetMatch;
  const displayPercent = Math.round(customMultiplier * 100);

  const handlePresetSelect = (level) => {
    const multiplier = levels[level];
    onLevelChange(level);
    onCustomMultiplierChange(multiplier);
    // Clear any custom price override when selecting a preset
    if (window.clearCustomPriceOverride) {
      window.clearCustomPriceOverride();
    }
  };

  const handleSliderChange = (value) => {
    const newMultiplier = value[0] / 100;
    onCustomMultiplierChange(newMultiplier);
    
    // Check if the new value matches a preset
    const matchingPreset = Object.entries(levels).find(([_, mult]) => 
      Math.abs(mult - newMultiplier) < 0.01
    );
    
    if (matchingPreset) {
      onLevelChange(matchingPreset[0]);
      // Clear any custom price override when matching preset
      if (window.clearCustomPriceOverride) {
        window.clearCustomPriceOverride();
      }
    }
  };

  const handleUsePreset = () => {
    if (selectedLevel && levels[selectedLevel]) {
      const presetMultiplier = levels[selectedLevel];
      onCustomMultiplierChange(presetMultiplier);
      // Clear any custom price override when using preset
      if (window.clearCustomPriceOverride) {
        window.clearCustomPriceOverride();
      }
    }
  };

  return (
    <Card className={cardClassName || "shadow-md"}>
      <CardHeader className={cardHeaderClassName || ""}>
        <CardTitle className={`flex items-center gap-2 ${cardTitleClassName || ""}`}>
          <Award className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
          Experience Level & Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Experience Level Dropdown */}
        <div>
          <Label className={labelClassName || ""}>Experience Level</Label>
          <Select value={selectedLevel} onValueChange={handlePresetSelect}>
            <SelectTrigger className={inputClassName || ""}>
              <SelectValue>
                <span>{selectedLevel}</span>
                <span className="ml-2" style={{ color: 'var(--color-accent-primary)' }}>
                  {levels[selectedLevel] ? `${Math.round(levels[selectedLevel] * 100)}%` : '100%'}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              {Object.entries(levels).map(([level, multiplier]) => (
                <SelectItem 
                  key={level} 
                  value={level}
                  className="hover:bg-[var(--color-bg-tertiary)]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span>{level}</span>
                  <span className="ml-2" style={{ color: 'var(--color-accent-primary)' }}>
                    {Math.round(multiplier * 100)}%
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className={labelClassName || ""}>
              <div className="flex items-center gap-2">
                <span>Custom Rate Adjustment</span>
                <Info className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </Label>
            {isCustom && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUsePreset}
                style={{ 
                  background: 'var(--color-bg-tertiary)', 
                  color: 'var(--color-accent-primary)',
                  borderColor: 'var(--color-accent-primary)',
                  fontSize: '12px',
                  padding: '4px 12px',
                  height: 'auto'
                }}
              >
                Use Preset
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className={textMutedClassName || ""}>30%</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--color-accent-primary)' }}>
                {displayPercent}%
              </span>
              <span className={textMutedClassName || ""}>200%</span>
            </div>
            
            <Slider
              value={[displayPercent]}
              onValueChange={handleSliderChange}
              min={30}
              max={200}
              step={5}
              className="w-full"
            />
            
            {isCustom && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(var(--color-accent-primary-rgb), 0.1)', borderColor: 'var(--color-accent-primary)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                  <span className="font-medium text-sm" style={{ color: 'var(--color-accent-primary)' }}>
                    Custom Pricing Active
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  All labor rates are multiplied by {customMultiplier.toFixed(2)}x ({displayPercent}%)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preset Descriptions */}
        <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Experience Level Guide:</p>
          <div className="space-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <p><strong>Junior:</strong> Entry-level rates (~65% of standard)</p>
            <p><strong>Standard:</strong> Mid-level professional rates (100%)</p>
            <p><strong>Senior:</strong> Expert/Premium rates (~135% of standard)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}