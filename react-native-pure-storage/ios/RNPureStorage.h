#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>

@protocol RNPureStorageInterface
- (BOOL)setItemSync:(NSString *)key type:(NSString *)type value:(NSString *)value encrypted:(BOOL)encrypted;
- (NSDictionary *)getItemSync:(NSString *)key;
- (BOOL)removeItemSync:(NSString *)key;
- (BOOL)clearSync;
- (NSArray<NSString *> *)getAllKeysSync;
- (BOOL)hasKeySync:(NSString *)key;
@end

@interface RNPureStorage : NSObject <RCTBridgeModule, RNPureStorageInterface>
// JSI installation method
+ (void)installJSIBindings:(RCTBridge *)bridge;
@end 