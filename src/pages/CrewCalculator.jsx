import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Camera, 
  Settings, 
  AlertCircle, 
  DollarSign,
  Download,
  RotateCcw,
  Plus,
  Minus,
  Calendar,
  Package,
  Video
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { calculateQuote } from "../components/calculator/calculations";
import { STORAGE_KEYS, DEFAULT_DAY_RATES, DEFAULT_GEAR_COSTS, DEFAULT_SETTINGS } from "../components/data/defaults";

export default function CrewCalculator() {
  const { toast } = useToast();
  
  // Data state
  const [dayRates, setDayRates] = useState(DEFAULT_DAY_RATES);
  const [gearCosts, setGearCosts] = useState(DEFAULT_GEAR_COSTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state - simplified
  const [formData, setFormData] = useState({
    client_name: "",
    project_title: "",
    day_type: "full",
    custom_hours: 10,
    experience_level: "Standard",
    selected_roles: [],
    include_audio_pre_post: false,
    gear_enabled: true,
    selected_gear_items: [],
    apply_rush_fee: false,
    apply_nonprofit_discount: false,
    travel_miles: 0,
    rental_costs: 0,
    usage_rights_enabled: false,
    usage_rights_cost: 0,
    notes_for_quote: ""
  });

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load day rates
      const ratesStr = localStorage.getItem(STORAGE_KEYS.DAY_RATES);
      if (ratesStr) {
        setDayRates(JSON.parse(ratesStr));
      }
      
      // Load gear costs
      const gearStr = localStorage.getItem(STORAGE_KEYS.GEAR_COSTS);
      if (gearStr) {
        setGearCosts(JSON.parse(gearStr));
      }
      
      // Load settings
      const settingsStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsStr) {
        setSettings(JSON.parse(settingsStr));
      }
      
      // Set default gear selection
      if (gearCosts.length > 0) {
        const defaultGear = gearCosts
          .filter(g => g.include_by_default && !g.item.toLowerCase().includes('studio') && !g.item.toLowerCase().includes('rent'))
          .map(g => g.id);
        
        if (defaultGear.length > 0) {
          setFormData(prev => ({ ...prev, selected_gear_items: defaultGear }));
        }
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update custom multiplier when experience level changes
  useEffect(() => {
    if (settings?.experience_levels && formData.experience_level) {
      const presetMultiplier = settings.experience_levels[formData.experience_level];
      if (presetMultiplier !== undefined) {
        setFormData(prev => ({ ...prev, custom_multiplier: presetMultiplier }));
      }
    }
  }, [formData.experience_level, settings]);

  // Calculate quote
  const calculations = useMemo(() => {
    if (!settings || !dayRates || dayRates.length === 0 || !gearCosts || gearCosts.length === 0) {
      return null;
    }
    
    return calculateQuote(formData, dayRates, gearCosts, settings);
  }, [formData, dayRates, gearCosts, settings]);

  // Handle role selection
  const handleRoleToggle = (roleId) => {
    setFormData(prev => {
      const existing = prev.selected_roles.find(r => r.role_id === roleId);
      
      if (existing) {
        // Remove role
        return {
          ...prev,
          selected_roles: prev.selected_roles.filter(r => r.role_id !== roleId)
        };
      } else {
        // Add role with default values based on day_type
        const role = dayRates.find(r => r.id === roleId);
        const isFullDay = prev.day_type === 'full';
        const isHalfDay = prev.day_type === 'half';
        
        return {
          ...prev,
          selected_roles: [...prev.selected_roles, { 
            role_id: roleId,
            role_name: role?.role || '',
            unit_type: role?.unit_type || 'day',
            quantity: 1,
            crew_qty: 1,
            full_days: isFullDay ? 1 : 0,
            half_days: isHalfDay ? 1 : 0,
            minutes_output: 0,
            requests: 0,
            deliverable_count: 1
          }]
        };
      }
    });
  };

  // Handle role crew quantity change
  const handleRoleQuantityChange = (roleId, delta) => {
    setFormData(prev => ({
      ...prev,
      selected_roles: prev.selected_roles.map(r => {
        if (r.role_id === roleId) {
          const newQty = Math.max(1, (r.crew_qty || r.quantity || 1) + delta);
          return { ...r, quantity: newQty, crew_qty: newQty };
        }
        return r;
      })
    }));
  };

  // Handle role days change
  const handleRoleDaysChange = (roleId, field, delta) => {
    setFormData(prev => ({
      ...prev,
      selected_roles: prev.selected_roles.map(r => {
        if (r.role_id === roleId) {
          const currentValue = r[field] || 0;
          const newValue = Math.max(0, currentValue + delta);
          return { ...r, [field]: newValue };
        }
        return r;
      })
    }));
  };

  // Handle role field change (for minutes_output, requests, deliverable_count)
  const handleRoleFieldChange = (roleId, field, value) => {
    setFormData(prev => ({
      ...prev,
      selected_roles: prev.selected_roles.map(r => {
        if (r.role_id === roleId) {
          return { ...r, [field]: value };
        }
        return r;
      })
    }));
  };

  // Handle gear selection
  const handleGearToggle = (gearId) => {
    setFormData(prev => {
      const isSelected = prev.selected_gear_items.includes(gearId);
      
      if (isSelected) {
        // Remove gear
        return {
          ...prev,
          selected_gear_items: prev.selected_gear_items.filter(id => id !== gearId)
        };
      } else {
        // Add gear
        return {
          ...prev,
          selected_gear_items: [...prev.selected_gear_items, gearId]
        };
      }
    });
  };

  // Check if role is selected
  const isRoleSelected = (roleId) => {
    return formData.selected_roles.some(r => r.role_id === roleId);
  };

  // Get role quantity
  const getRoleQuantity = (roleId) => {
    const role = formData.selected_roles.find(r => r.role_id === roleId);
    return role?.quantity || 1;
  };

  // Check if gear is selected
  const isGearSelected = (gearId) => {
    return formData.selected_gear_items.includes(gearId);
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      client_name: "",
      project_title: "",
      day_type: "full",
      custom_hours: 10,
      experience_level: "Standard",
      selected_roles: [],
      include_audio_pre_post: false,
      gear_enabled: true,
      selected_gear_items: gearCosts
        .filter(g => g.include_by_default && !g.item.toLowerCase().includes('studio') && !g.item.toLowerCase().includes('rent'))
        .map(g => g.id),
      apply_rush_fee: false,
      apply_nonprofit_discount: false,
      travel_miles: 0,
      rental_costs: 0,
      usage_rights_enabled: false,
      usage_rights_cost: 0,
      notes_for_quote: ""
    });
    
    toast({
      title: "Calculator Reset",
      description: "All fields have been reset to defaults."
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Crew-Based Quote Calculator
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Professional video production pricing based on crew roles, gear, and day rates
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label>Project Title</Label>
                  <Input
                    value={formData.project_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_title: e.target.value }))}
                    placeholder="Enter project title"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Crew Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Crew Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayRates.map(role => {
                  const isSelected = isRoleSelected(role.id);
                  const quantity = getRoleQuantity(role.id);
                  
                  return (
                    <div key={role.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{role.role}</div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            ${role.full_day_rate}/day
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleQuantityChange(role.id, -1)}
                            disabled={quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleQuantityChange(role.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {/* Production Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Production Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Day Type</Label>
                  <RadioGroup value={formData.day_type} onValueChange={(value) => setFormData(prev => ({ ...prev, day_type: value }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="half" id="half" />
                      <Label htmlFor="half">Half Day ({settings?.half_day_hours || 6} hours)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full">Full Day ({settings?.full_day_hours || 10} hours)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Custom Hours</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {formData.day_type === "custom" && (
                  <div>
                    <Label>Custom Hours</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      value={formData.custom_hours}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        custom_hours: parseFloat(e.target.value) || 10
                      }))}
                    />
                  </div>
                )}
                
                <div>
                  <Label>Experience Level</Label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full p-2 rounded-lg border"
                    style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="Standard">Standard (1.0x)</option>
                    <option value="Premium">Premium (1.25x)</option>
                    <option value="Elite">Elite (1.5x)</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Audio Pre & Post</Label>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Add audio production services
                    </p>
                  </div>
                  <Switch
                    checked={formData.include_audio_pre_post}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      include_audio_pre_post: checked
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Equipment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Equipment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Equipment</Label>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Add camera, audio, and lighting gear
                    </p>
                  </div>
                  <Switch
                    checked={formData.gear_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      gear_enabled: checked
                    }))}
                  />
                </div>
                
                {formData.gear_enabled && (
                  <div className="space-y-2 pt-2">
                    {gearCosts.map(gear => {
                      const isSelected = isGearSelected(gear.id);
                      
                      return (
                        <div key={gear.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleGearToggle(gear.id)}
                            />
                            <span className="text-sm">{gear.item}</span>
                          </div>
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            ${gear.total_investment.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Additional Costs */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Travel Miles</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.travel_miles}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      travel_miles: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div>
                  <Label>Rental Costs</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.rental_costs}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rental_costs: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Usage Rights</Label>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Add licensing fees
                    </p>
                  </div>
                  <Switch
                    checked={formData.usage_rights_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      usage_rights_enabled: checked
                    }))}
                  />
                </div>
                
                {formData.usage_rights_enabled && (
                  <div>
                    <Label>Usage Rights Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.usage_rights_cost}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        usage_rights_cost: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Fees & Discounts */}
            <Card>
              <CardHeader>
                <CardTitle>Fees & Discounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Rush Fee</Label>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      +{settings?.rush_fee_percent || 25}%
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.apply_rush_fee}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      apply_rush_fee: checked
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Nonprofit Discount</Label>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      -{settings?.nonprofit_discount_percent || 15}%
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.apply_nonprofit_discount}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      apply_nonprofit_discount: checked
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes_for_quote}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes_for_quote: e.target.value }))}
                  placeholder="Add any special notes or terms for this quote..."
                  rows={4}
                />
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          
          {/* Right Column - Live Totals */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              {/* Quote Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Quote Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {calculations && (
                    <>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Labor Subtotal
                        </div>
                        <div className="font-medium">
                          ${calculations.laborSubtotal.toLocaleString()}
                        </div>
                      </div>
                      
                      {calculations.overhead > 0 && (
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Overhead ({settings?.overhead_percent || 20}%)
                          </div>
                          <div className="font-medium">
                            ${calculations.overhead.toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {calculations.profitMargin > 0 && (
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Profit Margin ({settings?.profit_margin_percent || 50}%)
                          </div>
                          <div className="font-medium">
                            ${calculations.profitMargin.toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {calculations.gearAmortized > 0 && (
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Equipment
                          </div>
                          <div className="font-medium">
                            ${calculations.gearAmortized.toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {calculations.travelCost > 0 && (
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Travel
                          </div>
                          <div className="font-medium">
                            ${calculations.travelCost.toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {calculations.rentalCosts > 0 && (
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Rentals
                          </div>
                          <div className="font-medium">
                            ${calculations.rentalCosts.toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {calculations.usageRightsCost > 0 && (
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Usage Rights
                          </div>
                          <div className="font-medium">
                            ${calculations.usageRightsCost.toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span style={{ color: 'var(--color-accent-primary)' }}>
                          ${calculations.total.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Deposit ({settings?.deposit_percent || 50}%)
                          </div>
                          <div className="font-medium">
                            ${calculations.depositDue.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Balance Due
                          </div>
                          <div className="font-medium">
                            ${calculations.balanceDue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Line Items */}
              {calculations?.lineItems && calculations.lineItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {calculations.lineItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.description}</span>
                        <span className="font-medium">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {/* Export Actions */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button className="w-full" disabled={!calculations || calculations.total === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Quote
                  </Button>
                  <Button className="w-full" variant="outline" disabled={!calculations || calculations.total === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Invoice
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
