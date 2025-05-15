package com.purestorage;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;

import java.util.Map;

public class RNPureStorageModule extends ReactContextBaseJavaModule {
    private static final String STORAGE_NAME = "RNPureStorage";
    private final SharedPreferences mSharedPreferences;

    public RNPureStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mSharedPreferences = reactContext.getSharedPreferences(STORAGE_NAME, Context.MODE_PRIVATE);
    }

    @Override
    public String getName() {
        return "RNPureStorage";
    }

    @ReactMethod
    public void setItem(String key, String value, Promise promise) {
        try {
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            editor.putString(key, value);
            boolean success = editor.commit();
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getItem(String key, Promise promise) {
        try {
            String value = mSharedPreferences.getString(key, null);
            promise.resolve(value);
        } catch (Exception e) {
            promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void removeItem(String key, Promise promise) {
        try {
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            editor.remove(key);
            boolean success = editor.commit();
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void clear(Promise promise) {
        try {
            SharedPreferences.Editor editor = mSharedPreferences.edit();
            editor.clear();
            boolean success = editor.commit();
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getAllKeys(Promise promise) {
        try {
            Map<String, ?> allEntries = mSharedPreferences.getAll();
            WritableArray keys = Arguments.createArray();
            
            for (String key : allEntries.keySet()) {
                keys.pushString(key);
            }
            
            promise.resolve(keys);
        } catch (Exception e) {
            promise.reject("ERR_UNEXPECTED_EXCEPTION", e.getMessage(), e);
        }
    }
} 