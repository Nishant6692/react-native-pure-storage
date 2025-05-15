/**
 * JavaScript Interface (JSI) wrapper for synchronous storage operations
 * 
 * This provides true synchronous access to native storage on both platforms
 * using JSI when available, with a fallback to the async native module.
 */

import { NativeModules, Platform } from 'react-native';
import { serializeValue, deserializeValue } from './index';

// Check if JSI is available
const JSIPureStorage = global.JSIPureStorage;
const isJSIAvailable = !!JSIPureStorage;

/**
 * A pure JavaScript wrapper for the JSI implementation
 */
const JSIStorage = {
  /**
   * Whether JSI synchronous access is available
   */
  isAvailable: isJSIAvailable,
  
  /**
   * Set an item synchronously using JSI
   * @param {string} key - The key to store
   * @param {any} value - The value to store
   * @param {object} options - Storage options
   * @returns {boolean} - Whether the operation was successful
   */
  setItemSync: (key, value, options = {}) => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      const serialized = serializeValue(value);
      return JSIPureStorage.setItemSync(
        key,
        serialized.type,
        serialized.value,
        !!options.encrypted
      );
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Get an item synchronously using JSI
   * @param {string} key - The key to get
   * @param {object} options - Storage options
   * @returns {any} - The stored value or null if not found
   */
  getItemSync: (key, options = {}) => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      const result = JSIPureStorage.getItemSync(key);
      if (!result) {
        return options.default !== undefined ? options.default : null;
      }
      
      return deserializeValue(result);
    } catch (error) {
      return options.default !== undefined ? options.default : null;
    }
  },
  
  /**
   * Remove an item synchronously using JSI
   * @param {string} key - The key to remove
   * @returns {boolean} - Whether the operation was successful
   */
  removeItemSync: (key) => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      return JSIPureStorage.removeItemSync(key);
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Clear all items synchronously using JSI
   * @returns {boolean} - Whether the operation was successful
   */
  clearSync: () => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      return JSIPureStorage.clearSync();
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Get all keys synchronously using JSI
   * @returns {string[]} - Array of keys
   */
  getAllKeysSync: () => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      return JSIPureStorage.getAllKeysSync();
    } catch (error) {
      return [];
    }
  },
  
  /**
   * Check if a key exists synchronously using JSI
   * @param {string} key - The key to check
   * @returns {boolean} - Whether the key exists
   */
  hasKeySync: (key) => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      return JSIPureStorage.hasKeySync(key);
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Multi-get synchronously (not directly supported by JSI, composed from getItemSync)
   * @param {string[]} keys - Array of keys to get
   * @param {object} options - Storage options
   * @returns {object} - Object mapping keys to values
   */
  multiGetSync: (keys, options = {}) => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      const result = {};
      for (const key of keys) {
        result[key] = JSIStorage.getItemSync(key, options);
      }
      return result;
    } catch (error) {
      return {};
    }
  },
  
  /**
   * Multi-set synchronously (not directly supported by JSI, composed from setItemSync)
   * @param {object} items - Object mapping keys to values
   * @param {object} options - Storage options
   * @returns {boolean} - Whether all operations were successful
   */
  multiSetSync: (items, options = {}) => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      let success = true;
      for (const [key, value] of Object.entries(items)) {
        const result = JSIStorage.setItemSync(key, value, options);
        if (!result) {
          success = false;
        }
      }
      return success;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Multi-remove synchronously (not directly supported by JSI, composed from removeItemSync)
   * @param {string[]} keys - Array of keys to remove
   * @returns {boolean} - Whether all operations were successful
   */
  multiRemoveSync: (keys) => {
    if (!isJSIAvailable) {
      throw new Error('JSI synchronous storage is not available');
    }
    
    try {
      let success = true;
      for (const key of keys) {
        const result = JSIStorage.removeItemSync(key);
        if (!result) {
          success = false;
        }
      }
      return success;
    } catch (error) {
      return false;
    }
  }
};

export default JSIStorage; 