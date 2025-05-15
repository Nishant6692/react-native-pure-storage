/**
 * Binary Storage Test Utility for PureStorage
 * 
 * Run this in your React Native app to verify binary storage implementation is working correctly.
 */

import PureStorage from 'react-native-pure-storage';

export function testBinaryStorage() {
  console.log('\n=== PureStorage Binary Storage Test ===\n');
  
  // Check JSI availability
  const jsiAvailable = PureStorage.jsi.isAvailable;
  console.log(`JSI Available: ${jsiAvailable ? 'Yes ✅' : 'No ❌'}`);
  
  // Test 1: Basic binary storage
  console.log('\n--- Test 1: Basic Binary Storage ---');
  try {
    // Create a small binary array
    const testData = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    console.log(`Created test data: Uint8Array(${testData.length} bytes)`);
    
    // Async storage test
    console.log('\nAsync Storage Test:');
    (async () => {
      try {
        // Store the binary data
        console.log('Storing binary data...');
        const setSuccess = await PureStorage.setBinaryItem('binaryTest', testData);
        console.log(`Storage result: ${setSuccess ? 'Success ✅' : 'Failed ❌'}`);
        
        // Retrieve the binary data
        console.log('Retrieving binary data...');
        const retrievedData = await PureStorage.getBinaryItem('binaryTest');
        
        if (!retrievedData) {
          console.log('Retrieved data is null ❌');
          return;
        }
        
        console.log(`Retrieved data: ${retrievedData.constructor.name}(${retrievedData.length} bytes)`);
        
        // Compare original and retrieved data
        let match = retrievedData.length === testData.length;
        if (match) {
          for (let i = 0; i < testData.length; i++) {
            if (testData[i] !== retrievedData[i]) {
              match = false;
              break;
            }
          }
        }
        
        console.log(`Data integrity check: ${match ? 'Passed ✅' : 'Failed ❌'}`);
        
        // Test with different return type
        console.log('\nTesting different return types:');
        const asArrayBuffer = await PureStorage.getBinaryItem('binaryTest', { returnType: 'ArrayBuffer' });
        console.log(`Retrieved as ArrayBuffer: ${asArrayBuffer.constructor.name}, byteLength: ${asArrayBuffer.byteLength}`);
        
        // Cleanup
        await PureStorage.removeItem('binaryTest');
        console.log('Cleaned up test data');
      } catch (error) {
        console.log(`❌ Error in async test: ${error.message}`);
      }
    })();
    
    // Sync storage test (if JSI is available)
    if (jsiAvailable) {
      console.log('\nSync Storage Test:');
      try {
        // Store the binary data synchronously
        console.log('Storing binary data synchronously...');
        const setSyncSuccess = PureStorage.setBinaryItemSync('binarySyncTest', testData);
        console.log(`Storage result: ${setSyncSuccess ? 'Success ✅' : 'Failed ❌'}`);
        
        // Retrieve the binary data synchronously
        console.log('Retrieving binary data synchronously...');
        const retrievedSyncData = PureStorage.getBinaryItemSync('binarySyncTest');
        
        if (!retrievedSyncData) {
          console.log('Retrieved data is null ❌');
          return;
        }
        
        console.log(`Retrieved data: ${retrievedSyncData.constructor.name}(${retrievedSyncData.length} bytes)`);
        
        // Compare original and retrieved data
        let syncMatch = retrievedSyncData.length === testData.length;
        if (syncMatch) {
          for (let i = 0; i < testData.length; i++) {
            if (testData[i] !== retrievedSyncData[i]) {
              syncMatch = false;
              break;
            }
          }
        }
        
        console.log(`Data integrity check: ${syncMatch ? 'Passed ✅' : 'Failed ❌'}`);
        
        // Cleanup
        PureStorage.removeItemSync('binarySyncTest');
        console.log('Cleaned up test data');
      } catch (error) {
        console.log(`❌ Error in sync test: ${error.message}`);
      }
    } else {
      console.log('\nSkipping sync tests (JSI not available)');
    }
  } catch (error) {
    console.log(`❌ Error in binary storage test: ${error.message}`);
  }
  
  // Test 2: Large binary data
  console.log('\n--- Test 2: Large Binary Data ---');
  try {
    // Create a larger binary array (1MB)
    const size = 1024 * 1024; // 1MB
    const largeData = new Uint8Array(size);
    
    // Fill with pattern data
    for (let i = 0; i < size; i++) {
      largeData[i] = i % 256; // Cycle through 0-255
    }
    
    console.log(`Created large test data: Uint8Array(${largeData.length} bytes)`);
    
    // Async storage test
    console.log('\nAsync Storage Test:');
    (async () => {
      const startTime = performance.now();
      try {
        // Store the large binary data
        console.log('Storing large binary data...');
        const setSuccess = await PureStorage.setBinaryItem('largeBinaryTest', largeData);
        const setTime = performance.now() - startTime;
        console.log(`Storage result: ${setSuccess ? 'Success ✅' : 'Failed ❌'}`);
        console.log(`Storage time: ${setTime.toFixed(2)}ms`);
        
        // Retrieve the large binary data
        console.log('Retrieving large binary data...');
        const retrieveStartTime = performance.now();
        const retrievedData = await PureStorage.getBinaryItem('largeBinaryTest');
        const retrieveTime = performance.now() - retrieveStartTime;
        
        if (!retrievedData) {
          console.log('Retrieved data is null ❌');
          return;
        }
        
        console.log(`Retrieved data: ${retrievedData.constructor.name}(${retrievedData.length} bytes)`);
        console.log(`Retrieval time: ${retrieveTime.toFixed(2)}ms`);
        
        // Check first few bytes and some random spots
        console.log('Checking data integrity (sampling)...');
        let checksCorrect = 0;
        const samples = 20;
        
        // Check first 10 bytes
        for (let i = 0; i < 10; i++) {
          if (retrievedData[i] === largeData[i]) checksCorrect++;
        }
        
        // Check 10 random positions
        for (let i = 0; i < 10; i++) {
          const pos = Math.floor(Math.random() * size);
          if (retrievedData[pos] === largeData[pos]) checksCorrect++;
        }
        
        console.log(`Data integrity check: ${checksCorrect === samples ? 'Passed ✅' : `Failed (${checksCorrect}/${samples}) ❌`}`);
        
        // Cleanup
        await PureStorage.removeItem('largeBinaryTest');
        console.log('Cleaned up large test data');
      } catch (error) {
        console.log(`❌ Error in large data test: ${error.message}`);
      }
    })();
    
    // Sync storage test (if JSI is available)
    if (jsiAvailable) {
      console.log('\nSync Storage Test (Large Data):');
      try {
        // Store the large binary data synchronously
        console.log('Storing large binary data synchronously...');
        const syncStartTime = performance.now();
        const setSyncSuccess = PureStorage.setBinaryItemSync('largeBinarySyncTest', largeData);
        const setSyncTime = performance.now() - syncStartTime;
        
        console.log(`Storage result: ${setSyncSuccess ? 'Success ✅' : 'Failed ❌'}`);
        console.log(`Storage time: ${setSyncTime.toFixed(2)}ms`);
        
        // Retrieve the large binary data synchronously
        console.log('Retrieving large binary data synchronously...');
        const retrieveSyncStartTime = performance.now();
        const retrievedSyncData = PureStorage.getBinaryItemSync('largeBinarySyncTest');
        const retrieveSyncTime = performance.now() - retrieveSyncStartTime;
        
        if (!retrievedSyncData) {
          console.log('Retrieved data is null ❌');
          return;
        }
        
        console.log(`Retrieved data: ${retrievedSyncData.constructor.name}(${retrievedSyncData.length} bytes)`);
        console.log(`Retrieval time: ${retrieveSyncTime.toFixed(2)}ms`);
        
        // Check first few bytes and some random spots
        console.log('Checking data integrity (sampling)...');
        let syncChecksCorrect = 0;
        const samples = 20;
        
        // Check first 10 bytes
        for (let i = 0; i < 10; i++) {
          if (retrievedSyncData[i] === largeData[i]) syncChecksCorrect++;
        }
        
        // Check 10 random positions
        for (let i = 0; i < 10; i++) {
          const pos = Math.floor(Math.random() * size);
          if (retrievedSyncData[pos] === largeData[pos]) syncChecksCorrect++;
        }
        
        console.log(`Data integrity check: ${syncChecksCorrect === samples ? 'Passed ✅' : `Failed (${syncChecksCorrect}/${samples}) ❌`}`);
        
        // Cleanup
        PureStorage.removeItemSync('largeBinarySyncTest');
        console.log('Cleaned up large test data');
      } catch (error) {
        console.log(`❌ Error in large data sync test: ${error.message}`);
      }
    } else {
      console.log('\nSkipping sync tests for large data (JSI not available)');
    }
  } catch (error) {
    console.log(`❌ Error in large binary storage test: ${error.message}`);
  }
  
  // Test 3: Different binary types
  console.log('\n--- Test 3: Different Binary Types ---');
  try {
    // Create different binary types
    const types = [
      { name: 'ArrayBuffer', data: new ArrayBuffer(16) },
      { name: 'Int8Array', data: new Int8Array([-128, -64, -32, 0, 32, 64, 127]) },
      { name: 'Uint16Array', data: new Uint16Array([0, 256, 512, 1024, 65535]) },
      { name: 'Int32Array', data: new Int32Array([-2147483648, 0, 2147483647]) },
      { name: 'Float32Array', data: new Float32Array([0.0, 1.5, -1.5, 3.14159, -3.14159]) },
      { name: 'Float64Array', data: new Float64Array([Number.MIN_VALUE, Number.MAX_VALUE, Math.PI]) }
    ];
    
    // Test async storage of different types
    console.log('\nAsync Storage Test:');
    (async () => {
      for (const type of types) {
        try {
          console.log(`\nTesting ${type.name}:`);
          
          // Store the typed data
          console.log(`Storing ${type.name} data...`);
          const key = `binaryType_${type.name}`;
          await PureStorage.setBinaryItem(key, type.data);
          
          // Retrieve the typed data
          console.log(`Retrieving ${type.name} data...`);
          const retrievedData = await PureStorage.getBinaryItem(key, { returnType: type.name });
          
          console.log(`Retrieved type: ${retrievedData.constructor.name}`);
          console.log(`Length/Size: ${retrievedData.length || retrievedData.byteLength}`);
          
          // Show sample values for verification
          if (retrievedData.length > 0 || retrievedData.byteLength > 0) {
            const sample = Array.from(
              retrievedData instanceof ArrayBuffer 
                ? new Uint8Array(retrievedData).slice(0, 3) 
                : retrievedData.slice(0, 3)
            );
            console.log(`Sample values: [${sample.join(', ')}${retrievedData.length > 3 ? ', ...' : ''}]`);
          }
          
          // Cleanup
          await PureStorage.removeItem(key);
        } catch (error) {
          console.log(`❌ Error testing ${type.name}: ${error.message}`);
        }
      }
    })();
    
    // Test sync storage of different types (if JSI is available)
    if (jsiAvailable) {
      console.log('\nSync Storage Test:');
      for (const type of types) {
        try {
          console.log(`\nTesting ${type.name}:`);
          
          // Store the typed data synchronously
          console.log(`Storing ${type.name} data synchronously...`);
          const key = `syncBinaryType_${type.name}`;
          PureStorage.setBinaryItemSync(key, type.data);
          
          // Retrieve the typed data synchronously
          console.log(`Retrieving ${type.name} data synchronously...`);
          const retrievedData = PureStorage.getBinaryItemSync(key, { returnType: type.name });
          
          console.log(`Retrieved type: ${retrievedData.constructor.name}`);
          console.log(`Length/Size: ${retrievedData.length || retrievedData.byteLength}`);
          
          // Show sample values for verification
          if (retrievedData.length > 0 || retrievedData.byteLength > 0) {
            const sample = Array.from(
              retrievedData instanceof ArrayBuffer 
                ? new Uint8Array(retrievedData).slice(0, 3) 
                : retrievedData.slice(0, 3)
            );
            console.log(`Sample values: [${sample.join(', ')}${retrievedData.length > 3 ? ', ...' : ''}]`);
          }
          
          // Cleanup
          PureStorage.removeItemSync(key);
        } catch (error) {
          console.log(`❌ Error testing ${type.name} synchronously: ${error.message}`);
        }
      }
    } else {
      console.log('\nSkipping sync tests for different binary types (JSI not available)');
    }
  } catch (error) {
    console.log(`❌ Error in binary types test: ${error.message}`);
  }
  
  console.log('\n=== Binary Storage Tests Completed ===\n');
}

// Uncomment to run tests automatically when imported:
// testBinaryStorage(); 