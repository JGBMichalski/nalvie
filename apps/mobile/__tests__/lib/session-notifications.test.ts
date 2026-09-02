import * as Notifications from 'expo-notifications';
import { GRACE_PERIOD_MS } from '@nalvie/core';

import {
  addFailedNotificationDeliveredListener,
  cancelAllPendingSessionNotifications,
  cancelFailedNotification,
  cancelSessionNotifications,
  scheduleFailedNotification,
  sendLeaveWarningNotification,
} from '../../lib/session-notifications';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

describe('session-notifications', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('scheduled-id');
  });

  describe('scheduleFailedNotification', () => {
    it('does nothing when OS notification permission is not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      await scheduleFailedNotification();

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('schedules a "session ended" notification GRACE_PERIOD_MS from now', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      await scheduleFailedNotification();

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.body).toMatch(/stepped away too long/i);
      expect(call.trigger).toEqual({
        type: 'date',
        date: new Date(Date.now() + GRACE_PERIOD_MS),
      });
      jest.useRealTimers();
    });

    it('tags the notification so its actual delivery can be told apart from other notifications', async () => {
      await scheduleFailedNotification();

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.data).toEqual({ kind: 'session-failed' });
    });
  });

  describe('addFailedNotificationDeliveredListener', () => {
    it('fires when the OS actually delivers the tagged failed notification', () => {
      const listener = jest.fn();
      let deliver: (event: unknown) => void = () => {};
      (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation((cb) => {
        deliver = cb;
        return { remove: jest.fn() };
      });

      addFailedNotificationDeliveredListener(listener);
      deliver({ request: { content: { data: { kind: 'session-failed' } } } });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('ignores unrelated notifications (e.g. the completed one, or one with no data at all)', () => {
      const listener = jest.fn();
      let deliver: (event: unknown) => void = () => {};
      (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation((cb) => {
        deliver = cb;
        return { remove: jest.fn() };
      });

      addFailedNotificationDeliveredListener(listener);
      deliver({ request: { content: { data: undefined } } });
      deliver({ request: { content: { data: { kind: 'something-else' } } } });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('sendLeaveWarningNotification', () => {
    it('does nothing when OS notification permission is not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      await sendLeaveWarningNotification();

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('delivers immediately (not scheduled for later), mentioning the grace period', async () => {
      await sendLeaveWarningNotification();

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.body).toMatch(/15 seconds/);
      expect(call.trigger).toBeNull();
    });
  });

  describe('cancelFailedNotification / cancelSessionNotifications', () => {
    it('cancels a pending failed notification, and is a no-op if none is pending', async () => {
      await scheduleFailedNotification();
      await cancelFailedNotification();
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('scheduled-id');

      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockClear();
      await cancelFailedNotification();
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it('cancels the pending failed notification', async () => {
      await scheduleFailedNotification();
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockClear();

      await cancelSessionNotifications();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelAllPendingSessionNotifications', () => {
    it('purges every scheduled notification, e.g. left over from a force-quit session', async () => {
      await cancelAllPendingSessionNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    it('forgets any remembered ids, so a later cancel is a no-op rather than cancelling stale ids', async () => {
      await scheduleFailedNotification();

      await cancelAllPendingSessionNotifications();
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockClear();

      await cancelSessionNotifications();

      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
