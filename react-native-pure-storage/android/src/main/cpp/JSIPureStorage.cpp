#include <jni.h>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>
#include <jsi/JSIDynamic.h>

using namespace facebook::jsi;
using namespace facebook::react;
using namespace facebook::jni;

// Helper class for JSI hosting
class JSIPureStorageHostObject : public HostObject {
private:
    jni::global_ref<jobject> javaPureStorage_;
    jni::alias_ref<jobject> callInvoker_;
    jclass storageClass_;
    JNIEnv *env_;

public:
    JSIPureStorageHostObject(jni::alias_ref<jobject> javaPureStorage, jni::alias_ref<jobject> jsCallInvoker)
        : javaPureStorage_(jni::make_global(javaPureStorage)) {
        callInvoker_ = jsCallInvoker;
        env_ = jni::Environment::current();
        storageClass_ = env_->GetObjectClass(javaPureStorage_.get());
    }

    // Main JSI methods
    Value get(Runtime& runtime, const PropNameID& propName) override {
        std::string name = propName.utf8(runtime);
        
        // setItem
        if (name == "setItemSync") {
            return Function::createFromHostFunction(
                runtime,
                PropNameID::forAscii(runtime, "setItemSync"),
                4,  // Key, type, value, encrypted
                [this](Runtime& runtime, const Value& thisVal, const Value* args, size_t count) -> Value {
                    if (count < 4) {
                        return Value(false);
                    }
                    
                    std::string key = args[0].asString(runtime).utf8(runtime);
                    std::string type = args[1].asString(runtime).utf8(runtime);
                    std::string value = args[2].asString(runtime).utf8(runtime);
                    bool encrypted = args[3].getBool();
                    
                    jmethodID method = env_->GetMethodID(storageClass_, "setItemSync", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Z)Z");
                    jstring jKey = env_->NewStringUTF(key.c_str());
                    jstring jType = env_->NewStringUTF(type.c_str());
                    jstring jValue = env_->NewStringUTF(value.c_str());
                    
                    jboolean result = env_->CallBooleanMethod(
                        javaPureStorage_.get(),
                        method,
                        jKey,
                        jType,
                        jValue,
                        encrypted
                    );
                    
                    env_->DeleteLocalRef(jKey);
                    env_->DeleteLocalRef(jType);
                    env_->DeleteLocalRef(jValue);
                    
                    return Value(result == JNI_TRUE);
                }
            );
        }
        
        // getItem
        else if (name == "getItemSync") {
            return Function::createFromHostFunction(
                runtime,
                PropNameID::forAscii(runtime, "getItemSync"),
                1,  // Key
                [this](Runtime& runtime, const Value& thisVal, const Value* args, size_t count) -> Value {
                    if (count < 1) {
                        return Value::null();
                    }
                    
                    std::string key = args[0].asString(runtime).utf8(runtime);
                    
                    jmethodID method = env_->GetMethodID(storageClass_, "getItemSync", "(Ljava/lang/String;)Lcom/facebook/react/bridge/ReadableMap;");
                    jstring jKey = env_->NewStringUTF(key.c_str());
                    
                    jobject result = env_->CallObjectMethod(
                        javaPureStorage_.get(),
                        method,
                        jKey
                    );
                    
                    env_->DeleteLocalRef(jKey);
                    
                    if (result == nullptr) {
                        return Value::null();
                    }
                    
                    // Convert ReadableMap to JSI object
                    auto resultObj = jni::adopt_local(result);
                    auto resultMap = jni::static_ref_cast<facebook::react::ReadableMap::javaobject>(resultObj);
                    auto dynamicFromValue = jni::static_ref_cast<facebook::react::DynamicFromValue::javaobject>(resultMap);
                    
                    auto jsiValueFromDynamic = dynamicFromValue->cthis()->getJSIValue(runtime);
                    if (jsiValueFromDynamic.isObject()) {
                        return jsiValueFromDynamic;
                    }
                    
                    return Value::null();
                }
            );
        }
        
        // removeItem
        else if (name == "removeItemSync") {
            return Function::createFromHostFunction(
                runtime,
                PropNameID::forAscii(runtime, "removeItemSync"),
                1,  // Key
                [this](Runtime& runtime, const Value& thisVal, const Value* args, size_t count) -> Value {
                    if (count < 1) {
                        return Value(false);
                    }
                    
                    std::string key = args[0].asString(runtime).utf8(runtime);
                    
                    jmethodID method = env_->GetMethodID(storageClass_, "removeItemSync", "(Ljava/lang/String;)Z");
                    jstring jKey = env_->NewStringUTF(key.c_str());
                    
                    jboolean result = env_->CallBooleanMethod(
                        javaPureStorage_.get(),
                        method,
                        jKey
                    );
                    
                    env_->DeleteLocalRef(jKey);
                    
                    return Value(result == JNI_TRUE);
                }
            );
        }
        
        // clear
        else if (name == "clearSync") {
            return Function::createFromHostFunction(
                runtime,
                PropNameID::forAscii(runtime, "clearSync"),
                0,
                [this](Runtime& runtime, const Value& thisVal, const Value* args, size_t count) -> Value {
                    jmethodID method = env_->GetMethodID(storageClass_, "clearSync", "()Z");
                    
                    jboolean result = env_->CallBooleanMethod(
                        javaPureStorage_.get(),
                        method
                    );
                    
                    return Value(result == JNI_TRUE);
                }
            );
        }
        
        // getAllKeys
        else if (name == "getAllKeysSync") {
            return Function::createFromHostFunction(
                runtime,
                PropNameID::forAscii(runtime, "getAllKeysSync"),
                0,
                [this](Runtime& runtime, const Value& thisVal, const Value* args, size_t count) -> Value {
                    jmethodID method = env_->GetMethodID(storageClass_, "getAllKeysSync", "()[Ljava/lang/String;");
                    
                    jobjectArray resultArray = (jobjectArray)env_->CallObjectMethod(
                        javaPureStorage_.get(),
                        method
                    );
                    
                    if (resultArray == nullptr) {
                        return Array::createWithElements(runtime);
                    }
                    
                    jsize length = env_->GetArrayLength(resultArray);
                    std::vector<Value> keys;
                    keys.reserve(length);
                    
                    for (jsize i = 0; i < length; i++) {
                        jstring jKey = (jstring)env_->GetObjectArrayElement(resultArray, i);
                        const char* charKey = env_->GetStringUTFChars(jKey, 0);
                        keys.push_back(String::createFromUtf8(runtime, charKey));
                        env_->ReleaseStringUTFChars(jKey, charKey);
                        env_->DeleteLocalRef(jKey);
                    }
                    
                    env_->DeleteLocalRef(resultArray);
                    
                    return Array::createWithElements(runtime, keys);
                }
            );
        }
        
        // hasKey
        else if (name == "hasKeySync") {
            return Function::createFromHostFunction(
                runtime,
                PropNameID::forAscii(runtime, "hasKeySync"),
                1,  // Key
                [this](Runtime& runtime, const Value& thisVal, const Value* args, size_t count) -> Value {
                    if (count < 1) {
                        return Value(false);
                    }
                    
                    std::string key = args[0].asString(runtime).utf8(runtime);
                    
                    jmethodID method = env_->GetMethodID(storageClass_, "hasKeySync", "(Ljava/lang/String;)Z");
                    jstring jKey = env_->NewStringUTF(key.c_str());
                    
                    jboolean result = env_->CallBooleanMethod(
                        javaPureStorage_.get(),
                        method,
                        jKey
                    );
                    
                    env_->DeleteLocalRef(jKey);
                    
                    return Value(result == JNI_TRUE);
                }
            );
        }
        
        // Return undefined for unknown properties
        return Value::undefined();
    }
};

// JNI implementation
extern "C" JNIEXPORT void JNICALL
Java_com_purestorage_JSIPureStorageModule_nativeInstall(JNIEnv* env, jclass clazz, jobject context, jlong jsContextPtr) {
    auto runtime = reinterpret_cast<facebook::jsi::Runtime*>(jsContextPtr);
    auto reactContext = jni::adopt_local(context);
    
    // Get the ReactApplicationContext's JavaScriptContextHolder
    jclass reactContextClass = env->FindClass("com/facebook/react/bridge/ReactApplicationContext");
    jmethodID getJSModuleMethod = env->GetMethodID(reactContextClass, "getJSModule", 
        "(Ljava/lang/Class;)Lcom/facebook/react/bridge/JavaScriptModule;");
    
    jclass jsCallInvokerHolderClass = env->FindClass("com/facebook/react/bridge/JSCallInvokerHolder");
    jobject jsCallInvokerHolder = env->CallObjectMethod(context, getJSModuleMethod, jsCallInvokerHolderClass);
    
    // Create Java PureStorage module instance
    jclass jsiPureStorageClass = env->FindClass("com/purestorage/JSIPureStorageModule");
    jmethodID constructor = env->GetMethodID(jsiPureStorageClass, "<init>", "(Lcom/facebook/react/bridge/ReactApplicationContext;)V");
    jobject javaPureStorage = env->NewObject(jsiPureStorageClass, constructor, context);
    
    // Create the C++ host object and install it into the JS runtime
    auto hostObject = std::make_shared<JSIPureStorageHostObject>(
        jni::adopt_local(javaPureStorage),
        jni::adopt_local(jsCallInvokerHolder)
    );
    
    runtime->global().setProperty(
        *runtime,
        PropNameID::forAscii(*runtime, "JSIPureStorage"),
        Object::createFromHostObject(*runtime, hostObject)
    );
} 