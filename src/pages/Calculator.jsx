
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RotateCcw, AlertCircle, Download, Mail, Shield, Calendar as CalendarIcon, Lock, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import LiveTotalsPanel from "../components/calculator/LiveTotalsPanel";
import RoleSelector from "../components/calculator/RoleSelector";
import GearSelector from "../components/calculator/GearSelector";
import ExperienceLevelSelector from "../components/calculator/ExperienceLevelSelector";
import { calculateQuote } from "../components/calculator/calculations";
import { ExportService } from "../components/services/ExportService";
import { STORAGE_KEYS, DEFAULT_DAY_RATES, DEFAULT_GEAR_COSTS, DEFAULT_SETTINGS } from "../components/data/defaults";
import { useUnlockStatus } from "../components/hooks/useUnlockStatus";

export default function Calculator() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use centralized unlock status
  const { 
    isUnlocked, 
    hasUsedFreeQuote, 
    trialDaysLeft, 
    isTrialActive,
    markFreeQuoteUsed 
  } = useUnlockStatus();
  
  // State for data - initialize with defaults immediately
  const [dayRates, setDayRates] = useState(DEFAULT_DAY_RATES);
  const [gearCosts, setGearCosts] = useState(DEFAULT_GEAR_COSTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Form data state
  const [formData, setFormData] = useState({
    client_name: "",
    project_title: "",
    shoot_dates: [],
    day_type: "full",
    custom_hours: 10,
    custom_hourly_rate: 250,
    experience_level: "Standard",
    custom_multiplier: 1.0,
    selected_roles: [],
    include_audio_pre_post: false,
    gear_enabled: true,
    selected_gear_items: [],
    apply_nonprofit_discount: false,
    apply_rush_fee: false,
    travel_miles: 0,
    rental_costs: 0,
    notes_for_quote: ""
  });

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      console.log('=== LOADING DATA FROM LOCALSTORAGE ===');
      
      // Load day rates
      const ratesStr = localStorage.getItem(STORAGE_KEYS.DAY_RATES);
      if (ratesStr) {
        const loadedRates = JSON.parse(ratesStr);
        console.log('Loaded day rates:', loadedRates);
        setDayRates(loadedRates);
      } else {
        console.log('No day rates in localStorage, using defaults');
        localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(DEFAULT_DAY_RATES));
      }

      // Load gear costs
      const gearStr = localStorage.getItem(STORAGE_KEYS.GEAR_COSTS);
      if (gearStr) {
        const loadedGear = JSON.parse(gearStr);
        console.log('Loaded gear costs:', loadedGear);
        setGearCosts(loadedGear);
      } else {
        console.log('No gear costs in localStorage, using defaults');
        localStorage.setItem(STORAGE_KEYS.GEAR_COSTS, JSON.stringify(DEFAULT_GEAR_COSTS));
      }

      // Load settings
      const settingsStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsStr) {
        const loadedSettings = JSON.parse(settingsStr);
        console.log('Loaded settings:', loadedSettings);
        setSettings(loadedSettings);
      } else {
        console.log('No settings in localStorage, using defaults');
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }

      // Load saved form data
      const savedFormData = localStorage.getItem(STORAGE_KEYS.CALCULATOR_SESSION);
      if (savedFormData) {
        const parsed = JSON.parse(savedFormData);
        console.log('Loaded saved form data:', parsed);
        setFormData(parsed);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setIsLoading(false);
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.CALCULATOR_SESSION, JSON.stringify(formData));
      console.log('Saved form data to localStorage:', formData);
    }
  }, [formData, isLoading]);

  // Listen for storage changes from Admin page
  useEffect(() => {
    const handleStorageChange = (e) => {
      console.log('Storage change detected:', e.key);
      if (e.key === STORAGE_KEYS.DAY_RATES && e.newValue) {
        const newRates = JSON.parse(e.newValue);
        console.log('Updating day rates from storage event:', newRates);
        setDayRates(newRates);
      }
      if (e.key === STORAGE_KEYS.GEAR_COSTS && e.newValue) {
        const newGear = JSON.parse(e.newValue);
        console.log('Updating gear costs from storage event:', newGear);
        setGearCosts(newGear);
      }
      if (e.key === STORAGE_KEYS.SETTINGS && e.newValue) {
        const newSettings = JSON.parse(e.newValue);
        console.log('Updating settings from storage event:', newSettings);
        setSettings(newSettings);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Set default gear selection when gear costs first load
  useEffect(() => {
    if (gearCosts.length > 0 && formData.selected_gear_items.length === 0 && formData.gear_enabled && !isLoading) {
      const defaultGear = gearCosts
        .filter(g => g.include_by_default && !g.item.toLowerCase().includes('studio') && !g.item.toLowerCase().includes('rent'))
        .map(g => g.id);
      
      if (defaultGear.length > 0) {
        console.log('Setting default gear:', defaultGear);
        setFormData(prev => ({ ...prev, selected_gear_items: defaultGear }));
      }
    }
  }, [gearCosts, isLoading]);

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
    console.log('=== RUNNING CALCULATIONS ===');
    console.log('dayRates:', dayRates);
    console.log('gearCosts:', gearCosts);
    console.log('settings:', settings);
    console.log('formData:', formData);
    
    if (!settings || !dayRates || dayRates.length === 0 || !gearCosts || gearCosts.length === 0) {
      console.log('Missing required data for calculations');
      return null;
    }
    
    const result = calculateQuote(formData, dayRates, gearCosts, settings);
    console.log('Calculation result:', result);
    return result;
  }, [formData, dayRates, gearCosts, settings]);

  const checkAccessAndProceed = (action) => {
    if (isUnlocked) {
      action();
    } else if (hasUsedFreeQuote) {
      toast({
        title: "Unlock Required",
        description: "You've used your complimentary quote. Please unlock or start a 3-day trial.",
        variant: "destructive",
      });
      navigate(createPageUrl("Unlock"));
    } else {
      markFreeQuoteUsed();
      action();
      toast({
        title: "Free Quote Used",
        description: "This was your complimentary quote. Unlock or try 3-day trial for unlimited access.",
      });
      setTimeout(() => {
        navigate(createPageUrl("Unlock"));
      }, 3000);
    }
  };

  const handleReset = () => {
    const defaultGear = gearCosts
      .filter(g => g.include_by_default && !g.item.toLowerCase().includes('studio') && !g.item.toLowerCase().includes('rent'))
      .map(g => g.id);
    
    const defaultData = {
      client_name: "",
      project_title: "",
      shoot_dates: [],
      day_type: "full",
      custom_hours: 10,
      custom_hourly_rate: 250,
      experience_level: "Standard",
      custom_multiplier: 1.0,
      selected_roles: [],
      include_audio_pre_post: false,
      gear_enabled: true,
      selected_gear_items: defaultGear,
      apply_nonprofit_discount: false,
      apply_rush_fee: false,
      travel_miles: 0,
      rental_costs: 0,
      notes_for_quote: ""
    };
    setFormData(defaultData);
    toast({
      title: "Calculator Reset",
      description: "All fields have been reset to default values.",
    });
  };

  const handleSaveAsDefault = () => {
    const settingsToSave = {
      ...formData,
      client_name: "",
      project_title: "",
      shoot_dates: [],
      notes_for_quote: ""
    };
    localStorage.setItem(STORAGE_KEYS.SAVED_SETTINGS, JSON.stringify(settingsToSave));
    toast({
      title: "Settings Saved",
      description: "Your current calculator settings have been saved as default.",
    });
  };

  const handleLoadSavedSettings = () => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_SETTINGS);
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved);
        setFormData(savedSettings);
        toast({
          title: "Settings Loaded",
          description: "Your saved default settings have been loaded.",
        });
      } catch (e) {
        console.error('Failed to load saved settings', e);
        toast({
          title: "Error Loading Settings",
          description: "Failed to load saved settings.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Saved Settings",
        description: "There are no default settings saved.",
      });
    }
  };

  const handleClearSavedSettings = () => {
    localStorage.removeItem(STORAGE_KEYS.SAVED_SETTINGS);
    toast({
      title: "Settings Cleared",
      description: "Your saved default settings have been cleared.",
    });
  };

  const hasSavedSettings = () => {
    return localStorage.getItem(STORAGE_KEYS.SAVED_SETTINGS) !== null;
  };

  const formatShootDates = () => {
    if (!formData.shoot_dates || formData.shoot_dates.length === 0) return "Select dates";
    
    const sortedDates = [...formData.shoot_dates].sort((a, b) => new Date(a) - new Date(b));
    
    if (sortedDates.length === 1) {
      return format(new Date(sortedDates[0]), "MMM d, yyyy");
    }
    
    if (sortedDates.length === 2) {
      return `${format(new Date(sortedDates[0]), "MMM d")} - ${format(new Date(sortedDates[1]), "MMM d, yyyy")}`;
    }
    
    return `${format(new Date(sortedDates[0]), "MMM d")} - ${format(new Date(sortedDates[sortedDates.length - 1]), "MMM d, yyyy")} (${sortedDates.length} days)`;
  };

  const handleCopyEmail = () => {
    checkAccessAndProceed(() => {
      if (!calculations) return;
      
      const exportService = new ExportService(
        formData,
        calculations,
        dayRates,
        gearCosts,
        settings
      );
      
      const emailText = exportService.generateEmailText();
      navigator.clipboard.writeText(emailText);
      
      toast({
        title: "Quote copied",
        description: "Quote text has been copied to clipboard.",
      });
    });
  };

  const handlePrintReceipt = () => {
    checkAccessAndProceed(() => {
      if (!calculations) return;
      
      const exportService = new ExportService(
        formData,
        calculations,
        dayRates,
        gearCosts,
        settings
      );
      
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(exportService.generateClientHTML());
      printWindow.document.close();
    });
  };

  const handlePrint = () => {
    checkAccessAndProceed(() => {
      if (!calculations) return;
      
      const exportService = new ExportService(
        formData,
        calculations,
        dayRates,
        gearCosts,
        settings
      );
      
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(exportService.generateBusinessHTML());
      printWindow.document.close();
    });
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-accent-primary)' }}></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading calculator...</p>
        </div>
      </div>
    );
  }

  console.log('=== RENDER STATE ===');
  console.log('dayRates count:', dayRates.length);
  console.log('gearCosts count:', gearCosts.length);
  console.log('settings:', settings);
  console.log('formData.selected_roles:', formData.selected_roles);
  console.log('calculations:', calculations);

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Quote Calculator</h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>Create professional quotes with industry-standard pricing</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isUnlocked && hasUsedFreeQuote && (
                <Button
                  onClick={() => navigate(createPageUrl("Unlock"))}
                  variant="outline"
                  size="sm"
                  style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)', borderColor: 'var(--color-accent-primary)', boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)' }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock Unlimited
                </Button>
              )}
              {hasSavedSettings() && (
                <Button
                  onClick={handleLoadSavedSettings}
                  variant="outline"
                  size="sm"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
                >
                  Load Saved Settings
                </Button>
              )}
              <Button
                onClick={handleSaveAsDefault}
                variant="outline"
                size="sm"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                Save as Default
              </Button>
              {hasSavedSettings() && (
                <Button
                  onClick={handleClearSavedSettings}
                  variant="outline"
                  size="sm"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
                >
                  Clear Saved
                </Button>
              )}
              <Button
                onClick={handleCopyEmail}
                variant="outline"
                size="sm"
                disabled={!calculations}
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Copy Text
              </Button>
              <Button
                onClick={handlePrintReceipt}
                variant="outline"
                size="sm"
                disabled={!calculations}
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                <Download className="w-4 h-4 mr-2" />
                Client Quote
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                disabled={!calculations}
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                <Download className="w-4 h-4 mr-2" />
                Business Print
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Form
              </Button>
            </div>
          </div>

          {!isUnlocked && (
            <Alert className="mb-4 border" style={{
              background: hasUsedFreeQuote ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: hasUsedFreeQuote ? 'var(--color-warning)' : 'var(--color-success)'
            }}>
              <Shield className="h-4 w-4" style={{ color: hasUsedFreeQuote ? 'var(--color-warning)' : 'var(--color-success)' }} />
              <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                {hasUsedFreeQuote ? (
                  <strong>Free quote used. Unlock unlimited access or try a 3-day trial.</strong>
                ) : (
                  <><strong>Free Trial:</strong> You have 1 complimentary quote. Copying, downloading, or printing will use your free quote.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {trialDaysLeft !== null && isTrialActive && (
            <Alert className="mb-4 border" style={{
              background: 'rgba(139, 92, 246, 0.1)',
              borderColor: 'var(--color-accent-primary)'
            }}>
              <Clock className="h-4 w-4" style={{ color: 'var(--color-accent-primary)' }} />
              <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Trial Active:</strong> {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining of your 3-day trial
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
            <Shield className="h-4 w-4" style={{ color: 'var(--color-accent-primary)' }} />
            <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
              <strong>Privacy First:</strong> All data is stored locally in your browser. Your quotes and settings are automatically saved and will persist even after closing the browser.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>Client & Project Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name" style={{ color: 'var(--color-text-secondary)' }}>Client Name</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      placeholder="Enter client name"
                      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="project_title" style={{ color: 'var(--color-text-secondary)' }}>Project Title</Label>
                    <Input
                      id="project_title"
                      value={formData.project_title}
                      onChange={(e) => setFormData({...formData, project_title: e.target.value})}
                      placeholder="Enter project title"
                      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
                <div>
                  <Label style={{ color: 'var(--color-text-secondary)' }}>Shoot Date(s)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        style={{
                          background: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border-dark)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatShootDates()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)' }} align="start">
                      <Calendar
                        mode="multiple"
                        selected={formData.shoot_dates.map(d => new Date(d))}
                        onSelect={(dates) => {
                          const dateStrings = dates ? dates.map(d => d.toISOString()) : [];
                          setFormData({...formData, shoot_dates: dateStrings});
                        }}
                        initialFocus
                        styles={{
                          head_cell: { color: 'var(--color-text-secondary)' },
                          cell: { color: 'var(--color-text-primary)' },
                        }}
                      />
                      <div className="p-3" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Click dates to select multiple shoot days
                        </p>
                        {formData.shoot_dates.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            style={{ color: 'var(--color-accent-primary)' }}
                            onClick={() => setFormData({...formData, shoot_dates: []})}
                          >
                            Clear Dates
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Experience Level */}
            <ExperienceLevelSelector
              selectedLevel={formData.experience_level}
              onLevelChange={(level) => {
                const newMultiplier = settings?.experience_levels?.[level] || 1.0;
                setFormData({...formData, experience_level: level, custom_multiplier: newMultiplier});
              }}
              customMultiplier={formData.custom_multiplier}
              onCustomMultiplierChange={(multiplier) => setFormData({...formData, custom_multiplier: multiplier})}
              experienceLevels={settings?.experience_levels}
              cardClassName="shadow-md border-[var(--color-border-dark)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              cardHeaderClassName="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-dark)]"
              cardTitleClassName="text-lg text-[var(--color-text-primary)]"
              labelClassName="text-[var(--color-text-secondary)]"
              textMutedClassName="text-[var(--color-text-secondary)]"
              inputClassName="bg-[var(--color-bg-primary)] border-[var(--color-border-dark)] text-[var(--color-text-primary)]"
              checkboxHoverBgClassName="hover:bg-[var(--color-bg-tertiary)]"
            />

            {/* Pricing Model */}
            <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>Pricing Model</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.day_type === "half" ? 'bg-[var(--color-bg-tertiary)] border-2' : 'border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={formData.day_type === "half" ? { borderColor: 'var(--color-accent-primary)' } : {}}
                    onClick={() => setFormData({...formData, day_type: "half"})}
                  >
                    <Checkbox
                      checked={formData.day_type === "half"}
                      onCheckedChange={() => setFormData({...formData, day_type: "half"})}
                    />
                    <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      <span>Half Day Rates</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>(≤6 hours)</span>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.day_type === "full" ? 'bg-[var(--color-bg-tertiary)] border-2' : 'border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={formData.day_type === "full" ? { borderColor: 'var(--color-accent-primary)' } : {}}
                    onClick={() => setFormData({...formData, day_type: "full"})}
                  >
                    <Checkbox
                      checked={formData.day_type === "full"}
                      onCheckedChange={() => setFormData({...formData, day_type: "full"})}
                    />
                    <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      <span>Full Day Rates</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>(up to 10 hours)</span>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.day_type === "custom" ? 'bg-[var(--color-bg-tertiary)] border-2' : 'border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={formData.day_type === "custom" ? { borderColor: 'var(--color-accent-primary)' } : {}}
                    onClick={() => setFormData({...formData, day_type: "custom"})}
                  >
                    <Checkbox
                      checked={formData.day_type === "custom"}
                      onCheckedChange={() => setFormData({...formData, day_type: "custom"})}
                    />
                    <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      <span>Custom Hourly Rate</span>
                    </Label>
                  </div>
                </div>

                {formData.day_type === "custom" && (
                  <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="custom_hours" style={{ color: 'var(--color-text-secondary)' }}>Number of Hours</Label>
                        <Input
                          id="custom_hours"
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          value={formData.custom_hours}
                          onChange={(e) => setFormData({...formData, custom_hours: parseFloat(e.target.value)})}
                          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom_hourly_rate" style={{ color: 'var(--color-text-secondary)' }}>Hourly Rate ($)</Label>
                        <Input
                          id="custom_hourly_rate"
                          type="number"
                          min="0"
                          step="10"
                          value={formData.custom_hourly_rate}
                          onChange={(e) => setFormData({...formData, custom_hourly_rate: parseFloat(e.target.value) || 0})}
                          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                    </div>
                    {formData.custom_hours > 14 && (
                      <Alert style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-error)' }}>
                        <AlertCircle className="h-4 w-4" style={{ color: 'var(--color-error)' }} />
                        <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
                          Warning: Hours exceed 14. Consider breaking into multiple days.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Roles */}
            <RoleSelector
              dayRates={dayRates}
              selectedRoles={formData.selected_roles}
              onRoleChange={(roles) => {
                console.log('RoleSelector onChange:', roles);
                setFormData({...formData, selected_roles: roles});
              }}
              dayType={formData.day_type}
              customHours={formData.custom_hours}
              cardClassName="shadow-md border-[var(--color-border-dark)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              cardHeaderClassName="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-dark)]"
              cardTitleClassName="text-lg text-[var(--color-text-primary)]"
              labelClassName="text-[var(--color-text-secondary)]"
              textMutedClassName="text-[var(--color-text-secondary)]"
              inputClassName="bg-[var(--color-bg-primary)] border-[var(--color-border-dark)] text-[var(--color-text-primary)]"
              checkboxHoverBgClassName="hover:bg-[var(--color-bg-tertiary)]"
            />

            {/* Audio Pre & Post */}
            <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={formData.include_audio_pre_post}
                    onCheckedChange={(checked) => {
                      console.log('Audio checkbox changed:', checked);
                      setFormData({...formData, include_audio_pre_post: checked});
                    }}
                  />
                  <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                    <span>Include Audio Pre & Post Production</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}> (Flat rate: ${dayRates.find(r => r.role === "Audio Pre & Post")?.full_day_rate || 0})</span>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Gear */}
            <GearSelector
              gearCosts={gearCosts}
              selectedGear={formData.selected_gear_items}
              onGearChange={(gear) => {
                console.log('GearSelector onChange:', gear);
                setFormData({...formData, selected_gear_items: gear});
              }}
              settings={settings}
              gearEnabled={formData.gear_enabled}
              onGearEnabledChange={(enabled) => {
                console.log('Gear enabled changed:', enabled);
                setFormData(prev => {
                  let newSelectedGearItems = prev.selected_gear_items;
                  if (enabled && prev.selected_gear_items.length === 0) {
                    const defaultGear = gearCosts
                      .filter(g => g.include_by_default && !g.item.toLowerCase().includes('studio') && !g.item.toLowerCase().includes('rent'))
                      .map(g => g.id);
                    newSelectedGearItems = defaultGear;
                  }
                  return {
                    ...prev,
                    gear_enabled: enabled,
                    selected_gear_items: newSelectedGearItems,
                  };
                });
              }}
              cardClassName="shadow-md border-[var(--color-border-dark)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              cardHeaderClassName="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-dark)]"
              cardTitleClassName="text-lg text-[var(--color-text-primary)]"
              labelClassName="text-[var(--color-text-secondary)]"
              textMutedClassName="text-[var(--color-text-secondary)]"
              checkboxHoverBgClassName="hover:bg-[var(--color-bg-tertiary)]"
            />

            {/* Travel & Rentals */}
            <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>Additional Costs</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="travel_miles" style={{ color: 'var(--color-text-secondary)' }}>Travel (Miles)</Label>
                    <Input
                      id="travel_miles"
                      type="number"
                      min="0"
                      value={formData.travel_miles}
                      onChange={(e) => setFormData({...formData, travel_miles: parseFloat(e.target.value) || 0})}
                      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Rate: ${settings?.mileage_rate || 0.67}/mile</p>
                  </div>
                  <div>
                    <Label htmlFor="rental_costs" style={{ color: 'var(--color-text-secondary)' }}>Rental Costs ($)</Label>
                    <Input
                      id="rental_costs"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rental_costs}
                      onChange={(e) => setFormData({...formData, rental_costs: parseFloat(e.target.value) || 0})}
                      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fees & Discounts */}
            <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>Fees & Discounts</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <Checkbox
                    checked={formData.apply_rush_fee}
                    onCheckedChange={(checked) => {
                      console.log('Rush fee checkbox changed:', checked);
                      setFormData({...formData, apply_rush_fee: checked});
                    }}
                  />
                  <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                    <span>Rush Fee</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}> (+{settings?.rush_fee_percent || 25}%)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <Checkbox
                    checked={formData.apply_nonprofit_discount}
                    onCheckedChange={(checked) => {
                      console.log('Nonprofit discount checkbox changed:', checked);
                      setFormData({...formData, apply_nonprofit_discount: checked});
                    }}
                  />
                  <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                    <span>Nonprofit Discount</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}> (-{settings?.nonprofit_discount_percent || 15}%)</span>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  value={formData.notes_for_quote}
                  onChange={(e) => setFormData({...formData, notes_for_quote: e.target.value})}
                  placeholder="Add any special notes or terms for this quote..."
                  rows={4}
                  style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Totals */}
          <div className="lg:col-span-1">
            <LiveTotalsPanel calculations={calculations} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}
