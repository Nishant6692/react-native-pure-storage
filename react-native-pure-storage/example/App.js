import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import PureStorage from 'react-native-pure-storage';

const App = () => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [savedItems, setSavedItems] = useState([]);

  // Load all saved items when the app starts
  useEffect(() => {
    loadAllItems();
  }, []);

  // Function to load all items from storage
  const loadAllItems = async () => {
    try {
      const keys = await PureStorage.getAllKeys();
      const items = [];
      
      for (const k of keys) {
        const v = await PureStorage.getItem(k);
        items.push({ key: k, value: v });
      }
      
      setSavedItems(items);
    } catch (error) {
      Alert.alert('Error', 'Failed to load items: ' + error.message);
    }
  };

  // Function to save an item to storage
  const saveItem = async () => {
    if (!key.trim()) {
      Alert.alert('Error', 'Key cannot be empty');
      return;
    }

    try {
      await PureStorage.setItem(key, value);
      Alert.alert('Success', 'Item saved successfully');
      setKey('');
      setValue('');
      loadAllItems(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to save item: ' + error.message);
    }
  };

  // Function to get an item from storage
  const getItem = async () => {
    if (!key.trim()) {
      Alert.alert('Error', 'Key cannot be empty');
      return;
    }

    try {
      const result = await PureStorage.getItem(key);
      if (result !== null) {
        setValue(result);
        Alert.alert('Success', `Retrieved value: ${result}`);
      } else {
        Alert.alert('Not Found', `No value found for key: ${key}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get item: ' + error.message);
    }
  };

  // Function to remove an item from storage
  const removeItem = async () => {
    if (!key.trim()) {
      Alert.alert('Error', 'Key cannot be empty');
      return;
    }

    try {
      await PureStorage.removeItem(key);
      Alert.alert('Success', 'Item removed successfully');
      setKey('');
      setValue('');
      loadAllItems(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item: ' + error.message);
    }
  };

  // Function to clear all items from storage
  const clearAll = async () => {
    try {
      await PureStorage.clear();
      Alert.alert('Success', 'All items cleared successfully');
      setSavedItems([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear items: ' + error.message);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>React Native Pure Storage</Text>
        <Text style={styles.subtitle}>Native Storage Demo</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter key"
            value={key}
            onChangeText={setKey}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter value"
            value={value}
            onChangeText={setValue}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={saveItem}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={getItem}>
            <Text style={styles.buttonText}>Get</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={removeItem}>
            <Text style={styles.buttonText}>Remove</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAll}>
            <Text style={styles.buttonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Saved Items:</Text>
          <ScrollView style={styles.list}>
            {savedItems.length > 0 ? (
              savedItems.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.itemKey}>{item.key}:</Text>
                  <Text style={styles.itemValue}>{item.value}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No items saved</Text>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  itemKey: {
    fontWeight: 'bold',
    marginRight: 5,
    color: '#333',
  },
  itemValue: {
    flex: 1,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

export default App; 