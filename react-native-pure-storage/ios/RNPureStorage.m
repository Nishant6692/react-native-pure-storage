#import "RNPureStorage.h"

@implementation RNPureStorage

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(setItem:(NSString *)key
                  value:(NSString *)value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        [[NSUserDefaults standardUserDefaults] setObject:value forKey:key];
        BOOL success = [[NSUserDefaults standardUserDefaults] synchronize];
        resolve(@(success));
    } @catch (NSException *exception) {
        reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        id value = [[NSUserDefaults standardUserDefaults] objectForKey:key];
        resolve(value == nil ? [NSNull null] : value);
    } @catch (NSException *exception) {
        reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(removeItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
        BOOL success = [[NSUserDefaults standardUserDefaults] synchronize];
        resolve(@(success));
    } @catch (NSException *exception) {
        reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(clear:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        NSDictionary *dictionary = [defaults dictionaryRepresentation];
        
        // Only clear keys that belong to our module to avoid clearing system or app settings
        NSString *prefix = @"RNPureStorage_";
        for (NSString *key in dictionary) {
            if ([key hasPrefix:prefix]) {
                [defaults removeObjectForKey:key];
            }
        }
        
        BOOL success = [defaults synchronize];
        resolve(@(success));
    } @catch (NSException *exception) {
        reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getAllKeys:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        NSDictionary *dictionary = [defaults dictionaryRepresentation];
        NSMutableArray *keys = [NSMutableArray array];
        
        // Only include keys that belong to our module
        NSString *prefix = @"RNPureStorage_";
        for (NSString *key in dictionary) {
            if ([key hasPrefix:prefix]) {
                [keys addObject:key];
            }
        }
        
        resolve(keys);
    } @catch (NSException *exception) {
        reject(@"ERR_UNEXPECTED_EXCEPTION", exception.reason, nil);
    }
}

@end 