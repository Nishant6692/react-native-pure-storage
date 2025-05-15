# React Native Pure Storage

A pure React Native storage solution with no external dependencies. This package provides a simple key-value storage mechanism using the native capabilities of both Android (SharedPreferences) and iOS (NSUserDefaults).

## Features

- 100% native implementation (no external dependencies)
- Uses SharedPreferences on Android and NSUserDefaults on iOS
- Simple promise-based API
- TypeScript definitions included
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

// Store a value
PureStorage.setItem('key', 'value')
  .then(success => console.log('Value stored successfully', success))
  .catch(error => console.error('Error storing value', error));

// Get a value
PureStorage.getItem('key')
  .then(value => console.log('Retrieved value:', value))
  .catch(error => console.error('Error retrieving value', error));

// Remove a value
PureStorage.removeItem('key')
  .then(success => console.log('Value removed successfully', success))
  .catch(error => console.error('Error removing value', error));

// Clear all values
PureStorage.clear()
  .then(success => console.log('Storage cleared successfully', success))
  .catch(error => console.error('Error clearing storage', error));

// Get all keys
PureStorage.getAllKeys()
  .then(keys => console.log('All keys:', keys))
  .catch(error => console.error('Error getting all keys', error));
```

### With async/await

```javascript
async function exampleUsage() {
  try {
    // Store a value
    await PureStorage.setItem('username', 'john_doe');
    
    // Get a value
    const username = await PureStorage.getItem('username');
    console.log('Username:', username);
    
    // Remove a value
    await PureStorage.removeItem('username');
    
    // Check if removed
    const removedUsername = await PureStorage.getItem('username');
    console.log('Removed username:', removedUsername); // Should be null
    
    // Store multiple values
    await PureStorage.setItem('user_id', '12345');
    await PureStorage.setItem('user_email', 'john@example.com');
    
    // Get all keys
    const allKeys = await PureStorage.getAllKeys();
    console.log('All keys:', allKeys);
    
    // Clear everything
    await PureStorage.clear();
  } catch (error) {
    console.error('Error in storage operations:', error);
  }
}
```

## API

### `setItem(key: string, value: string): Promise<boolean>`

Stores a string value for the given key. Returns a promise that resolves to `true` if successful.

### `getItem(key: string): Promise<string | null>`

Gets the value for the given key. Returns a promise that resolves to the value if found, or `null` if not found.

### `removeItem(key: string): Promise<boolean>`

Removes the value for the given key. Returns a promise that resolves to `true` if successful.

### `clear(): Promise<boolean>`

Clears all values stored by the module. Returns a promise that resolves to `true` if successful.

### `getAllKeys(): Promise<string[]>`

Gets all keys stored by the module. Returns a promise that resolves to an array of keys.

## Example App

See the [example](./example) directory for a working example of React Native Pure Storage.

To run the example app:

```bash
cd example
npm install
# For iOS
npx pod-install
npx react-native run-ios
# For Android
npx react-native run-android
```

## Author

Nishant

## Repository

[GitHub Repository](https://github.com/Nishant6692/react-native-pure-storage)

## License

MIT 