require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ScreenLockSignal'
  s.version        = package['version'] || '1.0.0'
  s.summary        = 'Detects device screen lock/unlock via protected-data notifications.'
  s.author         = 'Nalvie'
  s.homepage       = 'https://github.com/'
  s.platforms      = { ios: '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ScreenLockSignal/**/*.{h,m,swift}'

  s.resource_bundles = {
    'ScreenLockSignal' => ['ScreenLockSignal/Resources/**/*']
  }
end
