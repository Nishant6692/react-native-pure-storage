#!/bin/bash

# Script to publish react-native-pure-storage to npm

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Check if logged in to npm
echo "Checking npm login status..."
npm whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "You are not logged in to npm. Please run 'npm login' first."
  exit 1
else
  echo "Logged in as $(npm whoami)"
fi

# Verify package.json
echo "Verifying package.json..."
if grep -q "YourUsername" package.json; then
  echo "ERROR: You need to update the repository and author information in package.json"
  exit 1
fi

# Run tests if they exist
if [ -f "__tests__/index.test.js" ]; then
  echo "Running tests..."
  npm test
  if [ $? -ne 0 ]; then
    echo "Tests failed. Please fix the issues before publishing."
    exit 1
  fi
fi

# Verify version
read -p "Current version is $(node -p "require('./package.json').version"). Is this correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Please update the version in package.json before publishing."
  exit 1
fi

# Final confirmation
read -p "Ready to publish react-native-pure-storage to npm. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Publication aborted."
  exit 1
fi

# Publish
echo "Publishing package..."
npm publish

if [ $? -eq 0 ]; then
  echo "✅ Package published successfully!"
  VERSION=$(node -p "require('./package.json').version")
  echo "Tag the release in git:"
  echo "git tag v$VERSION"
  echo "git push --tags"
else
  echo "❌ Publication failed."
fi 