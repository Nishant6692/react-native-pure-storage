#import <jsi/jsi.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import "RNPureStorage.h"

// Namespace to avoid collisions
namespace pure_storage {
  
using namespace facebook::jsi;
  
// Host object implementation
class JSIPureStorageHostObject : public jsi::HostObject {
private:
  id<RNPureStorageInterface> pureStorage;

public:
  JSIPureStorageHostObject(id<RNPureStorageInterface> storage) : pureStorage(storage) {}
  
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override {
    auto methodName = name.utf8(runtime);
    
    // setItemSync
    if (methodName == "setItemSync") {
      return jsi::Function::createFromHostFunction(
        runtime,
        name,
        4, // key, type, value, encrypted
        [this](jsi::Runtime& runtime, 
              const jsi::Value& thisValue, 
              const jsi::Value* arguments, 
              size_t count) -> jsi::Value {
          if (count < 4) {
            return jsi::Value(false);
          }
          
          NSString *key = [NSString stringWithUTF8String:arguments[0].getString(runtime).utf8(runtime).c_str()];
          NSString *type = [NSString stringWithUTF8String:arguments[1].getString(runtime).utf8(runtime).c_str()];
          NSString *value = [NSString stringWithUTF8String:arguments[2].getString(runtime).utf8(runtime).c_str()];
          BOOL encrypted = arguments[3].getBool();
          
          BOOL result = [pureStorage setItemSync:key type:type value:value encrypted:encrypted];
          return jsi::Value(result);
      });
    }
    
    // getItemSync
    else if (methodName == "getItemSync") {
      return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1, // key
        [this](jsi::Runtime& runtime, 
              const jsi::Value& thisValue, 
              const jsi::Value* arguments, 
              size_t count) -> jsi::Value {
          if (count < 1) {
            return jsi::Value::null();
          }
          
          NSString *key = [NSString stringWithUTF8String:arguments[0].getString(runtime).utf8(runtime).c_str()];
          NSDictionary *result = [pureStorage getItemSync:key];
          
          if (!result) {
            return jsi::Value::null();
          }
          
          jsi::Object jsResult(runtime);
          NSString *type = result[@"type"];
          NSString *value = result[@"value"];
          
          jsResult.setProperty(runtime, "type", jsi::String::createFromUtf8(runtime, [type UTF8String]));
          jsResult.setProperty(runtime, "value", jsi::String::createFromUtf8(runtime, [value UTF8String]));
          
          return jsResult;
      });
    }
    
    // removeItemSync
    else if (methodName == "removeItemSync") {
      return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1, // key
        [this](jsi::Runtime& runtime, 
              const jsi::Value& thisValue, 
              const jsi::Value* arguments, 
              size_t count) -> jsi::Value {
          if (count < 1) {
            return jsi::Value(false);
          }
          
          NSString *key = [NSString stringWithUTF8String:arguments[0].getString(runtime).utf8(runtime).c_str()];
          BOOL result = [pureStorage removeItemSync:key];
          
          return jsi::Value(result);
      });
    }
    
    // clearSync
    else if (methodName == "clearSync") {
      return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [this](jsi::Runtime& runtime, 
              const jsi::Value& thisValue, 
              const jsi::Value* arguments, 
              size_t count) -> jsi::Value {
          BOOL result = [pureStorage clearSync];
          return jsi::Value(result);
      });
    }
    
    // getAllKeysSync
    else if (methodName == "getAllKeysSync") {
      return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [this](jsi::Runtime& runtime, 
              const jsi::Value& thisValue, 
              const jsi::Value* arguments, 
              size_t count) -> jsi::Value {
          NSArray<NSString *> *keys = [pureStorage getAllKeysSync];
          
          jsi::Array result(runtime, keys.count);
          
          for (NSUInteger i = 0; i < keys.count; i++) {
            NSString *key = keys[i];
            result.setValueAtIndex(runtime, i, jsi::String::createFromUtf8(runtime, [key UTF8String]));
          }
          
          return result;
      });
    }
    
    // hasKeySync
    else if (methodName == "hasKeySync") {
      return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1, // key
        [this](jsi::Runtime& runtime, 
              const jsi::Value& thisValue, 
              const jsi::Value* arguments, 
              size_t count) -> jsi::Value {
          if (count < 1) {
            return jsi::Value(false);
          }
          
          NSString *key = [NSString stringWithUTF8String:arguments[0].getString(runtime).utf8(runtime).c_str()];
          BOOL result = [pureStorage hasKeySync:key];
          
          return jsi::Value(result);
      });
    }
    
    return jsi::Value::undefined();
  }
};

} // namespace pure_storage

@protocol RNPureStorageInterface
- (BOOL)setItemSync:(NSString *)key type:(NSString *)type value:(NSString *)value encrypted:(BOOL)encrypted;
- (NSDictionary *)getItemSync:(NSString *)key;
- (BOOL)removeItemSync:(NSString *)key;
- (BOOL)clearSync;
- (NSArray<NSString *> *)getAllKeysSync;
- (BOOL)hasKeySync:(NSString *)key;
@end

// C-style function to install the JSI bindings
RCT_EXTERN void installPureStorageJSIBindings(RCTBridge *bridge) {
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
  
  if (!cxxBridge.runtime) {
    return;
  }
  
  // Get the RNPureStorage module
  RNPureStorage *pureStorage = [bridge moduleForClass:[RNPureStorage class]];
  if (!pureStorage) {
    return;
  }
  
  // Install the bindings
  auto jsiRuntime = (facebook::jsi::Runtime *)cxxBridge.runtime;
  auto hostObject = std::make_shared<pure_storage::JSIPureStorageHostObject>(pureStorage);
  
  jsiRuntime->global().setProperty(
    *jsiRuntime,
    facebook::jsi::PropNameID::forAscii(*jsiRuntime, "JSIPureStorage"),
    facebook::jsi::Object::createFromHostObject(*jsiRuntime, hostObject)
  );
} 