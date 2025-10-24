import { useState, useEffect } from 'react';
import { isSubscriptionActive, activateSubscriptionCode, getSubscriptionDetails } from '@/services/serialCodeService';

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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasUsedFreeQuote, setHasUsedFreeQuote] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const checkStatus = () => {
    // Check if permanently unlocked (legacy or subscription)
    const legacyUnlocked = localStorage.getItem(STORAGE_KEYS.UNLOCKED) === 'true';
    
    // Check direct unlock (payment-based, no serial code needed)
    const directUnlock = localStorage.getItem(STORAGE_KEYS.DIRECT_UNLOCK) === 'true';
    
    // Check subscription status (new serial code system)
    const hasActiveSubscription = isSubscriptionActive();
    const subDetails = hasActiveSubscription ? getSubscriptionDetails() : null;
    
    // Check trial status
    const trialEnd = localStorage.getItem(STORAGE_KEYS.TRIAL_END);
    let trialActive = false;
    let daysLeft = null;
    
    if (trialEnd) {
      const endTime = parseInt(trialEnd, 10);
      const now = Date.now();
      if (now < endTime) {
        trialActive = true;
        const timeLeft = endTime - now;
        daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
      } else {
        // Trial expired, clean up
        localStorage.removeItem(STORAGE_KEYS.TRIAL_START);
        localStorage.removeItem(STORAGE_KEYS.TRIAL_END);
      }
    }
    
    // Check free quote usage
    const usedFree = localStorage.getItem(STORAGE_KEYS.USED_FREE) === 'true';
    
    setIsUnlocked(legacyUnlocked || directUnlock || hasActiveSubscription || trialActive);
    setIsTrialActive(trialActive);
    setTrialDaysLeft(daysLeft);
    setHasUsedFreeQuote(usedFree);
    setSubscriptionDetails(subDetails);
  };

  useEffect(() => {
    checkStatus();
    
    // Listen for storage changes (in case of updates from other tabs/components)
    const handleStorageChange = (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        checkStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (every minute) for trial expiration
    const interval = setInterval(checkStatus, 60000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const markFreeQuoteUsed = () => {
    localStorage.setItem(STORAGE_KEYS.USED_FREE, 'true');
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

  return {
    isUnlocked,
    hasUsedFreeQuote,
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