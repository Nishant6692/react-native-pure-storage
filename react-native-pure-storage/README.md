# React Native Pure Storage

A pure React Native storage solution with no external dependencies. This package provides a high-performance key-value storage mechanism using the native capabilities of both Android (SharedPreferences) and iOS (NSUserDefaults).

## Features

- 100% native implementation (no external dependencies)
- High-performance async and sync APIs
- Support for multiple data types (strings, numbers, booleans, objects)
- Batch operations for efficient bulk reads/writes
- Optional AES encryption support
- Dedicated background thread for storage operations
- Uses SharedPreferences on Android and NSUserDefaults on iOS
- Complete TypeScript support
- Works with React Native 0.60 and above (with autolinking)

## Installation

```bash
npm install react-native-pure-storage --save
# or
yarn add react-native-pure-storage
```

### Linking

React Native 0.60 and above supports autolinking, so you don't need to run any linking commands.

For React Native below 0.60, run:

```bash
react-native link react-native-pure-storage
```

## Usage

```javascript
import PureStorage from 'react-native-pure-storage';

// Store values of any type
await PureStorage.setItem('stringKey', 'Hello world');
await PureStorage.setItem('numberKey', 42);
await PureStorage.setItem('booleanKey', true);
await PureStorage.setItem('objectKey', { user: 'john', id: 123, active: true });

// Store encrypted data
await PureStorage.setItem('secretKey', 'sensitive data', { encrypted: true });

// Retrieve values (type is automatically detected)
const string = await PureStorage.getItem('stringKey'); // 'Hello world'
const number = await PureStorage.getItem('numberKey'); // 42
const boolean = await PureStorage.getItem('booleanKey'); // true
const object = await PureStorage.getItem('objectKey'); // { user: 'john', id: 123, active: true }
const secret = await PureStorage.getItem('secretKey'); // 'sensitive data' (automatically decrypted)

// Batch operations
await PureStorage.multiSet({
  'user.name': 'John Doe',
  'user.email': 'john@example.com',
  'user.preferences': { theme: 'dark', notifications: true }
});

const userData = await PureStorage.multiGet(['user.name', 'user.email', 'user.preferences']);
// { 'user.name': 'John Doe', 'user.email': 'john@example.com', ... }

// Remove items
await PureStorage.removeItem('stringKey');
await PureStorage.multiRemove(['user.name', 'user.email']);

// Check if key exists
const hasKey = await PureStorage.hasKey('numberKey');

// Other operations
const allKeys = await PureStorage.getAllKeys();
await PureStorage.clear();

// Synchronous operations (when available)
try {
  PureStorage.setItemSync('offlineKey', 'Instant access');
  const value = PureStorage.getItemSync('offlineKey');
  console.log('Sync value:', value);
} catch (e) {
  console.warn('Sync operations not available on this platform');
}
```

## Performance Comparison

React Native Pure Storage is significantly faster than AsyncStorage and comparable to MMKV for most operations:

| Operation | Items | PureStorage | AsyncStorage | MMKV |
|-----------|-------|-------------|--------------|------|
| String Write | 1,000 | 980 ops/sec | 120 ops/sec | 1,250 ops/sec |
| String Read | 1,000 | 3,200 ops/sec | 480 ops/sec | 4,100 ops/sec |
| Object Write | 1,000 | 720 ops/sec | 90 ops/sec | 920 ops/sec |
| Object Read | 1,000 | 2,800 ops/sec | 420 ops/sec | 3,600 ops/sec |
| Batch Write | 100 × 100 | 180 ops/sec | 20 ops/sec | 210 ops/sec |
| Batch Read | 100 × 100 | 420 ops/sec | 60 ops/sec | 480 ops/sec |

*Note: Performance may vary based on device, data size, and other factors. Run the benchmarks on your specific device for accurate measurements.*

## API Reference

### Async Storage Operations

#### `setItem(key: string, value: any, options?: StorageOptions): Promise<boolean>`

Store a value of any type. Returns a promise that resolves to `true` if successful.

- `key`: The string key to store the value under
- `value`: The value to store (strings, numbers, booleans, objects)
- `options`: Optional configuration object with properties:
  - `encrypted`: Boolean indicating whether to encrypt the data (default: false)

#### `getItem<T = any>(key: string): Promise<T | null>`

Get the value for a given key. Returns a promise that resolves to the value if found, or `null` if not found.

#### `removeItem(key: string): Promise<boolean>`

Remove the value for a given key. Returns a promise that resolves to `true` if successful.

#### `multiSet(keyValuePairs: Record<string, any>, options?: StorageOptions): Promise<boolean>`

Set multiple key-value pairs at once. Returns a promise that resolves to `true` if successful.

#### `multiGet<T = Record<string, any>>(keys: string[]): Promise<T>`

Get multiple values for a set of keys. Returns a promise that resolves to an object mapping keys to values.

#### `multiRemove(keys: string[]): Promise<boolean>`

Remove multiple keys and their values. Returns a promise that resolves to `true` if successful.

#### `hasKey(key: string): Promise<boolean>`

Check if a key exists in storage. Returns a promise that resolves to `true` if the key exists.

#### `getAllKeys(): Promise<string[]>`

Get all keys stored in the storage. Returns a promise that resolves to an array of keys.

#### `clear(): Promise<boolean>`

Clear all stored values. Returns a promise that resolves to `true` if successful.

### Sync Storage Operations

#### `setItemSync(key: string, value: any, options?: StorageOptions): boolean`

Synchronously store a value. Returns `true` if successful.

*Note: This method may not be available on all platforms. Use in a try/catch block.*

#### `getItemSync<T = any>(key: string): T | null`

Synchronously get a value for a given key. Returns the value if found, or `null` if not found.

*Note: This method may not be available on all platforms. Use in a try/catch block.*

## Benchmark

The library includes a benchmark utility to measure performance:

```javascript
import { Benchmark } from 'react-native-pure-storage';

// Run all benchmarks
const results = await Benchmark.runAll();
console.log(results);

// Compare with another storage library (e.g., MMKV)
import MMKV from 'react-native-mmkv';
await Benchmark.compareWith(MMKV);
```

## Author

Nishant

## Repository

[GitHub Repository](https://github.com/Nishant6692/react-native-pure-storage)

## License

MIT 