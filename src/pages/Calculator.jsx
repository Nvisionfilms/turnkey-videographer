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
import { RotateCcw, AlertCircle, Download, Mail, Shield, Calendar as CalendarIcon, Lock, Clock, Sparkles, Heart, Coffee, ArrowRight, ChevronLeft, ChevronRight, DollarSign, FileText, Settings as SettingsIcon, Key as KeyIcon, Copy as CopyIcon, User, Briefcase, Users, Package, Video as VideoIcon, Check, Percent } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { setReferralCookie, getReferralCookie } from "../utils/affiliateUtils";
import { getDeviceId } from "@/utils/deviceFingerprint";

import LiveTotalsPanel from "../components/calculator/LiveTotalsPanelNew";
import RoleSelector from "../components/calculator/RoleSelector";
import GearSelector from "../components/calculator/GearSelector";
import CameraSelector from "../components/calculator/CameraSelector";
import ExperienceLevelSelector from "../components/calculator/ExperienceLevelSelector";
import NegotiationTicker from "../components/calculator/NegotiationTicker";
import PresetTemplates from "../components/calculator/PresetTemplates";
import BehavioralPricingSection from "../components/calculator/BehavioralPricingSection";
import CollapsibleSection from "../components/calculator/CollapsibleSection";
import QuoteHistory, { saveToQuoteHistory } from "../components/calculator/QuoteHistory";
import MobileFloatingTotal from "../components/calculator/MobileFloatingTotal";
import LiveUpdatesTicker from "../components/LiveUpdatesTicker";
// import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import { calculateQuote } from "../components/calculator/calculations";
import { ExportService } from "../components/services/ExportService";
import { EnhancedExportService } from "../components/services/EnhancedExportService";
import { STORAGE_KEYS, DEFAULT_DAY_RATES, DEFAULT_GEAR_COSTS, DEFAULT_CAMERAS, DEFAULT_SETTINGS } from "../components/data/defaults";
import { useUnlockStatus } from "../components/hooks/useUnlockStatus";
import { recordFinalizedQuote } from "../utils/behaviorRecorder";
import { recordExportedDecision } from "../utils/exportedDecisionStore";

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
    canUseCalculator,
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

  const [includeDeliverablesInExport, setIncludeDeliverablesInExport] = useState(false);

  const hasDeliverableEstimate = useMemo(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEYS.DELIVERABLE_ESTIMATE));
    } catch {
      return false;
    }
  }, []);

  const [deliverableEstimate, setDeliverableEstimate] = useState(null);
  const [suggestedCrewPreset, setSuggestedCrewPreset] = useState(null);
  
  // Post-export reflection modal state
  const [reflectionText, setReflectionText] = useState(null);
  
  // Ref for debounced save timeout
  const saveTimeoutRef = React.useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    client_name: "",
    project_title: "",
    project_manager: "",
    production_company: "",
    crew_members: "",
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
    usage_rights_enabled: false,
    usage_rights_type: "1_year",
    usage_rights_cost: 0,
    usage_rights_percentage: 20,
    usage_rights_duration: "1 year",
    talent_fees_enabled: false,
    talent_primary_count: 0,
    talent_primary_rate: 500,
    talent_extra_count: 0,
    talent_extra_rate: 150,
    notes_for_quote: ""
  });

  // Helper function to load data from localStorage
  const loadAllData = useCallback((includeFormData = true) => {
    try {
      console.log('=== LOADING DATA FROM LOCALSTORAGE ===');
      
      // Load day rates
      const ratesStr = localStorage.getItem(STORAGE_KEYS.DAY_RATES);
      if (ratesStr) {
        let loadedRates = JSON.parse(ratesStr);
        console.log('Loaded day rates:', loadedRates);
        
        // Auto-migrate: Replace old Line/Lead Editor roles with new Social Media/Shorts and Long Form Editor roles
        const oldLineEditorId = 'rate_5';
        const oldLeadEditorId = 'rate_6';
        const hasOldLineEditor = loadedRates.some(r => r.id === oldLineEditorId && r.role.includes('Line Editor'));
        const hasOldLeadEditor = loadedRates.some(r => r.id === oldLeadEditorId && r.role.includes('Lead Editor'));
        
        if (hasOldLineEditor || hasOldLeadEditor) {
          console.log('Auto-migrating old Line/Lead Editor roles to new Social Media/Shorts and Long Form Editor roles');
          
          // Remove old editor roles and replace with new ones from defaults
          loadedRates = loadedRates.filter(r => r.id !== oldLineEditorId && r.id !== oldLeadEditorId);
          const newSocialMediaEditor = DEFAULT_DAY_RATES.find(r => r.id === oldLineEditorId);
          const newLongFormEditor = DEFAULT_DAY_RATES.find(r => r.id === oldLeadEditorId);
          
          if (newSocialMediaEditor) loadedRates.push(newSocialMediaEditor);
          if (newLongFormEditor) loadedRates.push(newLongFormEditor);
          
          localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(loadedRates));
          console.log('Migration complete - old editors replaced with new ones');
        }
        
        // Auto-migrate: Add missing default roles (like Drone Operator) for existing users
        const existingRoleIds = new Set(loadedRates.map(r => r.id));
        const missingRoles = DEFAULT_DAY_RATES.filter(dr => !existingRoleIds.has(dr.id));
        
        if (missingRoles.length > 0) {
          console.log('Auto-migrating missing roles:', missingRoles);
          const updatedRates = [...loadedRates, ...missingRoles];
          localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(updatedRates));
          setDayRates(updatedRates);
        } else {
          setDayRates(loadedRates);
        }
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
      // BUT skip if we're about to apply a deliverable preset
      if (includeFormData) {
        const shouldApplyPreset = localStorage.getItem(STORAGE_KEYS.APPLY_DELIVERABLE_PRESET_ONCE) === '1';
        
        if (shouldApplyPreset) {
          console.log('Skipping localStorage load - preset will be applied');
        } else {
          const savedFormData = localStorage.getItem(STORAGE_KEYS.CALCULATOR_SESSION);
          if (savedFormData) {
            const parsed = JSON.parse(savedFormData);
            console.log('Loaded saved form data:', parsed);
            setFormData(parsed);
          }
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELIVERABLE_ESTIMATE);
      setDeliverableEstimate(raw ? JSON.parse(raw) : null);
    } catch {
      setDeliverableEstimate(null);
    }
  }, []);

  const buildSuggestedCrewPresetFromDeliverables = useCallback((payload, availableDayRates, availableGearCosts) => {
    if (!payload?.selections || !payload?.computed) return null;


    const selections = payload.selections;
    const computed = payload.computed;

    const roleIdByIncludes = (needle) => {
      const found = (availableDayRates || []).find(r => (r.role || '').toLowerCase().includes(needle));
      return found?.id || null;
    };

    const addRole = (arr, roleId, qty = 1, daySplit) => {
      if (!roleId) return;
      const existing = arr.find(r => r.role_id === roleId);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + qty;
      } else {
        // Get role name from dayRates
        const roleData = availableDayRates.find(r => r.id === roleId);
        const roleName = roleData?.role || roleId;
        const unitType = roleData?.unit_type || 'day';
        
        arr.push({ 
          role_id: roleId, 
          role_name: roleName,
          unit_type: unitType,
          quantity: qty, 
          minutes_output: 0, 
          requests: 0, 
          deliverable_count: 0 
        });
      }

      if (daySplit) {
        const target = arr.find(r => r.role_id === roleId);
        if (target) {
          target.full_days = daySplit.full_days;
          target.half_days = daySplit.half_days;
          target.crew_qty = qty;
        }
      }
    };

    const selectedRoles = [];

    const scopeId = selections.executionScopeId;
    const hasLive = selections.productionCategoryId === 'live_stream_broadcast' || (computed?.estimateSummary?.productionCategoryLabel || '').toLowerCase().includes('live');
    const hasMultiCam = (selections.modifiers || []).some(m => m.modifierId === 'multi_camera_setup');
    const hasDrone = (selections.modifiers || []).some(m => m.modifierId === 'drone_aerials');
    const hasBroadcast = (selections.modifiers || []).some(m => m.modifierId === 'broadcast_compliance');
    
    // If deliverables are selected, assume post/editing is needed
    const hasDeliverables = (selections.deliverables || []).length > 0;
    const postRequested = Boolean(selections.postRequested) || hasDeliverables;
    

    const productionDaysFromComputed = (() => {
      const li = (computed?.lineItems || []).find(x => x.kind === 'production_day');
      return typeof li?.quantity === 'number' ? li.quantity : null;
    })();

    const baseProductionDays =
      typeof productionDaysFromComputed === 'number'
        ? productionDaysFromComputed
        : Number(selections.productionDays || 0);

    const computeDaySplit = (days) => {
      const d = Number(days || 0);
      if (d <= 0) return { full_days: 0, half_days: 0 };
      const full = Math.floor(d);
      const half = d - full >= 0.5 ? 1 : 0;
      return { full_days: full, half_days: half };
    };

    // Social-media style packages can often be a 1-person job; everything else defaults to a 2-person crew.
    // Heuristic: content_creation with only short-form/BTS/photo/B-roll deliverables (no live/broadcast).
    const socialMediaDeliverableIds = new Set([
      'sfv_60s',
      'bts_capture',
      'photo_set_10_20',
      'broll_library_export',
    ]);

    const selectedDeliverableIds = (selections.deliverables || []).map(d => d.deliverableId).filter(Boolean);
    const isSocialMediaPackage =
      selections.productionCategoryId === 'content_creation' &&
      selectedDeliverableIds.length > 0 &&
      selectedDeliverableIds.every(id => socialMediaDeliverableIds.has(id)) &&
      !hasLive &&
      !hasBroadcast;

    const isLongFormPackage = selections.productionCategoryId === 'content_creation' &&
      (selectedDeliverableIds.includes('lfv_2_10') || selectedDeliverableIds.includes('scripted_brand_video'));

    const isEventCoverage = selections.productionCategoryId === 'event_coverage';
    const isSeries = selections.productionCategoryId === 'streaming_series';
    const isFilm = selections.productionCategoryId === 'theatrical_film';

    const effectiveProductionDays = (() => {
      if (isSeries) return Math.max(2, baseProductionDays || 0);
      if (isFilm) return Math.max(30, baseProductionDays || 0);
      return baseProductionDays || 0;
    })();

    const daySplit = computeDaySplit(effectiveProductionDays);

    // Baseline camera operator
    // - content_creation: typically solo (social + long-form). You can add more later.
    // - event_coverage: suggested 2-person
    // - series/film: suggested 2-person baseline + leadership roles
    const baseCameraQty = isEventCoverage ? 2 : (isSeries || isFilm ? 2 : 1);
    addRole(
      selectedRoles,
      roleIdByIncludes('camera op (with camera)'),
      isSocialMediaPackage ? 1 : baseCameraQty,
      daySplit
    );

    // Scope influences responsibility roles
    // Note: Full creative direction is excluded - users selecting crew means they're using their own custom rates
    if (scopeId === 'directed_production') {
      addRole(selectedRoles, roleIdByIncludes('director'), 1, daySplit);
    }

    // Live/broadcast adds oversight + audio
    if (hasLive || hasBroadcast) {
      addRole(selectedRoles, roleIdByIncludes('director'), 1, daySplit);
    }

    // Series/film generally require a fuller crew
    if (isSeries || isFilm) {
      addRole(selectedRoles, roleIdByIncludes('director'), 1, daySplit);
      addRole(selectedRoles, roleIdByIncludes('director of photography'), 1, daySplit);
    }

    // Multi-cam setup is excluded - users decide camera setup when selecting roles manually

    // Post / editing roles (all-in)
    if (postRequested) {
      // Find editor roles by exact name match to avoid conflicts
      const socialMediaEditorId = (availableDayRates || []).find(r => 
        r.role && (r.role.toLowerCase().includes('social media') || r.role.toLowerCase().includes('shorts'))
      )?.id;
      const longFormEditorId = (availableDayRates || []).find(r => 
        r.role && r.role.toLowerCase().includes('long form')
      )?.id;
      const revisionsId = roleIdByIncludes('revisions per request');
      

      // Map deliverable IDs to editor types
      const shortFormDeliverableIds = new Set([
        'sfv_60s',           // Short-form video (<60s)
        'bts_capture',       // Behind the Scenes Capture
        'photo_set_10_20',   // Photo sets
        'broll_library_export' // B-roll
      ]);
      
      const longFormDeliverableIds = new Set([
        'lfv_2_10',              // Long-form Video (2-10 min)
        'interview_capture',     // Interview Capture
        'scripted_brand_video',  // Scripted Branded Video
        'training_video',        // Training Video
        'podcast_video'          // Podcast Video
      ]);

      // Count deliverables by type
      let shortFormCount = 0;
      let longFormCount = 0;
      let totalDeliverableCount = 0;

      (selections.deliverables || []).forEach(d => {
        const qty = Number(d.quantity || 0);
        totalDeliverableCount += qty;
        
        if (shortFormDeliverableIds.has(d.deliverableId)) {
          shortFormCount += qty;
        } else if (longFormDeliverableIds.has(d.deliverableId)) {
          longFormCount += qty;
        }
      });

      // Add Social Media/Shorts Editor if there are short-form deliverables
      if (socialMediaEditorId && shortFormCount > 0) {
        addRole(selectedRoles, socialMediaEditorId, 1);
        const editorEntry = selectedRoles.find(r => r.role_id === socialMediaEditorId);
        if (editorEntry) {
          editorEntry.deliverable_count = shortFormCount;
          editorEntry.crew_qty = 1;
          editorEntry.quantity = 1;
        }
      }

      // Add Long Form Editor if there are long-form deliverables
      if (longFormEditorId && longFormCount > 0) {
        addRole(selectedRoles, longFormEditorId, 1);
        const editorEntry = selectedRoles.find(r => r.role_id === longFormEditorId);
        if (editorEntry) {
          editorEntry.deliverable_count = longFormCount;
          editorEntry.crew_qty = 1;
          editorEntry.quantity = 1;
        }
      }

      // Basic revision requests heuristic: 1 request per deliverable, minimum 2
      const estimatedRequests = Math.max(2, totalDeliverableCount);
      if (revisionsId && totalDeliverableCount > 0) {
        addRole(selectedRoles, revisionsId, 1);
        const revEntry = selectedRoles.find(r => r.role_id === revisionsId);
        if (revEntry) {
          revEntry.requests = Math.max(revEntry.requests || 0, estimatedRequests);
        }
      }
    }

    // Gear suggestions
    const gearIdByIncludes = (needle) => {
      const found = (availableGearCosts || []).find(g => (g.item || '').toLowerCase().includes(needle));
      return found?.id || null;
    };

    const selectedGearItems = [];

    const addGear = (id) => {
      if (!id) return;
      if (!selectedGearItems.includes(id)) selectedGearItems.push(id);
    };

    // Baseline kit (always for presets)
    // - audio equipment
    // - lighting kit
    // - camera body
    // - lenses
    // - tripod
    addGear(gearIdByIncludes('audio'));
    addGear(gearIdByIncludes('lighting'));
    addGear(gearIdByIncludes('camera body'));
    addGear(gearIdByIncludes('lenses'));
    addGear(gearIdByIncludes('tripod'));

    if (hasDrone) {
      const droneId = gearIdByIncludes('drone');
      addGear(droneId);
    }

    // Audio pre/post suggestion
    const includeAudioPrePost = Boolean(hasLive) || (computed?.estimateSummary?.deliverables || []).some(d => (d.label || '').toLowerCase().includes('interview'));

    // Experience level: nudge up for higher responsibility / live
    const experienceLevel = (scopeId === 'full_creative_direction' || hasLive) ? 'Senior' : 'Standard';

    return {
      selected_roles: selectedRoles,
      gear_enabled: true,
      selected_gear_items: selectedGearItems,
      include_audio_pre_post: includeAudioPrePost,
      day_type: 'full',
      custom_hours: 10,
      experience_level: experienceLevel,
      deliverable_estimate: payload, // Store the full estimate for reference
    };
  }, []);

  useEffect(() => {
    if (!deliverableEstimate) {
      setSuggestedCrewPreset(null);
      return;
    }
    const preset = buildSuggestedCrewPresetFromDeliverables(deliverableEstimate, dayRates, gearCosts);
    setSuggestedCrewPreset(preset);
  }, [deliverableEstimate, dayRates, gearCosts, buildSuggestedCrewPresetFromDeliverables]);

  const applySuggestedCrewPreset = useCallback(() => {
    if (!suggestedCrewPreset) return;

    console.log('=== APPLYING PRESET ===');
    console.log('Preset selected_roles:', suggestedCrewPreset.selected_roles);
    console.log('Current formData.selected_roles:', formData.selected_roles);

    setFormData(prev => {
      const updated = {
        ...prev,
        ...suggestedCrewPreset,
      };
      console.log('Updated formData after preset:', updated);
      console.log('Updated selected_roles:', updated.selected_roles);
      return updated;
    });

    // Use setTimeout to log state after React has updated
    setTimeout(() => {
      console.log('FormData after state update:', formData);
      console.log('Selected roles after state update:', formData.selected_roles);
    }, 100);

    toast({
      title: 'Suggested Setup Applied',
      description: 'Roles and gear were pre-filled from your Deliverables Estimator.',
    });
  }, [suggestedCrewPreset, formData, toast]);

  // Apply preset immediately when it's ready
  useEffect(() => {
    if (!suggestedCrewPreset) return;

    let shouldApply = false;
    try {
      shouldApply = localStorage.getItem(STORAGE_KEYS.APPLY_DELIVERABLE_PRESET_ONCE) === '1';
    } catch {
      shouldApply = false;
    }

    if (!shouldApply) return;

    // Apply preset directly to avoid timing issues
    setFormData(prev => ({
      ...prev,
      ...suggestedCrewPreset,
    }));

    // Force a second state update to ensure UI re-renders
    setTimeout(() => {
      setFormData(prev => ({...prev}));
    }, 100);

    try {
      localStorage.removeItem(STORAGE_KEYS.APPLY_DELIVERABLE_PRESET_ONCE);
    } catch {
      // Ignore storage errors
    }
  }, [suggestedCrewPreset]);

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

  // Expose clearCustomPriceOverride function globally for other components to call
  useEffect(() => {
    window.clearCustomPriceOverride = () => {
      setFormData(prev => {
        const { custom_price_override, custom_discount_percent, ...rest } = prev;
        return {
          ...rest,
          custom_price_override: null,
          custom_discount_percent: null
        };
      });
      toast({
        title: "Custom Pricing Cleared",
        description: "Custom price override has been removed. Pricing will update automatically.",
      });
    };
    
    return () => {
      delete window.clearCustomPriceOverride;
    };
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

  // Auto-generate notes from deliverables and crew selections (1.5 second debounce)
  const notesTimeoutRef = React.useRef(null);
  useEffect(() => {
    // Clear existing timeout
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    
    // Set new timeout for debounced notes generation
    notesTimeoutRef.current = setTimeout(() => {
      const noteParts = [];
      
      // Add deliverable info if coming from deliverable calculator
      if (deliverableEstimate?.selections?.deliverables && deliverableEstimate.selections.deliverables.length > 0) {
        const deliverables = deliverableEstimate.selections.deliverables
          .map(d => `${d.quantity}x ${d.deliverableLabel || d.deliverableId}`)
          .join(', ');
        noteParts.push(`Deliverables: ${deliverables}`);
      }
      
      // Add crew info
      if (formData.selected_roles && formData.selected_roles.length > 0) {
        const crewList = formData.selected_roles.map(role => {
          const rateName = dayRates.find(r => r.id === role.role_id)?.role || role.role_name || 'Crew';
          const qty = role.crew_qty || role.quantity || 1;
          const fullDays = role.full_days || 0;
          const halfDays = role.half_days || 0;
          const days = fullDays + halfDays;
          return `${qty}x ${rateName} (${days} ${days === 1 ? 'day' : 'days'})`;
        }).join(', ');
        noteParts.push(`Crew: ${crewList}`);
      }
      
      // Add gear info
      if (formData.gear_enabled && formData.selected_gear_items && formData.selected_gear_items.length > 0) {
        const gearList = formData.selected_gear_items
          .map(gearId => gearCosts.find(g => g.id === gearId)?.item)
          .filter(Boolean)
          .join(', ');
        if (gearList) {
          noteParts.push(`Equipment: ${gearList}`);
        }
      }
      
      // Add camera info
      if (formData.selected_camera && formData.cameras) {
        const camera = formData.cameras.find(c => c.id === formData.selected_camera);
        if (camera) {
          noteParts.push(`Camera: ${camera.model}`);
        }
      }
      
      // Add usage rights info
      if (formData.usage_rights_enabled) {
        noteParts.push(`Usage Rights: ${formData.usage_rights_duration || formData.usage_rights_type}`);
      }
      
      // Add talent info
      if (formData.talent_fees_enabled) {
        const talentParts = [];
        if (formData.talent_primary_count > 0) {
          talentParts.push(`${formData.talent_primary_count} primary talent`);
        }
        if (formData.talent_extra_count > 0) {
          talentParts.push(`${formData.talent_extra_count} extras`);
        }
        if (talentParts.length > 0) {
          noteParts.push(`Talent: ${talentParts.join(', ')}`);
        }
      }
      
      // Only update if we have generated notes and the field is currently empty
      if (noteParts.length > 0 && !formData.notes_for_quote) {
        const generatedNotes = noteParts.join(' • ');
        setFormData(prev => ({ ...prev, notes_for_quote: generatedNotes }));
      }
    }, 1500); // 1.5 second delay
    
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
    };
  }, [formData.selected_roles, formData.selected_gear_items, formData.selected_camera, formData.usage_rights_enabled, formData.talent_fees_enabled, deliverableEstimate, dayRates, gearCosts]);

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
    
    const result = calculateQuote(formData, dayRates, gearCosts, settings, deliverableEstimate);
    
    // Store original total before any overrides
    result.originalTotal = result.total;
    
    // Apply custom price override if set (from round/discount buttons)
    // Disperse the adjustment proportionally into service line items so rates stay coherent
    if (formData.custom_price_override !== null && formData.custom_price_override > 0) {
      const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

      const targetTotal = Number(formData.custom_price_override || 0);
      const originalTotal = Number(result.originalTotal || 0);
      const discountPercent = Number(formData.custom_discount_percent || 0);
      const taxRate = (settings?.tax_rate_percent || 0) / 100;

      // Compute required pre-tax delta so that after tax the total hits the target
      const deltaTotal = targetTotal - originalTotal;
      const deltaPreTax = taxRate > 0 ? round2(deltaTotal / (1 + taxRate)) : deltaTotal;

      if (Math.abs(deltaPreTax) >= 0.01 && Array.isArray(result?.lineItems)) {
        const baseTaxableAmount = Number(result.taxableAmount || 0);

        // Identify service line items to adjust (exclude gear, travel, rentals, etc.)
        const isNonSection = (li) => li && !li.isSection;
        const isExcludedForAdjustment = (li) => {
          const desc = String(li?.description || '');
          if (!desc) return true;
          if (desc === 'Equipment & Gear') return true;
          if (desc.startsWith('Travel (')) return true;
          if (desc === 'Rental Costs') return true;
          if (desc === 'Usage Rights & Licensing') return true;
          if (desc === 'Talent Fees') return true;
          if (desc.startsWith('Rush Fee')) return true;
          if (desc.startsWith('Nonprofit Discount')) return true;
          if (desc.startsWith('Tax (')) return true;
          if (desc.startsWith('Discount')) return true;
          return false;
        };

        const candidateIndexes = result.lineItems
          .map((li, idx) => ({ li, idx }))
          .filter(({ li }) => isNonSection(li) && !isExcludedForAdjustment(li) && Number(li?.amount || 0) > 0)
          .map(({ idx }) => idx);

        const indexesToAdjust = candidateIndexes.length > 0
          ? candidateIndexes
          : result.lineItems
              .map((li, idx) => ({ li, idx }))
              .filter(({ li }) => isNonSection(li) && Number(li?.amount || 0) > 0)
              .map(({ idx }) => idx)
              .slice(0, 1);

        if (indexesToAdjust.length > 0) {
          // Calculate total of service items to distribute adjustment proportionally
          const serviceTotal = indexesToAdjust
            .reduce((sum, idx) => sum + Number(result.lineItems[idx]?.amount || 0), 0);

          let remaining = deltaPreTax;
          let lastAdjustedIdx = indexesToAdjust[indexesToAdjust.length - 1];
          
          indexesToAdjust.forEach((idx, i) => {
            const li = result.lineItems[idx];
            const base = Number(li?.amount || 0);
            const qty = typeof li?.quantity === 'number' ? li.quantity : null;

            // Last item gets remaining to avoid rounding drift
            const add = (i === indexesToAdjust.length - 1)
              ? remaining
              : (serviceTotal > 0 ? round2(deltaPreTax * (base / serviceTotal)) : 0);

            remaining = round2(remaining - add);

            const nextAmount = round2(base + add);
            li.amount = nextAmount;
            if (qty && qty > 0) {
              li.unitPrice = round2(nextAmount / qty);
            }

            lastAdjustedIdx = idx;
          });

          // Update derived totals
          result.subtotal = round2(Number(result.subtotal || 0) + deltaPreTax);
          result.laborWithOverheadProfit = round2(Number(result.laborWithOverheadProfit || 0) + deltaPreTax);

          const subtotal2 = round2(Number(result.subtotal || 0) + Number(result.rushFee || 0) - Number(result.nonprofitDiscount || 0));
          const taxableAmount = round2(baseTaxableAmount + deltaPreTax);
          let tax = round2(taxableAmount * taxRate);
          let total = round2(subtotal2 + tax);

          // Fix rounding drift to hit exact target
          const drift = round2(targetTotal - total);
          if (Math.abs(drift) >= 0.01) {
            if (taxRate > 0) {
              tax = round2(tax + drift);
              total = round2(total + drift);
            } else if (Number.isInteger(lastAdjustedIdx) && lastAdjustedIdx >= 0) {
              const li = result.lineItems[lastAdjustedIdx];
              const qty = typeof li?.quantity === 'number' ? li.quantity : null;
              li.amount = round2(Number(li.amount || 0) + drift);
              if (qty && qty > 0) {
                li.unitPrice = round2(li.amount / qty);
              }
              total = round2(total + drift);
            }
          }

          result.taxableAmount = taxableAmount;
          result.tax = tax;
          result.total = total;

          // Update the Tax line item amount
          const taxIdx = result.lineItems.findIndex(li => !li?.isSection && String(li?.description || '').startsWith('Tax ('));
          if (taxIdx !== -1) {
            result.lineItems[taxIdx].amount = round2(tax);
          }
        }
      }

      // Ensure total matches target
      result.total = targetTotal;
      result.depositDue = round2(result.total * ((settings?.deposit_percent || 50) / 100));
      result.balanceDue = round2(result.total - result.depositDue);
    }
    
    console.log('Calculation result:', result);
    return result;
  }, [formData, dayRates, gearCosts, settings, deliverableEstimate]);

  const pricingInputsSignatureRef = React.useRef('');
  useEffect(() => {
    const signatureObj = {
      day_type: formData.day_type,
      custom_hours: formData.custom_hours,
      experience_level: formData.experience_level,
      custom_multiplier: formData.custom_multiplier,
      selected_roles: formData.selected_roles,
      include_audio_pre_post: formData.include_audio_pre_post,
      gear_enabled: formData.gear_enabled,
      selected_gear_items: formData.selected_gear_items,
      selected_camera: formData.selected_camera,
      apply_nonprofit_discount: formData.apply_nonprofit_discount,
      apply_rush_fee: formData.apply_rush_fee,
      travel_miles: formData.travel_miles,
      rental_costs: formData.rental_costs,
      usage_rights_enabled: formData.usage_rights_enabled,
      usage_rights_type: formData.usage_rights_type,
      usage_rights_cost: formData.usage_rights_cost,
      talent_fees_enabled: formData.talent_fees_enabled,
      talent_primary_count: formData.talent_primary_count,
      talent_primary_rate: formData.talent_primary_rate,
      talent_extra_count: formData.talent_extra_count,
      talent_extra_rate: formData.talent_extra_rate,
    };

    let signature = '';
    try {
      signature = JSON.stringify(signatureObj);
    } catch {
      signature = String(Date.now());
    }

    const prevSignature = pricingInputsSignatureRef.current;
    pricingInputsSignatureRef.current = signature;

    // If the user previously used a manual/rounded override, clear it once they change pricing inputs.
    if (prevSignature && prevSignature !== signature && formData.custom_price_override !== null) {
      setFormData(prev => ({
        ...prev,
        custom_price_override: null,
      }));
    }
  }, [formData]);

  // Keyboard shortcuts for power users
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if not typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            // Save quote to history
            if (calculations) {
              saveToQuoteHistory(formData, calculations.total);
              toast({
                title: "Quote Saved",
                description: "Added to quote history",
              });
            }
            break;
          case 'e':
            e.preventDefault();
            // Export PDF (client version)
            if (calculations) {
              checkAccessAndProceed(() => {
                const exportService = new ExportService(formData, calculations, dayRates, gearCosts, settings);
                const printWindow = window.open('', '', 'width=800,height=600');
                printWindow.document.write(exportService.generateClientHTML());
                printWindow.document.close();
              });
            }
            break;
          case 'n':
            e.preventDefault();
            // New quote (reset)
            handleReset();
            toast({
              title: "New Quote",
              description: "Form reset to defaults",
            });
            break;
          case 'd':
            e.preventDefault();
            // Duplicate current quote (save and keep data)
            if (calculations) {
              saveToQuoteHistory(formData, calculations.total);
              toast({
                title: "Quote Duplicated",
                description: "Saved to history. Continue editing.",
              });
            }
            break;
          case 'r':
            e.preventDefault();
            // Round price
            if (calculations) {
              const currentTotal = calculations.total;
              const rounded = Math.ceil(currentTotal / 100) * 100;
              setFormData(prev => ({
                ...prev,
                custom_price_override: rounded,
                custom_discount_percent: 0
              }));
              toast({
                title: "Price Rounded",
                description: `$${currentTotal.toLocaleString()} → $${rounded.toLocaleString()}`,
              });
            }
            break;

          case 'c':
            e.preventDefault();
            // Copy total
            if (calculations) {
              navigator.clipboard.writeText((calculations.total ?? 0).toFixed(2));
              toast({
                title: "Copied!",
                description: `$${(calculations.total ?? 0).toFixed(2)} copied to clipboard`,
              });
            }
            break;

          case '1':
          case '2':
          case '3':
            e.preventDefault();
            // Quick discounts: 1=5%, 2=10%, 3=15% (cumulative)
            if (calculations) {
              const addPercent = e.key === '1' ? 5 : (e.key === '2' ? 10 : 15);
              setFormData(prev => {
                const currentDiscount = prev?.custom_discount_percent || 0;
                const newTotalDiscount = currentDiscount + addPercent;
                const baseTotal = calculations.originalTotal || calculations.total;
                const discounted = baseTotal * (1 - newTotalDiscount / 100);
                try {
                  navigator.clipboard.writeText((discounted ?? 0).toFixed(2));
                } catch {
                  // ignore clipboard errors
                }
                toast({
                  title: `${newTotalDiscount}% Total Discount`,
                  description: `New total: $${discounted.toLocaleString()}`,
                });

                return {
                  ...prev,
                  custom_price_override: discounted,
                  custom_discount_percent: newTotalDiscount,
                };
              });
            }
            break;
        }
      } else if (e.key === 'Escape') {
        // Clear custom price on Escape
        if (formData.custom_price_override) {
          setFormData(prev => ({
            ...prev,
            custom_price_override: null,
            custom_discount_percent: 0
          }));
          toast({
            title: "Custom Price Cleared",
            description: "Reverted to calculated total",
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [calculations, formData, toast]);

  const checkAccessAndProceed = async (action) => {
    if (isUnlocked) {
      action();
      return;
    }
    
    // Check server for free quote usage (catches incognito mode)
    try {
      const deviceId = await getDeviceId();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://backend-backend-c520.up.railway.app'}/api/free-quote/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      
      const data = await response.json();
      
      if (data.hasUsedFree) {
        // Already used free quote (by device OR IP) - redirect to unlock page
        navigate(createPageUrl("Unlock"));
        return;
      }
    } catch (error) {
      console.error('Failed to check free quote status:', error);
      // Fallback to local check if server fails
      if (hasUsedFreeQuote) {
        // Redirect to unlock page
        navigate(createPageUrl("Unlock"));
        return;
      }
    }
    
    // Allow free quote and mark as used
    await markFreeQuoteUsed();
    action();
    // Redirect to unlock page after export (no toast)
    setTimeout(() => {
      navigate(createPageUrl("Unlock"));
    }, 1000);
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
      usage_rights_enabled: false,
      usage_rights_type: "1_year",
      usage_rights_cost: 0,
      usage_rights_duration: "1 year",
      talent_fees_enabled: false,
      talent_primary_count: 0,
      talent_primary_rate: 500,
      talent_extra_count: 0,
      talent_extra_rate: 150,
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

  const handleUnlockSubmit = async () => {
    const code = unlockCode.trim().toUpperCase();
    
    // Check for trial code
    if (code === "TRIAL3DAY" || code === "NVISION3DAY") {
      const result = activateTrial();
      
      if (result.success) {
        toast({
          title: "Temporary recording enabled",
          description: result.message,
        });
        setUnlockDialogOpen(false);
        setUnlockCode('');
        setUnlockEmail('');
      } else {
        toast({
          title: "Temporary access unavailable",
          description: result.message,
          variant: "destructive"
        });
      }
      return;
    }
    
    // Check for permanent unlock code via backend API
    const result = await activateSubscription(code, unlockEmail);
    
    if (result.success) {
      toast({
        title: "Recording enabled",
        description: result.message,
      });
      setUnlockDialogOpen(false);
      setUnlockCode('');
      setUnlockEmail('');
    } else {
      toast({
        title: "Invalid access code",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleCopyEmail = async () => {
    await checkAccessAndProceed(() => {
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

  const handlePrintReceipt = async () => {
    await checkAccessAndProceed(() => {
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

  const buildHybridExportCalculations = (baseCalculations, deliverablePayload) => {
    if (!baseCalculations) return baseCalculations;

    const deliverableRawLineItems = deliverablePayload?.computed?.lineItems || [];

    const deliverableLineItemsRaw = deliverableRawLineItems
      .filter(li => !["production_day", "execution_scope", "scoped_multiplier"].includes(li.kind))
      .map(li => ({
        description: li.label,
        amount: Number(li.amount || 0),
        kind: li.kind,
        quantity: typeof li.quantity === 'number' ? li.quantity : 1,
        unitPrice: typeof li.unitPrice === 'number' ? li.unitPrice : null,
      }));

    // Combine duplicates for cleaner exports (e.g., repeated post minimum rows)
    const deliverableLineItems = (() => {
      const byKey = new Map();
      for (const li of deliverableLineItemsRaw) {
        const key = `${li.kind || ''}::${li.description || ''}::${li.unitPrice ?? ''}`;
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, { ...li });
        } else {
          existing.quantity = (Number(existing.quantity || 0) + Number(li.quantity || 0));
          existing.amount = (Number(existing.amount || 0) + Number(li.amount || 0));
        }
      }
      return Array.from(byKey.values());
    })();

    if (deliverableLineItems.length === 0) return baseCalculations;

    const deliverablesHasPostCharges = deliverableLineItems.some(li => li.kind === 'post_minimum' || (li.description || '').toLowerCase().includes('post-production'));

    // If Deliverables includes post-production pricing, remove overlapping crew post items from export
    // to avoid double-charging (editors, revisions, audio pre/post).
    const crewLineItemsRaw = Array.isArray(baseCalculations.lineItems) ? baseCalculations.lineItems : [];
    const removedCrewLineItems = deliverablesHasPostCharges
      ? crewLineItemsRaw.filter(li => {
          const d = (li.description || '').toLowerCase();
          // Remove editing services
          if (d.includes('editor')) return true;
          if (d.includes('revisions')) return true;
          // Remove audio pre/post ONLY if deliverables specifically include audio services
          const deliverablesHasAudio = deliverableLineItems.some(dli => 
            (dli.description || '').toLowerCase().includes('audio')
          );
          if (deliverablesHasAudio && (d.includes('audio pre') || d.includes('audio pre & post'))) return true;
          // Remove post-production services that overlap with deliverables
          if (d.includes('post-production')) return true;
          return false;
        })
      : [];

    const crewLineItems = deliverablesHasPostCharges
      ? crewLineItemsRaw.filter(li => !removedCrewLineItems.includes(li))
      : crewLineItemsRaw;

    const removedCrewSubtotal = removedCrewLineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
    const deliverablesSubtotalForExport = deliverableLineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);

    // Preserve whatever is already baked into baseCalculations totals (tax, discounts, travel, etc)
    // and only adjust for (a) removing duplicate crew post items and (b) adding deliverables items.
    // If a custom price override/discount was applied (originalTotal differs from total), apply the
    // same proportional scaling to the merged total so exports remain consistent.
    const baseTotal = Number(baseCalculations.total || 0);
    const baseOriginalTotal = Number(baseCalculations.originalTotal || 0);
    const hasOverride = baseOriginalTotal > 0 && baseTotal > 0 && Math.abs(baseTotal - baseOriginalTotal) > 0.01;
    const overrideScale = hasOverride ? (baseTotal / baseOriginalTotal) : 1;

    const mergedOriginalTotal = hasOverride
      ? (baseOriginalTotal - removedCrewSubtotal + deliverablesSubtotalForExport)
      : null;

    const nextTotal = hasOverride
      ? (mergedOriginalTotal * overrideScale)
      : (baseTotal - removedCrewSubtotal + deliverablesSubtotalForExport);

    const merged = {
      ...baseCalculations,
      lineItems: [
        { description: "Production (Crew)", amount: 0, isSection: true },
        ...crewLineItems,
        { description: "Deliverables", amount: 0, isSection: true },
        ...deliverableLineItems.map(li => ({
          description: li.description,
          amount: li.amount,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        }))
      ],
      total: nextTotal,
    };

    if (hasOverride && typeof mergedOriginalTotal === 'number') {
      merged.originalTotal = mergedOriginalTotal;
    }

    const depositPercent = settings?.deposit_percent || 50;
    merged.depositDue = Math.round(merged.total * (depositPercent / 100) * 100) / 100;
    merged.balanceDue = Math.round((merged.total - merged.depositDue) * 100) / 100;

    return merged;
  };

  const handlePrint = async () => {
    await checkAccessAndProceed(() => {
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

  // Enhanced export handlers
  const handleExportQuote = async () => {
    await checkAccessAndProceed(() => {
      if (!calculations) return;
      
      // Mark free quote as used IMMEDIATELY (before generating PDF)
      if (!isUnlocked) {
        markFreeQuoteUsed();
      }
      
      saveToQuoteHistory(formData, calculations.total);
      
      // Record behavior for reflection layer
      const finalPrice = formData.custom_price_override || calculations.total;
      recordFinalizedQuote({ calculations, formData, finalPrice });

      recordExportedDecision({
        formData,
        calculations,
        exportType: 'quote',
        finalPrice
      });

      let exportCalculations = calculations;
      if (includeDeliverablesInExport) {
        try {
          const deliverableRaw = localStorage.getItem(STORAGE_KEYS.DELIVERABLE_ESTIMATE);
          const deliverablePayload = deliverableRaw ? JSON.parse(deliverableRaw) : null;

          exportCalculations = buildHybridExportCalculations(exportCalculations, deliverablePayload);
        } catch {
          // ignore
        }
      }
      
      const enhancedExport = new EnhancedExportService(
        formData,
        exportCalculations,
        dayRates,
        gearCosts,
        settings,
        isUnlocked
      );
      
      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(enhancedExport.generateHTML('quote'));
      printWindow.document.close();
      
      // Show post-export reflection modal after brief delay
      setTimeout(() => {
        const text = getReflectionCopy({
          finalPrice,
          minimumPrice: calculations.negotiationLow
        });
        setReflectionText(text);
      }, 400);
    });
  };

  const handleExportInvoice = () => {
    if (!isUnlocked) {
      // Redirect to unlock page - no invoice for free users
      navigate(createPageUrl("Unlock"));
      return;
    }
    
    if (!calculations) return;
    
    saveToQuoteHistory(formData, calculations.total);
    
    // Record behavior for reflection layer
    const finalPrice = formData.custom_price_override || calculations.total;
    recordFinalizedQuote({ calculations, formData, finalPrice });

    recordExportedDecision({
      formData,
      calculations,
      exportType: 'invoice',
      finalPrice
    });

    let exportCalculations = calculations;
    if (includeDeliverablesInExport) {
      try {
        const deliverableRaw = localStorage.getItem(STORAGE_KEYS.DELIVERABLE_ESTIMATE);
        const deliverablePayload = deliverableRaw ? JSON.parse(deliverableRaw) : null;

        exportCalculations = buildHybridExportCalculations(exportCalculations, deliverablePayload);
      } catch {
        // ignore
      }
    }
    
    const enhancedExport = new EnhancedExportService(
      formData,
      exportCalculations,
      dayRates,
      gearCosts,
      settings,
      isUnlocked
    );
    
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(enhancedExport.generateHTML('invoice'));
    printWindow.document.close();
    
    // Show post-export reflection modal after brief delay
    setTimeout(() => {
      const text = getReflectionCopy({
        finalPrice,
        minimumPrice: calculations.negotiationLow
      });
      setReflectionText(text);
    }, 400);
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
      {/* Post-Export Reflection Modal */}
      {reflectionText && (
        <PostExportReflection 
          text={reflectionText} 
          onClose={() => setReflectionText(null)} 
        />
      )}
      
      {/* Locked Screen Overlay - Shows after free quote is used */}
      {!canUseCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
          <div className="max-w-md w-full rounded-lg p-8" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Export limit reached
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Enable recording to continue exporting quotes.
              </p>
            </div>

            {/* Access Code Input */}
            <div className="mb-6 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                  Access code
                </label>
                <Input
                  type="text"
                  placeholder="NV-XXXX-XXXX-XXXX-XXXX"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  className="font-mono"
                  style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={unlockEmail}
                  onChange={(e) => setUnlockEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlockSubmit()}
                  style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <Button
                onClick={handleUnlockSubmit}
                disabled={!unlockCode.trim() || !unlockEmail.trim()}
                className="w-full"
                style={{ background: 'var(--color-accent-primary)', color: 'white' }}
              >
                Activate
              </Button>
            </div>

            <div className="border-t pt-6 mb-4" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Need access? View pricing options.
              </p>
              <Button
                className="w-full"
                onClick={() => navigate(createPageUrl("Unlock"))}
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                View access options
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Section */}
      <div id="calculator" className="p-6 scroll-mt-6">
      <div className="max-w-7xl mx-auto p-6">
        {/* Pricing Ledger Header - System label, not marketing */}
        <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Pricing Ledger</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Recorded pricing decisions and outcomes.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>This page records what you send — not what you intended.</p>
        </div>

        <BehavioralPricingSection
          onRestoreDecisionState={(savedFormData) => {
            if (!savedFormData) return;
            setFormData({
              ...savedFormData,
              shoot_dates: Array.isArray(savedFormData.shoot_dates) ? savedFormData.shoot_dates : [],
            });
            toast({
              title: "Decision restored",
              description: "Selecting an entry restores its decision state.",
            });
          }}
        />
        
        {suggestedCrewPreset && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Deliverables estimator detected.
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Suggested roles and equipment are based on the current scope.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={applySuggestedCrewPreset} variant="outline" size="sm" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)' }}>
                  Apply Suggested Setup
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>New Pricing Decision</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>This decision will be recorded when exported.</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full justify-between md:justify-end">
              {!isUnlocked && (
                <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                    >
                      <KeyIcon className="w-4 h-4 mr-2" />
                      Enter access code
                    </Button>
                  </DialogTrigger>
                  <DialogContent style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)' }}>
                    <DialogHeader>
                      <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Enter access code</DialogTitle>
                      <DialogDescription style={{ color: 'var(--color-text-secondary)' }}>
                        Recording requires an access code.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="unlock-code" style={{ color: 'var(--color-text-secondary)' }}>Access code</Label>
                        <Input
                          id="unlock-code"
                          placeholder="XXXX-XXXX-XXXX"
                          value={unlockCode}
                          onChange={(e) => setUnlockCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlockSubmit()}
                          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unlock-email" style={{ color: 'var(--color-text-secondary)' }}>Email (optional)</Label>
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
                        style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                      >
                        Activate recording
                      </Button>
                      <div className="mt-2 text-center">
                        <a 
                          href={createPageUrl("Unlock") + (searchParams.get('ref') ? `?ref=${searchParams.get('ref')}` : '')} 
                          className="text-sm hover:underline"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Need an access code?
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
                onClick={handleExportQuote}
                variant="outline"
                size="sm"
                disabled={!calculations}
                style={{ background: 'var(--color-accent-primary)', color: '#000', borderColor: 'var(--color-accent-primary)', fontWeight: '600' }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Quote
              </Button>
              <Button
                onClick={handleExportInvoice}
                variant="outline"
                size="sm"
                disabled={!calculations}
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent-primary)', borderColor: 'var(--color-accent-primary)', fontWeight: '600' }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Invoice
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                disabled={!calculations}
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Old Quote
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

          <div className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Exporting records this decision in your ledger.
          </div>

          {!isUnlocked && (
            <div className="mb-4 px-3 py-2 rounded text-xs" style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)'
            }}>
              {hasUsedFreeQuote ? (
                <>Export limit reached. <a href={createPageUrl("Unlock")} className="underline" style={{ color: 'var(--color-text-secondary)' }}>Enable recording</a> to continue.</>
              ) : (
                <>Limited mode: 1 export available. Exports not stored.</>
              )}
            </div>
          )}

          {/* Negotiation Ticker - Only show when calculations exist */}
          {calculations && calculations.total > 0 && (
            <div className="mb-6">
              <NegotiationTicker 
                calculations={calculations} 
                settings={settings}
                customPriceOverride={formData.custom_price_override}
                onPriceChange={(price) => setFormData(prev => ({
                  ...prev, 
                  custom_price_override: price,
                  custom_discount_percent: 0
                }))}
              />
            </div>
          )}

          {trialDaysLeft !== null && isTrialActive && (
            <div className="mb-4 px-3 py-2 rounded text-xs" style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)'
            }}>
              Temporary access: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
            </div>
          )}

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
                
                {/* Crew & Production Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_manager" style={{ color: 'var(--color-text-secondary)' }}>Project Manager</Label>
                    <Input
                      id="project_manager"
                      value={formData.project_manager}
                      onChange={(e) => setFormData({...formData, project_manager: e.target.value})}
                      placeholder="e.g., John Smith"
                      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="production_company" style={{ color: 'var(--color-text-secondary)' }}>Production Company</Label>
                    <Input
                      id="production_company"
                      value={formData.production_company}
                      onChange={(e) => setFormData({...formData, production_company: e.target.value})}
                      placeholder="e.g., ABC Productions"
                      style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="crew_members" style={{ color: 'var(--color-text-secondary)' }}>Crew Members</Label>
                  <Input
                    id="crew_members"
                    value={formData.crew_members}
                    onChange={(e) => setFormData({...formData, crew_members: e.target.value})}
                    placeholder="e.g., Camera Op: Jane Doe, Gaffer: Mike Johnson"
                    style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                  />
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
                setFormData(prev => ({...prev, experience_level: level, custom_multiplier: newMultiplier}));
              }}
              customMultiplier={formData.custom_multiplier}
              onCustomMultiplierChange={(multiplier) => setFormData(prev => ({...prev, custom_multiplier: multiplier}))}
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
                {/* Pricing model grid - 2 cols on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {/* Half Day */}
                  <button
                    type="button"
                    className={`flex flex-col items-center p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                      formData.day_type === "half" && !formData.single_price_enabled 
                        ? 'border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] shadow-sm' 
                        : 'border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent-primary)] hover:shadow-sm'
                    }`}
                    onClick={() => {
                      const updatedRoles = (formData.selected_roles || []).map(role => ({
                        ...role,
                        half_days: role.half_days || role.full_days || 1,
                        full_days: 0
                      }));
                      setFormData({...formData, day_type: "half", single_price_enabled: false, selected_roles: updatedRoles});
                    }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mb-2 ${
                      formData.day_type === "half" && !formData.single_price_enabled
                        ? 'border-[var(--color-accent-primary)]'
                        : 'border-[var(--color-border-dark)]'
                    }`}>
                      {formData.day_type === "half" && !formData.single_price_enabled && (
                        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent-primary)' }}></div>
                      )}
                    </div>
                    <div className="text-xs md:text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Half Day</div>
                    <div className="text-xs hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>≤{settings?.half_day_hours || 6}h</div>
                  </button>

                  {/* Full Day */}
                  <button
                    type="button"
                    className={`flex flex-col items-center p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                      formData.day_type === "full" && !formData.single_price_enabled 
                        ? 'border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] shadow-sm' 
                        : 'border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent-primary)] hover:shadow-sm'
                    }`}
                    onClick={() => {
                      const updatedRoles = (formData.selected_roles || []).map(role => ({
                        ...role,
                        full_days: role.full_days || role.half_days || 1,
                        half_days: 0
                      }));
                      setFormData({...formData, day_type: "full", single_price_enabled: false, selected_roles: updatedRoles});
                    }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mb-2 ${
                      formData.day_type === "full" && !formData.single_price_enabled
                        ? 'border-[var(--color-accent-primary)]'
                        : 'border-[var(--color-border-dark)]'
                    }`}>
                      {formData.day_type === "full" && !formData.single_price_enabled && (
                        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent-primary)' }}></div>
                      )}
                    </div>
                    <div className="text-xs md:text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Full Day</div>
                    <div className="text-xs hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>≤{settings?.full_day_hours || 10}h</div>
                  </button>

                  {/* Custom Hourly */}
                  <button
                    type="button"
                    className={`flex flex-col items-center p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                      formData.day_type === "custom" && !formData.single_price_enabled 
                        ? 'border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] shadow-sm' 
                        : 'border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent-primary)] hover:shadow-sm'
                    }`}
                    onClick={() => setFormData({...formData, day_type: "custom", single_price_enabled: false})}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mb-2 ${
                      formData.day_type === "custom" && !formData.single_price_enabled
                        ? 'border-[var(--color-accent-primary)]'
                        : 'border-[var(--color-border-dark)]'
                    }`}>
                      {formData.day_type === "custom" && !formData.single_price_enabled && (
                        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent-primary)' }}></div>
                      )}
                    </div>
                    <div className="text-xs md:text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Hourly</div>
                    <div className="text-xs hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>Custom</div>
                  </button>

                  {/* Single Fixed Price */}
                  <button
                    type="button"
                    className={`flex flex-col items-center p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                      formData.single_price_enabled 
                        ? 'border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] shadow-sm' 
                        : 'border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent-primary)] hover:shadow-sm'
                    }`}
                    onClick={() => setFormData({...formData, single_price_enabled: true, day_type: null})}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mb-2 ${
                      formData.single_price_enabled
                        ? 'border-[var(--color-accent-primary)]'
                        : 'border-[var(--color-border-dark)]'
                    }`}>
                      {formData.single_price_enabled && (
                        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-accent-primary)' }}></div>
                      )}
                    </div>
                    <div className="text-xs md:text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Fixed</div>
                    <div className="text-xs hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>+overhead</div>
                  </button>
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
                setFormData(prev => ({...prev, selected_roles: roles}));
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

            {/* Usage Rights & Licensing */}
            <Card className="shadow-md border-2 transition-all duration-200" style={{ 
              background: 'var(--color-bg-secondary)', 
              borderColor: formData.usage_rights_enabled ? 'var(--color-accent-primary)' : 'var(--color-border-dark)',
              color: 'var(--color-text-primary)' 
            }}>
              <CardHeader className="pb-3" style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76, 111, 255, 0.12)' }}>
                      <Shield className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                    </div>
                    <div>
                      <CardTitle className="text-base" style={{ color: 'var(--color-text-primary)' }}>Usage Rights & Licensing</CardTitle>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Commercial usage and distribution rights</p>
                    </div>
                  </div>
                  {formData.usage_rights_enabled && (
                    <div className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(76, 111, 255, 0.12)', color: 'var(--color-accent-primary)', border: '1px solid var(--color-border)' }}>
                      Active
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Toggle Switch */}
                <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200" 
                  style={{ 
                    background: formData.usage_rights_enabled ? 'rgba(76, 111, 255, 0.06)' : 'var(--color-bg-primary)',
                    border: '1px solid',
                    borderColor: formData.usage_rights_enabled ? 'rgba(76, 111, 255, 0.28)' : 'var(--color-border)'
                  }}
                  onClick={() => setFormData({...formData, usage_rights_enabled: !formData.usage_rights_enabled})}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.usage_rights_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, usage_rights_enabled: checked})}
                    />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Include Usage Rights Fee</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Add licensing fees to this quote</div>
                    </div>
                  </div>
                </label>
                
                {formData.usage_rights_enabled && (
                  <div className="space-y-4 p-5 rounded-xl" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                    {/* Duration Selector */}
                    <div>
                      <Label htmlFor="usage_rights_type" className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Clock className="w-4 h-4" />
                        License Duration
                      </Label>
                      <select
                        id="usage_rights_type"
                        value={formData.usage_rights_type}
                        onChange={(e) => {
                          const type = e.target.value;
                          let duration = "1 year";
                          if (type === "6_months") duration = "6 months";
                          else if (type === "1_year") duration = "1 year";
                          else if (type === "2_years") duration = "2 years";
                          else if (type === "perpetual") duration = "Perpetual";
                          else if (type === "custom") duration = "Custom";
                          setFormData({...formData, usage_rights_type: type, usage_rights_duration: duration});
                        }}
                        className="w-full p-3 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:outline-none"
                        style={{ 
                          background: 'var(--color-bg-secondary)', 
                          borderColor: 'var(--color-border-dark)', 
                          color: 'var(--color-text-primary)', 
                          border: '1px solid' 
                        }}
                      >
                        <option value="6_months">📅 6 Months</option>
                        <option value="1_year">📅 1 Year (Standard)</option>
                        <option value="2_years">📅 2 Years</option>
                        <option value="perpetual">♾️ Perpetual (Unlimited)</option>
                        <option value="custom">✏️ Custom Duration</option>
                      </select>
                    </div>
                    
                    {formData.usage_rights_type === "custom" && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="usage_rights_duration" className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Custom Duration</Label>
                        <Input
                          id="usage_rights_duration"
                          type="text"
                          value={formData.usage_rights_duration}
                          onChange={(e) => setFormData({...formData, usage_rights_duration: e.target.value})}
                          placeholder="e.g., 18 months, 3 years, 5 years"
                          className="p-3 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                          style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                    )}
                    
                    {/* Percentage and Cost Inputs (Synced) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Percentage Input */}
                      <div className="space-y-2">
                        <Label htmlFor="usage_rights_percentage" className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                          <Percent className="w-4 h-4" />
                          Percentage
                        </Label>
                        <div className="relative">
                          <Input
                            id="usage_rights_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={formData.usage_rights_percentage}
                            onChange={(e) => {
                              const percentage = parseFloat(e.target.value) || 0;
                              const baseTotal = calculations?.subtotal || 0;
                              const calculatedCost = (baseTotal * percentage) / 100;
                              setFormData(prev => ({
                                ...prev, 
                                usage_rights_percentage: percentage,
                                usage_rights_cost: Math.round(calculatedCost * 100) / 100
                              }));
                            }}
                            className="pr-8 p-3 text-lg font-semibold rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                            placeholder="20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-semibold" style={{ color: 'var(--color-text-muted)' }}>%</span>
                        </div>
                      </div>
                      
                      {/* Dollar Amount Input */}
                      <div className="space-y-2">
                        <Label htmlFor="usage_rights_cost" className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                          <DollarSign className="w-4 h-4" />
                          License Fee
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold" style={{ color: 'var(--color-text-muted)' }}>$</span>
                          <Input
                            id="usage_rights_cost"
                            type="number"
                            min="0"
                            step="100"
                            value={formData.usage_rights_cost}
                            onChange={(e) => {
                              const cost = parseFloat(e.target.value) || 0;
                              const baseTotal = calculations?.subtotal || 0;
                              const calculatedPercentage = baseTotal > 0 ? (cost / baseTotal) * 100 : 0;
                              setFormData(prev => ({
                                ...prev,
                                usage_rights_cost: cost,
                                usage_rights_percentage: Math.round(calculatedPercentage * 10) / 10
                              }));
                            }}
                            className="pl-8 p-3 text-lg font-semibold rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(76, 111, 255, 0.06)', border: '1px solid rgba(76, 111, 255, 0.20)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        <strong>Industry Standard:</strong> 20-50% of production cost • Base: ${calculations?.subtotal?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Talent Fees */}
            <Card className="shadow-md border-2 transition-all duration-200" style={{ 
              background: 'var(--color-bg-secondary)', 
              borderColor: formData.talent_fees_enabled ? 'var(--color-accent-primary)' : 'var(--color-border-dark)',
              color: 'var(--color-text-primary)' 
            }}>
              <CardHeader className="pb-3" style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-border-dark)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76, 111, 255, 0.12)' }}>
                      <Users className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                    </div>
                    <div>
                      <CardTitle className="text-base" style={{ color: 'var(--color-text-primary)' }}>Talent Fees</CardTitle>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>On-camera talent and usage for featured people</p>
                    </div>
                  </div>
                  {formData.talent_fees_enabled && (
                    <div className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(76, 111, 255, 0.12)', color: 'var(--color-accent-primary)', border: '1px solid var(--color-border)' }}>
                      Active
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Toggle Switch */}
                <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200" 
                  style={{ 
                    background: formData.talent_fees_enabled ? 'rgba(76, 111, 255, 0.06)' : 'var(--color-bg-primary)',
                    border: '1px solid',
                    borderColor: formData.talent_fees_enabled ? 'rgba(76, 111, 255, 0.28)' : 'var(--color-border)'
                  }}
                  onClick={() => setFormData({...formData, talent_fees_enabled: !formData.talent_fees_enabled})}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.talent_fees_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, talent_fees_enabled: checked})}
                    />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Include Talent Fees</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Add talent costs to this quote</div>
                    </div>
                  </div>
                </label>
                
                {formData.talent_fees_enabled && (
                  <div className="space-y-5 p-5 rounded-xl" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                    {/* Primary Talent */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76, 111, 255, 0.12)' }}>
                          <User className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Primary Actors</h4>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Lead roles and speaking parts</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="talent_primary_count" className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Number of Actors</Label>
                          <Input
                            id="talent_primary_count"
                            type="number"
                            min="0"
                            value={formData.talent_primary_count}
                            onChange={(e) => setFormData({...formData, talent_primary_count: parseInt(e.target.value) || 0})}
                            className="p-2.5 rounded-lg text-center font-semibold transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="talent_primary_rate" className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Rate per Actor</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>$</span>
                            <Input
                              id="talent_primary_rate"
                              type="number"
                              min="0"
                              step="50"
                              value={formData.talent_primary_rate}
                              onChange={(e) => setFormData({...formData, talent_primary_rate: parseFloat(e.target.value) || 0})}
                              className="pl-7 p-2.5 rounded-lg text-center font-semibold transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                              placeholder="500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }}></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}>and</span>
                      </div>
                    </div>
                    
                    {/* Extras */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76, 111, 255, 0.12)' }}>
                          <Users className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Background Extras</h4>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Non-speaking background talent</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="talent_extra_count" className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Number of Extras</Label>
                          <Input
                            id="talent_extra_count"
                            type="number"
                            min="0"
                            value={formData.talent_extra_count}
                            onChange={(e) => setFormData({...formData, talent_extra_count: parseInt(e.target.value) || 0})}
                            className="p-2.5 rounded-lg text-center font-semibold transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="talent_extra_rate" className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Rate per Extra</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>$</span>
                            <Input
                              id="talent_extra_rate"
                              type="number"
                              min="0"
                              step="25"
                              value={formData.talent_extra_rate}
                              onChange={(e) => setFormData({...formData, talent_extra_rate: parseFloat(e.target.value) || 0})}
                              className="pl-7 p-2.5 rounded-lg text-center font-semibold transition-all duration-200 focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)', color: 'var(--color-text-primary)' }}
                              placeholder="150"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Total Display */}
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(76, 111, 255, 0.06)', border: '1px solid rgba(76, 111, 255, 0.22)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Talent Cost</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--color-accent-primary)' }}>
                          ${((formData.talent_primary_count * formData.talent_primary_rate) + (formData.talent_extra_count * formData.talent_extra_rate)).toLocaleString()}
                        </span>
                      </div>
                      {(formData.talent_primary_count > 0 || formData.talent_extra_count > 0) && (
                        <div className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid rgba(76, 111, 255, 0.20)', color: 'var(--color-text-muted)' }}>
                          {formData.talent_primary_count > 0 && `${formData.talent_primary_count} primary × $${formData.talent_primary_rate}`}
                          {formData.talent_primary_count > 0 && formData.talent_extra_count > 0 && ' + '}
                          {formData.talent_extra_count > 0 && `${formData.talent_extra_count} extras × $${formData.talent_extra_rate}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
          <div className="lg:col-span-1 space-y-4">
            <LiveTotalsPanel 
              calculations={calculations} 
              settings={settings} 
              formData={{...formData, cameras}}
              dayRates={dayRates}
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

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Local Ledger Storage
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            All data is stored locally in your browser.
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            No accounts. No cloud sync.
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Clearing your browser clears the ledger.
          </div>

          <div className="mt-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Over time, this page shows you who you are under pressure.
          </div>
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
      color: "rgba(76, 111, 255, 0.12)"
    },
    {
      icon: SettingsIcon,
      title: "Select Your Gear",
      description: "Add cameras, lenses, audio equipment - the tool calculates amortization automatically",
      color: "rgba(76, 111, 255, 0.12)"
    },
    {
      icon: FileText,
      title: "Generate Quote",
      description: "Professional PDF quotes ready to send with all line items, taxes, and terms included",
      color: "rgba(76, 111, 255, 0.12)"
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
              style={{ background: 'rgba(76, 111, 255, 0.12)' }}
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
                    background: idx === currentSlide ? 'var(--color-accent-primary)' : 'rgba(76, 111, 255, 0.28)',
                    width: idx === currentSlide ? '24px' : '8px'
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{ background: 'rgba(76, 111, 255, 0.12)' }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
