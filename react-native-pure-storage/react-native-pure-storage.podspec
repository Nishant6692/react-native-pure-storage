require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "react-native-pure-storage"
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']
  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platform     = :ios, "11.0"
  s.source       = { :git => package['repository']['url'], :tag => "v#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.requires_arc = true
  
  s.dependency "React-Core"
  s.dependency "React-jsi"
  s.dependency "React-cxxreact"
  s.dependency "React-callinvoker"
  
  # Needed for C++ support
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\""
  }
end 