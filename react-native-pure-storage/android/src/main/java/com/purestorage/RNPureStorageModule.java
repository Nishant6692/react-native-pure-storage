package com.purestorage;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class RNPureStorageModule extends ReactContextBaseJavaModule {
    private static final String STORAGE_NAME = "RNPureStorage";
    private static final String ENCRYPTION_KEY_NAME = "RNPureStorage_EncryptionKey";
    private static final String PREFIX = "RNPureStorage_";
    
    private final SharedPreferences mSharedPreferences;
    private final Executor mExecutor;
    private String mEncryptionKey;

    public RNPureStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mSharedPreferences = reactContext.getSharedPreferences(STORAGE_NAME, Context.MODE_PRIVATE);
        mExecutor = Executors.newSingleThreadExecutor();
        setupEncryptionKey();
    }

    private void setupEncryptionKey() {
        mEncryptionKey = mSharedPreferences.getString(ENCRYPTION_KEY_NAME, null);
        
        if (mEncryptionKey == null) {
            // Generate a random encryption key
            byte[] keyBytes = new byte[32]; // 256-bit key
            new java.security.SecureRandom().nextBytes(keyBytes);
            mEncryptionKey = Base64.encodeToString(keyBytes, Base64.DEFAULT);
            
            // Save the encryption key (in a real app, this would be in the Android Keystore)
            mSharedPreferences.edit().putString(ENCRYPTION_KEY_NAME, mEncryptionKey).apply();
        }
    }

    @Override
    public String getName() {
        return "RNPureStorage";
    }
    
    // Encryption helpers
    private String encrypt(String value) {
        try {
            byte[] keyData = Base64.decode(mEncryptionKey, Base64.DEFAULT);
            
            // Derive key and IV using hashing
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] key = sha.digest(keyData);
            
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            byte[] iv = md5.digest(keyData);
            
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            
            return Base64.encodeToString(encrypted, Base64.DEFAULT);
        } catch (Exception e) {
            return null;
        }
    }
    
    private String decrypt(String encryptedValue) {
        try {
            byte[] encrypted = Base64.decode(encryptedValue, Base64.DEFAULT);
            byte[] keyData = Base64.decode(mEncryptionKey, Base64.DEFAULT);
            
            // Derive the same key and IV
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] key = sha.digest(keyData);
            
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            byte[] iv = md5.digest(keyData);
            
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            byte[] decrypted = cipher.doFinal(encrypted);
            
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
    
    // Helper methods
    private String keyWithPrefix(String key) {
        return PREFIX + key;
    }
    
    private WritableMap serializeItem(String type, String value) {
        WritableMap item = Arguments.createMap();
        item.putString("type", type);
        item.putString("value", value);
        return item;
    }
    
    private boolean isEncrypted(String value) {
        // This is a simplistic check - in a real app, you might have a more robust way
        // to identify encrypted data
        try {
            Base64.decode(value, Base64.DEFAULT);
            return value.length() > 20 && !value.startsWith("{") && !value.startsWith("[");
        } catch (Exception e) {
            return false;
        }
    }

    // Set item implementation
    @ReactMethod
    public void setItem(String key, String type, String value, boolean encrypted, Promise promise) {
        if (key == null || key.isEmpty()) {
            promise.reject("ERR_EMPTY_KEY", "Key cannot be empty");
            return;
        }
        
        mExecutor.execute(() -> {
            try {
                String storageKey = keyWithPrefix(key);
                SharedPreferences.Editor editor = mSharedPreferences.edit();
                
                if (encrypted && value != null) {
                    String encryptedValue = encrypt(value);
                    if (encryptedValue != null) {
                        // Create a map with type and encrypted value
                        WritableMap item = serializeItem(type, encryptedValue);
                        String serialized = Arguments.toJSONString(item);
                        editor.putString(storageKey, serialized);
                    } else {
                        // Fallback if encryption fails
                        WritableMap item = serializeItem(type, value);
                        String serialized = Arguments.toJSONString(item);
                        editor.putString(storageKey, serialized);
                    }
                } else {
                    WritableMap item = serializeItem(type, value);
                    String serialized = Arguments.toJSONString(item);
                    editor.putString(storageKey, serialized);
                }
                
                // Use apply() instead of commit() for better performance
                editor.apply();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }
    
    // Synchronous set item - Note: this is not directly exposed to JS but could be
    public boolean setItemSync(String key, String type, String value, boolean encrypted) {
        if (key == null || key.isEmpty()) {
            return false;
        }
        
        try {
            String storageKey = keyWithPrefix(key);
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            
            if (encrypted && value != null) {
                String encryptedValue = encrypt(value);
                if (encryptedValue != null) {
                    WritableMap item = serializeItem(type, encryptedValue);
                    String serialized = Arguments.toJSONString(item);
                    editor.putString(storageKey, serialized);
                } else {
                    WritableMap item = serializeItem(type, value);
                    String serialized = Arguments.toJSONString(item);
                    editor.putString(storageKey, serialized);
                }
            } else {
                WritableMap item = serializeItem(type, value);
                String serialized = Arguments.toJSONString(item);
                editor.putString(storageKey, serialized);
            }
            
            // Use commit() for synchronous operation
            return editor.commit();
        } catch (Exception e) {
            return false;
        }
    }

    @ReactMethod
    public void getItem(String key, Promise promise) {
        if (key == null || key.isEmpty()) {
            promise.reject("ERR_EMPTY_KEY", "Key cannot be empty");
            return;
        }
        
        mExecutor.execute(() -> {
            try {
                String storageKey = keyWithPrefix(key);
                String serialized = mSharedPreferences.getString(storageKey, null);
                
                if (serialized != null) {
                    ReadableMap item = Arguments.fromJSONString(serialized);
                    String type = item.getString("type");
                    String value = item.getString("value");
                    
                    // Check if value might be encrypted
                    if ("string".equals(type) && isEncrypted(value)) {
                        String decryptedValue = decrypt(value);
                        if (decryptedValue != null) {
                            // Successfully decrypted
                            WritableMap decryptedItem = Arguments.createMap();
                            decryptedItem.putString("type", type);
                            decryptedItem.putString("value", decryptedValue);
                            promise.resolve(decryptedItem);
                            return;
                        }
                    }
                    
                    // Return as is if not encrypted or decryption failed
                    WritableMap result = Arguments.createMap();
                    result.putString("type", type);
                    result.putString("value", value);
                    promise.resolve(result);
                } else {
                    promise.resolve(null);
                }
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }
    
    // This is a synchronous version not exposed to JS directly
    public ReadableMap getItemSync(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }
        
        try {
            String storageKey = keyWithPrefix(key);
            String serialized = mSharedPreferences.getString(storageKey, null);
            
            if (serialized != null) {
                ReadableMap item = Arguments.fromJSONString(serialized);
                String type = item.getString("type");
                String value = item.getString("value");
                
                // Check if value might be encrypted
                if ("string".equals(type) && isEncrypted(value)) {
                    String decryptedValue = decrypt(value);
                    if (decryptedValue != null) {
                        // Successfully decrypted
                        WritableMap decryptedItem = Arguments.createMap();
                        decryptedItem.putString("type", type);
                        decryptedItem.putString("value", decryptedValue);
                        return decryptedItem;
                    }
                }
                
                // Return as is if not encrypted or decryption failed
                WritableMap result = Arguments.createMap();
                result.putString("type", type);
                result.putString("value", value);
                return result;
            }
            
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    @ReactMethod
    public void removeItem(String key, Promise promise) {
        if (key == null || key.isEmpty()) {
            promise.reject("ERR_EMPTY_KEY", "Key cannot be empty");
            return;
        }
        
        mExecutor.execute(() -> {
            try {
                String storageKey = keyWithPrefix(key);
                SharedPreferences.Editor editor = mSharedPreferences.edit();
                editor.remove(storageKey);
                editor.apply(); // Using apply for better performance
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }

    @ReactMethod
    public void clear(Promise promise) {
        mExecutor.execute(() -> {
            try {
                SharedPreferences.Editor editor = mSharedPreferences.edit();
                Map<String, ?> allEntries = mSharedPreferences.getAll();
                
                for (String key : allEntries.keySet()) {
                    if (key.startsWith(PREFIX) && !key.equals(ENCRYPTION_KEY_NAME)) {
                        editor.remove(key);
                    }
                }
                
                editor.apply();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }

    @ReactMethod
    public void getAllKeys(Promise promise) {
        mExecutor.execute(() -> {
            try {
                Map<String, ?> allEntries = mSharedPreferences.getAll();
                WritableArray keys = Arguments.createArray();
                
                for (String key : allEntries.keySet()) {
                    if (key.startsWith(PREFIX) && !key.equals(ENCRYPTION_KEY_NAME)) {
                        keys.pushString(key.substring(PREFIX.length()));
                    }
                }
                
                promise.resolve(keys);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }
    
    @ReactMethod
    public void hasKey(String key, Promise promise) {
        if (key == null || key.isEmpty()) {
            promise.reject("ERR_EMPTY_KEY", "Key cannot be empty");
            return;
        }
        
        mExecutor.execute(() -> {
            try {
                String storageKey = keyWithPrefix(key);
                boolean exists = mSharedPreferences.contains(storageKey);
                promise.resolve(exists);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }
    
    @ReactMethod
    public void multiSet(ReadableArray keyValueArray, boolean encrypted, Promise promise) {
        if (keyValueArray == null || keyValueArray.size() == 0) {
            promise.reject("ERR_INVALID_ARGS", "Expected an array of key-value pairs");
            return;
        }
        
        mExecutor.execute(() -> {
            try {
                SharedPreferences.Editor editor = mSharedPreferences.edit();
                
                for (int i = 0; i < keyValueArray.size(); i++) {
                    ReadableArray entry = keyValueArray.getArray(i);
                    
                    if (entry.size() != 3) {
                        promise.reject("ERR_INVALID_ARGS", "Each entry must be [key, type, value]");
                        return;
                    }
                    
                    String key = entry.getString(0);
                    String type = entry.getString(1);
                    String value = entry.getString(2);
                    
                    if (key == null || key.isEmpty()) {
                        promise.reject("ERR_INVALID_ARGS", "Keys must be strings");
                        return;
                    }
                    
                    String storageKey = keyWithPrefix(key);
                    
                    if (encrypted && value != null) {
                        String encryptedValue = encrypt(value);
                        if (encryptedValue != null) {
                            WritableMap item = serializeItem(type, encryptedValue);
                            String serialized = Arguments.toJSONString(item);
                            editor.putString(storageKey, serialized);
                        } else {
                            WritableMap item = serializeItem(type, value);
                            String serialized = Arguments.toJSONString(item);
                            editor.putString(storageKey, serialized);
                        }
                    } else {
                        WritableMap item = serializeItem(type, value);
                        String serialized = Arguments.toJSONString(item);
                        editor.putString(storageKey, serialized);
                    }
                }
                
                editor.apply();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }
    
    @ReactMethod
    public void multiGet(ReadableArray keys, Promise promise) {
        if (keys == null || keys.size() == 0) {
            promise.reject("ERR_INVALID_ARGS", "Expected an array of keys");
            return;
        }
        
        mExecutor.execute(() -> {
            try {
                WritableMap result = Arguments.createMap();
                List<String> keyList = new ArrayList<>();
                
                for (int i = 0; i < keys.size(); i++) {
                    keyList.add(keys.getString(i));
                }
                
                for (String key : keyList) {
                    String storageKey = keyWithPrefix(key);
                    String serialized = mSharedPreferences.getString(storageKey, null);
                    
                    if (serialized != null) {
                        ReadableMap item = Arguments.fromJSONString(serialized);
                        String type = item.getString("type");
                        String value = item.getString("value");
                        
                        // Check if value might be encrypted
                        if ("string".equals(type) && isEncrypted(value)) {
                            String decryptedValue = decrypt(value);
                            if (decryptedValue != null) {
                                // Successfully decrypted
                                WritableMap decryptedItem = Arguments.createMap();
                                decryptedItem.putString("type", type);
                                decryptedItem.putString("value", decryptedValue);
                                result.putMap(key, decryptedItem);
                                continue;
                            }
                        }
                        
                        // Return as is if not encrypted or decryption failed
                        WritableMap itemResult = Arguments.createMap();
                        itemResult.putString("type", type);
                        itemResult.putString("value", value);
                        result.putMap(key, itemResult);
                    } else {
                        result.putNull(key);
                    }
                }
                
                promise.resolve(result);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }
    
    @ReactMethod
    public void multiRemove(ReadableArray keys, Promise promise) {
        if (keys == null || keys.size() == 0) {
            promise.reject("ERR_INVALID_ARGS", "Expected an array of keys");
            return;
        }
        
        mExecutor.execute(() -> {
            try {
                SharedPreferences.Editor editor = mSharedPreferences.edit();
                
                for (int i = 0; i < keys.size(); i++) {
                    String key = keys.getString(i);
                    if (key == null || key.isEmpty()) {
                        promise.reject("ERR_INVALID_ARGS", "Keys must be strings");
                        return;
                    }
                    
                    String storageKey = keyWithPrefix(key);
                    editor.remove(storageKey);
                }
                
                editor.apply();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
            }
        });
    }
} 