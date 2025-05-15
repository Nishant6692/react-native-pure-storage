import { NativeModules, Platform } from 'react-native';
import { createCache, createNullCache } from './cache';
import { StorageInstance } from './storage-instance';
import { StorageError, KeyError, EncryptionError, SerializationError, SyncOperationError } from './errors';
import JSIStorage from './jsi-storage';

const { RNPureStorage, RNJSIPureStorage } = NativeModules;

if (!RNPureStorage) {
  throw new Error(`RNPureStorage module is not linked. Please check the installation instructions.`);
}

// Initialize JSI if the module is available
if (RNJSIPureStorage) {
  try {
    // This module registers the JSI bindings
    console.log('PureStorage: JSI module detected, synchronous operations will be available if JSI is supported');
  } catch (error) {
    console.warn('PureStorage: Failed to initialize JSI module', error);
  }
} else {
  console.log('PureStorage: JSI module not available, falling back to async-only operations');
}

// Utility function for binary data compression
export const compressBinary = (data) => {
  if (!(data instanceof Uint8Array)) {
    // Convert to Uint8Array if needed
    data = data instanceof ArrayBuffer 
      ? new Uint8Array(data) 
      : new Uint8Array(data.buffer);
  }
  
  // Simple run-length encoding compression
  // Format: [value, count] pairs for repeated values
  // Non-repeated values are stored as [value, 0]
  const compressed = [];
  let currentValue = data[0];
  let count = 1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i] === currentValue && count < 255) {
      count++;
    } else {
      compressed.push(currentValue, count);
      currentValue = data[i];
      count = 1;
    }
  }
  
  // Push the last value
  if (data.length > 0) {
    compressed.push(currentValue, count);
  }
  
  // Create a typed array from the compressed data
  const compressedData = new Uint8Array(compressed);
  
  // Only return compressed data if it's actually smaller
  if (compressedData.length < data.length) {
    return { compressed: compressedData, originalSize: data.length, isCompressed: true };
  }
  
  // If compression doesn't save space, return the original
  return { compressed: data, originalSize: data.length, isCompressed: false };
};

// Utility function for binary data decompression
export const decompressBinary = (compressedData, originalSize, isCompressed) => {
  // If data wasn't compressed, return as is
  if (!isCompressed) {
    return compressedData;
  }
  
  // Decompress run-length encoded data
  const decompressed = new Uint8Array(originalSize);
  let writeIndex = 0;
  
  for (let i = 0; i < compressedData.length; i += 2) {
    const value = compressedData[i];
    const count = compressedData[i+1];
    
    if (count === 0) {
      // Non-repeated value
      decompressed[writeIndex++] = value;
    } else {
      // Repeated value
      for (let j = 0; j < count; j++) {
        decompressed[writeIndex++] = value;
      }
    }
  }
  
  return decompressed;
};

// Utility functions for serialization/deserialization
export const serializeValue = (value, options = {}) => {
  if (value === null || value === undefined) {
    return { type: 'null', value: null };
  }
  
  // Handle ArrayBuffer and typed arrays
  if (
    value instanceof ArrayBuffer || 
    value instanceof Uint8Array || 
    value instanceof Uint16Array || 
    value instanceof Uint32Array || 
    value instanceof Int8Array || 
    value instanceof Int16Array || 
    value instanceof Int32Array || 
    value instanceof Float32Array || 
    value instanceof Float64Array
  ) {
    // Convert to Uint8Array if it's not already
    const uint8Array = value instanceof Uint8Array 
      ? value 
      : value instanceof ArrayBuffer 
        ? new Uint8Array(value) 
        : new Uint8Array(value.buffer);
    
    let binaryData = uint8Array;
    let isCompressed = false;
    let originalSize = uint8Array.byteLength;
    
    // Apply compression if specified
    if (options.compression) {
      const compressResult = compressBinary(uint8Array);
      binaryData = compressResult.compressed;
      isCompressed = compressResult.isCompressed;
      originalSize = compressResult.originalSize;
    }
    
    // Convert to Base64 for storage
    let binary = '';
    const len = binaryData.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(binaryData[i]);
    }
    const base64 = global.btoa ? global.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
    
    // Store the original type for proper reconstruction
    const originalType = value.constructor.name;
    return { 
      type: 'binary', 
      value: base64,
      binaryType: originalType,
      isCompressed,
      originalSize: isCompressed ? originalSize : undefined
    };
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

export const deserializeValue = (item) => {
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
    case 'binary': {
      // Convert from Base64 back to binary
      const binary = global.atob 
        ? global.atob(item.value) 
        : Buffer.from(item.value, 'base64').toString('binary');
      
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Decompress if needed
      let processedBytes = bytes;
      if (item.isCompressed) {
        processedBytes = decompressBinary(bytes, item.originalSize, true);
      }
      
      // Reconstruct the original typed array based on the stored type
      switch (item.binaryType) {
        case 'ArrayBuffer':
          return processedBytes.buffer;
        case 'Uint8Array':
          return processedBytes;
        case 'Uint16Array':
          return new Uint16Array(processedBytes.buffer);
        case 'Uint32Array':
          return new Uint32Array(processedBytes.buffer);
        case 'Int8Array':
          return new Int8Array(processedBytes.buffer);
        case 'Int16Array':
          return new Int16Array(processedBytes.buffer);
        case 'Int32Array':
          return new Int32Array(processedBytes.buffer);
        case 'Float32Array':
          return new Float32Array(processedBytes.buffer);
        case 'Float64Array':
          return new Float64Array(processedBytes.buffer);
        default:
          // Default to Uint8Array if type is unknown
          return processedBytes;
      }
    }
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
   * Synchronously store a value for a given key (via JSI when available)
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store (strings, numbers, booleans, objects)
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {boolean} - Returns true if successful
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  setItemSync: (key, value, options = {}) => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      return JSIStorage.setItemSync(key, value, options);
    }
    
    // Fall back to the original implementation
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
   * Synchronously get a value for a given key (via JSI when available)
   * @param {string} key - The key to retrieve the value for
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @param {any} [options.default] - Default value if the key doesn't exist
   * @returns {any} - The stored value, or null if not found
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  getItemSync: (key, options = {}) => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      return JSIStorage.getItemSync(key, options);
    }
    
    // Fall back to the original implementation
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
   * Synchronously remove a value for a given key (via JSI when available)
   * @param {string} key - The key to remove
   * @returns {boolean} - Returns true if successful
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  removeItemSync: (key) => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      return JSIStorage.removeItemSync(key);
    }
    
    // Fall back to attempting the native synchronous method if available
    try {
      const success = defaultInstance.removeItemSync(key);
      
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
    } catch (error) {
      throw new SyncOperationError("Synchronous removeItem operation not available without JSI");
    }
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
   * Synchronously clear all stored values (via JSI when available)
   * @returns {boolean} - Returns true if successful
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  clearSync: () => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      const success = JSIStorage.clearSync();
      
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
    }
    
    // Fall back to attempting the native synchronous method if available
    try {
      const success = defaultInstance.clearSync();
      
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
    } catch (error) {
      throw new SyncOperationError("Synchronous clear operation not available without JSI");
    }
  },

  /**
   * Get all keys stored in the storage
   * @returns {Promise<Array<string>>} - A promise that resolves to an array of keys
   */
  getAllKeys: () => {
    return defaultInstance.getAllKeys();
  },

  /**
   * Synchronously get all keys stored in the storage (via JSI when available)
   * @returns {Array<string>} - An array of keys
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  getAllKeysSync: () => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      return JSIStorage.getAllKeysSync();
    }
    
    // Fall back to attempting the native synchronous method if available
    try {
      return defaultInstance.getAllKeysSync();
    } catch (error) {
      throw new SyncOperationError("Synchronous getAllKeys operation not available without JSI");
    }
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
   * Synchronously check if a key exists in storage (via JSI when available)
   * @param {string} key - The key to check
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {boolean} - Returns true if the key exists
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  hasKeySync: (key, options = {}) => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      return JSIStorage.hasKeySync(key);
    }
    
    // Fall back to attempting the native synchronous method if available
    try {
      return defaultInstance.hasKeySync(key, options);
    } catch (error) {
      throw new SyncOperationError("Synchronous hasKey operation not available without JSI");
    }
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
   * Synchronously set multiple key-value pairs at once (via JSI when available)
   * @param {Object} keyValuePairs - Object with key-value pairs to store
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {boolean} - Returns true if successful
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  multiSetSync: (keyValuePairs, options = {}) => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      const success = JSIStorage.multiSetSync(keyValuePairs, options);
      
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
    }
    
    throw new SyncOperationError("Synchronous multiSet operation not available without JSI");
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
   * Synchronously get multiple values for a set of keys (via JSI when available)
   * @param {Array<string>} keys - Array of keys to retrieve
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @returns {Object} - An object of key-value pairs
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  multiGetSync: (keys, options = {}) => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      return JSIStorage.multiGetSync(keys, options);
    }
    
    throw new SyncOperationError("Synchronous multiGet operation not available without JSI");
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
   * Synchronously remove multiple keys and their values (via JSI when available)
   * @param {Array<string>} keys - Array of keys to remove
   * @returns {boolean} - Returns true if successful
   * @throws {Error} - If JSI is not available and the platform doesn't support synchronous operations
   */
  multiRemoveSync: (keys) => {
    // Try to use JSI if available
    if (JSIStorage.isAvailable) {
      const success = JSIStorage.multiRemoveSync(keys);
      
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
    }
    
    throw new SyncOperationError("Synchronous multiRemove operation not available without JSI");
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
  },

  /**
   * Store binary data for a given key
   * @param {string} key - The key to store the binary data under
   * @param {ArrayBuffer|TypedArray} data - The binary data to store
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @param {boolean} [options.compression=false] - Whether to compress the data using RLE
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  setBinaryItem: (key, data, options = {}) => {
    if (!(data instanceof ArrayBuffer) && 
        !(data instanceof Uint8Array) && 
        !(data instanceof Uint16Array) && 
        !(data instanceof Uint32Array) && 
        !(data instanceof Int8Array) && 
        !(data instanceof Int16Array) && 
        !(data instanceof Int32Array) && 
        !(data instanceof Float32Array) && 
        !(data instanceof Float64Array)) {
      throw new SerializationError('Data must be an ArrayBuffer or TypedArray');
    }
    
    return PureStorage.setItem(key, data, options);
  },
  
  /**
   * Get binary data for a given key
   * @param {string} key - The key to retrieve the binary data for
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @param {string} [options.returnType='Uint8Array'] - The type of binary data to return: 'ArrayBuffer', 'Uint8Array', etc.
   * @returns {Promise<ArrayBuffer|TypedArray|null>} - A promise that resolves to the binary data, or null if not found
   */
  getBinaryItem: async (key, options = {}) => {
    const value = await PureStorage.getItem(key, options);
    
    if (value === null) {
      return null;
    }
    
    // If the value isn't binary, convert it if possible
    if (!(value instanceof ArrayBuffer) && 
        !(value instanceof Uint8Array) && 
        !(value instanceof Uint16Array) && 
        !(value instanceof Uint32Array) && 
        !(value instanceof Int8Array) && 
        !(value instanceof Int16Array) && 
        !(value instanceof Int32Array) && 
        !(value instanceof Float32Array) && 
        !(value instanceof Float64Array)) {
      
      // If value is a string, try to convert it to binary
      if (typeof value === 'string') {
        const binary = unescape(encodeURIComponent(value));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }
      
      throw new SerializationError('Retrieved value is not binary data');
    }
    
    // Convert to the requested return type if needed
    const returnType = options.returnType || 'Uint8Array';
    if (returnType === 'ArrayBuffer' && !(value instanceof ArrayBuffer)) {
      return value.buffer.slice(0);
    } else if (returnType === 'Uint8Array' && !(value instanceof Uint8Array)) {
      return new Uint8Array(value instanceof ArrayBuffer ? value : value.buffer);
    }
    
    return value;
  },
  
  /**
   * Synchronously store binary data for a given key
   * @param {string} key - The key to store the binary data under
   * @param {ArrayBuffer|TypedArray} data - The binary data to store
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the data
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @param {boolean} [options.compression=false] - Whether to compress the data using RLE
   * @returns {boolean} - Returns true if successful
   * @throws {Error} - If JSI is not available or if data is not binary
   */
  setBinaryItemSync: (key, data, options = {}) => {
    if (!(data instanceof ArrayBuffer) && 
        !(data instanceof Uint8Array) && 
        !(data instanceof Uint16Array) && 
        !(data instanceof Uint32Array) && 
        !(data instanceof Int8Array) && 
        !(data instanceof Int16Array) && 
        !(data instanceof Int32Array) && 
        !(data instanceof Float32Array) && 
        !(data instanceof Float64Array)) {
      throw new SerializationError('Data must be an ArrayBuffer or TypedArray');
    }
    
    return PureStorage.setItemSync(key, data, options);
  },
  
  /**
   * Synchronously get binary data for a given key
   * @param {string} key - The key to retrieve the binary data for
   * @param {object} [options] - Optional configuration
   * @param {boolean} [options.skipCache=false] - Whether to skip the cache
   * @param {string} [options.returnType='Uint8Array'] - The type of binary data to return: 'ArrayBuffer', 'Uint8Array', etc.
   * @returns {ArrayBuffer|TypedArray|null} - The binary data, or null if not found
   * @throws {Error} - If JSI is not available or if the data cannot be converted to binary
   */
  getBinaryItemSync: (key, options = {}) => {
    const value = PureStorage.getItemSync(key, options);
    
    if (value === null) {
      return null;
    }
    
    // If the value isn't binary, convert it if possible
    if (!(value instanceof ArrayBuffer) && 
        !(value instanceof Uint8Array) && 
        !(value instanceof Uint16Array) && 
        !(value instanceof Uint32Array) && 
        !(value instanceof Int8Array) && 
        !(value instanceof Int16Array) && 
        !(value instanceof Int32Array) && 
        !(value instanceof Float32Array) && 
        !(value instanceof Float64Array)) {
      
      // If value is a string, try to convert it to binary
      if (typeof value === 'string') {
        const binary = unescape(encodeURIComponent(value));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }
      
      throw new SerializationError('Retrieved value is not binary data');
    }
    
    // Convert to the requested return type if needed
    const returnType = options.returnType || 'Uint8Array';
    if (returnType === 'ArrayBuffer' && !(value instanceof ArrayBuffer)) {
      return value.buffer.slice(0);
    } else if (returnType === 'Uint8Array' && !(value instanceof Uint8Array)) {
      return new Uint8Array(value instanceof ArrayBuffer ? value : value.buffer);
    }
    
    return value;
  },
  
  /**
   * Check if binary data is cached in memory
   * @param {string} key - The key to check
   * @returns {boolean} - Whether the binary data is in cache
   */
  isBinaryCached: (key) => {
    if (!memoryCache) return false;
    
    const cached = memoryCache.get(key);
    if (!cached) return false;
    
    return cached.type === 'binary';
  },

  // Add information about JSI support
  jsi: {
    /**
     * Whether JSI synchronous access is available
     */
    isAvailable: JSIStorage.isAvailable,
    
    /**
     * Get all keys synchronously (JSI only)
     * @returns {Array<string>} Array of keys
     * @throws {Error} If JSI is not available
     */
    getAllKeysSync: () => {
      return JSIStorage.getAllKeysSync();
    },
    
    /**
     * Clear all storage synchronously (JSI only)
     * @returns {boolean} Success
     * @throws {Error} If JSI is not available
     */
    clearSync: () => {
      const success = JSIStorage.clearSync();
      
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
    },
    
    /**
     * Remove an item synchronously (JSI only)
     * @param {string} key Key to remove
     * @returns {boolean} Success
     * @throws {Error} If JSI is not available
     */
    removeItemSync: (key) => {
      const success = JSIStorage.removeItemSync(key);
      
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
    },
    
    /**
     * Check if a key exists synchronously (JSI only)
     * @param {string} key Key to check
     * @returns {boolean} Whether the key exists
     * @throws {Error} If JSI is not available
     */
    hasKeySync: (key) => {
      return JSIStorage.hasKeySync(key);
    },
    
    /**
     * Set multiple items synchronously (JSI only)
     * @param {Object} keyValuePairs Object of key-value pairs
     * @param {Object} options Storage options
     * @returns {boolean} Success
     * @throws {Error} If JSI is not available
     */
    multiSetSync: (keyValuePairs, options = {}) => {
      const success = JSIStorage.multiSetSync(keyValuePairs, options);
      
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
    },
    
    /**
     * Get multiple items synchronously (JSI only)
     * @param {Array<string>} keys Array of keys to retrieve
     * @param {Object} options Storage options
     * @returns {Object} Object of key-value pairs
     * @throws {Error} If JSI is not available
     */
    multiGetSync: (keys, options = {}) => {
      return JSIStorage.multiGetSync(keys, options);
    },
    
    /**
     * Remove multiple items synchronously (JSI only)
     * @param {Array<string>} keys Array of keys to remove
     * @returns {boolean} Success
     * @throws {Error} If JSI is not available
     */
    multiRemoveSync: (keys) => {
      const success = JSIStorage.multiRemoveSync(keys);
      
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
    }
  }
};

// Export the main API
const PureStorageAPI = Object.assign({}, defaultInstance);

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