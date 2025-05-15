#!/bin/bash

# Script to create a downloadable package of react-native-pure-storage

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Create a temporary directory for the package
TEMP_DIR="./temp-package"
PACKAGE_NAME="react-native-pure-storage"
ZIP_NAME="${PACKAGE_NAME}.zip"

# Remove any existing temporary directory and zip file
rm -rf $TEMP_DIR
rm -f $ZIP_NAME

# Create the directory structure
mkdir -p $TEMP_DIR/$PACKAGE_NAME
mkdir -p $TEMP_DIR/$PACKAGE_NAME/android/src/main/java/com/purestorage
mkdir -p $TEMP_DIR/$PACKAGE_NAME/ios
mkdir -p $TEMP_DIR/$PACKAGE_NAME/example
mkdir -p $TEMP_DIR/$PACKAGE_NAME/scripts

# Copy the main files
cp package.json $TEMP_DIR/$PACKAGE_NAME/
cp index.js $TEMP_DIR/$PACKAGE_NAME/
cp index.d.ts $TEMP_DIR/$PACKAGE_NAME/
cp README.md $TEMP_DIR/$PACKAGE_NAME/
cp react-native-pure-storage.podspec $TEMP_DIR/$PACKAGE_NAME/

# Copy Android files
cp android/build.gradle $TEMP_DIR/$PACKAGE_NAME/android/
cp android/src/main/AndroidManifest.xml $TEMP_DIR/$PACKAGE_NAME/android/src/main/
cp android/src/main/java/com/purestorage/RNPureStorageModule.java $TEMP_DIR/$PACKAGE_NAME/android/src/main/java/com/purestorage/
cp android/src/main/java/com/purestorage/RNPureStoragePackage.java $TEMP_DIR/$PACKAGE_NAME/android/src/main/java/com/purestorage/

# Copy iOS files
cp ios/RNPureStorage.h $TEMP_DIR/$PACKAGE_NAME/ios/
cp ios/RNPureStorage.m $TEMP_DIR/$PACKAGE_NAME/ios/

# Copy example app
cp example/App.js $TEMP_DIR/$PACKAGE_NAME/example/
cp example/package.json $TEMP_DIR/$PACKAGE_NAME/example/
cp example/README.md $TEMP_DIR/$PACKAGE_NAME/example/
cp scripts/create-package.sh $TEMP_DIR/$PACKAGE_NAME/scripts/

# Create the zip file
cd $TEMP_DIR
zip -r ../$ZIP_NAME $PACKAGE_NAME

# Cleanup
cd ..
rm -rf $TEMP_DIR

echo "Package created: $ZIP_NAME"
echo "You can distribute this file for users to download and extract." 