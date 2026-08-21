import { settingsRepository } from './repository';

// Shared by the intro's Skip and Get-started actions
export async function completeOnboarding(): Promise<void> {
  const settings = await settingsRepository.getSettings();
  await settingsRepository.saveSettings({ ...settings, hasCompletedOnboarding: true });
}
