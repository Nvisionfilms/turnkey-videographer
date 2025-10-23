import { useState, useEffect } from 'react';

/**
 * Custom hook for managing data in localStorage with React state
 * @param {string} key - localStorage key
 * @param {any} defaultValue - default value if key doesn't exist
 * @returns {[any, Function]} - [value, setValue]
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

/**
 * Directly read from localStorage without React state
 * @param {string} key - localStorage key
 * @param {any} defaultValue - default value if key doesn't exist
 * @returns {any} - parsed value or default
 */
export function getLocalStorage(key, defaultValue) {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Directly write to localStorage
 * @param {string} key - localStorage key
 * @param {any} value - value to store
 */
export function setLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - localStorage key
 */
export function removeLocalStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}