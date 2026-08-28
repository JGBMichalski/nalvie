// The real local module runs `requireNativeModule('ScreenLockSignal')` at
// import time, which throws outside a real native runtime. Every test that
// touches useLeaveDetection (via useSessionLoop, or transitively via Home)
// goes through this module, so it's mapped globally rather than per-test.
// Tests exercising lock/unlock behavior pass an explicit fake (see
// __tests__/test-utils/fake-lock-signal.ts) instead of relying on this mock.
module.exports = {
  addLockedListener: jest.fn(() => ({ remove: jest.fn() })),
  addUnlockedListener: jest.fn(() => ({ remove: jest.fn() })),
};
