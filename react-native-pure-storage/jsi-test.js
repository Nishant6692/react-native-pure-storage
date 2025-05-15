/**
 * JSI Testing Utility for PureStorage
 * 
 * Run this in your React Native app to verify the JSI implementation is working correctly.
 */

import PureStorage from 'react-native-pure-storage';

export function testJSIImplementation() {
  console.log('\n=== PureStorage JSI Test ===\n');
  
  // Test JSI availability
  console.log(`JSI Available: ${PureStorage.jsi.isAvailable ? 'Yes ✅' : 'No ❌'}`);
  
  if (!PureStorage.jsi.isAvailable) {
    console.log('JSI is not available. Skipping tests.');
    console.log('This could be because:');
    console.log('- The platform does not support JSI');
    console.log('- The JSI module is not properly initialized');
    console.log('- There was an error during JSI initialization');
    return;
  }
  
  // Test methods
  try {
    // Setup
    console.log('\n--- Setting up test data ---');
    const testKey = '__jsi_test_key__';
    const testData = { test: true, timestamp: Date.now() };
    
    // Test setItem
    try {
      PureStorage.setItemSync(testKey, testData);
      console.log('setItemSync: ✅');
    } catch (error) {
      console.log(`setItemSync: ❌ - ${error.message}`);
    }
    
    // Test getItem
    try {
      const value = PureStorage.getItemSync(testKey);
      console.log('getItemSync: ' + (
        value && value.test === true ? '✅' : `❌ - Unexpected value: ${JSON.stringify(value)}`
      ));
    } catch (error) {
      console.log(`getItemSync: ❌ - ${error.message}`);
    }
    
    // Test hasKey
    try {
      const hasKey = PureStorage.hasKeySync(testKey);
      console.log('hasKeySync: ' + (hasKey ? '✅' : '❌ - Key not found'));
    } catch (error) {
      console.log(`hasKeySync: ❌ - ${error.message}`);
    }
    
    // Test getAllKeys
    try {
      const keys = PureStorage.getAllKeysSync();
      console.log('getAllKeysSync: ' + (
        Array.isArray(keys) ? '✅' : `❌ - Unexpected result: ${JSON.stringify(keys)}`
      ));
      console.log(`  Found ${keys.length} keys`);
    } catch (error) {
      console.log(`getAllKeysSync: ❌ - ${error.message}`);
    }
    
    // Test removeItem
    try {
      PureStorage.removeItemSync(testKey);
      const exists = PureStorage.hasKeySync(testKey);
      console.log('removeItemSync: ' + (!exists ? '✅' : '❌ - Key still exists'));
    } catch (error) {
      console.log(`removeItemSync: ❌ - ${error.message}`);
    }
    
    // Test multi operations
    console.log('\n--- Testing batch operations ---');
    
    // multiSet
    try {
      PureStorage.multiSetSync({
        '__jsi_test_1__': 'value1',
        '__jsi_test_2__': 'value2',
        '__jsi_test_3__': 'value3',
      });
      console.log('multiSetSync: ✅');
    } catch (error) {
      console.log(`multiSetSync: ❌ - ${error.message}`);
    }
    
    // multiGet
    try {
      const values = PureStorage.multiGetSync(['__jsi_test_1__', '__jsi_test_2__', '__jsi_test_3__']);
      const success = values && 
        values['__jsi_test_1__'] === 'value1' && 
        values['__jsi_test_2__'] === 'value2' && 
        values['__jsi_test_3__'] === 'value3';
      
      console.log('multiGetSync: ' + (success ? '✅' : `❌ - Unexpected results: ${JSON.stringify(values)}`));
    } catch (error) {
      console.log(`multiGetSync: ❌ - ${error.message}`);
    }
    
    // multiRemove
    try {
      PureStorage.multiRemoveSync(['__jsi_test_1__', '__jsi_test_2__', '__jsi_test_3__']);
      
      const key1Exists = PureStorage.hasKeySync('__jsi_test_1__');
      const key2Exists = PureStorage.hasKeySync('__jsi_test_2__');
      const key3Exists = PureStorage.hasKeySync('__jsi_test_3__');
      
      const success = !key1Exists && !key2Exists && !key3Exists;
      console.log('multiRemoveSync: ' + (success ? '✅' : '❌ - Keys still exist'));
    } catch (error) {
      console.log(`multiRemoveSync: ❌ - ${error.message}`);
    }
    
    // Performance test
    console.log('\n--- Performance comparison ---');
    
    // Prepare test data
    const iterations = 100;
    const testKeyPrefix = '__perf_test_';
    
    // Sync write test
    console.log(`Writing ${iterations} items synchronously...`);
    const syncWriteStart = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      PureStorage.setItemSync(`${testKeyPrefix}${i}`, { value: i });
    }
    
    const syncWriteTime = Date.now() - syncWriteStart;
    console.log(`Sync write time: ${syncWriteTime}ms (${iterations/syncWriteTime*1000} ops/sec)`);
    
    // Sync read test
    console.log(`Reading ${iterations} items synchronously...`);
    const syncReadStart = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      PureStorage.getItemSync(`${testKeyPrefix}${i}`);
    }
    
    const syncReadTime = Date.now() - syncReadStart;
    console.log(`Sync read time: ${syncReadTime}ms (${iterations/syncReadTime*1000} ops/sec)`);
    
    // Clean up
    console.log('\n--- Cleaning up ---');
    
    try {
      // Create array of test keys
      const testKeys = Array.from({ length: iterations }, (_, i) => `${testKeyPrefix}${i}`);
      // Remove them all at once
      PureStorage.multiRemoveSync(testKeys);
      console.log('Cleanup: ✅');
    } catch (error) {
      console.log(`Cleanup: ❌ - ${error.message}`);
    }
    
    console.log('\n=== JSI Tests Completed ===\n');
  } catch (error) {
    console.log(`\n❌ Error running JSI tests: ${error.message}\n`);
  }
}

// Uncomment to run the test automatically when imported:
// testJSIImplementation(); 