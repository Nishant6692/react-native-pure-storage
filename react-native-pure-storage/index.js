import { NativeModules, Platform } from 'react-native';

const { RNPureStorage } = NativeModules;

if (!RNPureStorage) {
  throw new Error(`RNPureStorage module is not linked. Please check the installation instructions.`);
}

/**
 * A pure React Native storage solution with no external dependencies
 */
const PureStorage = {
  /**
   * Store a value for a given key
   * @param {string} key - The key to store the value under
   * @param {string} value - The value to store (must be a string)
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  setItem: (key, value) => {
    if (typeof key !== 'string' || typeof value !== 'string') {
      return Promise.reject(new Error('Key and value must be strings'));
    }
    return RNPureStorage.setItem(key, value);
  },

  /**
   * Get a value for a given key
   * @param {string} key - The key to retrieve the value for
   * @returns {Promise<string>} - A promise that resolves to the stored value, or null if not found
   */
  getItem: (key) => {
    if (typeof key !== 'string') {
      return Promise.reject(new Error('Key must be a string'));
    }
    return RNPureStorage.getItem(key);
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
  }
};

export default PureStorage; 