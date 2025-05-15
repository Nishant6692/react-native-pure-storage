# React Native Pure Storage

A native, asynchronous, and dependency-free solution for key-value storage in React Native applications. This library provides a fast and efficient way to store data with built-in support for caching, encryption, namespaces, and event handling.

## Features

- 🚀 High-performance native storage with in-memory caching
- 🔒 Optional encryption for sensitive data
- 🔄 True synchronous API via JSI (JavaScript Interface)
- 🧩 Support for multiple storage instances with namespaces
- 📱 Works on both iOS and Android
- 📦 Zero external dependencies
- 📊 Built-in benchmarking tools
- 🔍 Comprehensive error handling
- 🎧 Event listeners for storage changes
- 📊 Support for complex data types (objects, arrays, etc.)

## Installation

```bash
npm install react-native-pure-storage
# or
yarn add react-native-pure-storage
```

### Linking

#### React Native >= 0.60

Autolinking will handle the linking process automatically.

#### React Native < 0.60

```bash
react-native link react-native-pure-storage
```

## Usage

### Basic Operations

```javascript
import PureStorage from 'react-native-pure-storage';

// Store values
await PureStorage.setItem('userId', 123);
await PureStorage.setItem('userProfile', { name: 'John', age: 30 });
await PureStorage.setItem('sensitiveData', 'secret', { encrypted: true });

// Retrieve values
const userId = await PureStorage.getItem('userId');
const userProfile = await PureStorage.getItem('userProfile');
const secret = await PureStorage.getItem('sensitiveData');

// Check if a key exists
const exists = await PureStorage.hasKey('userId');

// Remove items
await PureStorage.removeItem('userId');

// Clear all storage
await PureStorage.clear();
```

### Batched Operations

```javascript
// Store multiple values at once
await PureStorage.multiSet({
  userId: 123,
  username: 'john_doe',
  lastLogin: new Date().toISOString()
});

// Get multiple values at once
const userData = await PureStorage.multiGet(['userId', 'username', 'lastLogin']);

// Remove multiple keys
await PureStorage.multiRemove(['userId', 'username']);
```

### Synchronous API via JSI

React Native Pure Storage now provides true synchronous access via JSI (JavaScript Interface) on both iOS and Android:

```javascript
import PureStorage from 'react-native-pure-storage';

// Check if JSI is available
if (PureStorage.jsi.isAvailable) {
  console.log('JSI is available!');
  
  // Use synchronous methods directly
  PureStorage.setItemSync('counter', 42);
  const value = PureStorage.getItemSync('counter');
  console.log('Value:', value); // 42
  
  // Advanced synchronous operations
  const allKeys = PureStorage.jsi.getAllKeysSync();
  const exists = PureStorage.jsi.hasKeySync('counter');
  PureStorage.jsi.multiSetSync({ a: 1, b: 2, c: 3 });
  const values = PureStorage.jsi.multiGetSync(['a', 'b', 'c']);
  PureStorage.jsi.multiRemoveSync(['a', 'b']);
  PureStorage.jsi.clearSync();
} else {
  console.log('JSI not available, falling back to async methods');
}
```

The JSI integration provides true synchronous access to the storage, allowing you to avoid promise-based code when needed. This is particularly useful for:

- Initial app data loading
- Form state persistence
- Critical performance paths
- Synchronous code that requires storage access

> **Note**: JSI methods throw an error if JSI is not available. Always check `PureStorage.jsi.isAvailable` before using these methods or use try/catch blocks.

### Complete Synchronous API Usage

The synchronous API is accessible in two ways:

1. Via the main API (`PureStorage.setItemSync`, etc.) - more convenient
2. Via the `jsi` property (`PureStorage.jsi.setItemSync`, etc.) - more explicit

Here's a comprehensive example showing all available synchronous methods:

```javascript
import PureStorage from 'react-native-pure-storage';

function useSyncStorage() {
  // Always check if JSI is available before using sync methods
  if (!PureStorage.jsi.isAvailable) {
    console.warn('JSI is not available on this device/platform');
    return;
  }
  
  try {
    // Basic operations
    PureStorage.setItemSync('username', 'john_doe');
    PureStorage.setItemSync('isLoggedIn', true);
    PureStorage.setItemSync('userProfile', { 
      id: 123, 
      name: 'John Doe', 
      email: 'john@example.com' 
    });
    
    // Encrypted storage for sensitive data
    PureStorage.setItemSync('accessToken', 'eyJ0eXAiOi...', { encrypted: true });
    
    // Read operations
    const username = PureStorage.getItemSync('username');
    const isLoggedIn = PureStorage.getItemSync('isLoggedIn');
    const profile = PureStorage.getItemSync('userProfile');
    const token = PureStorage.getItemSync('accessToken');
    
    console.log(`User ${username} is ${isLoggedIn ? 'logged in' : 'not logged in'}`);
    console.log(`Profile:`, profile);
    
    // Check if keys exist
    if (PureStorage.hasKeySync('accessToken')) {
      console.log('User has valid session');
    }
    
    // Get all stored keys
    const allKeys = PureStorage.getAllKeysSync();
    console.log('All stored keys:', allKeys);
    
    // Batch operations
    PureStorage.multiSetSync({
      'preference_theme': 'dark',
      'preference_notifications': true,
      'preference_language': 'en-US'
    });
    
    const preferences = PureStorage.multiGetSync([
      'preference_theme', 
      'preference_notifications', 
      'preference_language'
    ]);
    
    console.log('User preferences:', preferences);
    
    // Removing data
    PureStorage.removeItemSync('temporaryData');
    PureStorage.multiRemoveSync(['oldKey1', 'oldKey2', 'oldKey3']);
    
    // Clear all data (use carefully!)
    // PureStorage.clearSync();
    
  } catch (error) {
    console.error('Error using synchronous storage:', error);
  }
}
```

#### Performance Considerations

Synchronous operations are faster than their asynchronous counterparts, especially for reading operations. However, keep these guidelines in mind:

1. Use synchronous operations for small, critical data that needs immediate access
2. For large datasets, prefer asynchronous operations to avoid blocking the JS thread
3. Batch related operations with `multiSetSync`/`multiGetSync` when possible
4. Always handle errors appropriately, as synchronous operations will throw rather than reject promises

#### Fallback Pattern

For compatibility with devices that don't support JSI, use this pattern:

```javascript
function getStoredValue(key, defaultValue = null) {
  try {
    // Try synchronous access first
    if (PureStorage.jsi.isAvailable) {
      return PureStorage.getItemSync(key) ?? defaultValue;
    }
  } catch (error) {
    console.warn('Sync storage access failed:', error);
  }
  
  // Fall back to async (will return a promise)
  return PureStorage.getItem(key, { default: defaultValue });
}

// Usage:
const value = PureStorage.jsi.isAvailable 
  ? getStoredValue('myKey', 'default') 
  : await getStoredValue('myKey', 'default');
```

### Namespaced Storage Instances

```javascript
// Create a storage instance with a specific namespace
const userStorage = PureStorage.getInstance('user');
const settingsStorage = PureStorage.getInstance('settings', { encrypted: true });

// Use instances with their own separate storage
await userStorage.setItem('name', 'John');
await settingsStorage.setItem('theme', 'dark');

// Different namespaces don't interfere with each other
const userName = await userStorage.getItem('name');  // Returns 'John'
const defaultName = await PureStorage.getItem('name');  // Returns null
```

### Cache Configuration

```javascript
// Configure the cache for the default instance
PureStorage.configureCache({
  maxSize: 200,  // Maximum items in cache
  ttl: 300000    // Time to live: 5 minutes (in milliseconds)
});

// Disable cache
PureStorage.configureCache(false);

// Skip cache for a specific operation
const value = await PureStorage.getItem('largeObject', { skipCache: true });

// Get cache statistics
const stats = PureStorage.getCacheStats();
console.log('Cache hit rate:', stats.hitRate);
```

### Event Listeners

```javascript
// Listen to all storage changes
const unsubscribe = PureStorage.onChange(event => {
  console.log(`Storage ${event.type} event:`, event.key, event.value);
});

// Listen to changes for a specific key
const keyUnsubscribe = PureStorage.onKeyChange('userId', event => {
  console.log(`User ID changed to: ${event.value}`);
});

// Later, remove the listeners
unsubscribe();
keyUnsubscribe();
```

### Error Handling

```javascript
import { StorageError, KeyError } from 'react-native-pure-storage';

try {
  await PureStorage.setItem('user', userData);
} catch (error) {
  if (error instanceof KeyError) {
    console.error('Invalid key:', error.message);
  } else if (error instanceof StorageError) {
    console.error(`Storage error (${error.code}):`, error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## API Reference

### Core Methods

- `setItem(key, value, options)`: Store a value for a given key
- `getItem(key, options)`: Get a value for a given key
- `removeItem(key)`: Remove a value for a given key
- `clear()`: Clear all stored values
- `getAllKeys()`: Get all keys stored in the storage
- `multiSet(keyValuePairs, options)`: Set multiple key-value pairs at once
- `multiGet(keys, options)`: Get multiple values for a set of keys
- `multiRemove(keys)`: Remove multiple keys and their values
- `hasKey(key, options)`: Check if a key exists in storage

### Synchronous Methods

- `setItemSync(key, value, options)`: Synchronously store a value
- `getItemSync(key, options)`: Synchronously get a value

### JSI Methods (When Available)

Available via the `jsi` property:

- `isAvailable`: Whether JSI synchronous access is available
- `getAllKeysSync()`: Get all keys synchronously
- `clearSync()`: Clear all storage synchronously
- `removeItemSync(key)`: Remove a key synchronously
- `hasKeySync(key)`: Check if a key exists synchronously
- `multiSetSync(keyValuePairs, options)`: Set multiple key-value pairs synchronously
- `multiGetSync(keys, options)`: Get multiple key-value pairs synchronously
- `multiRemoveSync(keys)`: Remove multiple keys synchronously

### Instance Management

- `getInstance(namespace, options)`: Create a storage instance with a namespace

### Cache Management

- `configureCache(options)`: Configure the cache settings
- `getCacheStats()`: Get cache statistics
- `resetCacheStats()`: Reset cache statistics

### Event Handling

- `onChange(callback)`: Add a listener for storage changes
- `onKeyChange(key, callback)`: Add a listener for changes to a specific key

### Options

#### Storage Options

- `encrypted`: Whether to encrypt the data (default: false)
- `skipCache`: Skip the in-memory cache for this operation (default: false)
- `default`: Default value to return if the key doesn't exist

#### Cache Options

- `maxSize`: Maximum number of items to keep in cache
- `ttl`: Time to live in milliseconds

#### Storage Instance Options

- `namespace`: Namespace for the storage instance
- `encrypted`: Whether to encrypt all data by default
- `cache`: Cache configuration or false to disable

## Error Types

- `StorageError`: Base error class for storage-related errors
- `KeyError`: Error for invalid keys
- `EncryptionError`: Error for encryption/decryption operations
- `SerializationError`: Error for JSON serialization/deserialization
- `SyncOperationError`: Error for when synchronous operations aren't available

## License

MIT 