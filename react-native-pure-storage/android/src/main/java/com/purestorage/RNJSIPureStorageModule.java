package com.purestorage;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.bridge.JavaScriptContextHolder;

@ReactModule(name = RNJSIPureStorageModule.NAME)
public class RNJSIPureStorageModule extends ReactContextBaseJavaModule {
    static final String NAME = "RNJSIPureStorage";
    private static boolean sJSIBindingsInstalled = false;

    public RNJSIPureStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
        initializeJSI(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    private synchronized void initializeJSI(ReactApplicationContext reactContext) {
        if (sJSIBindingsInstalled) {
            return;
        }

        try {
            // Install the bindings
            JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder();
            if (jsContext.get() != 0) {
                JSIPureStorageModule.install(reactContext, jsContext.get());
                sJSIBindingsInstalled = true;
            }
        } catch (Exception e) {
            // JSI might not be available
        }
    }
} 