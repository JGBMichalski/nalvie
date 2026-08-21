// Every test renders through Home eventually, which touches session-notifications
// -> expo-notifications. The real module runs side-effecting native-module setup
// on import (e.g. push token auto-registration), which is slow and noisy under
// Jest and unnecessary here — this app only ever schedules local notifications.
// Test files that need to assert on specific calls still override this with their
// own `jest.mock('expo-notifications', ...)`, which takes precedence.
module.exports = {
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined', canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  scheduleNotificationAsync: jest.fn(async () => 'mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: { DATE: 'date' },
};
