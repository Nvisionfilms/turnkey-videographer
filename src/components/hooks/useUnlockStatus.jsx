import { useState, useEffect, useCallback } from 'react';
import { isSubscriptionActive, activateSubscriptionCode, getSubscriptionDetails } from '@/services/serialCodeService';
import { apiCall, API_ENDPOINTS } from '../../config/api';

const STORAGE_KEYS = {
  UNLOCKED: 'nvision_is_unlocked',
  TRIAL_START: 'nvision_trial_start',
  TRIAL_END: 'nvision_trial_end',
  TRIAL_USED: 'nvision_trial_ever_used',
  TRIAL_TIMESTAMP: 'nvision_trial_timestamp',
  USED_FREE: 'nvision_has_used_free_quote',
  DIRECT_UNLOCK: 'nvision_direct_unlock',
  DIRECT_UNLOCK_DATE: 'nvision_direct_unlock_date',
  DIRECT_UNLOCK_EMAIL: 'nvision_direct_unlock_email',
};

export function useUnlockStatus() {
  // Production mode - requires valid access code
  const DEV_FORCE_UNLOCKED = false;
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasUsedFreeQuote, setHasUsedFreeQuote] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // STRICT: Only allow access through Railway database validation
  const validateWithServer = useCallback(async () => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedCode = localStorage.getItem('unlockCode');
    
    if (!storedEmail || !storedCode) {
      return false;
    }
    
    try {
      setIsValidating(true);
      
      // Use enhanced validation that checks Stripe session from database
      const response = await apiCall('/api/unlock/validate-enhanced', {
        method: 'POST',
        body: JSON.stringify({
          code: storedCode,
          email: storedEmail
        })
      });
      
      if (response.status === 'revoked') {
        // Payment was refunded - clear all access
        localStorage.removeItem('userEmail');
        localStorage.removeItem('unlockCode');
        localStorage.removeItem('stripeSessionId');
        localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
        localStorage.removeItem(STORAGE_KEYS.DIRECT_UNLOCK);
        return false;
      }
      
      if (response.isActive) {
        // Valid subscription - set flags for session
        localStorage.setItem(STORAGE_KEYS.UNLOCKED, 'true');
        localStorage.setItem(STORAGE_KEYS.DIRECT_UNLOCK, 'true');
        return true;
      } else {
        // Invalid or expired - clear all localStorage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('unlockCode');
        localStorage.removeItem('stripeSessionId');
        localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
        localStorage.removeItem(STORAGE_KEYS.DIRECT_UNLOCK);
        return false;
      }
    } catch (error) {
      // API error - keep credentials but don't unlock
      console.error('Server validation failed:', error.message);
      // Don't clear credentials on network error - let user retry
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const checkStatus = () => {
    // Check if user has valid credentials stored
    const storedEmail = localStorage.getItem('userEmail');
    const storedCode = localStorage.getItem('unlockCode');
    const directUnlock = localStorage.getItem(STORAGE_KEYS.DIRECT_UNLOCK) === 'true';
    const isUnlockedStored = localStorage.getItem(STORAGE_KEYS.UNLOCKED) === 'true';
    
    // Check free quote usage (check both localStorage and sessionStorage)
    const usedFreeLocal = localStorage.getItem(STORAGE_KEYS.USED_FREE) === 'true';
    const usedFreeSession = sessionStorage.getItem(STORAGE_KEYS.USED_FREE) === 'true';
    const usedFree = usedFreeLocal || usedFreeSession;
    
    // If found in sessionStorage but not localStorage, sync it
    if (usedFreeSession && !usedFreeLocal) {
      localStorage.setItem(STORAGE_KEYS.USED_FREE, 'true');
      const sessionTimestamp = sessionStorage.getItem('nvision_free_quote_timestamp');
      if (sessionTimestamp) {
        localStorage.setItem('nvision_free_quote_timestamp', sessionTimestamp);
      }
    }
    
    // User is unlocked if they have valid credentials OR the unlock flag is set
    const shouldBeUnlocked = DEV_FORCE_UNLOCKED || (storedEmail && storedCode && (directUnlock || isUnlockedStored));
    
    setIsUnlocked(shouldBeUnlocked);
    setIsTrialActive(false);
    setTrialDaysLeft(null);
    setHasUsedFreeQuote(usedFree);
    setSubscriptionDetails(null);
  };

  useEffect(() => {
    // Always validate with server on mount (async) - SILENT, no toasts
    const validateOnMount = async () => {
      const storedEmail = localStorage.getItem('userEmail');
      const storedCode = localStorage.getItem('unlockCode');
      
      if (storedEmail && storedCode) {
        // Has credentials - validate with server silently
        const isValid = await validateWithServer();
        
        if (isValid) {
          // Valid - set localStorage flags and state
          localStorage.setItem(STORAGE_KEYS.UNLOCKED, 'true');
          localStorage.setItem(STORAGE_KEYS.DIRECT_UNLOCK, 'true');
          setIsUnlocked(true);
        } else {
          // Invalid - clear all localStorage silently
          localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
          localStorage.removeItem(STORAGE_KEYS.DIRECT_UNLOCK);
          localStorage.removeItem('userEmail');
          localStorage.removeItem('unlockCode');
          setIsUnlocked(false);
        }
      } else {
        // No credentials - check if unlock flags are set (legacy)
        const isUnlockedStored = localStorage.getItem(STORAGE_KEYS.UNLOCKED) === 'true';
        const directUnlock = localStorage.getItem(STORAGE_KEYS.DIRECT_UNLOCK) === 'true';
        
        if (isUnlockedStored || directUnlock) {
          // Has unlock flags but no credentials - keep unlocked but validate on next mount
          setIsUnlocked(true);
        } else {
          // No credentials and no flags - locked
          setIsUnlocked(false);
        }
      }
      
      // Also check free quote status
      checkStatus();
    };
    
    validateOnMount();
    
    // Listen for storage changes (in case of updates from other tabs/components)
    const handleStorageChange = (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        checkStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // REMOVED: Periodic interval check - was causing disruptive toasts
    // Validation only happens on mount and explicit user actions
    // This prevents interrupting users during phone calls or active work
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [validateWithServer]);

  const markFreeQuoteUsed = () => {
    const timestamp = Date.now().toString();
    localStorage.setItem(STORAGE_KEYS.USED_FREE, 'true');
    localStorage.setItem('nvision_free_quote_timestamp', timestamp);
    
    // Also try to persist in sessionStorage as backup
    try {
      sessionStorage.setItem(STORAGE_KEYS.USED_FREE, 'true');
      sessionStorage.setItem('nvision_free_quote_timestamp', timestamp);
    } catch (e) {
      console.warn('SessionStorage not available');
    }
    
    setHasUsedFreeQuote(true);
  };

  const hasUsedTrialBefore = () => {
    const trialUsed = localStorage.getItem(STORAGE_KEYS.TRIAL_USED) === 'true';
    const trialTimestamp = localStorage.getItem(STORAGE_KEYS.TRIAL_TIMESTAMP);
    return trialUsed || trialTimestamp !== null;
  };

  const activateTrial = () => {
    if (hasUsedTrialBefore()) {
      return { success: false, message: "Trial already used on this device" };
    }

    const trialStartTime = Date.now();
    const trialEndTime = trialStartTime + (3 * 24 * 60 * 60 * 1000); // 3 days
    
    localStorage.setItem(STORAGE_KEYS.TRIAL_USED, 'true');
    localStorage.setItem(STORAGE_KEYS.TRIAL_TIMESTAMP, trialStartTime.toString());
    localStorage.setItem(STORAGE_KEYS.TRIAL_START, trialStartTime.toString());
    localStorage.setItem(STORAGE_KEYS.TRIAL_END, trialEndTime.toString());
    localStorage.removeItem(STORAGE_KEYS.USED_FREE);
    
    checkStatus();
    return { success: true, message: "3-day trial activated" };
  };

  const activateSubscription = (code, email = '') => {
    const result = activateSubscriptionCode(code, email);
    
    if (result.success) {
      // Clean up trial and free quote data
      localStorage.removeItem(STORAGE_KEYS.TRIAL_START);
      localStorage.removeItem(STORAGE_KEYS.TRIAL_END);
      localStorage.removeItem(STORAGE_KEYS.USED_FREE);
      
      // Also set legacy unlock flag for backward compatibility
      localStorage.setItem(STORAGE_KEYS.UNLOCKED, 'true');
      
      checkStatus();
    }
    
    return result;
  };

  const activateDirectUnlock = (email = '') => {
    try {
      // Activate direct unlock (no serial code needed)
      localStorage.setItem(STORAGE_KEYS.DIRECT_UNLOCK, 'true');
      localStorage.setItem(STORAGE_KEYS.DIRECT_UNLOCK_DATE, new Date().toISOString());
      
      if (email) {
        localStorage.setItem(STORAGE_KEYS.DIRECT_UNLOCK_EMAIL, email);
      }
      
      // Clean up trial and free quote data
      localStorage.removeItem(STORAGE_KEYS.TRIAL_START);
      localStorage.removeItem(STORAGE_KEYS.TRIAL_END);
      localStorage.removeItem(STORAGE_KEYS.USED_FREE);
      
      // Also set legacy unlock flag for backward compatibility
      localStorage.setItem(STORAGE_KEYS.UNLOCKED, 'true');
      
      checkStatus();
      
      return {
        success: true,
        message: 'Calculator unlocked successfully! You now have unlimited access.',
        code: 'DIRECT_UNLOCK'
      };
    } catch (error) {
      console.error('Error activating direct unlock:', error);
      return {
        success: false,
        message: 'Failed to unlock calculator. Please try again.',
        code: 'UNLOCK_ERROR'
      };
    }
  };

  // User can use calculator if: unlocked OR hasn't used free quote yet
  const canUseCalculator = isUnlocked || !hasUsedFreeQuote;

  return {
    isUnlocked,
    hasUsedFreeQuote,
    canUseCalculator,
    trialDaysLeft,
    isTrialActive,
    subscriptionDetails,
    markFreeQuoteUsed,
    hasUsedTrialBefore,
    activateTrial,
    activateSubscription,
    activateDirectUnlock,
  };
}