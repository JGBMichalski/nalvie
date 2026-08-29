import * as Notifications from 'expo-notifications';

// Without this, the OS defaults to *not* showing a notification if it's
// received while the app still counts as foregrounded — the exact window
// sendLeaveWarningNotification's immediate (trigger: null) delivery lands in
// right as the app backgrounds. Scheduled notifications (e.g.
// scheduleFailedNotification/scheduleCompletedNotification) are unaffected —
// by the time those fire, the app is genuinely backgrounded, which this
// handler has no say over.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
