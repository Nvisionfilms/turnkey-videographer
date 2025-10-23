// DEFAULT DATA
// These are the initial values loaded when a user first opens the app
// or when they reset to defaults

export const STORAGE_KEYS = {
  DAY_RATES: 'nvision_day_rates',
  GEAR_COSTS: 'nvision_gear_costs',
  SETTINGS: 'nvision_settings',
  CALCULATOR_SESSION: 'nvision_calculator_session',
  SAVED_SETTINGS: 'nvision_saved_settings',
  UNLOCKED: 'nvision_is_unlocked',
  TRIAL_START: 'nvision_trial_start_date',
  TRIAL_END: 'nvision_trial_end_date',
  USED_FREE: 'nvision_has_used_free_quote',
  WELCOMED: 'nvision_welcomed'
};

export const DEFAULT_DAY_RATES = [
  {
    id: "rate_1",
    role: "Camera op (no camera)",
    unit_type: "day",
    half_day_rate: 1200,
    full_day_rate: 2000,
    active: true,
    notes: ""
  },
  {
    id: "rate_2",
    role: "Camera op (with camera)",
    unit_type: "day",
    half_day_rate: 3000,
    full_day_rate: 5000,
    active: true,
    notes: ""
  },
  {
    id: "rate_3",
    role: "Director",
    unit_type: "day",
    half_day_rate: 1200,
    full_day_rate: 2000,
    active: true,
    notes: ""
  },
  {
    id: "rate_4",
    role: "Director of Photography",
    unit_type: "day",
    half_day_rate: 3000,
    full_day_rate: 5000,
    active: true,
    notes: ""
  },
  {
    id: "rate_5",
    role: "Line Editor (per 5 min)",
    unit_type: "per_5_min",
    half_day_rate: 400,
    full_day_rate: 800,
    active: true,
    notes: ""
  },
  {
    id: "rate_6",
    role: "Lead Editor (per 5 min)",
    unit_type: "per_5_min",
    half_day_rate: 500,
    full_day_rate: 1000,
    active: true,
    notes: ""
  },
  {
    id: "rate_7",
    role: "Revisions Per Request (basic edits)",
    unit_type: "per_request",
    half_day_rate: 50,
    full_day_rate: 100,
    active: true,
    notes: ""
  },
  {
    id: "rate_8",
    role: "Audio Pre & Post",
    unit_type: "flat",
    half_day_rate: 750,
    full_day_rate: 2200,
    active: true,
    notes: ""
  }
];

export const DEFAULT_GEAR_COSTS = [
  {
    id: "gear_1",
    item: "Camera Body",
    total_investment: 6000,
    include_by_default: true
  },
  {
    id: "gear_2",
    item: "Lenses",
    total_investment: 8000,
    include_by_default: true
  },
  {
    id: "gear_3",
    item: "Tripod",
    total_investment: 1500,
    include_by_default: true
  },
  {
    id: "gear_4",
    item: "Lighting Kit",
    total_investment: 3000,
    include_by_default: true
  },
  {
    id: "gear_5",
    item: "Audio Equipment",
    total_investment: 2500,
    include_by_default: true
  },
  {
    id: "gear_6",
    item: "Gimbal/Stabilizer",
    total_investment: 1200,
    include_by_default: true
  },
  {
    id: "gear_7",
    item: "Drone",
    total_investment: 2000,
    include_by_default: false
  },
  {
    id: "gear_8",
    item: "Studio Rental",
    total_investment: 0,
    include_by_default: false
  }
];

export const DEFAULT_SETTINGS = {
  id: "settings_1",
  company_name: "NVision Video Production",
  company_tagline: "Professional Videography Services",
  company_address: "",
  company_phone: "",
  company_email: "",
  company_website: "",
  default_currency: "USD",
  tax_rate_percent: 8.25,
  deposit_percent: 50,
  region: "Austin, TX",
  industry_index: 1.0,
  region_multiplier: 1.0,
  nonprofit_discount_percent: 15,
  rush_fee_percent: 25,
  overtime_multiplier: 1.5,
  gear_amortization_days: 180,
  mileage_rate: 0.67,
  tax_travel: false,
  experience_levels: {
    Junior: 0.65,
    Standard: 1.0,
    Senior: 1.35
  },
  last_updated: new Date().toISOString()
};

/**
 * Initialize localStorage with default data if not already present
 * This runs once when the app loads
 */
export function initializeLocalStorage() {
  try {
    // Check and initialize day rates
    const existingRates = localStorage.getItem(STORAGE_KEYS.DAY_RATES);
    if (!existingRates) {
      console.log('Initializing default day rates...');
      localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(DEFAULT_DAY_RATES));
    }

    // Check and initialize gear costs
    const existingGear = localStorage.getItem(STORAGE_KEYS.GEAR_COSTS);
    if (!existingGear) {
      console.log('Initializing default gear costs...');
      localStorage.setItem(STORAGE_KEYS.GEAR_COSTS, JSON.stringify(DEFAULT_GEAR_COSTS));
    }

    // Check and initialize settings
    const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!existingSettings) {
      console.log('Initializing default settings...');
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }

    console.log('localStorage initialization complete');
  } catch (error) {
    console.error('Error initializing localStorage:', error);
  }
}

/**
 * Reset all data to defaults (for admin use)
 */
export function resetToDefaults() {
  try {
    localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(DEFAULT_DAY_RATES));
    localStorage.setItem(STORAGE_KEYS.GEAR_COSTS, JSON.stringify(DEFAULT_GEAR_COSTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    console.log('Reset to defaults complete');
  } catch (error) {
    console.error('Error resetting to defaults:', error);
  }
}

/**
 * Load all defaults - replaces current data with defaults
 */
export function loadAllDefaults() {
  try {
    localStorage.setItem(STORAGE_KEYS.DAY_RATES, JSON.stringify(DEFAULT_DAY_RATES));
    localStorage.setItem(STORAGE_KEYS.GEAR_COSTS, JSON.stringify(DEFAULT_GEAR_COSTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    
    // Trigger storage event so Calculator page updates
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
    
    console.log('Loaded all defaults');
    return true;
  } catch (error) {
    console.error('Error loading defaults:', error);
    return false;
  }
}