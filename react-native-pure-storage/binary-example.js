/**
 * Example of using PureStorage for Binary Data
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Image } from 'react-native';
import PureStorage from 'react-native-pure-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export default function BinaryStorageExample() {
  const [jsiAvailable, setJsiAvailable] = useState(false);
  const [logs, setLogs] = useState([]);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  
  useEffect(() => {
    // Check if JSI is available when component mounts
    setJsiAvailable(PureStorage.jsi.isAvailable);
  }, []);

  // Helper to add a log entry
  const addLog = (message) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Pick an image from gallery
  const pickImage = async () => {
    try {
      addLog('Requesting permission to access media library...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        addLog('❌ Permission to access media library was denied');
        return;
      }
      
      addLog('Opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      
      if (result.canceled) {
        addLog('Image selection was canceled');
        return;
      }
      
      // Set the image base64 data and URI
      setImageBase64(result.assets[0].base64);
      setImageUri(result.assets[0].uri);
      addLog(`✅ Image selected (${Math.round(result.assets[0].fileSize / 1024)} KB)`);
    } catch (error) {
      addLog(`❌ Error picking image: ${error.message}`);
    }
  };

  // Convert base64 to binary
  const convertBase64ToBinary = () => {
    if (!imageBase64) {
      addLog('❌ No image selected');
      return;
    }
    
    try {
      addLog('Converting base64 to binary...');
      const binary = global.atob 
        ? global.atob(imageBase64) 
        : Buffer.from(imageBase64, 'base64').toString('binary');
      
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      addLog(`✅ Converted to binary (${bytes.byteLength} bytes)`);
      return bytes;
    } catch (error) {
      addLog(`❌ Error converting image: ${error.message}`);
      return null;
    }
  };

  // Save binary data using sync API
  const saveImageSync = () => {
    if (!jsiAvailable) {
      addLog('❌ JSI not available, cannot use sync API');
      return;
    }
    
    const imageBinary = convertBase64ToBinary();
    if (!imageBinary) return;
    
    try {
      addLog('Saving image using sync API...');
      const startTime = performance.now();
      PureStorage.setBinaryItemSync('testImage', imageBinary);
      const endTime = performance.now();
      
      addLog(`✅ Image saved synchronously in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      addLog(`❌ Error saving image: ${error.message}`);
    }
  };

  // Load binary data using sync API
  const loadImageSync = () => {
    if (!jsiAvailable) {
      addLog('❌ JSI not available, cannot use sync API');
      return;
    }
    
    try {
      addLog('Loading image using sync API...');
      const startTime = performance.now();
      const binaryData = PureStorage.getBinaryItemSync('testImage');
      const endTime = performance.now();
      
      if (!binaryData) {
        addLog('❌ No image found in storage');
        return;
      }
      
      // Convert binary back to base64
      const binary = String.fromCharCode.apply(null, binaryData);
      const base64 = global.btoa ? global.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
      
      setImageBase64(base64);
      addLog(`✅ Image loaded synchronously in ${(endTime - startTime).toFixed(2)}ms (${binaryData.byteLength} bytes)`);
    } catch (error) {
      addLog(`❌ Error loading image: ${error.message}`);
    }
  };

  // Save binary data using async API
  const saveImageAsync = async () => {
    const imageBinary = convertBase64ToBinary();
    if (!imageBinary) return;
    
    try {
      addLog('Saving image using async API...');
      const startTime = performance.now();
      await PureStorage.setBinaryItem('testImage', imageBinary);
      const endTime = performance.now();
      
      addLog(`✅ Image saved asynchronously in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      addLog(`❌ Error saving image: ${error.message}`);
    }
  };

  // Load binary data using async API
  const loadImageAsync = async () => {
    try {
      addLog('Loading image using async API...');
      const startTime = performance.now();
      const binaryData = await PureStorage.getBinaryItem('testImage');
      const endTime = performance.now();
      
      if (!binaryData) {
        addLog('❌ No image found in storage');
        return;
      }
      
      // Convert binary back to base64
      const binary = String.fromCharCode.apply(null, binaryData);
      const base64 = global.btoa ? global.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
      
      setImageBase64(base64);
      addLog(`✅ Image loaded asynchronously in ${(endTime - startTime).toFixed(2)}ms (${binaryData.byteLength} bytes)`);
    } catch (error) {
      addLog(`❌ Error loading image: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PureStorage Binary Example</Text>
      <Text style={styles.status}>
        JSI Status: {jsiAvailable ? 'Available ✅' : 'Not Available ❌'}
      </Text>

      {/* Image preview */}
      <View style={styles.imageContainer}>
        {imageBase64 ? (
          <Image 
            source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} 
            style={styles.image} 
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Button 
          title="Pick Image" 
          onPress={pickImage} 
          color="#007AFF"
        />
      </View>
      
      <View style={styles.buttonRow}>
        <Button 
          title="Save (Sync)" 
          onPress={saveImageSync} 
          color="#4CD964"
          disabled={!jsiAvailable || !imageBase64}
        />
        <Button 
          title="Load (Sync)" 
          onPress={loadImageSync} 
          color="#4CD964"
          disabled={!jsiAvailable}
        />
      </View>
      
      <View style={styles.buttonRow}>
        <Button 
          title="Save (Async)" 
          onPress={saveImageAsync} 
          color="#FF9500"
          disabled={!imageBase64}
        />
        <Button 
          title="Load (Async)" 
          onPress={loadImageAsync} 
          color="#FF9500"
        />
      </View>

      {/* Log display */}
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Logs:</Text>
        <ScrollView style={styles.logs}>
          {logs.map((log, index) => (
            <Text key={`log-${index}`} style={styles.logLine}>
              {log}
            </Text>
          ))}
        </ScrollView>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888888',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  logContainer: {
    flex: 1,
    marginTop: 10,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logs: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
  },
  logLine: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
}); 