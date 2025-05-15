# React Native Pure Storage Example

This is an example app demonstrating the usage of `react-native-pure-storage` package, a pure React Native storage solution with no external dependencies.

## Installation

1. First, install the dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

2. For iOS, install CocoaPods dependencies:
   ```
   cd ios && pod install && cd ..
   ```

## Running the Example

### Android

```
npm run android
```
or
```
yarn android
```

### iOS

```
npm run ios
```
or
```
yarn ios
```

## Features Demonstrated

This example app demonstrates the following features of the `react-native-pure-storage` package:

- Storing key-value pairs
- Retrieving values by key
- Removing specific values
- Clearing all stored values
- Displaying a list of all stored items

## App Structure

The example app provides a simple UI with:

- Input fields to specify key and value
- Buttons to save, get, remove items, and clear all storage
- A scrollable list showing all saved items

## Troubleshooting

If you encounter any issues:

1. Make sure you have followed the React Native setup instructions for your platform
2. Verify that you have linked the native modules correctly (React Native 0.60+ uses autolinking)
3. Clean and rebuild your project
   - For Android: `cd android && ./gradlew clean && cd ..`
   - For iOS: `cd ios && rm -rf build/ && cd ..`

## Contributing

If you find any issues, please report them in the main repository. 