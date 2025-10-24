// LOCAL DATA MANAGER
// Provides CRUD operations for localStorage-backed data
// Mimics the nvision.entities API for easier refactoring

import { STORAGE_KEYS } from './defaults';

/**
 * Generate a unique ID for new records
 */
function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generic localStorage data manager
 */
class LocalDataManager {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  /**
   * List all records
   * @param {string} sortField - field to sort by (prefix with '-' for descending)
   * @param {number} limit - max number of records to return
   * @returns {array} - array of records
   */
  list(sortField = null, limit = null) {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      
      let result = Array.isArray(data) ? data : [];

      // Sort if requested
      if (sortField) {
        const descending = sortField.startsWith('-');
        const field = descending ? sortField.slice(1) : sortField;
        
        result.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return descending ? 1 : -1;
          if (aVal > bVal) return descending ? -1 : 1;
          return 0;
        });
      }

      // Limit if requested
      if (limit && limit > 0) {
        result = result.slice(0, limit);
      }

      return result;
    } catch (error) {
      console.error(`Error listing from ${this.storageKey}:`, error);
      return [];
    }
  }

  /**
   * Filter records by criteria
   * @param {object} criteria - key-value pairs to match
   * @param {string} sortField - field to sort by
   * @param {number} limit - max number of records
   * @returns {array} - filtered array of records
   */
  filter(criteria = {}, sortField = null, limit = null) {
    const allRecords = this.list(sortField, limit);
    
    return allRecords.filter(record => {
      return Object.entries(criteria).every(([key, value]) => record[key] === value);
    });
  }

  /**
   * Get a single record by ID
   * @param {string} id - record ID
   * @returns {object|null} - record or null if not found
   */
  get(id) {
    const records = this.list();
    return records.find(r => r.id === id) || null;
  }

  /**
   * Create a new record
   * @param {object} data - record data
   * @returns {object} - created record with ID
   */
  create(data) {
    try {
      const records = this.list();
      const newRecord = {
        id: generateId(this.storageKey.split('_')[1]),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data
      };
      
      records.push(newRecord);
      localStorage.setItem(this.storageKey, JSON.stringify(records));
      
      return newRecord;
    } catch (error) {
      console.error(`Error creating in ${this.storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Bulk create multiple records
   * @param {array} dataArray - array of record data objects
   * @returns {array} - array of created records
   */
  bulkCreate(dataArray) {
    try {
      const records = this.list();
      const newRecords = dataArray.map(data => ({
        id: generateId(this.storageKey.split('_')[1]),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data
      }));
      
      records.push(...newRecords);
      localStorage.setItem(this.storageKey, JSON.stringify(records));
      
      return newRecords;
    } catch (error) {
      console.error(`Error bulk creating in ${this.storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Update a record by ID
   * @param {string} id - record ID
   * @param {object} updates - fields to update
   * @returns {object} - updated record
   */
  update(id, updates) {
    try {
      const records = this.list();
      const index = records.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error(`Record with id ${id} not found`);
      }
      
      records[index] = {
        ...records[index],
        ...updates,
        updated_date: new Date().toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(records));
      
      return records[index];
    } catch (error) {
      console.error(`Error updating in ${this.storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record by ID
   * @param {string} id - record ID
   * @returns {boolean} - true if deleted
   */
  delete(id) {
    try {
      const records = this.list();
      const filtered = records.filter(r => r.id !== id);
      
      if (filtered.length === records.length) {
        throw new Error(`Record with id ${id} not found`);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      
      return true;
    } catch (error) {
      console.error(`Error deleting from ${this.storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Get the schema (not used for localStorage, but kept for API compatibility)
   * @returns {object} - empty object (schemas are documentation only)
   */
  schema() {
    return {};
  }
}

// Export manager instances
export const localDayRates = new LocalDataManager(STORAGE_KEYS.DAY_RATES);
export const localGearCosts = new LocalDataManager(STORAGE_KEYS.GEAR_COSTS);
export const localSettings = new LocalDataManager(STORAGE_KEYS.SETTINGS);