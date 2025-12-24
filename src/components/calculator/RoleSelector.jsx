import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  AlertCircle, 
  Camera, 
  Video, 
  Mic, 
  Lightbulb, 
  Clapperboard, 
  Film, 
  UserCircle,
  Headphones,
  Palette,
  Briefcase
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RoleSelector({ 
  dayRates, 
  selectedRoles, 
  onRoleChange, 
  dayType,
  customHours = 10,
  cardClassName, 
  cardHeaderClassName, 
  cardTitleClassName, 
  labelClassName, 
  textMutedClassName, 
  inputClassName, 
  checkboxHoverBgClassName 
}) {
  // Get icon for role type
  const getRoleIcon = (roleName) => {
    const name = roleName.toLowerCase();
    if (name.includes('director') || name.includes('dp') || name.includes('cinematographer')) return Camera;
    if (name.includes('camera') || name.includes('operator')) return Video;
    if (name.includes('audio') || name.includes('sound')) return Mic;
    if (name.includes('gaffer') || name.includes('lighting') || name.includes('electric')) return Lightbulb;
    if (name.includes('producer')) return Clapperboard;
    if (name.includes('editor')) return Film;
    if (name.includes('ac') || name.includes('assistant')) return UserCircle;
    if (name.includes('grip')) return Briefcase;
    if (name.includes('color')) return Palette;
    return Video; // Default icon
  };

  const handleRoleToggle = (rate, checked) => {
    if (checked) {
      onRoleChange([...selectedRoles, {
        role_id: rate.id,
        role_name: rate.role,
        unit_type: rate.unit_type,
        quantity: rate.unit_type === 'day' ? 1 : 0,
        crew_qty: rate.unit_type === 'day' ? 1 : 0,
        half_days: rate.unit_type === 'day' ? (dayType === 'half' ? 1 : 0) : 0,
        full_days: rate.unit_type === 'day' ? (dayType === 'full' ? 1 : (dayType === 'half' ? 0 : 1)) : 0,
        minutes_output: 0,
        requests: 0,
        deliverable_count: 0
      }]);
    } else {
      onRoleChange(selectedRoles.filter(r => r.role_id !== rate.id));
    }
  };

  const handleQuantityChange = (roleId, field, value) => {
    onRoleChange(selectedRoles.map(role => 
      role.role_id === roleId ? { ...role, [field]: parseFloat(value) || 0 } : role
    ));
  };

  const isRoleSelected = (rateId) => selectedRoles.some(r => r.role_id === rateId);
  const getSelectedRole = (rateId) => selectedRoles.find(r => r.role_id === rateId);

  const getRateDisplay = (rate) => {
    if (rate.unit_type !== 'day') {
      if (rate.unit_type === 'per_5_min') {
        const rateToUse = dayType === "half" && rate.half_day_rate > 0 
          ? rate.half_day_rate 
          : rate.full_day_rate;
        return `$${rateToUse}/5-min block`;
      }
      if (rate.unit_type === 'per_deliverable') {
        const rateToUse = dayType === "half" && rate.half_day_rate > 0 
          ? rate.half_day_rate 
          : rate.full_day_rate;
        return `$${rateToUse}/deliverable`;
      }
      if (rate.unit_type === 'per_request') {
        return `$${rate.full_day_rate}/request`;
      }
      if (rate.unit_type === 'flat') {
        return `$${rate.full_day_rate} (flat rate)`;
      }
    }

    // For day-based rates, show what's being used based on day_type
    if (dayType === "custom") {
      const hourlyRate = rate.full_day_rate / 10; // Assuming 10-hour base
      const dayRate = hourlyRate * customHours;
      return `$${dayRate.toFixed(2)}/day (${customHours}h @ $${hourlyRate.toFixed(2)}/hr)`;
    }
    
    if (dayType === "half") {
      return `$${rate.half_day_rate}/half day (≤6h)`;
    }
    
    if (dayType === "full") {
      return `$${rate.full_day_rate}/full day (up to 10h)`;
    }
    
    return 'No pricing model selected';
  };

  const getQuantityLabel = () => {
    if (dayType === "half") return "Half Days";
    if (dayType === "full") return "Full Days";
    if (dayType === "custom") return "Days";
    return "Days";
  };

  const hasNoPricingModel = !dayType || dayType === "";

  return (
    <Card className={cardClassName || "shadow-md border-slate-200"}>
      <CardHeader className={cardHeaderClassName || ""}>
        <CardTitle className={`flex items-center gap-2 text-lg ${cardTitleClassName || ""}`}>
          <Users className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
          Roles & Services
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {hasNoPricingModel && (
          <Alert className="mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-error)' }}>
            <AlertCircle className="h-4 w-4" style={{ color: 'var(--color-error)' }} />
            <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
              Please select a pricing model above to see rates and add roles.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Grid of role cards - 3 cols on mobile, 4 on md, 5 on lg */}
        <div className={`grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-3 ${hasNoPricingModel ? 'opacity-50 pointer-events-none' : ''}`}>
          {dayRates.filter(r => r.active && r.unit_type !== 'flat').map((rate) => {
            const selected = isRoleSelected(rate.id);
            const selectedRole = getSelectedRole(rate.id);
            const RoleIcon = getRoleIcon(rate.role);
            
            return (
              <div key={rate.id} className="relative">
                {/* Role Card Button - compact on mobile */}
                <button
                  onClick={() => handleRoleToggle(rate, !selected)}
                  disabled={hasNoPricingModel}
                  className={`w-full p-2 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 text-center ${
                    selected 
                      ? 'border-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] shadow-lg' 
                      : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent-primary)] hover:shadow-md'
                  }`}
                  style={{
                    cursor: hasNoPricingModel ? 'not-allowed' : 'pointer'
                  }}
                >
                  {/* Icon - smaller on mobile */}
                  <div className="flex justify-center mb-1 md:mb-3">
                    <div 
                      className="w-8 h-8 md:w-14 md:h-14 rounded-full flex items-center justify-center"
                      style={{ 
                        background: selected ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <RoleIcon 
                        className="w-4 h-4 md:w-7 md:h-7" 
                        style={{ 
                          color: selected ? 'var(--color-bg-primary)' : 'var(--color-accent-primary)',
                          strokeWidth: 2
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Role Name - smaller on mobile */}
                  <h3 
                    className="text-[10px] md:text-sm font-semibold leading-tight line-clamp-2" 
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {rate.role}
                  </h3>
                  
                  {/* Rate Description - hidden on mobile, shown on md+ */}
                  <p 
                    className="hidden md:block text-xs mt-1" 
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {getRateDisplay(rate)}
                  </p>
                  
                  {/* Selected Checkmark */}
                  {selected && (
                    <div 
                      className="absolute top-1 right-1 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--color-accent-primary)' }}
                    >
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3" style={{ color: 'var(--color-bg-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
                
                {/* Quantity Input (appears below when selected) */}
                {selected && (
                  <div className="mt-2 p-2 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <div className="flex gap-2">
                      {rate.unit_type === 'day' && (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="text-[8px] text-center mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Crew</div>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={selectedRole?.crew_qty ?? 1}
                              onChange={(e) => handleQuantityChange(rate.id, 'crew_qty', e.target.value)}
                              className="h-7 text-xs text-center px-1"
                              style={{ 
                                background: 'var(--color-input-bg)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)'
                              }}
                            />
                          </div>
                          {dayType !== 'custom' ? (
                            <>
                              <div className="flex-1 min-w-0">
                                <div className="text-[8px] text-center mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Half</div>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={selectedRole?.half_days ?? 0}
                                  onChange={(e) => handleQuantityChange(rate.id, 'half_days', e.target.value)}
                                  className="h-7 text-xs text-center px-1"
                                  style={{ 
                                    background: 'var(--color-input-bg)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[8px] text-center mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Full</div>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={selectedRole?.full_days ?? 0}
                                  onChange={(e) => handleQuantityChange(rate.id, 'full_days', e.target.value)}
                                  className="h-7 text-xs text-center px-1"
                                  style={{ 
                                    background: 'var(--color-input-bg)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="text-[8px] text-center mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Days</div>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={selectedRole?.quantity || 0}
                                onChange={(e) => handleQuantityChange(rate.id, 'quantity', e.target.value)}
                                className="h-7 text-xs text-center px-1"
                                style={{ 
                                  background: 'var(--color-input-bg)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)'
                                }}
                              />
                            </div>
                          )}
                        </>
                      )}
                      {rate.unit_type === 'per_5_min' && (
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] text-center mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Min</div>
                          <Input
                            type="number"
                            min="0"
                            value={selectedRole?.minutes_output || 0}
                            onChange={(e) => handleQuantityChange(rate.id, 'minutes_output', e.target.value)}
                            className="h-7 text-xs text-center px-1"
                            style={{ 
                              background: 'var(--color-input-bg)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-primary)'
                            }}
                          />
                        </div>
                      )}
                      {rate.unit_type === 'per_deliverable' && (
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] text-center mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Qty</div>
                          <Input
                            type="number"
                            min="0"
                            value={selectedRole?.deliverable_count || 0}
                            onChange={(e) => handleQuantityChange(rate.id, 'deliverable_count', e.target.value)}
                            className="h-7 text-xs text-center px-1"
                            style={{ 
                              background: 'var(--color-input-bg)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-primary)'
                            }}
                          />
                        </div>
                      )}
                      {rate.unit_type === 'per_request' && (
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] text-center mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Req</div>
                          <Input
                            type="number"
                            min="0"
                            value={selectedRole?.requests || 0}
                            onChange={(e) => handleQuantityChange(rate.id, 'requests', e.target.value)}
                            className="h-7 text-xs text-center px-1"
                            style={{ 
                              background: 'var(--color-input-bg)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-primary)'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}