// Without this, a test file that renders any screen touching
// sessionRepository/settingsRepository without first calling
// resetXForTests() would hit real expo-sqlite, which throws under
// jest-expo's native-module mock.
import { resetSessionRepositoryForTests, resetSettingsRepositoryForTests } from '../lib/repository';

beforeEach(() => {
  resetSessionRepositoryForTests();
  resetSettingsRepositoryForTests();
});
