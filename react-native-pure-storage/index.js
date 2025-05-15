import { NativeModules, Platform } from 'react-native';
import Benchmark from './benchmark';

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
        throw new Error(`Could not serialize value: ${e.message}`);
      }
    default:
      throw new Error(`Unsupported value type: ${type}`);
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
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  setItem: (key, value, options = {}) => {
    if (typeof key !== 'string') {
      return Promise.reject(new Error('Key must be a string'));
    }
    
    try {
      const serialized = serializeValue(value);
      return RNPureStorage.setItem(key, serialized.type, serialized.value, !!options.encrypted);
    } catch (e) {
      return Promise.reject(e);
    }
  },

  /**
   * Synchronously store a value for a given key (when available)
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store (strings, numbers, booleans, objects)
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @returns {boolean} - Returns true if successful
   */
  setItemSync: (key, value, options = {}) => {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }
    
    if (!RNPureStorage.setItemSync) {
      throw new Error('Synchronous API not available on this platform');
    }
    
    try {
      const serialized = serializeValue(value);
      return RNPureStorage.setItemSync(key, serialized.type, serialized.value, !!options.encrypted);
    } catch (e) {
      throw e;
    }
  },

  /**
   * Get a value for a given key
   * @param {string} key - The key to retrieve the value for
   * @returns {Promise<any>} - A promise that resolves to the stored value, or null if not found
   */
  getItem: (key) => {
    if (typeof key !== 'string') {
      return Promise.reject(new Error('Key must be a string'));
    }
    
    return RNPureStorage.getItem(key).then(result => {
      return result ? deserializeValue(result) : null;
    });
  },

  /**
   * Synchronously get a value for a given key (when available)
   * @param {string} key - The key to retrieve the value for
   * @returns {any} - The stored value, or null if not found
   */
  getItemSync: (key) => {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }
    
    if (!RNPureStorage.getItemSync) {
      throw new Error('Synchronous API not available on this platform');
    }
    
    const result = RNPureStorage.getItemSync(key);
    return result ? deserializeValue(result) : null;
  },

  /**
   * Remove a value for a given key
   * @param {string} key - The key to remove
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  removeItem: (key) => {
    if (typeof key !== 'string') {
      return Promise.reject(new Error('Key must be a string'));
    }
    return RNPureStorage.removeItem(key);
  },

  /**
   * Clear all stored values
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  clear: () => {
    return RNPureStorage.clear();
  },

  /**
   * Get all keys stored in the storage
   * @returns {Promise<Array<string>>} - A promise that resolves to an array of keys
   */
  getAllKeys: () => {
    return RNPureStorage.getAllKeys();
  },
  
  /**
   * Set multiple key-value pairs at once
   * @param {Object} keyValuePairs - Object with key-value pairs to store
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  multiSet: (keyValuePairs, options = {}) => {
    if (!keyValuePairs || typeof keyValuePairs !== 'object') {
      return Promise.reject(new Error('Expected an object of key-value pairs'));
    }
    
    try {
      const serialized = Object.entries(keyValuePairs).map(([key, value]) => {
        if (typeof key !== 'string') {
          throw new Error('Keys must be strings');
        }
        const serializedValue = serializeValue(value);
        return [key, serializedValue.type, serializedValue.value];
      });
      
      return RNPureStorage.multiSet(serialized, !!options.encrypted);
    } catch (e) {
      return Promise.reject(e);
    }
  },
  
  /**
   * Get multiple values for a set of keys
   * @param {Array<string>} keys - Array of keys to retrieve
   * @returns {Promise<Object>} - A promise that resolves to an object of key-value pairs
   */
  multiGet: (keys) => {
    if (!Array.isArray(keys)) {
      return Promise.reject(new Error('Expected an array of keys'));
    }
    
    for (const key of keys) {
      if (typeof key !== 'string') {
        return Promise.reject(new Error('Keys must be strings'));
      }
    }
    
    return RNPureStorage.multiGet(keys).then(results => {
      const deserialized = {};
      
      for (const [key, value] of Object.entries(results)) {
        deserialized[key] = value ? deserializeValue(value) : null;
      }
      
      return deserialized;
    });
  },
  
  /**
   * Remove multiple keys and their values
   * @param {Array<string>} keys - Array of keys to remove
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  multiRemove: (keys) => {
    if (!Array.isArray(keys)) {
      return Promise.reject(new Error('Expected an array of keys'));
    }
    
    for (const key of keys) {
      if (typeof key !== 'string') {
        return Promise.reject(new Error('Keys must be strings'));
      }
    }
    
    return RNPureStorage.multiRemove(keys);
  },
  
  /**
   * Check if a key exists in storage
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} - A promise that resolves to true if the key exists
   */
  hasKey: (key) => {
    if (typeof key !== 'string') {
      return Promise.reject(new Error('Key must be a string'));
    }
    
    return RNPureStorage.hasKey(key);
  }
};

export default PureStorage;
export { Benchmark }; 