#import "RNPureStorage.h"
#import <React/RCTUtils.h>
#import <CommonCrypto/CommonCrypto.h>

// Constants
static NSString *const RNPureStoragePrefix = @"RNPureStorage_";
static NSString *const RNPureStorageEncryptionKeyName = @"RNPureStorage_EncryptionKey";

@implementation RNPureStorage {
  dispatch_queue_t _storageQueue;
  NSUserDefaults *_defaults;
  NSString *_encryptionKey;
}

RCT_EXPORT_MODULE();

- (instancetype)init {
  if (self = [super init]) {
    _storageQueue = dispatch_queue_create("com.purestorage.queue", DISPATCH_QUEUE_SERIAL);
    _defaults = [NSUserDefaults standardUserDefaults];
    [self setupEncryptionKey];
  }
  return self;
}

- (void)setupEncryptionKey {
  _encryptionKey = [_defaults objectForKey:RNPureStorageEncryptionKeyName];
  
  if (!_encryptionKey) {
    // Generate a random encryption key if one doesn't exist
    NSMutableData *keyData = [NSMutableData dataWithLength:32]; // 256-bit key
    SecRandomCopyBytes(kSecRandomDefault, keyData.length, keyData.mutableBytes);
    _encryptionKey = [keyData base64EncodedStringWithOptions:0];
    
    // Store the encryption key in keychain in a real app for better security
    // For now, we use UserDefaults for simplicity
    [_defaults setObject:_encryptionKey forKey:RNPureStorageEncryptionKeyName];
    [_defaults synchronize];
  }
}

// Helper method that decides whether to run on the main thread or custom queue
- (dispatch_queue_t)methodQueue {
  return _storageQueue;
}

#pragma mark - Encryption Helpers

- (NSString *)encryptString:(NSString *)string {
  if (!string) return nil;
  
  NSData *data = [string dataUsingEncoding:NSUTF8StringEncoding];
  if (!data) return nil;
  
  // Use the encryption key to derive a key and IV for AES encryption
  NSData *keyData = [[NSData alloc] initWithBase64EncodedString:_encryptionKey options:0];
  unsigned char key[kCCKeySizeAES256];
  unsigned char iv[kCCBlockSizeAES128];
  
  CC_SHA256(keyData.bytes, (CC_LONG)keyData.length, key);
  CC_MD5(keyData.bytes, (CC_LONG)keyData.length, iv);
  
  // Encrypt the data
  size_t outLength;
  NSMutableData *cipherData = [NSMutableData dataWithLength:data.length + kCCBlockSizeAES128];
  
  CCCryptorStatus result = CCCrypt(kCCEncrypt,
                                   kCCAlgorithmAES,
                                   kCCOptionPKCS7Padding,
                                   key, kCCKeySizeAES256,
                                   iv,
                                   data.bytes, data.length,
                                   cipherData.mutableBytes, cipherData.length,
                                   &outLength);
  
  if (result == kCCSuccess) {
    cipherData.length = outLength;
    return [cipherData base64EncodedStringWithOptions:0];
  }
  
  return nil;
}

- (NSString *)decryptString:(NSString *)encryptedString {
  if (!encryptedString) return nil;
  
  NSData *cipherData = [[NSData alloc] initWithBase64EncodedString:encryptedString options:0];
  if (!cipherData) return nil;
  
  // Use the encryption key to derive the same key and IV used for encryption
  NSData *keyData = [[NSData alloc] initWithBase64EncodedString:_encryptionKey options:0];
  unsigned char key[kCCKeySizeAES256];
  unsigned char iv[kCCBlockSizeAES128];
  
  CC_SHA256(keyData.bytes, (CC_LONG)keyData.length, key);
  CC_MD5(keyData.bytes, (CC_LONG)keyData.length, iv);
  
  // Decrypt the data
  size_t outLength;
  NSMutableData *decryptedData = [NSMutableData dataWithLength:cipherData.length + kCCBlockSizeAES128];
  
  CCCryptorStatus result = CCCrypt(kCCDecrypt,
                                  kCCAlgorithmAES,
                                  kCCOptionPKCS7Padding,
                                  key, kCCKeySizeAES256,
                                  iv,
                                  cipherData.bytes, cipherData.length,
                                  decryptedData.mutableBytes, decryptedData.length,
                                  &outLength);
  
  if (result == kCCSuccess) {
    decryptedData.length = outLength;
    return [[NSString alloc] initWithData:decryptedData encoding:NSUTF8StringEncoding];
  }
  
  return nil;
}

#pragma mark - Storage Helpers

- (NSString *)keyWithPrefix:(NSString *)key {
  return [RNPureStoragePrefix stringByAppendingString:key];
}

- (NSDictionary *)serializeItem:(NSString *)type value:(NSString *)value {
  return @{@"type": type, @"value": value ?: [NSNull null]};
}

#pragma mark - Exposed Methods

// Set Item
RCT_EXPORT_METHOD(setItem:(NSString *)key
                  type:(NSString *)type
                  value:(NSString *)value
                  encrypted:(BOOL)encrypted
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!key) {
    reject(@"ERR_EMPTY_KEY", @"Key cannot be empty", nil);
    return;
  }
  
  dispatch_async(_storageQueue, ^{
    @try {
      NSString *storageKey = [self keyWithPrefix:key];
      NSDictionary *item = [self serializeItem:type value:value];
      
      if (encrypted) {
        NSString *valueToStore = item[@"value"];
        NSMutableDictionary *encryptedItem = [item mutableCopy];
        encryptedItem[@"value"] = [self encryptString:valueToStore];
        [self->_defaults setObject:encryptedItem forKey:storageKey];
      } else {
        [self->_defaults setObject:item forKey:storageKey];
      }
      
      // No need to synchronize after every call - iOS does this automatically at appropriate times
      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// This is a synchronous version that can be called from the native side or JavaScript
RCT_EXPORT_SYNCHRONOUS_METHOD(setItemSync:(NSString *)key
                            type:(NSString *)type
                            value:(NSString *)value
                            encrypted:(BOOL)encrypted) {
  if (!key) {
    return @NO;
  }
  
  @try {
    NSString *storageKey = [self keyWithPrefix:key];
    NSDictionary *item = [self serializeItem:type value:value];
    
    if (encrypted) {
      NSString *valueToStore = item[@"value"];
      NSMutableDictionary *encryptedItem = [item mutableCopy];
      encryptedItem[@"value"] = [self encryptString:valueToStore];
      [_defaults setObject:encryptedItem forKey:storageKey];
    } else {
      [_defaults setObject:item forKey:storageKey];
    }
    
    return @YES;
  } @catch (NSException *exception) {
    return @NO;
  }
}

// Get Item
RCT_EXPORT_METHOD(getItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!key) {
    reject(@"ERR_EMPTY_KEY", @"Key cannot be empty", nil);
    return;
  }
  
  dispatch_async(_storageQueue, ^{
    @try {
      NSString *storageKey = [self keyWithPrefix:key];
      NSDictionary *item = [self->_defaults objectForKey:storageKey];
      
      if (item) {
        NSString *type = item[@"type"];
        id value = item[@"value"];
        
        // Check if the value is encrypted
        if ([type isEqualToString:@"string"] && [value isKindOfClass:[NSString class]] && ![value hasPrefix:@"{"]) {
          NSString *decryptedValue = [self decryptString:value];
          
          if (decryptedValue) {
            // The value was successfully decrypted
            NSMutableDictionary *decryptedItem = [item mutableCopy];
            decryptedItem[@"value"] = decryptedValue;
            resolve(decryptedItem);
            return;
          }
        }
        
        resolve(item);
      } else {
        resolve([NSNull null]);
      }
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// Synchronous version of getItem
RCT_EXPORT_SYNCHRONOUS_METHOD(getItemSync:(NSString *)key) {
  if (!key) {
    return [NSNull null];
  }
  
  @try {
    NSString *storageKey = [self keyWithPrefix:key];
    NSDictionary *item = [_defaults objectForKey:storageKey];
    
    if (item) {
      NSString *type = item[@"type"];
      id value = item[@"value"];
      
      // Check if the value is encrypted
      if ([type isEqualToString:@"string"] && [value isKindOfClass:[NSString class]] && ![value hasPrefix:@"{"]) {
        NSString *decryptedValue = [self decryptString:value];
        
        if (decryptedValue) {
          // The value was successfully decrypted
          NSMutableDictionary *decryptedItem = [item mutableCopy];
          decryptedItem[@"value"] = decryptedValue;
          return decryptedItem;
        }
      }
      
      return item;
    }
    
    return [NSNull null];
  } @catch (NSException *exception) {
    return [NSNull null];
  }
}

// Remove Item
RCT_EXPORT_METHOD(removeItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!key) {
    reject(@"ERR_EMPTY_KEY", @"Key cannot be empty", nil);
    return;
  }
  
  dispatch_async(_storageQueue, ^{
    @try {
      NSString *storageKey = [self keyWithPrefix:key];
      [self->_defaults removeObjectForKey:storageKey];
      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// Clear Storage
RCT_EXPORT_METHOD(clear:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(_storageQueue, ^{
    @try {
      NSUserDefaults *defaults = self->_defaults;
      NSDictionary *dictionary = [defaults dictionaryRepresentation];
      
      for (NSString *key in dictionary) {
        if ([key hasPrefix:RNPureStoragePrefix]) {
          [defaults removeObjectForKey:key];
        }
      }
      
      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// Get All Keys
RCT_EXPORT_METHOD(getAllKeys:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(_storageQueue, ^{
    @try {
      NSUserDefaults *defaults = self->_defaults;
      NSDictionary *dictionary = [defaults dictionaryRepresentation];
      NSMutableArray *keys = [NSMutableArray array];
      
      NSUInteger prefixLength = RNPureStoragePrefix.length;
      
      for (NSString *key in dictionary) {
        if ([key hasPrefix:RNPureStoragePrefix]) {
          [keys addObject:[key substringFromIndex:prefixLength]];
        }
      }
      
      resolve(keys);
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// Check if a key exists
RCT_EXPORT_METHOD(hasKey:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!key) {
    reject(@"ERR_EMPTY_KEY", @"Key cannot be empty", nil);
    return;
  }
  
  dispatch_async(_storageQueue, ^{
    @try {
      NSString *storageKey = [self keyWithPrefix:key];
      BOOL exists = [self->_defaults objectForKey:storageKey] != nil;
      resolve(@(exists));
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// MultiSet
RCT_EXPORT_METHOD(multiSet:(NSArray *)keyValueArray
                  encrypted:(BOOL)encrypted
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!keyValueArray || ![keyValueArray isKindOfClass:[NSArray class]]) {
    reject(@"ERR_INVALID_ARGS", @"Expected an array of key-value pairs", nil);
    return;
  }
  
  dispatch_async(_storageQueue, ^{
    @try {
      NSUserDefaults *defaults = self->_defaults;
      
      for (NSArray *entry in keyValueArray) {
        if (entry.count != 3) {
          reject(@"ERR_INVALID_ARGS", @"Each entry must be [key, type, value]", nil);
          return;
        }
        
        NSString *key = entry[0];
        NSString *type = entry[1];
        NSString *value = entry[2];
        
        if (![key isKindOfClass:[NSString class]]) {
          reject(@"ERR_INVALID_ARGS", @"Keys must be strings", nil);
          return;
        }
        
        NSString *storageKey = [self keyWithPrefix:key];
        NSDictionary *item = [self serializeItem:type value:value];
        
        if (encrypted) {
          NSString *valueToStore = item[@"value"];
          NSMutableDictionary *encryptedItem = [item mutableCopy];
          encryptedItem[@"value"] = [self encryptString:valueToStore];
          [defaults setObject:encryptedItem forKey:storageKey];
        } else {
          [defaults setObject:item forKey:storageKey];
        }
      }
      
      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// MultiGet
RCT_EXPORT_METHOD(multiGet:(NSArray *)keys
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!keys || ![keys isKindOfClass:[NSArray class]]) {
    reject(@"ERR_INVALID_ARGS", @"Expected an array of keys", nil);
    return;
  }
  
  dispatch_async(_storageQueue, ^{
    @try {
      NSUserDefaults *defaults = self->_defaults;
      NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:keys.count];
      
      for (NSString *key in keys) {
        if (![key isKindOfClass:[NSString class]]) {
          reject(@"ERR_INVALID_ARGS", @"Keys must be strings", nil);
          return;
        }
        
        NSString *storageKey = [self keyWithPrefix:key];
        NSDictionary *item = [defaults objectForKey:storageKey];
        
        if (item) {
          NSString *type = item[@"type"];
          id value = item[@"value"];
          
          // Check if the value is encrypted
          if ([type isEqualToString:@"string"] && [value isKindOfClass:[NSString class]] && ![value hasPrefix:@"{"]) {
            NSString *decryptedValue = [self decryptString:value];
            
            if (decryptedValue) {
              // The value was successfully decrypted
              NSMutableDictionary *decryptedItem = [item mutableCopy];
              decryptedItem[@"value"] = decryptedValue;
              result[key] = decryptedItem;
              continue;
            }
          }
          
          result[key] = item;
        } else {
          result[key] = [NSNull null];
        }
      }
      
      resolve(result);
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

// MultiRemove
RCT_EXPORT_METHOD(multiRemove:(NSArray *)keys
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (!keys || ![keys isKindOfClass:[NSArray class]]) {
    reject(@"ERR_INVALID_ARGS", @"Expected an array of keys", nil);
    return;
  }
  
  dispatch_async(_storageQueue, ^{
    @try {
      NSUserDefaults *defaults = self->_defaults;
      
      for (NSString *key in keys) {
        if (![key isKindOfClass:[NSString class]]) {
          reject(@"ERR_INVALID_ARGS", @"Keys must be strings", nil);
          return;
        }
        
        NSString *storageKey = [self keyWithPrefix:key];
        [defaults removeObjectForKey:storageKey];
      }
      
      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
  });
}

#pragma mark - JSI Implementation

// JSI installation method
+ (void)installJSIBindings:(RCTBridge *)bridge {
  // Import the implementation from JSIPureStorage.mm
  extern void installPureStorageJSIBindings(RCTBridge *bridge);
  installPureStorageJSIBindings(bridge);
}

// Additional synchronous methods required by the RNPureStorageInterface

- (BOOL)removeItemSync:(NSString *)key {
  if (!key) {
    return NO;
  }
  
  @try {
    NSString *storageKey = [self keyWithPrefix:key];
    [_defaults removeObjectForKey:storageKey];
    return YES;
  } @catch (NSException *exception) {
    return NO;
  }
}

- (BOOL)clearSync {
  @try {
    // Get all keys with our prefix
    NSArray<NSString *> *allKeys = [self getAllKeysSync];
    
    for (NSString *key in allKeys) {
      NSString *storageKey = [self keyWithPrefix:key];
      [_defaults removeObjectForKey:storageKey];
    }
    
    return YES;
  } @catch (NSException *exception) {
    return NO;
  }
}

- (NSArray<NSString *> *)getAllKeysSync {
  @try {
    NSArray<NSString *> *allKeys = [[_defaults dictionaryRepresentation] allKeys];
    NSMutableArray<NSString *> *filteredKeys = [NSMutableArray new];
    NSString *prefix = RNPureStoragePrefix;
    
    for (NSString *key in allKeys) {
      if ([key hasPrefix:prefix] && ![key isEqualToString:RNPureStorageEncryptionKeyName]) {
        [filteredKeys addObject:[key substringFromIndex:prefix.length]];
      }
    }
    
    return filteredKeys;
  } @catch (NSException *exception) {
    return @[];
  }
}

- (BOOL)hasKeySync:(NSString *)key {
  if (!key) {
    return NO;
  }
  
  @try {
    NSString *storageKey = [self keyWithPrefix:key];
    return [_defaults objectForKey:storageKey] != nil;
  } @catch (NSException *exception) {
    return NO;
  }
}

@end 