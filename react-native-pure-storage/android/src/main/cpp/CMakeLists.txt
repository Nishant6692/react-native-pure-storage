cmake_minimum_required(VERSION 3.13)

# Set the project name
project(JSIPureStorage)

# Locate package with header files
find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

# Define the library target
add_library(
  JSIPureStorage
  SHARED
  JSIPureStorage.cpp
)

# Link the libraries
target_link_libraries(
  JSIPureStorage
  fbjni::fbjni
  ReactAndroid::jsi
  ReactAndroid::react_nativemodule_core
)

# Set properties for Android 
set_target_properties(
  JSIPureStorage PROPERTIES
  CXX_STANDARD 17
  CXX_STANDARD_REQUIRED ON
  POSITION_INDEPENDENT_CODE ON
)

# Include directories
target_include_directories(
  JSIPureStorage 
  PRIVATE
  "${NODE_MODULES_DIR}/react-native/ReactCommon"
  "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
  "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule"
) 