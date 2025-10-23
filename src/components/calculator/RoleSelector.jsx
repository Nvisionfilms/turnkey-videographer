import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, AlertCircle } from "lucide-react";
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
  const handleRoleToggle = (rate, checked) => {
    if (checked) {
      onRoleChange([...selectedRoles, {
        role_id: rate.id,
        role_name: rate.role,
        unit_type: rate.unit_type,
        quantity: rate.unit_type === 'day' ? 1 : 0,
        minutes_output: 0,
        requests: 0
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
      <CardHeader className={cardHeaderClassName || "bg-slate-50 border-b border-slate-200"}>
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
        
        <div className={`space-y-4 ${hasNoPricingModel ? 'opacity-50 pointer-events-none' : ''}`}>
          {dayRates.filter(r => r.active && r.unit_type !== 'flat').map((rate) => {
            const selected = isRoleSelected(rate.id);
            const selectedRole = getSelectedRole(rate.id);
            
            return (
              <div key={rate.id} className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${checkboxHoverBgClassName || "hover:bg-slate-50"}`}>
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => handleRoleToggle(rate, checked)}
                  className="mt-1"
                  disabled={hasNoPricingModel}
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className={`font-medium ${labelClassName || "text-slate-900"}`}>{rate.role}</Label>
                    <p className={`text-xs mt-0.5 ${textMutedClassName || "text-slate-500"}`}>
                      {getRateDisplay(rate)}
                    </p>
                  </div>
                  
                  {selected && (
                    <div className="flex gap-3">
                      {rate.unit_type === 'day' && (
                        <div className="w-24">
                          <Label className={`text-xs ${labelClassName || "text-slate-600"}`}>
                            {getQuantityLabel()}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={selectedRole?.quantity || 0}
                            onChange={(e) => handleQuantityChange(rate.id, 'quantity', e.target.value)}
                            className={`h-8 ${inputClassName || ""}`}
                          />
                        </div>
                      )}
                      {rate.unit_type === 'per_5_min' && (
                        <div className="w-32">
                          <Label className={`text-xs ${labelClassName || "text-slate-600"}`}>Minutes Output</Label>
                          <Input
                            type="number"
                            min="0"
                            value={selectedRole?.minutes_output || 0}
                            onChange={(e) => handleQuantityChange(rate.id, 'minutes_output', e.target.value)}
                            className={`h-8 ${inputClassName || ""}`}
                          />
                        </div>
                      )}
                      {rate.unit_type === 'per_request' && (
                        <div className="w-24">
                          <Label className={`text-xs ${labelClassName || "text-slate-600"}`}>Requests</Label>
                          <Input
                            type="number"
                            min="0"
                            value={selectedRole?.requests || 0}
                            onChange={(e) => handleQuantityChange(rate.id, 'requests', e.target.value)}
                            className={`h-8 ${inputClassName || ""}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}