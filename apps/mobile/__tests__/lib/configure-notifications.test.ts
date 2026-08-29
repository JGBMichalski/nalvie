import * as Notifications from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
}));

describe('configure-notifications', () => {
  it('registers a handler that shows notifications received while foregrounded', async () => {
    // Without this, the OS defaults to silently dropping a notification
    // delivered while the app still counts as foregrounded — exactly the
    // window sendLeaveWarningNotification's immediate (trigger: null)
    // delivery lands in right as the app backgrounds.
    jest.isolateModules(() => {
      require('../../lib/configure-notifications');
    });

    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    const { handleNotification } = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];
    await expect(handleNotification()).resolves.toEqual(
      expect.objectContaining({ shouldShowBanner: true, shouldShowList: true }),
    );
  });
});
