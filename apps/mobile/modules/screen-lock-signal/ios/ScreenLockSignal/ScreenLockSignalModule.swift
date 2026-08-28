import ExpoModulesCore

/// Emits `onLocked` / `onUnlocked` from Apple's protected-data lock/unlock
/// notifications. These fire specifically on device lock/unlock, not on
/// ordinary app backgrounding — see
/// .scratch/screen-lock-safe-sessions/issues/08-ios-native-lock-module-design.md
///
/// Known limitation: on a passcode-less device (no Data Protection), these
/// notifications likely never fire at all. There is no error/negative event —
/// screen-off just looks identical to "no signal," which is what makes the
/// JS-side gate degrade safely to today's pre-fix behavior with zero
/// special-casing.
public class ScreenLockSignalModule: Module {
  // Block-based observers return opaque tokens; hold them so OnDestroy can
  // remove exactly these registrations (removeObserver(self,…) wouldn't —
  // `self` was never registered as an observer).
  private var observers: [NSObjectProtocol] = []

  public func definition() -> ModuleDefinition {
    Name("ScreenLockSignal")

    Events("onLocked", "onUnlocked")

    OnCreate {
      let lockedObserver = NotificationCenter.default.addObserver(
        forName: UIApplication.protectedDataWillBecomeUnavailableNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.sendEvent("onLocked")
      }

      let unlockedObserver = NotificationCenter.default.addObserver(
        forName: UIApplication.protectedDataDidBecomeAvailableNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.sendEvent("onUnlocked")
      }

      self.observers = [lockedObserver, unlockedObserver]
    }

    OnDestroy {
      for observer in self.observers {
        NotificationCenter.default.removeObserver(observer)
      }
      self.observers = []
    }
  }
}
