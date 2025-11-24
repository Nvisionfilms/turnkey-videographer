// Calculator v2.1 - Updated with unlock dialog and negotiation ticker
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw, AlertCircle, Download, Mail, Shield, Calendar as CalendarIcon, Lock, Clock, Sparkles, Heart, Coffee, ArrowRight, ChevronLeft, ChevronRight, DollarSign, FileText, Settings as SettingsIcon, Key, Copy as CopyIcon, User, Briefcase, Users, Package, Video as VideoIcon, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { setReferralCookie } from "../utils/affiliateUtils";

import LiveTotalsPanel from "../components/calculator/LiveTotalsPanelNew";
import RoleSelector from "../components/calculator/RoleSelector";
import GearSelector from "../components/calculator/GearSelector";
import CameraSelector from "../components/calculator/CameraSelector";
import ExperienceLevelSelector from "../components/calculator/ExperienceLevelSelector";
import NegotiationTicker from "../components/calculator/NegotiationTicker";
import PresetTemplates from "../components/calculator/PresetTemplates";
import CollapsibleSection from "../components/calculator/CollapsibleSection";
import QuoteHistory, { saveToQuoteHistory } from "../components/calculator/QuoteHistory";
import MobileFloatingTotal from "../components/calculator/MobileFloatingTotal";
import { calculateQuote } from "../components/calculator/calculations";
import { ExportService } from "../components/services/ExportService";
import { STORAGE_KEYS, DEFAULT_DAY_RATES, DEFAULT_GEAR_COSTS, DEFAULT_CAMERAS, DEFAULT_SETTINGS } from "../components/data/defaults";
import { useUnlockStatus } from "../components/hooks/useUnlockStatus";

export default function Calculator() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Track affiliate referrals
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCookie(refCode);
      console.log('Affiliate referral tracked:', refCode);
    }
  }, [searchParams]);
  
  // Use centralized unlock status
  const { 
    isUnlocked, 
    hasUsedFreeQuote, 
    trialDaysLeft, 
    isTrialActive,
    markFreeQuoteUsed,
    activateSubscription,
    activateTrial
  } = useUnlockStatus();
  
  // State for data - initialize with defaults immediately
  const [dayRates, setDayRates] = useState(DEFAULT_DAY_RATES);
  const [gearCosts, setGearCosts] = useState(DEFAULT_GEAR_COSTS);
  const [cameras, setCameras] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Unlock dialog state
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockEmail, setUnlockEmail] = useState('');
  
  // Ref for debounced save timeout
  const saveTimeoutRef = React.useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    client_name: "",
    project_title: "",
    shoot_dates: [],
    day_type: "full",
    custom_hours: 10,
    custom_hourly_rate: 250,
    single_price: 0,
    single_price_enabled: false,
    custom_price_override: null, // For round/discount buttons
    custom_discount_percent: 0, // Track cumulative discount percentage
    experience_level: "Standard",
    custom_multiplier: 1.0,
    selected_roles: [],
    include_audio_pre_post: false,
    gear_enabled: true,
    selected_gear_items: [],
    selected_camera: "",
    apply_nonprofit_discount: false,
    apply_rush_fee: false,
    travel_miles: 0,
    rental_costs: 0,
    notes_for_quote: ""
  });

  // Helper function to load data from localStorage
  const loadAllData = useCallback((includeFormData = true) => {
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
        setDayRates(DEFAULT_DAY_RATES);
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
        setGearCosts(DEFAULT_GEAR_COSTS);
      }

      // Load cameras
      const camerasStr = localStorage.getItem(STORAGE_KEYS.CAMERAS);
      if (camerasStr) {
        const loadedCameras = JSON.parse(camerasStr);
        console.log('Loaded cameras:', loadedCameras);
        setCameras(loadedCameras);
      } else {
        console.log('No cameras in localStorage, using defaults');
        localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(DEFAULT_CAMERAS));
        setCameras(DEFAULT_CAMERAS);
      }

      // Load settings
      const settingsStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsStr) {
        const loadedSettings = JSON.parse(settingsStr);
        
        // Migrate: Add desired_profit_margin_percent if it doesn't exist
        if (loadedSettings.desired_profit_margin_percent === undefined) {
          loadedSettings.desired_profit_margin_percent = DEFAULT_SETTINGS.desired_profit_margin_percent;
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(loadedSettings));
          console.log('✨ Migrated settings to include desired_profit_margin_percent:', loadedSettings.desired_profit_margin_percent);
        }
        
        console.log('Loaded settings:', loadedSettings);
        setSettings(loadedSettings);
      } else {
        console.log('No settings in localStorage, using defaults');
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        setSettings(DEFAULT_SETTINGS);
      }

      // Load saved form data (only on initial mount)
      if (includeFormData) {
        const savedFormData = localStorage.getItem(STORAGE_KEYS.CALCULATOR_SESSION);
        if (savedFormData) {
          const parsed = JSON.parse(savedFormData);
          console.log('Loaded saved form data:', parsed);
          setFormData(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      console.warn('Clearing corrupted localStorage and using defaults');
      // Clear all calculator-related localStorage on error
      try {
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (e) {
        console.error('Could not clear localStorage:', e);
      }
      // Use defaults
      setDayRates(DEFAULT_DAY_RATES);
      setGearCosts(DEFAULT_GEAR_COSTS);
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    loadAllData(true);
    setIsLoading(false);
  }, [loadAllData]);

  // Save form data to localStorage with debouncing (1 second delay)
  useEffect(() => {
    if (!isLoading) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.CALCULATOR_SESSION, JSON.stringify(formData));
        console.log('Saved form data to localStorage:', formData);
      }, 1000); // 1 second delay
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
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

  // Listen for settings updates from Admin page
  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      console.log('✅ Calculator received settingsUpdated event:', event.detail);
      console.log('📊 New desired_profit_margin_percent:', event.detail.desired_profit_margin_percent);
      setSettings(event.detail);
    };

    console.log('🎧 Calculator is now listening for settingsUpdated events');
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Reload data when page becomes visible (e.g., navigating back from Setup)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, reloading data from localStorage');
        loadAllData(false); // Don't reload form data, only rates/gear/settings
      }
    };

    const handleFocus = () => {
      console.log('Window focused, reloading data from localStorage');
      loadAllData(false); // Don't reload form data, only rates/gear/settings
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadAllData]);

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
    
    // Store original total before any overrides
    result.originalTotal = result.total;
    
    // Apply custom price override if set (from round/discount buttons)
    if (formData.custom_price_override !== null && formData.custom_price_override > 0) {
      result.total = formData.custom_price_override;
      result.depositDue = result.total * ((settings?.deposit_percent || 50) / 100);
      result.balanceDue = result.total - result.depositDue;
    }
    
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

  const handleSmartFill = () => {
    // Analyze current form data and intelligently fill missing fields
    const updates = { ...formData };
    let changesMade = [];

    // 1. If no roles selected, suggest standard production roles
    if (updates.selected_roles.length === 0) {
      const cameraOpRole = dayRates.find(r => r.role === "Camera op (with camera)" && r.active);
      if (cameraOpRole) {
        updates.selected_roles = [{ role_id: cameraOpRole.id, quantity: 1 }];
        changesMade.push("Added Camera Operator role");
      }
    }

    // 2. If roles include camera op, enable gear if not already
    const hasCameraRole = updates.selected_roles.some(r => {
      const role = dayRates.find(dr => dr.id === r.role_id);
      return role && role.role.toLowerCase().includes('camera');
    });
    
    if (hasCameraRole && !updates.gear_enabled) {
      updates.gear_enabled = true;
      changesMade.push("Enabled gear costs");
    }

    // 3. If gear enabled but nothing selected, add default gear
    if (updates.gear_enabled && updates.selected_gear_items.length === 0) {
      const defaultGear = gearCosts
        .filter(g => g.include_by_default && !g.item.toLowerCase().includes('studio') && !g.item.toLowerCase().includes('rent'))
        .map(g => g.id);
      if (defaultGear.length > 0) {
        updates.selected_gear_items = defaultGear;
        changesMade.push("Added default gear items");
      }
    }

    // 4. If no day type selected or custom, default to full day
    if (!updates.day_type || updates.day_type === 'custom') {
      updates.day_type = 'full';
      changesMade.push("Set to Full Day pricing");
    }

    // 5. If no experience level, set to Standard
    if (!updates.experience_level || updates.experience_level === '') {
      updates.experience_level = 'Standard';
      updates.custom_multiplier = settings?.experience_levels?.['Standard'] || 1.0;
      changesMade.push("Set experience level to Standard");
    }

    // 6. If shoot dates selected and multiple days, suggest appropriate setup
    if (updates.shoot_dates.length > 1) {
      // For multi-day shoots, consider adding editor roles if not present
      const hasEditor = updates.selected_roles.some(r => {
        const role = dayRates.find(dr => dr.id === r.role_id);
        return role && role.role.toLowerCase().includes('editor');
      });
      
      if (!hasEditor) {
        const editorRole = dayRates.find(r => r.role === "Line Editor (per 5 min)" && r.active);
        if (editorRole) {
          updates.selected_roles = [...updates.selected_roles, { role_id: editorRole.id, quantity: 1 }];
          changesMade.push("Added Editor role for multi-day project");
        }
      }
    }

    // 7. Suggest travel if not set (assume local project needs some travel)
    if (updates.travel_miles === 0) {
      updates.travel_miles = 25; // Standard local travel
      changesMade.push("Added 25 miles for local travel");
    }

    // Apply updates
    if (changesMade.length > 0) {
      setFormData(updates);
      toast({
        title: "Smart Fill Complete",
        description: `${changesMade.length} suggestion${changesMade.length !== 1 ? 's' : ''} applied: ${changesMade.slice(0, 3).join(', ')}${changesMade.length > 3 ? '...' : ''}`
      });
    } else {
      toast({
        title: "Form Already Complete",
        description: "All key fields are already filled in.",
      });
    }
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

  const handleUnlockSubmit = () => {
    const code = unlockCode.trim().toUpperCase();
    
    // Check for trial code
    if (code === "TRIAL3DAY" || code === "NVISION3DAY") {
      const result = activateTrial();
      
      if (result.success) {
        toast({
          title: "3-Day Trial Activated!",
          description: result.message,
        });
        setUnlockDialogOpen(false);
        setUnlockCode('');
        setUnlockEmail('');
      } else {
        toast({
          title: "Trial Already Used",
          description: result.message,
          variant: "destructive"
        });
      }
      return;
    }
    
    // Check for permanent unlock code
    const result = activateSubscription(code, unlockEmail);
    
    if (result.success) {
      toast({
        title: "Unlocked!",
        description: result.message,
      });
      setUnlockDialogOpen(false);
      setUnlockCode('');
      setUnlockEmail('');
    } else {
      toast({
        title: "Invalid Code",
        description: result.message,
        variant: "destructive"
      });
    }
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
      
      // Save to history
      saveToQuoteHistory(formData, calculations.total);
      
      toast({
        title: "Quote copied",
        description: "Quote text has been copied to clipboard.",
      });
    });
  };

  const handlePrintReceipt = () => {
    checkAccessAndProceed(() => {
      if (!calculations) return;
      
      // Save to history
      saveToQuoteHistory(formData, calculations.total);
      
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
      
      // Save to history
      saveToQuoteHistory(formData, calculations.total);
      
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
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Landing Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                You already have the talent —
                <span style={{ color: 'var(--color-accent-primary)' }}> now get the clarity to match.</span>
              </h1>
              
              <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Charge what you're worth. Send quotes with confidence. Run your creative business like a pro.
              </p>
              
              <div className="flex gap-4">
                <a href="#calculator" className="inline-block">
                  <Button 
                    size="lg"
                    className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform"
                    style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                  >
                    Start Calculating
                  </Button>
                </a>
              </div>
            </div>
            
            <div>
              <CalculatorCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-6" style={{ background: 'var(--color-bg-card)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            The struggle isn't your talent.
          </h2>
          
          <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <p>
              It's the <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>anxiety before you hit send</span> on a quote.
            </p>
            
            <p>
              It's wondering if you're <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>charging too much</span> or <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>leaving money on the table</span>.
            </p>
            
            <p>
              It's being <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>busy but not profitable</span>.
            </p>
            
            <p className="text-xl font-bold pt-6" style={{ color: 'var(--color-accent-primary)' }}>
              Confidence doesn't come from talent — it comes from clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <div id="calculator" className="p-6 scroll-mt-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Quote Calculator</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Create professional quotes with industry-standard pricing</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full justify-between md:justify-end">
              {!isUnlocked && (
                <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)', borderColor: 'var(--color-accent-primary)', boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)' }}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Enter Unlock Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)' }}>
                    <DialogHeader>
                      <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Enter Your Unlock Code</DialogTitle>
                      <DialogDescription style={{ color: 'var(--color-text-secondary)' }}>
                        Enter your unlock code or trial code to activate unlimited access
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="unlock-code" style={{ color: 'var(--color-text-secondary)' }}>Unlock Code</Label>
                        <Input
                          id="unlock-code"
                          placeholder="NV-XXXX-XXXX-XXXX-XXXX or TRIAL3DAY"
                          value={unlockCode}
                          onChange={(e) => setUnlockCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlockSubmit()}
                          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unlock-email" style={{ color: 'var(--color-text-secondary)' }}>Email (Optional)</Label>
                        <Input
                          id="unlock-email"
                          type="email"
                          placeholder="your@email.com"
                          value={unlockEmail}
                          onChange={(e) => setUnlockEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlockSubmit()}
                          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <Button 
                        onClick={handleUnlockSubmit}
                        className="w-full"
                        style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                      >
                        Activate Code
                      </Button>
                      <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'rgba(255, 193, 7, 0.1)', border: '2px solid var(--color-accent-primary)' }}>
                        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                          Don't have a code?
                        </p>
                        <a 
                          href={createPageUrl("Unlock") + (searchParams.get('ref') ? `?ref=${searchParams.get('ref')}` : '')} 
                          className="inline-block px-6 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
                          style={{ 
                            background: 'var(--color-accent-primary)', 
                            color: '#000',
                            boxShadow: '0 4px 12px rgba(255, 193, 7, 0.4)'
                          }}
                        >
                          🎉 Get Unlimited Access Now!
                        </a>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {!isUnlocked && hasUsedFreeQuote && (
                <Button
                  onClick={() => navigate(createPageUrl("Unlock"))}
                  variant="outline"
                  size="sm"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Buy Unlimited
                </Button>
              )}
              <Button
                onClick={handleSmartFill}
                variant="outline"
                size="sm"
                style={{ background: 'var(--color-success)', color: 'white', borderColor: 'var(--color-success)' }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Smart Fill
              </Button>
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
              <QuoteHistory 
                onLoadQuote={(savedFormData) => {
                  setFormData({
                    ...savedFormData,
                    custom_price_override: null, // Clear custom price when loading from history
                    custom_discount_percent: 0 // Clear discount percentage
                  });
                  toast({
                    title: "Quote Loaded!",
                    description: "Previous quote has been restored",
                  });
                }}
              />
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Form
              </Button>
              <Button
                onClick={() => {
                  const timestamp = new Date().toLocaleString();
                  setFormData({
                    ...formData,
                    client_name: `${formData.client_name} (Copy)`,
                    project_title: `${formData.project_title} (Copy)`,
                    custom_price_override: null, // Clear custom price on duplicate
                    custom_discount_percent: 0 // Clear discount percentage
                  });
                  toast({
                    title: "Quote Duplicated!",
                    description: "You can now modify this copy independently",
                  });
                }}
                variant="outline"
                size="sm"
                disabled={!formData.client_name && !formData.project_title}
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                <CopyIcon className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>

          {/* Affiliate Banner */}
          <Card className="mb-6 border-2 overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
            borderColor: 'var(--color-accent-primary)'
          }}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <DollarSign className="w-6 h-6" style={{ color: 'var(--color-accent-primary)' }} />
                    <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Earn $6 Per Referral!
                    </h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Join our affiliate program and earn 15% commission on every sale you refer. 
                    Get your unique link, share it, and start earning today!
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      30-day cookie tracking
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      $25 minimum payout
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      PayPal payments
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/affiliate/signup')}
                    size="lg"
                    className="whitespace-nowrap font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    style={{ 
                      background: 'var(--color-accent-primary)', 
                      color: '#000',
                      border: 'none'
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join Affiliate Program
                  </Button>
                  <Button
                    onClick={() => navigate('/affiliate/login')}
                    variant="outline"
                    size="lg"
                    className="whitespace-nowrap"
                    style={{ 
                      borderColor: 'var(--color-accent-primary)',
                      color: 'var(--color-accent-primary)',
                      background: 'transparent'
                    }}
                  >
                    Affiliate Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Negotiation Ticker - Only show when calculations exist */}
          {calculations && calculations.total > 0 && (
            <div className="mb-6">
              <NegotiationTicker calculations={calculations} settings={settings} />
            </div>
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

          {/* Preset Templates */}
          <PresetTemplates 
            onApplyPreset={(presetConfig) => {
              setFormData({
                ...formData,
                ...presetConfig,
                shoot_dates: formData.shoot_dates, // Keep existing dates
                custom_price_override: null, // Clear any custom price when applying template
                custom_discount_percent: 0 // Clear discount percentage
              });
              toast({
                title: "Template Applied!",
                description: "You can now customize this quote",
              });
            }}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 pb-20 lg:pb-0">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Client Info */}
            <CollapsibleSection 
              title="Client & Project Details" 
              icon={User}
              defaultOpen={true}
              cardClassName="border-[var(--color-border-dark)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
            >
              <div className="space-y-4">
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
              </div>
            </CollapsibleSection>

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
            <CollapsibleSection 
              title="Pricing Model" 
              icon={DollarSign}
              defaultOpen={true}
              cardClassName="border-[var(--color-border-dark)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
            >
                <div className="space-y-3">
                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.day_type === "half" && !formData.single_price_enabled ? 'bg-[var(--color-bg-tertiary)] border-2' : 'border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={formData.day_type === "half" && !formData.single_price_enabled ? { borderColor: 'var(--color-accent-primary)' } : {}}
                    onClick={() => setFormData({...formData, day_type: "half", single_price_enabled: false})}
                  >
                    <Checkbox
                      checked={formData.day_type === "half" && !formData.single_price_enabled}
                      onCheckedChange={() => setFormData({...formData, day_type: "half", single_price_enabled: false})}
                    />
                    <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      <span>Half Day Rates</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>(up to 6 hours)</span>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.day_type === "full" && !formData.single_price_enabled ? 'bg-[var(--color-bg-tertiary)] border-2' : 'border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={formData.day_type === "full" && !formData.single_price_enabled ? { borderColor: 'var(--color-accent-primary)' } : {}}
                    onClick={() => setFormData({...formData, day_type: "full", single_price_enabled: false})}
                  >
                    <Checkbox
                      checked={formData.day_type === "full" && !formData.single_price_enabled}
                      onCheckedChange={() => setFormData({...formData, day_type: "full", single_price_enabled: false})}
                    />
                    <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      <span>Full Day Rates</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>(up to 10 hours)</span>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.day_type === "custom" && !formData.single_price_enabled ? 'bg-[var(--color-bg-tertiary)] border-2' : 'border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={formData.day_type === "custom" && !formData.single_price_enabled ? { borderColor: 'var(--color-accent-primary)' } : {}}
                    onClick={() => setFormData({...formData, day_type: "custom", single_price_enabled: false})}
                  >
                    <Checkbox
                      checked={formData.day_type === "custom" && !formData.single_price_enabled}
                      onCheckedChange={() => setFormData({...formData, day_type: "custom", single_price_enabled: false})}
                    />
                    <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      <span>Custom Hourly Rate</span>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.single_price_enabled ? 'bg-[var(--color-bg-tertiary)] border-2' : 'border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={formData.single_price_enabled ? { borderColor: 'var(--color-accent-primary)' } : {}}
                    onClick={() => setFormData({...formData, single_price_enabled: true, day_type: null})}
                  >
                    <Checkbox
                      checked={formData.single_price_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, single_price_enabled: checked, day_type: checked ? null : formData.day_type})}
                    />
                    <Label className="flex-1 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                      <span>Single Fixed Price</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>(overhead/admin added)</span>
                    </Label>
                  </div>
                </div>

                {formData.single_price_enabled && (
                  <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
                    <div>
                      <Label htmlFor="single_price" style={{ color: 'var(--color-text-secondary)' }}>Base Price ($)</Label>
                      <Input
                        id="single_price"
                        type="number"
                        min="0"
                        step="50"
                        value={formData.single_price}
                        onChange={(e) => setFormData({...formData, single_price: parseFloat(e.target.value) || 0})}
                        style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                        placeholder="Enter your fixed price"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        This base price will have overhead, profit margin, gear, travel, and taxes added automatically
                      </p>
                    </div>
                  </div>
                )}

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
            </CollapsibleSection>

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
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-start space-x-3">
                  <div className="flex items-center">
                    <Checkbox
                      checked={formData.include_audio_pre_post}
                      onCheckedChange={(checked) => {
                        console.log('Audio checkbox changed:', checked);
                        setFormData({...formData, include_audio_pre_post: checked});
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="cursor-pointer block leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                      <div className="font-medium">Include Audio Pre- and Post-Production</div>
                      <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Flat fee: ${dayRates.find(r => r.role === "Audio Pre & Post")?.full_day_rate || 0}
                      </div>
                    </Label>
                  </div>
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

            {/* Camera */}
            <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <CardTitle style={{ color: 'var(--color-text-primary)' }}>Camera</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CameraSelector
                  cameras={cameras}
                  selectedCamera={formData.selected_camera}
                  onCameraChange={(cameraId) => setFormData({...formData, selected_camera: cameraId})}
                />
              </CardContent>
            </Card>

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
            <LiveTotalsPanel 
              calculations={calculations} 
              settings={settings} 
              formData={{...formData, cameras}}
              onUpdateCustomPrice={(price) => {
                setFormData(prev => ({...prev, custom_price_override: price}));
              }}
              onUpdateDiscount={(discountPercent) => {
                setFormData(prev => ({...prev, custom_discount_percent: discountPercent}));
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Total */}
      <MobileFloatingTotal 
        total={calculations?.total}
        onExpand={(expanded) => {
          // Could scroll to quote card when expanded
          if (expanded) {
            document.getElementById('quote-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }}
      />
      </div>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="w-12 h-12 mx-auto mb-6" style={{ color: 'var(--color-accent-primary)' }} />
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            You deserve to be paid what you're worth.
          </h2>
          
          <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            This tool just makes it easier to figure out what that is.
          </p>
        </div>
      </section>
    </div>
  );
}

function CalculatorCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      icon: DollarSign,
      title: "Set Your Rates",
      description: "Choose your experience level and the calculator suggests industry-standard day rates",
      color: "rgba(212, 175, 55, 0.1)"
    },
    {
      icon: SettingsIcon,
      title: "Select Your Gear",
      description: "Add cameras, lenses, audio equipment - the tool calculates amortization automatically",
      color: "rgba(212, 175, 55, 0.1)"
    },
    {
      icon: FileText,
      title: "Generate Quote",
      description: "Professional PDF quotes ready to send with all line items, taxes, and terms included",
      color: "rgba(212, 175, 55, 0.1)"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative">
      <Card className="shadow-2xl border-2" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-accent-primary)' }}>
        <CardContent className="p-8 md:p-12">
          <div className="min-h-[280px] flex flex-col items-center justify-center text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500"
              style={{ background: slides[currentSlide].color }}
            >
              {React.createElement(slides[currentSlide].icon, {
                className: "w-10 h-10",
                style: { color: 'var(--color-accent-primary)' }
              })}
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-4 transition-all duration-500" style={{ color: 'var(--color-text-primary)' }}>
              {slides[currentSlide].title}
            </h3>
            
            <p className="text-base md:text-lg leading-relaxed transition-all duration-500" style={{ color: 'var(--color-text-secondary)' }}>
              {slides[currentSlide].description}
            </p>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{ background: 'rgba(212, 175, 55, 0.1)' }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            </button>
            
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: idx === currentSlide ? 'var(--color-accent-primary)' : 'rgba(212, 175, 55, 0.3)',
                    width: idx === currentSlide ? '24px' : '8px'
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{ background: 'rgba(212, 175, 55, 0.1)' }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
