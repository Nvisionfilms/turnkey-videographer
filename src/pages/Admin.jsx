
import React, { useState, useRef, useEffect } from "react";
import { nvision } from "@/api/nvisionClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, DollarSign, Camera, RotateCcw, Plus, Trash2, Save, Award, Upload, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { STORAGE_KEYS, DEFAULT_DAY_RATES, DEFAULT_GEAR_COSTS, DEFAULT_CAMERAS, DEFAULT_SETTINGS } from "../components/data/defaults";

export default function Admin() {
  const { toast } = useToast();
  const [editingRate, setEditingRate] = useState(null);
  const [editingGear, setEditingGear] = useState(null);
  const [editingExperienceLevel, setEditingExperienceLevel] = useState(null);
  const [showAddRate, setShowAddRate] = useState(false);
  const [showAddGear, setShowAddGear] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", description: "", onConfirm: null });
  
  const [dayRates, setDayRates] = useState([]);
  const [gearCosts, setGearCosts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [settings, setSettings] = useState(null);
  const [localSettings, setLocalSettings] = useState(null);
  const saveTimeoutRef = useRef(null);
  
  const [newRate, setNewRate] = useState({
    role: "",
    half_day_rate: 0,
    full_day_rate: 0,
    unit_type: "day",
    active: true
  });
  const [newGear, setNewGear] = useState({
    item: "",
    total_investment: 0,
    include_by_default: true
  });
  const [newCamera, setNewCamera] = useState({
    make: "",
    model: "",
    is_default: false
  });
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);

  useEffect(() => {
    loadDataFromStorage();
  }, []);

  const loadDataFromStorage = () => {
    try {
      let rates = localStorage.getItem(STORAGE_KEYS.DAY_RATES);
      if (!rates) {
        localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(DEFAULT_DAY_RATES));
        rates = JSON.stringify(DEFAULT_DAY_RATES);
      }
      
      // Auto-migrate: Add missing default roles (like Drone Operator) for existing users
      const loadedRates = JSON.parse(rates);
      const existingRoleIds = new Set(loadedRates.map(r => r.id));
      const missingRoles = DEFAULT_DAY_RATES.filter(dr => !existingRoleIds.has(dr.id));
      
      if (missingRoles.length > 0) {
        const updatedRates = [...loadedRates, ...missingRoles];
        localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(updatedRates));
        setDayRates(updatedRates);
      } else {
        setDayRates(loadedRates);
      }

      let gear = localStorage.getItem(STORAGE_KEYS.GEAR_COSTS);
      if (!gear) {
        localStorage.setItem(STORAGE_KEYS.GEAR_COSTS, JSON.stringify(DEFAULT_GEAR_COSTS));
        gear = JSON.stringify(DEFAULT_GEAR_COSTS);
      }
      setGearCosts(JSON.parse(gear));

      let cams = localStorage.getItem(STORAGE_KEYS.CAMERAS);
      if (!cams) {
        localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(DEFAULT_CAMERAS));
        cams = JSON.stringify(DEFAULT_CAMERAS);
      }
      setCameras(JSON.parse(cams));

      let sett = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!sett) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        sett = JSON.stringify(DEFAULT_SETTINGS);
      }
      const loadedSettings = JSON.parse(sett);
      
      // Migrate: Add desired_profit_margin_percent if it doesn't exist
      if (loadedSettings.desired_profit_margin_percent === undefined) {
        loadedSettings.desired_profit_margin_percent = DEFAULT_SETTINGS.desired_profit_margin_percent;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(loadedSettings));
        console.log('✨ Migrated settings to include desired_profit_margin_percent:', loadedSettings.desired_profit_margin_percent);
      }
      
      setSettings(loadedSettings);
      setLocalSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setDayRates(DEFAULT_DAY_RATES);
      setGearCosts(DEFAULT_GEAR_COSTS);
      setSettings(DEFAULT_SETTINGS);
      setLocalSettings(DEFAULT_SETTINGS);
    }
  };

  const saveDataToStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify(data),
        url: window.location.href
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      toast({
        title: "Save Error",
        description: "Failed to save data to your browser's storage. Please try again or check your browser settings.",
        variant: "destructive"
      });
    }
  };

  const showConfirmDialog = (title, description, onConfirm) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  const updateRate = (id, data) => {
    const updated = dayRates.map(r => r.id === id ? { ...r, ...data } : r);
    setDayRates(updated);
    saveDataToStorage(STORAGE_KEYS.DAY_RATES, updated);
    setEditingRate(null);
  };

  const toggleRateActive = (id, active) => {
    const updated = dayRates.map(r => r.id === id ? { ...r, active } : r);
    setDayRates(updated);
    saveDataToStorage(STORAGE_KEYS.DAY_RATES, updated);
  };

  const createRate = (data) => {
    const newId = `rate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newRateObj = { ...data, id: newId };
    const updated = [...dayRates, newRateObj];
    setDayRates(updated);
    saveDataToStorage(STORAGE_KEYS.DAY_RATES, updated);
    
    // Automatically create a corresponding gear card for this role
    const gearId = `gear_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newGearCard = {
      id: gearId,
      item: data.role, // Use the role name as the gear item name
      total_investment: 0, // Default to 0, admin can update later
      include_by_default: false // Don't include by default
    };
    const updatedGear = [...gearCosts, newGearCard];
    setGearCosts(updatedGear);
    saveDataToStorage(STORAGE_KEYS.GEAR_COSTS, updatedGear);
    
    setShowAddRate(false);
    setNewRate({
      role: "",
      half_day_rate: 0,
      full_day_rate: 0,
      unit_type: "day",
      active: true
    });
    
    toast({
      title: "Role and Gear Card Created",
      description: `Created role "${data.role}" and corresponding gear card.`,
    });
  };

  const deleteRate = (id) => {
    const updated = dayRates.filter(r => r.id !== id);
    setDayRates(updated);
    saveDataToStorage(STORAGE_KEYS.DAY_RATES, updated);
  };

  const updateGear = (id, data) => {
    const updated = gearCosts.map(g => g.id === id ? { ...g, ...data } : g);
    setGearCosts(updated);
    saveDataToStorage(STORAGE_KEYS.GEAR_COSTS, updated);
    setEditingGear(null);
  };

  const toggleGearIncludeByDefault = (id, include_by_default) => {
    const updated = gearCosts.map(g => g.id === id ? { ...g, include_by_default } : g);
    setGearCosts(updated);
    saveDataToStorage(STORAGE_KEYS.GEAR_COSTS, updated);
  };

  const createGear = (data) => {
    const newId = `gear_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newGearObj = { ...data, id: newId };
    const updated = [...gearCosts, newGearObj];
    setGearCosts(updated);
    saveDataToStorage(STORAGE_KEYS.GEAR_COSTS, updated);
    setShowAddGear(false);
    setNewGear({
      item: "",
      total_investment: 0,
      include_by_default: true
    });
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, SVG, or WebP)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      handleSettingsUpdate('company_logo', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleSettingsUpdate('company_logo', '');
  };

  const deleteGear = (id) => {
    const updated = gearCosts.filter(g => g.id !== id);
    setGearCosts(updated);
    saveDataToStorage(STORAGE_KEYS.GEAR_COSTS, updated);
  };

  // Camera CRUD
  const createCamera = (data) => {
    const newId = `camera_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newCameraObj = { ...data, id: newId };
    const updated = [...cameras, newCameraObj];
    setCameras(updated);
    saveDataToStorage(STORAGE_KEYS.CAMERAS, updated);
    setShowAddCamera(false);
    setNewCamera({
      make: "",
      model: "",
      is_default: false
    });
  };

  const updateCamera = (id, data) => {
    const updated = cameras.map(c => c.id === id ? { ...c, ...data } : c);
    setCameras(updated);
    saveDataToStorage(STORAGE_KEYS.CAMERAS, updated);
    setEditingCamera(null);
  };

  const deleteCamera = (id) => {
    const updated = cameras.filter(c => c.id !== id);
    setCameras(updated);
    saveDataToStorage(STORAGE_KEYS.CAMERAS, updated);
  };

  const toggleCameraDefault = (id) => {
    const updated = cameras.map(c => ({
      ...c,
      is_default: c.id === id
    }));
    setCameras(updated);
    saveDataToStorage(STORAGE_KEYS.CAMERAS, updated);
  };

  const updateSettings = (data) => {
    const updated = { ...data, last_updated: new Date().toISOString() };
    console.log('💾 Saving settings to localStorage:', updated);
    setSettings(updated);
    setLocalSettings(updated);
    saveDataToStorage(STORAGE_KEYS.SETTINGS, updated);
    
    // Dispatch custom event to notify other components (like Calculator) that settings changed
    console.log('📢 Dispatching settingsUpdated event with desired_profit_margin_percent:', updated.desired_profit_margin_percent);
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: updated }));
  };

  const resetToDefaults = () => {
    const resetRates = dayRates.map(rate => ({
      ...rate,
      half_day_rate: 0,
      full_day_rate: 0
    }));
    setDayRates(resetRates);
    saveDataToStorage(STORAGE_KEYS.DAY_RATES, resetRates);

    const resetGear = gearCosts.map(gear => ({
      ...gear,
      total_investment: 0
    }));
    setGearCosts(resetGear);
    saveDataToStorage(STORAGE_KEYS.GEAR_COSTS, resetGear);

    toast({ title: "Reset Complete", description: "All rates and gear costs have been reset to $0." });
  };

  const resetRoles = () => {
    const existingRoles = new Set(dayRates.map(r => r.role));
    const rolesToAdd = DEFAULT_DAY_RATES.filter(dr => !existingRoles.has(dr.role));
    
    if (rolesToAdd.length > 0) {
      const newRolesWithIds = rolesToAdd.map(r => ({ ...r, id: `rate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` }));
      const updated = [...dayRates, ...newRolesWithIds];
      setDayRates(updated);
      saveDataToStorage(STORAGE_KEYS.DAY_RATES, updated);
      toast({
        title: "Roles Restored",
        description: `${rolesToAdd.length} missing default role${rolesToAdd.length !== 1 ? 's' : ''} have been restored.`
      });
    } else {
      toast({ title: "Roles Restored", description: "All default roles already exist." });
    }
  };

  const loadAllDefaults = () => {
    showConfirmDialog(
      "Load all default values?",
      "This will replace ALL current rates, gear costs, and settings with the original default values. This action cannot be undone.",
      () => {
        try {
          localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(DEFAULT_DAY_RATES));
          localStorage.setItem(STORAGE_KEYS.GEAR_COSTS, JSON.stringify(DEFAULT_GEAR_COSTS));
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEYS.DAY_RATES,
            newValue: JSON.stringify(DEFAULT_DAY_RATES),
            url: window.location.href
          }));
          window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEYS.GEAR_COSTS,
            newValue: JSON.stringify(DEFAULT_GEAR_COSTS),
            url: window.location.href
          }));
          window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEYS.SETTINGS,
            newValue: JSON.stringify(DEFAULT_SETTINGS),
            url: window.location.href
          }));
          
          loadDataFromStorage();
          
          toast({
            title: "Defaults Loaded",
            description: "All default rates, gear costs, and settings have been loaded successfully."
          });
        } catch (error) {
          console.error('Failed to load defaults:', error);
          toast({
            title: "Error",
            description: "Failed to load defaults. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const autoFillRates = async () => {
    setIsAutoFilling(true);
    
    try {
      const prompt = `You are a videography pricing expert. Provide industry-standard day rates for videography roles in USD based on current market rates in the US video production industry for 2024-2025.

Use these industry standard ranges as guidelines:
- Camera op (no camera): Varies widely, often starting at $1,000 - $2,000+ per day
- Camera op (with camera): Usually starts at $2,500 - $5,000+ for full day with equipment
- Director of Photography: Ranges from $1,000 - $5,000+ per day
- Director: Often starts at $1,000 - $2,000 per day
- Line Editor: Editing costs range $300 - $800+ per 5 minutes
- Lead Editor: Typically starts at $500 - $1,000+ per 5 minutes
- Revisions Per Request: May incur charges per hour or per revision ($50 - $200 per request)
- Audio Pre & Post: Audio work costs $1,000 - $3,000+ per day (flat rate for project)

IMPORTANT: Return rates for ALL of these exact role names (copy exactly as written):
1. Camera op (no camera)
2. Camera op (with camera)
3. Director
4. Director of Photography
5. Line Editor (per 5 min)
6. Lead Editor (per 5 min)
7. Revisions Per Request (basic edits)
8. Audio Pre & Post

For EACH role above, you must provide:
- role: exact name from the list above
- half_day_rate: rate for under 4 hours (typically 60% of full day rate)
- full_day_rate: rate for up to 10 hours

Return ALL 8 roles in your response. Use mid-range values from the provided ranges.`;

      const response = await nvision.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            rates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  half_day_rate: { type: "number" },
                  full_day_rate: { type: "number" }
                },
                required: ["role", "half_day_rate", "full_day_rate"]
              }
            }
          },
          required: ["rates"]
        }
      });

      let updatedCount = 0;

      const updatedRates = dayRates.map(existingRate => {
        const suggested = response.rates.find(r => r.role === existingRate.role);
        if (suggested) {
          updatedCount++;
          return {
            ...existingRate,
            half_day_rate: suggested.half_day_rate,
            full_day_rate: suggested.full_day_rate
          };
        }
        return existingRate;
      });

      setDayRates(updatedRates);
      saveDataToStorage(STORAGE_KEYS.DAY_RATES, updatedRates);
      
      toast({
        title: "Auto-Fill Complete",
        description: `Successfully updated ${updatedCount} rates.`,
      });
    } catch (error) {
      console.error("Auto-fill failed:", error);
      toast({
        title: "Auto-Fill Failed",
        description: `There was an error auto-filling rates: ${error.message || 'Unknown error'}.`,
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSettingsUpdate = (field, value) => {
    const updatedSettings = {
      ...(localSettings || {}),
      [field]: value,
    };
    setLocalSettings(updatedSettings);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateSettings(updatedSettings);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleExperienceLevelUpdate = (level, multiplier) => {
    if (!localSettings || !localSettings.experience_levels) return;

    const updatedLevels = {
      ...localSettings.experience_levels,
      [level]: parseFloat(multiplier)
    };
    handleSettingsUpdate('experience_levels', updatedLevels);
    setEditingExperienceLevel(null);
  };

  const addNewExperienceLevel = () => {
    const levelName = prompt("Enter new experience level name:");
    if (!levelName || levelName.trim() === "") return;

    if (localSettings?.experience_levels && localSettings.experience_levels[levelName]) {
      toast({
        title: "Error",
        description: `Experience level "${levelName}" already exists.`,
        variant: "destructive"
      });
      return;
    }

    const multiplierInput = prompt("Enter multiplier (e.g., 0.8 for 80%, 1.5 for 150%):");
    if (!multiplierInput || isNaN(parseFloat(multiplierInput))) {
      toast({
        title: "Error",
        description: "Please enter a valid number for the multiplier.",
        variant: "destructive"
      });
      return;
    }

    const multiplier = parseFloat(multiplierInput);

    const updatedLevels = {
      ...(localSettings?.experience_levels || {}),
      [levelName]: multiplier
    };
    handleSettingsUpdate('experience_levels', updatedLevels);
    toast({
      title: "Success",
      description: `Experience level "${levelName}" added successfully.`,
    });
  };

  const removeExperienceLevel = (level) => {
    showConfirmDialog(
      "Remove experience level?",
      `Are you sure you want to delete "${level}"? This action cannot be undone.`,
      () => {
        if (!localSettings || !localSettings.experience_levels) return;
        const updatedLevels = { ...localSettings.experience_levels };
        delete updatedLevels[level];
        handleSettingsUpdate('experience_levels', updatedLevels);
      }
    );
  };

  const handleAddNewRate = () => {
    if (!newRate.role.trim()) {
      toast({
        title: "Error",
        description: "Please enter a role name before creating.",
        variant: "destructive"
      });
      return;
    }
    createRate(newRate);
  };

  const handleAddNewGear = () => {
    if (!newGear.item.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gear item name before creating.",
        variant: "destructive"
      });
      return;
    }
    createGear(newGear);
  };

  return (
    <div className="min-h-screen p-3 md:p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Setup Rates</h1>
          <p className="text-xs md:text-base mb-3 hidden md:block" style={{ color: 'var(--color-text-muted)' }}>
            Configure your day rates, gear costs, and business settings. This information is stored locally on your computer and will be used to calculate quotes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={loadAllDefaults}
              variant="outline"
              size="sm"
              className="gap-1 text-xs md:text-sm"
              style={{ borderColor: 'var(--color-accent-primary)', color: 'var(--color-accent-primary)', background: 'var(--color-bg-secondary)' }}
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
              Load All Defaults
            </Button>
            <Button
              onClick={() => {
                showConfirmDialog(
                  "Restore default roles?",
                  "This will create any missing default roles. Existing roles will not be affected.",
                  () => resetRoles()
                );
              }}
              variant="outline"
              size="sm"
              className="gap-1 text-xs md:text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
              Restore Default Roles
            </Button>
            <Button
              onClick={() => {
                showConfirmDialog(
                  "Reset all prices to $0?",
                  "This will reset ALL day rates and gear costs to $0. Are you sure you want to continue?",
                  () => resetToDefaults()
                );
              }}
              variant="outline"
              size="sm"
              className="gap-1 text-xs md:text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
              Reset All to $0
            </Button>
          </div>
        </div>

        <Tabs defaultValue="rates" className="space-y-3 md:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <TabsTrigger value="rates" className="text-[10px] md:text-sm py-2 data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)]" style={{ color: 'var(--color-text-secondary)' }}>Day Rates</TabsTrigger>
            <TabsTrigger value="gear" className="text-[10px] md:text-sm py-2 data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)]" style={{ color: 'var(--color-text-secondary)' }}>Gear Costs</TabsTrigger>
            <TabsTrigger value="cameras" className="text-[10px] md:text-sm py-2 data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)]" style={{ color: 'var(--color-text-secondary)' }}>Cameras</TabsTrigger>
            <TabsTrigger value="settings" className="text-[10px] md:text-sm py-2 data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)]" style={{ color: 'var(--color-text-secondary)' }}>Business</TabsTrigger>
          </TabsList>

          <TabsContent value="rates">
            <Card className="shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                      Day Rates
                    </CardTitle>
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <strong>Roles are positions you are charging for.</strong> This can be for services you're providing, what someone is charging you, or what you budget for hiring.
                      Set your custom pricing for each role based on what you feel you should earn, or use the AI Auto-Fill button to populate with current industry-standard rates.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => autoFillRates()}
                      disabled={isAutoFilling}
                      variant="outline"
                      style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'var(--color-bg-secondary)' }}
                    >
                      {isAutoFilling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--color-success)' }}></div>
                          Auto-Filling...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Auto-Fill Rates
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowAddRate(!showAddRate)}
                      style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Rate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {showAddRate && (
                  <Card className="mb-6" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
                    <CardContent className="p-4 space-y-4">
                      <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add New Day Rate</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label style={{ color: 'var(--color-text-secondary)' }}>Role Name</Label>
                          <Input
                            value={newRate.role}
                            onChange={(e) => setNewRate({...newRate, role: e.target.value})}
                            placeholder="e.g., Producer"
                            style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                          />
                        </div>
                        <div>
                          <Label style={{ color: 'var(--color-text-secondary)' }}>Unit Type</Label>
                          <Select
                            value={newRate.unit_type}
                            onValueChange={(value) => setNewRate({...newRate, unit_type: value})}
                          >
                            <SelectTrigger style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                              <SelectItem value="day" className="hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-primary)' }}>Day</SelectItem>
                              <SelectItem value="per_5_min" className="hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-primary)' }}>Per 5 Minutes</SelectItem>
                              <SelectItem value="per_request" className="hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-primary)' }}>Per Request</SelectItem>
                              <SelectItem value="flat" className="hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-primary)' }}>Flat Rate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label style={{ color: 'var(--color-text-secondary)' }}>Half Day Rate ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newRate.half_day_rate}
                            onChange={(e) => setNewRate({...newRate, half_day_rate: parseFloat(e.target.value) || 0})}
                            style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                          />
                        </div>
                        <div>
                          <Label style={{ color: 'var(--color-text-secondary)' }}>Full Day Rate ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newRate.full_day_rate}
                            onChange={(e) => setNewRate({...newRate, full_day_rate: parseFloat(e.target.value) || 0})}
                            style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowAddRate(false)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)' }}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddNewRate} style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}>
                          Create
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mobile-friendly rate cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {dayRates.length === 0 ? (
                    <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                      No rates found. Click "Add New Rate" to create one.
                    </div>
                  ) : (
                    dayRates.map((rate) => (
                      <div 
                        key={rate.id}
                        className={`p-2 rounded-lg border-2 ${rate.active ? 'border-[var(--color-accent-primary)]' : 'border-[var(--color-border)] opacity-50'}`}
                        style={{ background: 'var(--color-bg-primary)' }}
                      >
                        {editingRate?.id === rate.id ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingRate.half_day_rate}
                              onChange={(e) => setEditingRate({...editingRate, half_day_rate: parseFloat(e.target.value) || 0})}
                              className="h-7 text-xs"
                              placeholder="Half Day"
                              style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                            />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingRate.full_day_rate}
                              onChange={(e) => setEditingRate({...editingRate, full_day_rate: parseFloat(e.target.value) || 0})}
                              className="h-7 text-xs"
                              placeholder="Full Day"
                              style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                            />
                            <div className="flex gap-1">
                              <Button size="sm" className="flex-1 h-6 text-[10px]" onClick={() => updateRate(rate.id, editingRate)} style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setEditingRate(null)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                ✕
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-[10px] font-semibold mb-1 line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>{rate.role}</div>
                            <div className="text-[9px] mb-1" style={{ color: 'var(--color-text-muted)' }}>{rate.unit_type}</div>
                            <div className="flex justify-between text-[10px] mb-2">
                              <span style={{ color: 'var(--color-text-secondary)' }}>½: ${rate.half_day_rate}</span>
                              <span style={{ color: 'var(--color-text-primary)' }}>Full: ${rate.full_day_rate}</span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <Checkbox 
                                checked={rate.active} 
                                onCheckedChange={(checked) => toggleRateActive(rate.id, checked)}
                                className="h-3 w-3"
                              />
                              <span className="text-[8px]" style={{ color: rate.active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}>
                                {rate.active ? 'Active' : 'Off'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="flex-1 h-6 text-[10px]" onClick={() => setEditingRate(rate)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" className="h-6 px-2" onClick={() => showConfirmDialog("Delete?", `Delete "${rate.role}"?`, () => deleteRate(rate.id))}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gear">
            <Card className="shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      <Camera className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                      Gear Investment Costs
                    </CardTitle>
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <strong>Enter the total investment cost for each piece of gear you bring on set or use in post-production.</strong>
                      {' '}For example: 5 tripods at $1,000 each = $5,000 total investment. 
                      The cost is automatically amortized across job-days to calculate the daily rate added to quotes.
                      Check "Include by Default" for items you typically bring to every shoot.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddGear(!showAddGear)}
                    style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                    className="flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Gear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {showAddGear && (
                  <Card className="mb-6" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
                    <CardContent className="p-4 space-y-4">
                      <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add New Gear Item</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label style={{ color: 'var(--color-text-secondary)' }}>Item Name</Label>
                          <Input
                            value={newGear.item}
                            onChange={(e) => setNewGear({...newGear, item: e.target.value})}
                            placeholder="e.g., Drone"
                            style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                          />
                        </div>
                        <div>
                          <Label style={{ color: 'var(--color-text-secondary)' }}>Total Investment ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newGear.total_investment}
                            onChange={(e) => setNewGear({...newGear, total_investment: parseFloat(e.target.value) || 0})}
                            style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={newGear.include_by_default}
                          onCheckedChange={(checked) => setNewGear({...newGear, include_by_default: checked})}
                        />
                        <Label style={{ color: 'var(--color-text-secondary)' }}>Include by default in quotes</Label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowAddGear(false)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)' }}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddNewGear} style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}>
                          Create
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mobile-friendly gear cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {gearCosts.length === 0 ? (
                    <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                      No gear costs found. Click "Add New Gear" to create one.
                    </div>
                  ) : (
                    gearCosts.map((gear) => (
                      <div 
                        key={gear.id}
                        className={`p-2 rounded-lg border-2 ${gear.include_by_default ? 'border-[var(--color-accent-primary)]' : 'border-[var(--color-border)]'}`}
                        style={{ background: 'var(--color-bg-primary)' }}
                      >
                        {editingGear?.id === gear.id ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingGear.total_investment}
                              onChange={(e) => setEditingGear({...editingGear, total_investment: parseFloat(e.target.value) || 0})}
                              className="h-7 text-xs"
                              placeholder="Investment $"
                              style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                            />
                            <div className="flex gap-1">
                              <Button size="sm" className="flex-1 h-6 text-[10px]" onClick={() => updateGear(gear.id, editingGear)} style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setEditingGear(null)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                ✕
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-[10px] font-semibold mb-1 line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>{gear.item}</div>
                            <div className="text-xs font-bold mb-2" style={{ color: 'var(--color-accent-primary)' }}>${gear.total_investment.toLocaleString()}</div>
                            <div className="flex items-center justify-between mb-1">
                              <Checkbox 
                                checked={gear.include_by_default} 
                                onCheckedChange={(checked) => toggleGearIncludeByDefault(gear.id, checked)}
                                className="h-3 w-3"
                              />
                              <span className="text-[8px]" style={{ color: gear.include_by_default ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}>
                                {gear.include_by_default ? 'Default' : 'Off'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="flex-1 h-6 text-[10px]" onClick={() => setEditingGear(gear)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" className="h-6 px-2" onClick={() => showConfirmDialog("Delete?", `Delete "${gear.item}"?`, () => deleteGear(gear.id))}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cameras">
            <Card className="shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
              <CardHeader style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      <Camera className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                      Camera Inventory
                    </CardTitle>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Manage your camera equipment. Set one as default for quick selection.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddCamera(true)}
                    className="gap-2"
                    style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Camera
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {showAddCamera && (
                  <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                    <h4 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Add New Camera</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label style={{ color: 'var(--color-text-secondary)' }}>Make</Label>
                        <Input
                          value={newCamera.make}
                          onChange={(e) => setNewCamera({...newCamera, make: e.target.value})}
                          placeholder="Sony, Canon, RED..."
                          style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: 'var(--color-text-secondary)' }}>Model</Label>
                        <Input
                          value={newCamera.model}
                          onChange={(e) => setNewCamera({...newCamera, model: e.target.value})}
                          placeholder="FX3, C70, Komodo..."
                          style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Checkbox
                        checked={newCamera.is_default}
                        onCheckedChange={(checked) => setNewCamera({...newCamera, is_default: checked})}
                      />
                      <Label style={{ color: 'var(--color-text-secondary)' }}>Set as default camera</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => createCamera(newCamera)}
                        disabled={!newCamera.make || !newCamera.model}
                        style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Camera
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddCamera(false);
                          setNewCamera({ make: "", model: "", is_default: false });
                        }}
                        variant="outline"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mobile-friendly camera cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {cameras.map((camera) => (
                    <div 
                      key={camera.id} 
                      className={`p-3 rounded-lg border-2 ${camera.is_default ? 'border-[var(--color-accent-primary)]' : 'border-[var(--color-border)]'}`}
                      style={{ background: 'var(--color-bg-primary)' }}
                    >
                      {editingCamera === camera.id ? (
                        <div className="space-y-2">
                          <Input
                            defaultValue={camera.make}
                            onBlur={(e) => updateCamera(camera.id, { make: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Make"
                            style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                          />
                          <Input
                            defaultValue={camera.model}
                            onBlur={(e) => updateCamera(camera.id, { model: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Model"
                            style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                          />
                          <Button
                            onClick={() => setEditingCamera(null)}
                            size="sm"
                            className="w-full h-7 text-xs"
                            style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-right text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{camera.make}</div>
                          <div className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{camera.model}</div>
                          <div className="flex items-center justify-between mb-2">
                            <Checkbox
                              checked={camera.is_default}
                              onCheckedChange={() => toggleCameraDefault(camera.id)}
                            />
                            {camera.is_default && <span className="text-[10px]" style={{ color: 'var(--color-accent-primary)' }}>Default</span>}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => setEditingCamera(camera.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteCamera(camera.id)}
                              variant="destructive"
                              size="sm"
                              className="h-7 px-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
              <CardHeader className="p-3 md:p-6" style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                <CardTitle className="flex items-center gap-2 text-sm md:text-base" style={{ color: 'var(--color-text-primary)' }}>
                  <SettingsIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--color-accent-primary)' }} />
                  Business Info
                </CardTitle>
                <p className="text-xs hidden md:block" style={{ color: 'var(--color-text-muted)' }}>
                  Settings for calculations and quotes.
                </p>
              </CardHeader>
              <CardContent className="p-3 md:p-6 space-y-4 md:space-y-6">
                
                {/* Company Information */}
                <div className="space-y-2 md:space-y-4">
                  <h3 className="text-sm md:text-lg font-semibold pb-1 md:pb-2" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}>
                    Company Info
                  </h3>
                  <div className="grid gap-2 md:gap-4 grid-cols-2">
                    <div>
                      <Label htmlFor="company_name" className="text-[10px] md:text-sm mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Name
                      </Label>
                      <Input
                        id="company_name"
                        value={localSettings?.company_name || ""}
                        onChange={(e) => handleSettingsUpdate('company_name', e.target.value)}
                        placeholder="Company Name"
                        className="h-8 text-xs md:text-sm"
                        style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_tagline" className="text-[10px] md:text-sm mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Tagline
                      </Label>
                      <Input
                        id="company_tagline"
                        value={localSettings?.company_tagline || ""}
                        onChange={(e) => handleSettingsUpdate('company_tagline', e.target.value)}
                        placeholder="Tagline"
                        className="h-8 text-xs md:text-sm"
                        style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                      />
                    </div>
                  </div>

                  {/* Logo - compact on mobile */}
                  <div className="hidden md:block">
                    <Label className="text-[10px] md:text-sm mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Logo
                    </Label>
                    {localSettings?.company_logo ? (
                      <div className="flex items-center gap-2">
                        <img src={localSettings.company_logo} alt="Logo" className="max-w-[100px] max-h-[40px] border rounded" style={{ borderColor: 'var(--color-border-dark)' }} />
                        <Button onClick={handleRemoveLogo} variant="destructive" size="sm" className="h-6 px-2"><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <label htmlFor="logo-upload">
                        <div className="border-2 border-dashed rounded p-3 text-center cursor-pointer text-xs" style={{ borderColor: 'var(--color-border-dark)', background: 'var(--color-bg-tertiary)' }}>
                          <Upload className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--color-text-muted)' }} />
                          <span style={{ color: 'var(--color-text-muted)' }}>Upload</span>
                        </div>
                        <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="company_address" className="text-[10px] md:text-sm mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Address
                    </Label>
                    <Input id="company_address" value={localSettings?.company_address || ""} onChange={(e) => handleSettingsUpdate('company_address', e.target.value)} placeholder="Address" className="h-8 text-xs md:text-sm" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                  </div>

                  <div className="grid gap-2 grid-cols-3">
                    <div>
                      <Label htmlFor="company_phone" className="text-[10px] md:text-sm mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Phone</Label>
                      <Input id="company_phone" value={localSettings?.company_phone || ""} onChange={(e) => handleSettingsUpdate('company_phone', e.target.value)} placeholder="Phone" className="h-8 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label htmlFor="company_email" className="text-[10px] md:text-sm mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Email</Label>
                      <Input id="company_email" type="email" value={localSettings?.company_email || ""} onChange={(e) => handleSettingsUpdate('company_email', e.target.value)} placeholder="Email" className="h-8 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label htmlFor="company_website" className="text-[10px] md:text-sm mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Web</Label>
                      <Input id="company_website" value={localSettings?.company_website || ""} onChange={(e) => handleSettingsUpdate('company_website', e.target.value)} placeholder="Website" className="h-8 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                  </div>
                </div>

                {/* Financial Settings - Compact */}
                <div className="space-y-2 md:space-y-4">
                  <h3 className="text-sm md:text-lg font-semibold pb-1 md:pb-2" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}>
                    Financial
                  </h3>
                  <div className="grid gap-2 grid-cols-3 md:grid-cols-4">
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Overhead %</Label>
                      <Input type="number" min="0" max="100" value={localSettings?.overhead_percent || 0} onChange={(e) => handleSettingsUpdate('overhead_percent', parseFloat(e.target.value) || 0)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Profit %</Label>
                      <Input type="number" min="0" max="100" value={localSettings?.profit_margin_percent || 0} onChange={(e) => handleSettingsUpdate('profit_margin_percent', parseFloat(e.target.value) || 0)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Target %</Label>
                      <Input type="number" min="0" max="100" value={localSettings?.desired_profit_margin_percent || 0} onChange={(e) => handleSettingsUpdate('desired_profit_margin_percent', parseFloat(e.target.value) || 0)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Tax %</Label>
                      <Input type="number" min="0" max="25" step="0.01" value={localSettings?.tax_rate_percent || 0} onChange={(e) => handleSettingsUpdate('tax_rate_percent', parseFloat(e.target.value) || 0)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Deposit %</Label>
                      <Input type="number" min="0" max="100" value={localSettings?.deposit_percent || 0} onChange={(e) => handleSettingsUpdate('deposit_percent', parseFloat(e.target.value) || 0)} disabled={localSettings?.deposit_enabled === false} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)', opacity: localSettings?.deposit_enabled === false ? 0.5 : 1 }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Nonprofit %</Label>
                      <Input type="number" min="0" max="50" value={localSettings?.nonprofit_discount_percent || 0} onChange={(e) => handleSettingsUpdate('nonprofit_discount_percent', parseFloat(e.target.value) || 0)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Rush %</Label>
                      <Input type="number" min="0" max="100" value={localSettings?.rush_fee_percent || 0} onChange={(e) => handleSettingsUpdate('rush_fee_percent', parseFloat(e.target.value) || 0)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="deposit_enabled" checked={localSettings?.deposit_enabled !== false} onCheckedChange={(checked) => handleSettingsUpdate('deposit_enabled', checked)} className="h-3 w-3" />
                      <Label htmlFor="deposit_enabled" className="text-[8px] md:text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>Deposit On</Label>
                    </div>
                  </div>
                </div>

                {/* Pricing & Operational - Compact */}
                <div className="space-y-2 md:space-y-4">
                  <h3 className="text-sm md:text-lg font-semibold pb-1 md:pb-2" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}>
                    Pricing & Operations
                  </h3>
                  <div className="grid gap-2 grid-cols-4">
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>½ Day Hrs</Label>
                      <Input type="number" min="1" max="12" value={localSettings?.half_day_hours || 6} onChange={(e) => handleSettingsUpdate('half_day_hours', parseInt(e.target.value) || 6)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Full Hrs</Label>
                      <Input type="number" min="1" max="16" value={localSettings?.full_day_hours || 10} onChange={(e) => handleSettingsUpdate('full_day_hours', parseInt(e.target.value) || 10)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>$/Mile</Label>
                      <Input type="number" min="0" step="0.01" value={localSettings?.mileage_rate || 0} onChange={(e) => handleSettingsUpdate('mileage_rate', parseFloat(e.target.value) || 0)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                    <div>
                      <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>OT Multi</Label>
                      <Input type="number" min="1" step="0.1" value={localSettings?.overtime_multiplier || 1.5} onChange={(e) => handleSettingsUpdate('overtime_multiplier', parseFloat(e.target.value) || 1.5)} className="h-7 text-xs" style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[9px] md:text-xs mb-0.5 block" style={{ color: 'var(--color-text-secondary)' }}>Gear Amortization: {localSettings?.gear_amortization_days || 90} days</Label>
                    <Slider min={1} max={365} step={1} value={[localSettings?.gear_amortization_days || 90]} onValueChange={(value) => handleSettingsUpdate('gear_amortization_days', value[0])} className="w-full" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 p-1.5 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>
                      <Checkbox id="show_service_fee_on_invoice" checked={localSettings?.show_service_fee_on_invoice !== false} onCheckedChange={(checked) => handleSettingsUpdate('show_service_fee_on_invoice', checked)} className="h-3 w-3" />
                      <Label htmlFor="show_service_fee_on_invoice" className="text-[8px] md:text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>Show Fee</Label>
                    </div>
                    <div className="flex items-center gap-1 p-1.5 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>
                      <Checkbox id="simplified_invoice" checked={localSettings?.simplified_invoice || false} onCheckedChange={(checked) => handleSettingsUpdate('simplified_invoice', checked)} className="h-3 w-3" />
                      <Label htmlFor="simplified_invoice" className="text-[8px] md:text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>Simple Invoice</Label>
                    </div>
                    <div className="flex items-center gap-1 p-1.5 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>
                      <Checkbox id="tax_travel" checked={localSettings?.tax_travel || false} onCheckedChange={(checked) => handleSettingsUpdate('tax_travel', checked)} className="h-3 w-3" />
                      <Label htmlFor="tax_travel" className="text-[8px] md:text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>Tax Travel</Label>
                    </div>
                  </div>
                </div>

                {/* Regional Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold pb-2" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}>
                    Regional Settings
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="region" className="mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Region
                      </Label>
                      <Input
                        id="region"
                        value={localSettings?.region || ""}
                        onChange={(e) => handleSettingsUpdate('region', e.target.value)}
                        placeholder="Austin, TX"
                        style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry_index" className="mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Industry Index
                      </Label>
                      <Input
                        id="industry_index"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={localSettings?.industry_index || 1.0}
                        onChange={(e) => handleSettingsUpdate('industry_index', parseFloat(e.target.value) || 1.0)}
                        style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                      />
                      <p className="text-xs text-muted-foreground mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        1.0 = standard
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="region_multiplier" className="mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Region Multiplier
                      </Label>
                      <Input
                        id="region_multiplier"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={localSettings?.region_multiplier || 1.0}
                        onChange={(e) => handleSettingsUpdate('region_multiplier', parseFloat(e.target.value) || 1.0)}
                        style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                      />
                      <p className="text-xs text-muted-foreground mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Cost-of-living adjustment
                      </p>
                    </div>
                  </div>
                </div>

                {/* PDF & Quote Customization */}
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold pb-2" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}>
                    PDF & Quote Customization
                  </h3>
                  
                  <div>
                    <Label htmlFor="terms_and_conditions" className="mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Terms & Conditions
                    </Label>
                    <Textarea
                      id="terms_and_conditions"
                      value={localSettings?.terms_and_conditions || ""}
                      onChange={(e) => handleSettingsUpdate('terms_and_conditions', e.target.value)}
                      placeholder="Payment is due within 30 days of receiving this invoice..."
                      rows={6}
                      style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      These terms will appear at the bottom of your PDF quotes
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes_to_customer" className="mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Notes to Customer (Optional)
                    </Label>
                    <Textarea
                      id="notes_to_customer"
                      value={localSettings?.notes_to_customer || ""}
                      onChange={(e) => handleSettingsUpdate('notes_to_customer', e.target.value)}
                      placeholder="Thank you for your business! We look forward to working with you..."
                      rows={4}
                      style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      Optional personalized message that appears on your quotes
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show_signature_field"
                        checked={localSettings?.show_signature_field !== false}
                        onCheckedChange={(checked) => handleSettingsUpdate('show_signature_field', checked)}
                      />
                      <Label htmlFor="show_signature_field" className="cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                        Show signature field on PDF
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show_payment_schedule"
                        checked={localSettings?.show_payment_schedule !== false}
                        onCheckedChange={(checked) => handleSettingsUpdate('show_payment_schedule', checked)}
                      />
                      <Label htmlFor="show_payment_schedule" className="cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                        Show payment schedule on PDF
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Experience Levels */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="block" style={{ color: 'var(--color-text-secondary)' }}>
                      Experience Level Multipliers
                    </Label>
                    <Button
                      size="sm"
                      onClick={addNewExperienceLevel}
                      style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Level
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Adjust day rates based on the experience level of the talent.
                    e.g., Junior (0.8x), Senior (1.2x).
                  </p>
                  <div className="space-y-3">
                    {localSettings?.experience_levels && Object.keys(localSettings.experience_levels).map((level) => (
                      <div key={level} className="flex flex-row items-center gap-2 flex-wrap">
                        <Label className="w-24" style={{ color: 'var(--color-text-primary)' }}>{level}</Label>
                        {editingExperienceLevel === level ? (
                          <>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={localSettings.experience_levels[level]}
                              onChange={(e) => setLocalSettings({
                                ...localSettings,
                                experience_levels: {
                                  ...localSettings.experience_levels,
                                  [level]: parseFloat(e.target.value) || 0
                                }
                              })}
                              className="w-24"
                              style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', borderColor: 'var(--color-input-border)' }}
                            />
                            <Button size="sm" onClick={() => handleExperienceLevelUpdate(level, localSettings.experience_levels[level])} style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingExperienceLevel(null)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)' }}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="w-24" style={{ color: 'var(--color-text-primary)' }}>{localSettings.experience_levels[level]}x</span>
                            <Button size="sm" variant="outline" onClick={() => setEditingExperienceLevel(level)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)' }}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeExperienceLevel(level)}
                              style={{ background: 'var(--color-error)', color: 'white' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--color-text-primary)' }}>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--color-text-secondary)' }}>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                setConfirmDialog({ ...confirmDialog, open: false });
              }}
              style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
