/**
 * Example component demonstrating FileStorage usage
 */
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, 
  TouchableOpacity, Platform, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'react-native-fs';
import FileStorage from './file-storage';

export default function FileStorageExample() {
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logMessages, setLogMessages] = useState([]);

  // Add a log message
  const log = (message) => {
    setLogMessages(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    console.log(message);
  };

  // Load saved files on component mount
  useEffect(() => {
    loadSavedFiles();
  }, []);

  // Load all saved files and images
  const loadSavedFiles = async () => {
    setLoading(true);
    log('Loading saved files and images...');

    try {
      // List all files
      const allFiles = await FileStorage.listFiles();
      
      // Separate images and other files
      const imageFiles = [];
      const otherFiles = [];
      
      // Process each file
      for (const file of allFiles) {
        const { key, metadata } = file;
        
        // Check if it's an image
        if (metadata && metadata.width && metadata.height) {
          // Get image details including data URI
          const { uri } = await FileStorage.getImage(key);
          if (uri) {
            imageFiles.push({
              key,
              uri,
              metadata
            });
          }
        } else {
          // For non-image files, just get the metadata
          otherFiles.push({
            key,
            metadata
          });
        }
      }
      
      setImages(imageFiles);
      setFiles(otherFiles);
      
      log(`Loaded ${imageFiles.length} images and ${otherFiles.length} other files`);
    } catch (error) {
      log(`Error loading files: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Pick and save an image
  const pickAndSaveImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        log('Permission to access media library denied');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (result.canceled) {
        log('Image selection canceled');
        return;
      }
      
      setLoading(true);
      log('Saving image...');
      
      // Generate a key
      const imageUri = result.assets[0].uri;
      const key = `image_${Date.now()}`;
      
      // Store image with additional metadata
      const success = await FileStorage.storeImage(key, imageUri, {
        compression: true,
        quality: 0.8,
        metadata: {
          title: `Image ${images.length + 1}`,
          tags: ['example', 'gallery']
        }
      });
      
      if (success) {
        log(`Image saved successfully with key: ${key}`);
        await loadSavedFiles(); // Reload files
      } else {
        log('Failed to save image');
      }
    } catch (error) {
      log(`Error picking/saving image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Pick and save a document/file
  const pickAndSaveDocument = async () => {
    try {
      // Launch document picker
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*'
      });
      
      if (result.canceled) {
        log('Document selection canceled');
        return;
      }
      
      setLoading(true);
      log(`Saving document: ${result.assets[0].name}...`);
      
      // Generate a key
      const fileUri = result.assets[0].uri;
      const key = `file_${Date.now()}`;
      
      // Store file with metadata
      const success = await FileStorage.storeFile(key, fileUri, {
        compression: true,
        metadata: {
          name: result.assets[0].name,
          type: result.assets[0].mimeType,
          size: result.assets[0].size,
          title: `File ${files.length + 1}`
        }
      });
      
      if (success) {
        log(`Document saved successfully with key: ${key}`);
        await loadSavedFiles(); // Reload files
      } else {
        log('Failed to save document');
      }
    } catch (error) {
      log(`Error picking/saving document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save a file to filesystem
  const saveToFilesystem = async (key, filename) => {
    try {
      setLoading(true);
      log(`Saving ${key} to filesystem...`);
      
      // Determine path to save
      const directory = Platform.OS === 'ios' 
        ? FileSystem.DocumentDirectoryPath 
        : FileSystem.ExternalDirectoryPath;
        
      const path = `${directory}/${filename || 'exported_file'}`;
      
      // Save to filesystem
      const savedPath = await FileStorage.saveToFilesystem(key, path);
      
      if (savedPath) {
        log(`File saved to: ${savedPath}`);
      } else {
        log('Failed to save file to filesystem');
      }
    } catch (error) {
      log(`Error saving to filesystem: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a stored file
  const deleteStoredFile = async (key) => {
    try {
      setLoading(true);
      log(`Deleting ${key}...`);
      
      const success = await FileStorage.deleteFile(key);
      
      if (success) {
        log(`File deleted successfully: ${key}`);
        await loadSavedFiles(); // Reload files
      } else {
        log(`Failed to delete file: ${key}`);
      }
    } catch (error) {
      log(`Error deleting file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FileStorage Example</Text>
      
      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickAndSaveImage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Add Image</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickAndSaveDocument}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Add File</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={loadSavedFiles}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      )}
      
      <ScrollView style={styles.content}>
        {/* Images section */}
        {images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stored Images ({images.length})</Text>
            <ScrollView horizontal style={styles.imageList}>
              {images.map((image) => (
                <View key={image.key} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                  <Text style={styles.imageTitle}>
                    {image.metadata?.title || image.key}
                  </Text>
                  <Text style={styles.imageInfo}>
                    {image.metadata?.width}x{image.metadata?.height}
                  </Text>
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      onPress={() => saveToFilesystem(image.key, `${image.metadata?.title || 'image'}.${image.metadata?.format || 'jpg'}`)}
                      style={styles.smallButton}
                    >
                      <Text style={styles.smallButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteStoredFile(image.key)}
                      style={[styles.smallButton, styles.deleteButton]}
                    >
                      <Text style={styles.smallButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Files section */}
        {files.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stored Files ({files.length})</Text>
            {files.map((file) => (
              <View key={file.key} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>
                    {file.metadata?.name || file.metadata?.title || file.key}
                  </Text>
                  <Text style={styles.fileDetails}>
                    Type: {file.metadata?.type || 'Unknown'}{' '}
                    {file.metadata?.size ? `| Size: ${Math.round(file.metadata.size / 1024)} KB` : ''}
                  </Text>
                </View>
                <View style={styles.fileActions}>
                  <TouchableOpacity
                    onPress={() => saveToFilesystem(file.key, file.metadata?.name)}
                    style={styles.smallButton}
                  >
                    <Text style={styles.smallButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteStoredFile(file.key)}
                    style={[styles.smallButton, styles.deleteButton]}
                  >
                    <Text style={styles.smallButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* No files message */}
        {images.length === 0 && files.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No stored files or images. Add some using the buttons above.
            </Text>
          </View>
        )}
        
        {/* Logs section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          <View style={styles.logContainer}>
            {logMessages.map((message, index) => (
              <Text key={index} style={styles.logMessage}>{message}</Text>
            ))}
            {logMessages.length === 0 && (
              <Text style={styles.emptyLogMessage}>No activity yet</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  imageList: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 16,
    width: 150,
    alignItems: 'center',
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  imageInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fileDetails: {
    fontSize: 12,
    color: '#666',
  },
  fileActions: {
    flexDirection: 'row',
  },
  smallButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logContainer: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    maxHeight: 200,
  },
  logMessage: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    marginBottom: 4,
  },
  emptyLogMessage: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 8,
  },
}); 