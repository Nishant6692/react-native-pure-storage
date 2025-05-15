import { NativeModules, Platform } from 'react-native';
import { createCache, createNullCache } from './cache';
import { StorageInstance } from './storage-instance';
import { StorageError, KeyError, EncryptionError, SerializationError, SyncOperationError } from './errors';
const createBenchmark = require('./benchmark');

const { RNPureStorage } = NativeModules;

if (!RNPureStorage) {
  throw new Error(`RNPureStorage module is not linked. Please check the installation instructions.`);
}

// Utility functions for serialization/deserialization
const serializeValue = (value) => {
  if (value === null || value === undefined) {
    return { type: 'null', value: null };
  }
  
  const type = typeof value;
  
  switch (type) {
    case 'string':
      return { type, value };
    case 'number':
    case 'boolean':
      return { type, value: String(value) };
    case 'object':
      try {
        return { type, value: JSON.stringify(value) };
      } catch (e) {
        throw new SerializationError(`Could not serialize value: ${e.message}`);
      }
    default:
      throw new SerializationError(`Unsupported value type: ${type}`);
  }
};

const deserializeValue = (item) => {
  if (!item || !item.type) {
    return null;
  }
  
  switch (item.type) {
    case 'null':
      return null;
    case 'string':
      return item.value;
    case 'number':
      return Number(item.value);
    case 'boolean':
      return item.value === 'true';
    case 'object':
      try {
        return JSON.parse(item.value);
      } catch (e) {
        return null;
      }
    default:
      return item.value;
  }
};

// Create default cache
const DEFAULT_CACHE_OPTIONS = { maxSize: 100, ttl: 60000 }; // 1 minute TTL
let memoryCache = createCache(DEFAULT_CACHE_OPTIONS);

// Create default instance for the main API
const defaultInstance = new StorageInstance({ namespace: 'default' });

// Event handlers for the main API
const globalChangeHandlers = new Set();
const globalKeyHandlers = new Map();

/**
 * A pure React Native storage solution with no external dependencies
 */
const PureStorage = {
  /**
   * Store a value for a given key
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store (strings, numbers, booleans, objects)
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  setItem: (key, value, options = {}) => {
    return defaultInstance.setItem(key, value, options)
      .then(success => {
        if (success) {
          // Notify global handlers
          const event = { type: 'set', key, value };
          for (const handler of globalChangeHandlers) {
            try {
              handler(event);
            } catch (error) {
              console.error('Error in storage change handler:', error);
            }
          }
          
          // Notify key-specific handlers
          if (globalKeyHandlers.has(key)) {
            for (const handler of globalKeyHandlers.get(key)) {
              try {
                handler(event);
              } catch (error) {
                console.error(`Error in handler for key "${key}":`, error);
              }
            }
          }
        }
        return success;
      });
  },

  /**
   * Synchronously store a value for a given key (when available)
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store (strings, numbers, booleans, objects)
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {boolean} - Returns true if successful
   */
  setItemSync: (key, value, options = {}) => {
    const success = defaultInstance.setItemSync(key, value, options);
    
    if (success) {
      // Notify global handlers
      const event = { type: 'set', key, value };
      for (const handler of globalChangeHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in storage change handler:', error);
        }
      }
      
      // Notify key-specific handlers
      if (globalKeyHandlers.has(key)) {
        for (const handler of globalKeyHandlers.get(key)) {
          try {
            handler(event);
          } catch (error) {
            console.error(`Error in handler for key "${key}":`, error);
          }
        }
      }
    }
    
    return success;
  },

  /**
   * Get a value for a given key
   * @param {string} key - The key to retrieve the value for
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @param {any} [options.default] - Default value if the key doesn't exist
   * @returns {Promise<any>} - A promise that resolves to the stored value, or null if not found
   */
  getItem: (key, options = {}) => {
    return defaultInstance.getItem(key, options);
  },

  /**
   * Synchronously get a value for a given key (when available)
   * @param {string} key - The key to retrieve the value for
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @param {any} [options.default] - Default value if the key doesn't exist
   * @returns {any} - The stored value, or null if not found
   */
  getItemSync: (key, options = {}) => {
    return defaultInstance.getItemSync(key, options);
  },

  /**
   * Remove a value for a given key
   * @param {string} key - The key to remove
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  removeItem: (key) => {
    return defaultInstance.removeItem(key)
      .then(success => {
        if (success) {
          // Notify global handlers
          const event = { type: 'remove', key };
          for (const handler of globalChangeHandlers) {
            try {
              handler(event);
            } catch (error) {
              console.error('Error in storage change handler:', error);
            }
          }
          
          // Notify key-specific handlers
          if (globalKeyHandlers.has(key)) {
            for (const handler of globalKeyHandlers.get(key)) {
              try {
                handler(event);
              } catch (error) {
                console.error(`Error in handler for key "${key}":`, error);
              }
            }
          }
        }
        return success;
      });
  },

  /**
   * Clear all stored values
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  clear: () => {
    return defaultInstance.clear()
      .then(success => {
        if (success) {
          // Notify global handlers
          const event = { type: 'clear' };
          for (const handler of globalChangeHandlers) {
            try {
              handler(event);
            } catch (error) {
              console.error('Error in storage change handler:', error);
            }
          }
        }
        return success;
      });
  },

  /**
   * Get all keys stored in the storage
   * @returns {Promise<Array<string>>} - A promise that resolves to an array of keys
   */
  getAllKeys: () => {
    return defaultInstance.getAllKeys();
  },
  
  /**
   * Set multiple key-value pairs at once
   * @param {Object} keyValuePairs - Object with key-value pairs to store
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  multiSet: (keyValuePairs, options = {}) => {
    return defaultInstance.multiSet(keyValuePairs, options)
      .then(success => {
        if (success) {
          // Notify about each key
          for (const [key, value] of Object.entries(keyValuePairs)) {
            // Notify global handlers
            const event = { type: 'set', key, value };
            for (const handler of globalChangeHandlers) {
              try {
                handler(event);
              } catch (error) {
                console.error('Error in storage change handler:', error);
              }
            }
            
            // Notify key-specific handlers
            if (globalKeyHandlers.has(key)) {
              for (const handler of globalKeyHandlers.get(key)) {
                try {
                  handler(event);
                } catch (error) {
                  console.error(`Error in handler for key "${key}":`, error);
                }
              }
            }
          }
        }
        return success;
      });
  },
  
  /**
   * Get multiple values for a set of keys
   * @param {Array<string>} keys - Array of keys to retrieve
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {Promise<Object>} - A promise that resolves to an object of key-value pairs
   */
  multiGet: (keys, options = {}) => {
    return defaultInstance.multiGet(keys, options);
  },
  
  /**
   * Remove multiple keys and their values
   * @param {Array<string>} keys - Array of keys to remove
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  multiRemove: (keys) => {
    return defaultInstance.multiRemove(keys)
      .then(success => {
        if (success) {
          // Notify about each key
          for (const key of keys) {
            // Notify global handlers
            const event = { type: 'remove', key };
            for (const handler of globalChangeHandlers) {
              try {
                handler(event);
              } catch (error) {
                console.error('Error in storage change handler:', error);
              }
            }
            
            // Notify key-specific handlers
            if (globalKeyHandlers.has(key)) {
              for (const handler of globalKeyHandlers.get(key)) {
                try {
                  handler(event);
                } catch (error) {
                  console.error(`Error in handler for key "${key}":`, error);
                }
              }
            }
          }
        }
        return success;
      });
  },
  
  /**
   * Check if a key exists in storage
   * @param {string} key - The key to check
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {Promise<boolean>} - A promise that resolves to true if the key exists
   */
  hasKey: (key, options = {}) => {
    return defaultInstance.hasKey(key, options);
  },
  
  /**
   * Create a new storage instance with its own namespace
   * @param {string} namespace - The namespace to use
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt all data by default
   * @param {object|boolean} [options.cache] - Cache configuration or false to disable
   * @returns {StorageInstance} - A new storage instance
   */
  getInstance: (namespace, options = {}) => {
    return new StorageInstance({ 
      namespace,
      ...options
    });
  },
  
  /**
   * Configure the cache for the default instance
   * @param {object|boolean} options - Cache options or false to disable
   */
  configureCache: (options) => {
    defaultInstance.configureCache(options);
  },
  
  /**
   * Add a listener for storage changes
   * @param {function} callback - The callback to call when any value changes
   * @returns {function} - A function to remove the listener
   */
  onChange: (callback) => {
    if (typeof callback !== 'function') {
      throw new StorageError('Callback must be a function', 'INVALID_CALLBACK');
    }
    
    globalChangeHandlers.add(callback);
    
    // Return a function to remove the listener
    return () => {
      globalChangeHandlers.delete(callback);
    };
  },
  
  /**
   * Add a listener for changes to a specific key
   * @param {string} key - The key to watch
   * @param {function} callback - The callback to call when the key changes
   * @returns {function} - A function to remove the listener
   */
  onKeyChange: (key, callback) => {
    if (typeof key !== 'string') {
      throw new KeyError('Key must be a string');
    }
    
    if (typeof callback !== 'function') {
      throw new StorageError('Callback must be a function', 'INVALID_CALLBACK');
    }
    
    if (!globalKeyHandlers.has(key)) {
      globalKeyHandlers.set(key, new Set());
    }
    
    globalKeyHandlers.get(key).add(callback);
    
    // Return a function to remove the listener
    return () => {
      if (globalKeyHandlers.has(key)) {
        globalKeyHandlers.get(key).delete(callback);
        
        // Clean up empty handlers
        if (globalKeyHandlers.get(key).size === 0) {
          globalKeyHandlers.delete(key);
        }
      }
    };
  },
  
  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getCacheStats: () => {
    return defaultInstance.getCacheStats();
  },
  
  /**
   * Reset cache statistics
   */
  resetCacheStats: () => {
    defaultInstance.resetCacheStats();
  }
};

// Export the main API
const PureStorageAPI = Object.assign({}, defaultInstance);

// Export the Benchmark utility
PureStorageAPI.Benchmark = createBenchmark(PureStorageAPI);

// Export error classes
PureStorageAPI.StorageError = StorageError;
PureStorageAPI.KeyError = KeyError;
PureStorageAPI.EncryptionError = EncryptionError;
PureStorageAPI.SerializationError = SerializationError;
PureStorageAPI.SyncOperationError = SyncOperationError;

module.exports = PureStorageAPI;
export { 
  StorageInstance,
  StorageError,
  KeyError,
  EncryptionError,
  SerializationError,
  SyncOperationError
}; 