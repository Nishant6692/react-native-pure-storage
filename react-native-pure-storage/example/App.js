import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';

import PureStorage from 'react-native-pure-storage';

const ExampleApp = () => {
  const [key, setKey] = useState('test_key');
  const [value, setValue] = useState('Test value');
  const [storedValue, setStoredValue] = useState(null);
  const [encrypted, setEncrypted] = useState(false);
  const [useCache, setUseCache] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [instanceName, setInstanceName] = useState('custom');
  const [currentNamespace, setCurrentNamespace] = useState('default');
  
  // Create a custom storage instance
  const [customInstance, setCustomInstance] = useState(null);
  
  // Event notifications
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    // Set up event listeners
    const unsubscribe = PureStorage.onChange(event => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [...prev, { ...event, timestamp }].slice(-5));
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const handleSetValue = async () => {
    try {
      setIsLoading(true);
      const storage = customInstance || PureStorage;
      
      await storage.setItem(key, value, { 
        encrypted, 
        skipCache: !useCache 
      });
      
      Alert.alert('Success', `Value set for key "${key}"`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGetValue = async () => {
    try {
      setIsLoading(true);
      const storage = customInstance || PureStorage;
      
      const result = await storage.getItem(key, { 
        skipCache: !useCache 
      });
      
      setStoredValue(result);
    } catch (error) {
      Alert.alert('Error', error.message);
      setStoredValue(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveValue = async () => {
    try {
      setIsLoading(true);
      const storage = customInstance || PureStorage;
      
      await storage.removeItem(key);
      setStoredValue(null);
      Alert.alert('Success', `Key "${key}" removed`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearAll = async () => {
    try {
      setIsLoading(true);
      const storage = customInstance || PureStorage;
      
      await storage.clear();
      setStoredValue(null);
      Alert.alert('Success', 'All keys cleared');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRunBenchmark = async () => {
    try {
      setIsLoading(true);
      setBenchmarkResults(null);
      
      const results = await PureStorage.Benchmark.runAll(50);
      setBenchmarkResults(results);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateInstance = () => {
    const instance = PureStorage.getInstance(instanceName, {
      encrypted,
      cache: {
        maxSize: 50,
        ttl: 30000 // 30 seconds
      }
    });
    
    setCustomInstance(instance);
    setCurrentNamespace(instanceName);
    Alert.alert('Success', `Created instance with namespace "${instanceName}"`);
  };
  
  const handleResetInstance = () => {
    setCustomInstance(null);
    setCurrentNamespace('default');
  };
  
  const getCacheStats = () => {
    const storage = customInstance || PureStorage;
    const stats = storage.getCacheStats();
    Alert.alert(
      'Cache Statistics',
      `Size: ${stats.size} items\nHits: ${stats.hits}\nMisses: ${stats.misses}\nHit Rate: ${Math.round(stats.hitRate * 100)}%`
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>React Native Pure Storage</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Namespace: {currentNamespace}</Text>
          {currentNamespace !== 'default' && (
            <Button 
              title="Reset to Default" 
              onPress={handleResetInstance}
              color="#777"
            />
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Instance</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Namespace"
              value={instanceName}
              onChangeText={setInstanceName}
            />
            <Button 
              title="Create" 
              onPress={handleCreateInstance}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store and Retrieve</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Key:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter key"
              value={key}
              onChangeText={setKey}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Value:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter value"
              value={value}
              onChangeText={setValue}
            />
          </View>
          
          <View style={styles.optionsContainer}>
            <View style={styles.option}>
              <Text>Encrypted:</Text>
              <Switch value={encrypted} onValueChange={setEncrypted} />
            </View>
            
            <View style={styles.option}>
              <Text>Use Cache:</Text>
              <Switch value={useCache} onValueChange={setUseCache} />
            </View>
          </View>
          
          <View style={styles.buttonGroup}>
            <Button title="Set Value" onPress={handleSetValue} />
            <Button title="Get Value" onPress={handleGetValue} />
            <Button title="Remove" onPress={handleRemoveValue} />
            <Button title="Clear All" onPress={handleClearAll} color="#FF6B6B" />
          </View>
          
          <View style={styles.resultContainer}>
            <Text style={styles.label}>Stored Value:</Text>
            <Text style={styles.valueText}>
              {storedValue !== null
                ? typeof storedValue === 'object'
                  ? JSON.stringify(storedValue)
                  : String(storedValue)
                : 'null'}
            </Text>
          </View>
          
          <Button 
            title="Get Cache Stats" 
            onPress={getCacheStats}
            color="#777"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>No events yet</Text>
          ) : (
            events.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <Text style={styles.eventTime}>{event.timestamp}</Text>
                <Text style={styles.eventType}>{event.type}</Text>
                <Text style={styles.eventKey}>{event.key || 'all'}</Text>
              </View>
            ))
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benchmark</Text>
          <Button 
            title="Run Benchmark" 
            onPress={handleRunBenchmark}
          />
          
          {benchmarkResults && (
            <View style={styles.benchmarkResults}>
              <Text style={styles.benchmarkTitle}>Results (operations per second):</Text>
              {Object.entries(benchmarkResults).map(([name, result]) => (
                <View key={name} style={styles.benchmarkRow}>
                  <Text style={styles.benchmarkName}>{name}:</Text>
                  <Text style={styles.benchmarkValue}>{result.opsPerSecond} ops/sec</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  resultContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F0F4F8',
    borderRadius: 5,
    marginBottom: 15,
  },
  valueText: {
    fontFamily: 'monospace',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 10,
  },
  eventItem: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
    width: 80,
  },
  eventType: {
    fontWeight: 'bold',
    width: 60,
    color: '#666',
  },
  eventKey: {
    flex: 1,
    fontFamily: 'monospace',
  },
  benchmarkResults: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F0F4F8',
    borderRadius: 5,
  },
  benchmarkTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  benchmarkName: {
    fontWeight: '500',
  },
  benchmarkValue: {
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ExampleApp; 