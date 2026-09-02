import type { EventSubscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import { GRACE_PERIOD_MS } from '@nalvie/core';

import { hasNotificationPermission } from './notification-permissions';

// Notifications for a session the user walked away from.

type NotificationKind = 'failed';

const scheduledIds: Record<NotificationKind, string | null> = { failed: null };
const FAILED_NOTIFICATION_DATA = { kind: 'session-failed' } as const;

async function canNotify(): Promise<boolean> {
  return hasNotificationPermission();
}

async function cancel(kind: NotificationKind): Promise<void> {
  const id = scheduledIds[kind];
  if (!id) return;
  scheduledIds[kind] = null;
  await Notifications.cancelScheduledNotificationAsync(id);
}

// Scheduled the moment the app backgrounds during an active, unpaused session.
export async function scheduleFailedNotification(): Promise<void> {
  await cancelFailedNotification();
  if (!(await canNotify())) return;

  scheduledIds.failed = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nalvie',
      body: 'Session ended — you stepped away too long. No reward this time.',
      data: FAILED_NOTIFICATION_DATA,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + GRACE_PERIOD_MS),
    },
  });
}

export function addFailedNotificationDeliveredListener(listener: () => void): EventSubscription {
  return Notifications.addNotificationReceivedListener((event) => {
    if (event.request.content.data?.kind === FAILED_NOTIFICATION_DATA.kind) listener();
  });
}

export async function sendLeaveWarningNotification(): Promise<void> {
  if (!(await canNotify())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nalvie',
      body: `Your session will end in ${Math.round(GRACE_PERIOD_MS / 1000)} seconds unless you return.`,
    },
    trigger: null,
  });
}

export function cancelFailedNotification(): Promise<void> {
  return cancel('failed');
}

// Called once a session resolves in-app (foregrounded)
export async function cancelSessionNotifications(): Promise<void> {
  await cancelFailedNotification();
}

// Called on app launch: a force-quit means any notification scheduled
// for the previous session's now-lost in-memory id can't be cancelled
// by id, so purge everything scheduled instead.
export async function cancelAllPendingSessionNotifications(): Promise<void> {
  scheduledIds.failed = null;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
