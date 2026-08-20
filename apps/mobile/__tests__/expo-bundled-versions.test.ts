import semver from 'semver';

import packageJson from '../package.json';

// This test ensures that the versions of native dependencies installed
// in this project are compatible with the versions of those dependencies
// that ship with Expo Go.
const bundled: Record<string, string> = require('expo/bundledNativeModules.json');

const dependencies = packageJson.dependencies as Record<string, string>;

const nativeDependencies = Object.keys(dependencies).filter((name) => name in bundled);

describe('Expo-bundled native modules', () => {
  it('covers the libraries that ship native code', () => {
    expect(nativeDependencies).toContain('react-native-reanimated');
    expect(nativeDependencies).toContain('react-native-worklets');
  });

  it.each(nativeDependencies)('installs a version of %s that Expo Go can load', (name) => {
    const expected = bundled[name];
    const installed = require(`${name}/package.json`).version as string;

    expect(semver.satisfies(installed, expected)).toBe(true);
  });
});
