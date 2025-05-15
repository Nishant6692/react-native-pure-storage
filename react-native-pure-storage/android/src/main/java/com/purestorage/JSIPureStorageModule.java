package com.purestorage;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * JSI implementation for PureStorage to enable synchronous access
 */
public class JSIPureStorageModule {
    private static final String STORAGE_NAME = "RNPureStorage";
    private static final String ENCRYPTION_KEY_NAME = "RNPureStorage_EncryptionKey";
    private static final String PREFIX = "RNPureStorage_";
    
    private final ReactApplicationContext mReactContext;
    private final SharedPreferences mSharedPreferences;
    private String mEncryptionKey;

    public JSIPureStorageModule(ReactApplicationContext reactContext) {
        mReactContext = reactContext;
        mSharedPreferences = reactContext.getSharedPreferences(STORAGE_NAME, Context.MODE_PRIVATE);
        setupEncryptionKey();
    }

    private void setupEncryptionKey() {
        mEncryptionKey = mSharedPreferences.getString(ENCRYPTION_KEY_NAME, null);
        
        if (mEncryptionKey == null) {
            // Generate a random encryption key
            byte[] keyBytes = new byte[32]; // 256-bit key
            new java.security.SecureRandom().nextBytes(keyBytes);
            mEncryptionKey = Base64.encodeToString(keyBytes, Base64.DEFAULT);
            
            // Save the encryption key
            mSharedPreferences.edit().putString(ENCRYPTION_KEY_NAME, mEncryptionKey).apply();
        }
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
        try {
            Base64.decode(value, Base64.DEFAULT);
            return value.length() > 20 && !value.startsWith("{") && !value.startsWith("[");
        } catch (Exception e) {
            return false;
        }
    }

    // JSI SYNCHRONOUS METHODS
    
    // Set an item synchronously
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
            
            // Use commit() for synchronous operations
            return editor.commit();
        } catch (Exception e) {
            return false;
        }
    }
    
    // Get an item synchronously
    public ReadableMap getItemSync(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }
        
        try {
            String storageKey = keyWithPrefix(key);
            String serialized = mSharedPreferences.getString(storageKey, null);
            
            if (serialized == null) {
                return null;
            }
            
            ReadableMap item = Arguments.fromJSONString(serialized);
            String type = item.getString("type");
            String value = item.getString("value");
            
            // Check if the value is encrypted and decrypt if needed
            if (isEncrypted(value)) {
                String decryptedValue = decrypt(value);
                if (decryptedValue != null) {
                    return serializeItem(type, decryptedValue);
                }
            }
            
            return item;
        } catch (Exception e) {
            return null;
        }
    }
    
    // Remove an item synchronously
    public boolean removeItemSync(String key) {
        if (key == null || key.isEmpty()) {
            return false;
        }
        
        try {
            String storageKey = keyWithPrefix(key);
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            editor.remove(storageKey);
            return editor.commit();
        } catch (Exception e) {
            return false;
        }
    }
    
    // Clear storage synchronously
    public boolean clearSync() {
        try {
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            
            // Get all keys with our prefix
            Map<String, ?> allEntries = mSharedPreferences.getAll();
            for (Map.Entry<String, ?> entry : allEntries.entrySet()) {
                String key = entry.getKey();
                if (key.startsWith(PREFIX) && !key.equals(ENCRYPTION_KEY_NAME)) {
                    editor.remove(key);
                }
            }
            
            return editor.commit();
        } catch (Exception e) {
            return false;
        }
    }
    
    // Get all keys synchronously
    public String[] getAllKeysSync() {
        try {
            List<String> keysList = new ArrayList<>();
            Map<String, ?> allEntries = mSharedPreferences.getAll();
            
            for (Map.Entry<String, ?> entry : allEntries.entrySet()) {
                String key = entry.getKey();
                if (key.startsWith(PREFIX) && !key.equals(ENCRYPTION_KEY_NAME)) {
                    keysList.add(key.substring(PREFIX.length()));
                }
            }
            
            return keysList.toArray(new String[0]);
        } catch (Exception e) {
            return new String[0];
        }
    }
    
    // Check if a key exists synchronously
    public boolean hasKeySync(String key) {
        if (key == null || key.isEmpty()) {
            return false;
        }
        
        try {
            String storageKey = keyWithPrefix(key);
            return mSharedPreferences.contains(storageKey);
        } catch (Exception e) {
            return false;
        }
    }
    
    // Multiple synchronous operations
    
    // Set multiple items synchronously
    public boolean multiSetSync(ReadableMap keyValuePairs, boolean encrypted) {
        if (keyValuePairs == null || keyValuePairs.toHashMap().isEmpty()) {
            return false;
        }
        
        try {
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            ReadableArray keys = keyValuePairs.keySetArray();
            
            for (int i = 0; i < keys.size(); i++) {
                String key = keys.getString(i);
                ReadableMap entry = keyValuePairs.getMap(key);
                
                if (entry != null) {
                    String type = entry.getString("type");
                    String value = entry.getString("value");
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
            }
            
            return editor.commit();
        } catch (Exception e) {
            return false;
        }
    }
    
    // Get multiple items synchronously
    public ReadableMap multiGetSync(ReadableArray keys) {
        if (keys == null) {
            return Arguments.createMap();
        }
        
        try {
            WritableMap result = Arguments.createMap();
            
            for (int i = 0; i < keys.size(); i++) {
                String key = keys.getString(i);
                ReadableMap item = getItemSync(key);
                
                if (item != null) {
                    result.putMap(key, item);
                }
            }
            
            return result;
        } catch (Exception e) {
            return Arguments.createMap();
        }
    }
    
    // Remove multiple items synchronously
    public boolean multiRemoveSync(ReadableArray keys) {
        if (keys == null) {
            return false;
        }
        
        try {
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            
            for (int i = 0; i < keys.size(); i++) {
                String key = keys.getString(i);
                String storageKey = keyWithPrefix(key);
                editor.remove(storageKey);
            }
            
            return editor.commit();
        } catch (Exception e) {
            return false;
        }
    }
    
    // This method will install the JSI bindings
    public static void install(ReactApplicationContext context, long jsContextPtr) {
        // This would be implemented in C++ to register the JSI functions
        nativeInstall(context, jsContextPtr);
    }
    
    private static native void nativeInstall(ReactApplicationContext context, long jsContextPtr);
} 