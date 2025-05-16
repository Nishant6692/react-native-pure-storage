/**
 * File and Image Storage Utilities for PureStorage
 * 
 * This module provides specialized methods for storing and retrieving files and images,
 * building on top of the binary storage capabilities of PureStorage.
 */

import { Platform } from 'react-native';
import PureStorage from './index';

/**
 * Utility for storing and retrieving files and images
 */
export default class FileStorage {
  /**
   * Store a file from a URI
   * @param {string} key - The key to store the file under
   * @param {string} uri - The URI of the file (file://, content://, etc.)
   * @param {object} [options] - Storage options
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the file
   * @param {boolean} [options.compression=true] - Whether to compress the file
   * @param {string} [options.metadata] - Optional metadata to store with the file
   * @returns {Promise<boolean>} - Whether the operation succeeded
   */
  static async storeFile(key, uri, options = {}) {
    try {
      // Import RNFS on-demand to avoid dependency if not used
      const RNFS = require('react-native-fs');
      
      // Read the file as a base64 string
      const base64 = await RNFS.readFile(uri, 'base64');
      
      // Convert base64 to binary
      const binary = this._base64ToBinary(base64);
      
      // Default to using compression for files
      const compressionOption = options.compression !== undefined ? options.compression : true;
      
      // Store metadata if provided
      if (options.metadata) {
        await PureStorage.setItem(`${key}:metadata`, {
          uri,
          dateStored: new Date().toISOString(),
          ...options.metadata
        });
      }
      
      // Store the actual file data
      return await PureStorage.setBinaryItem(key, binary, {
        ...options,
        compression: compressionOption
      });
    } catch (error) {
      console.error('Error storing file:', error);
      return false;
    }
  }
  
  /**
   * Retrieve a file as a binary object
   * @param {string} key - The key the file was stored under
   * @param {object} [options] - Retrieval options
   * @returns {Promise<{data: Uint8Array, metadata: object|null}>} - File data and metadata
   */
  static async getFile(key, options = {}) {
    try {
      // Get the file data
      const data = await PureStorage.getBinaryItem(key, options);
      
      if (!data) {
        return { data: null, metadata: null };
      }
      
      // Try to get metadata if it exists
      let metadata = null;
      try {
        metadata = await PureStorage.getItem(`${key}:metadata`);
      } catch (e) {
        // Metadata doesn't exist or couldn't be retrieved
      }
      
      return { data, metadata };
    } catch (error) {
      console.error('Error retrieving file:', error);
      return { data: null, metadata: null };
    }
  }
  
  /**
   * Store an image from a URI
   * @param {string} key - The key to store the image under
   * @param {string} uri - The URI of the image
   * @param {object} [options] - Storage options
   * @param {boolean} [options.encrypted=false] - Whether to encrypt the image
   * @param {boolean} [options.compression=true] - Whether to compress the image
   * @param {string} [options.format='jpeg'] - Format of the image ('jpeg' or 'png')
   * @param {number} [options.quality=0.8] - Quality of the image (0.0-1.0)
   * @param {object} [options.metadata] - Additional metadata to store
   * @returns {Promise<boolean>} - Whether the operation succeeded
   */
  static async storeImage(key, uri, options = {}) {
    try {
      // Import Image Manipulation on-demand to avoid dependency if not used
      const ImageManipulator = require('expo-image-manipulator');
      
      // Process/optimize the image before storage
      const format = options.format || 'jpeg';
      const quality = options.quality !== undefined ? options.quality : 0.8;
      
      // Manipulate image if needed (resize, compress, etc)
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [], // No transformations by default
        {
          compress: quality,
          format: format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG
        }
      );
      
      // Store image dimensions and other metadata
      const imageInfo = {
        width: manipResult.width,
        height: manipResult.height,
        format,
        originalUri: uri,
        dateStored: new Date().toISOString(),
        ...options.metadata
      };
      
      await PureStorage.setItem(`${key}:metadata`, imageInfo);
      
      // Store the actual image using file storage
      return await this.storeFile(key, manipResult.uri, {
        ...options,
        metadata: undefined // Metadata already stored separately
      });
    } catch (error) {
      console.error('Error storing image:', error);
      return false;
    }
  }
  
  /**
   * Retrieve an image as a base64 data URI
   * @param {string} key - The key the image was stored under
   * @param {object} [options] - Retrieval options
   * @returns {Promise<{uri: string|null, metadata: object|null}>} - Image URI and metadata
   */
  static async getImage(key, options = {}) {
    try {
      const { data, metadata } = await this.getFile(key, options);
      
      if (!data) {
        return { uri: null, metadata: null };
      }
      
      // Convert binary data back to base64
      const base64 = this._binaryToBase64(data);
      
      // Get format from metadata or default to jpeg
      const format = metadata?.format || 'jpeg';
      const uri = `data:image/${format};base64,${base64}`;
      
      return { uri, metadata };
    } catch (error) {
      console.error('Error retrieving image:', error);
      return { uri: null, metadata: null };
    }
  }
  
  /**
   * Save an image or file to the filesystem
   * @param {string} key - The key the file is stored under
   * @param {string} destinationPath - Path to save the file to
   * @param {object} [options] - Options for retrieval
   * @returns {Promise<string|null>} - The path the file was saved to, or null on failure
   */
  static async saveToFilesystem(key, destinationPath, options = {}) {
    try {
      const RNFS = require('react-native-fs');
      const { data } = await this.getFile(key, options);
      
      if (!data) {
        throw new Error('File not found');
      }
      
      // Convert binary to base64 for writing
      const base64 = this._binaryToBase64(data);
      
      // Write the file
      await RNFS.writeFile(destinationPath, base64, 'base64');
      
      return destinationPath;
    } catch (error) {
      console.error('Error saving file to filesystem:', error);
      return null;
    }
  }
  
  /**
   * List all stored files
   * @param {string} [prefix] - Optional prefix to filter by
   * @returns {Promise<Array<{key: string, metadata: object|null}>>} - List of files
   */
  static async listFiles(prefix = '') {
    try {
      const allKeys = await PureStorage.getAllKeys();
      
      // Filter out metadata keys and keys that don't match prefix
      const fileKeys = allKeys.filter(key => 
        !key.endsWith(':metadata') && 
        key.startsWith(prefix)
      );
      
      // Get metadata for each file
      const files = await Promise.all(fileKeys.map(async (key) => {
        try {
          const metadata = await PureStorage.getItem(`${key}:metadata`);
          return { key, metadata };
        } catch (e) {
          return { key, metadata: null };
        }
      }));
      
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
  
  /**
   * Delete a file and its metadata
   * @param {string} key - The key of the file to delete
   * @returns {Promise<boolean>} - Whether the operation succeeded
   */
  static async deleteFile(key) {
    try {
      // Delete the file data
      await PureStorage.removeItem(key);
      
      // Try to delete metadata if it exists
      try {
        await PureStorage.removeItem(`${key}:metadata`);
      } catch (e) {
        // Metadata doesn't exist or couldn't be deleted
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  /**
   * Get the size of a stored file in bytes
   * @param {string} key - The key of the file
   * @returns {Promise<number|null>} - Size in bytes or null if not found
   */
  static async getFileSize(key) {
    try {
      const { data } = await this.getFile(key);
      return data ? data.byteLength : null;
    } catch (error) {
      console.error('Error getting file size:', error);
      return null;
    }
  }
  
  /**
   * Convert a base64 string to a Uint8Array
   * @param {string} base64 - Base64 string
   * @returns {Uint8Array} - Binary data
   * @private
   */
  static _base64ToBinary(base64) {
    const binary = global.atob
      ? global.atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
    
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return bytes;
  }
  
  /**
   * Convert a Uint8Array to a base64 string
   * @param {Uint8Array} uint8Array - Binary data
   * @returns {string} - Base64 string
   * @private
   */
  static _binaryToBase64(uint8Array) {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    
    return global.btoa
      ? global.btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');
  }
} 