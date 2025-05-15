/**
 * Example of using the PureStorage JSI Synchronous API
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import PureStorage from 'react-native-pure-storage';

export default function JSIExample() {
  const [jsiAvailable, setJsiAvailable] = useState(false);
  const [syncResults, setSyncResults] = useState([]);
  const [asyncResults, setAsyncResults] = useState([]);

  useEffect(() => {
    // Check if JSI is available when component mounts
    setJsiAvailable(PureStorage.jsi.isAvailable);
  }, []);

  // Helper to add a log entry
  const addSyncLog = (message) => {
    setSyncResults(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const addAsyncLog = (message) => {
    setAsyncResults(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Example of using sync methods
  const runSyncExample = () => {
    if (!jsiAvailable) {
      addSyncLog('JSI not available, sync operations will throw errors');
      return;
    }

    try {
      // Clear storage to start fresh
      addSyncLog('Clearing storage...');
      const clearResult = PureStorage.clearSync();
      addSyncLog(`Clear result: ${clearResult}`);

      // Set item
      addSyncLog('Setting items...');
      PureStorage.setItemSync('syncCounter', 1);
      PureStorage.setItemSync('syncObject', { name: 'Test', syncTime: Date.now() });
      PureStorage.setItemSync('syncSecret', 'password123', { encrypted: true });

      // Get item
      const counter = PureStorage.getItemSync('syncCounter');
      addSyncLog(`Retrieved counter: ${counter}`);

      const obj = PureStorage.getItemSync('syncObject');
      addSyncLog(`Retrieved object: ${JSON.stringify(obj)}`);

      const secret = PureStorage.getItemSync('syncSecret');
      addSyncLog(`Retrieved secret: ${secret}`);

      // Check if key exists
      const hasKey = PureStorage.hasKeySync('syncCounter');
      addSyncLog(`Has 'syncCounter': ${hasKey}`);

      // Get all keys
      const allKeys = PureStorage.getAllKeysSync();
      addSyncLog(`All keys: ${JSON.stringify(allKeys)}`);

      // Multi-operations
      PureStorage.multiSetSync({
        'multi1': 'value1',
        'multi2': 'value2',
        'multi3': 'value3',
      });

      const multiResult = PureStorage.multiGetSync(['multi1', 'multi2', 'multi3', 'nonexistent']);
      addSyncLog(`Multi-get results: ${JSON.stringify(multiResult)}`);

      // Remove operations
      PureStorage.removeItemSync('syncCounter');
      const counterAfterRemove = PureStorage.getItemSync('syncCounter');
      addSyncLog(`Counter after remove: ${counterAfterRemove === null ? 'null' : counterAfterRemove}`);

      PureStorage.multiRemoveSync(['multi1', 'multi3']);
      const remainingKeys = PureStorage.getAllKeysSync();
      addSyncLog(`Remaining keys after multi-remove: ${JSON.stringify(remainingKeys)}`);

    } catch (error) {
      addSyncLog(`Error: ${error.message}`);
    }
  };

  // Example of using async methods (for comparison)
  const runAsyncExample = async () => {
    try {
      // Clear storage to start fresh
      addAsyncLog('Clearing storage...');
      const clearResult = await PureStorage.clear();
      addAsyncLog(`Clear result: ${clearResult}`);

      // Set item
      addAsyncLog('Setting items...');
      await PureStorage.setItem('asyncCounter', 1);
      await PureStorage.setItem('asyncObject', { name: 'Test', asyncTime: Date.now() });
      await PureStorage.setItem('asyncSecret', 'password123', { encrypted: true });

      // Get item
      const counter = await PureStorage.getItem('asyncCounter');
      addAsyncLog(`Retrieved counter: ${counter}`);

      const obj = await PureStorage.getItem('asyncObject');
      addAsyncLog(`Retrieved object: ${JSON.stringify(obj)}`);

      const secret = await PureStorage.getItem('asyncSecret');
      addAsyncLog(`Retrieved secret: ${secret}`);

      // Check if key exists
      const hasKey = await PureStorage.hasKey('asyncCounter');
      addAsyncLog(`Has 'asyncCounter': ${hasKey}`);

      // Get all keys
      const allKeys = await PureStorage.getAllKeys();
      addAsyncLog(`All keys: ${JSON.stringify(allKeys)}`);

      // Multi-operations
      await PureStorage.multiSet({
        'multi1': 'value1', 
        'multi2': 'value2',
        'multi3': 'value3',
      });

      const multiResult = await PureStorage.multiGet(['multi1', 'multi2', 'multi3', 'nonexistent']);
      addAsyncLog(`Multi-get results: ${JSON.stringify(multiResult)}`);

      // Remove operations
      await PureStorage.removeItem('asyncCounter');
      const counterAfterRemove = await PureStorage.getItem('asyncCounter');
      addAsyncLog(`Counter after remove: ${counterAfterRemove === null ? 'null' : counterAfterRemove}`);

      await PureStorage.multiRemove(['multi1', 'multi3']);
      const remainingKeys = await PureStorage.getAllKeys();
      addAsyncLog(`Remaining keys after multi-remove: ${JSON.stringify(remainingKeys)}`);
      
    } catch (error) {
      addAsyncLog(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PureStorage JSI Example</Text>
      <Text style={styles.status}>
        JSI Status: {jsiAvailable ? 'Available ✅' : 'Not Available ❌'}
      </Text>

      <View style={styles.buttonContainer}>
        <Button 
          title="Run Sync Example" 
          onPress={runSyncExample} 
          color="#007AFF"
        />
        <Button 
          title="Run Async Example" 
          onPress={runAsyncExample} 
          color="#4CD964"
        />
      </View>

      <View style={styles.resultContainer}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Sync Results:</Text>
          <ScrollView style={styles.logContainer}>
            {syncResults.map((log, index) => (
              <Text key={`sync-${index}`} style={styles.logLine}>{log}</Text>
            ))}
          </ScrollView>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Async Results:</Text>
          <ScrollView style={styles.logContainer}>
            {asyncResults.map((log, index) => (
              <Text key={`async-${index}`} style={styles.logLine}>{log}</Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  resultContainer: {
    flex: 1, 
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
  },
  logLine: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
}); 