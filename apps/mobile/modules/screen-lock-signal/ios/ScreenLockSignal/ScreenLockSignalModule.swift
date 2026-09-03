import ActivityKit
import AVFoundation
import ExpoModulesCore
import UserNotifications

/// Emits `onLocked` / `onUnlocked` from Apple's protected-data lock/unlock
/// notifications. These fire specifically on device lock/unlock, not on
/// ordinary app backgrounding.
///
/// Also owns the in-progress session's lock-screen presence, mirroring
/// Android's `SessionService`: a Live Activity for the countdown, a scheduled
/// local notification for completion, and a timer that silences the ambient
/// audio and plays a completion chime the moment the session is due to end.
///
/// Known limitation: on a passcode-less device (no Data Protection), the
/// lock/unlock notifications likely never fire at all. There is no
/// error/negative event — screen-off just looks identical to "no signal," which
/// is what makes the JS-side gate degrade safely to today's pre-fix behavior
/// with zero special-casing.
public class ScreenLockSignalModule: Module {
  // Block-based observers return opaque tokens; hold them so OnDestroy can
  // remove exactly these registrations (removeObserver(self,…) wouldn't —
  // `self` was never registered as an observer).
  private var observers: [NSObjectProtocol] = []

  private var endTimer: Timer?
  private var itemName: String = "new fish"
  private var expectingFailure = false

  private var chimePlayer: AVAudioPlayer?
  private var chimeDelegate: ChimeCompletionDelegate?

  private static let completedNotificationId = "nalvie-session-completed"

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
      self.endTimer?.invalidate()
      self.endTimer = nil
    }

    Function("startSessionService") { (endAtMs: Double, itemName: String) in
      self.itemName = itemName
      self.expectingFailure = false
      let endsAt = Self.date(from: endAtMs)
      self.startActivity(endsAt: endsAt, itemName: itemName)
      self.scheduleCompletedNotification(at: endsAt)
      self.armEndTimer(at: endsAt)
    }

    Function("pauseSessionService") {
      self.endTimer?.invalidate()
      self.endTimer = nil
      self.cancelCompletedNotification()
      self.updateActivity(endsAt: Date(), isPaused: true)
    }

    Function("resumeSessionService") { (endAtMs: Double) in
      self.expectingFailure = false
      let endsAt = Self.date(from: endAtMs)
      self.updateActivity(endsAt: endsAt, isPaused: false)
      self.scheduleCompletedNotification(at: endsAt)
      self.armEndTimer(at: endsAt)
    }

    Function("expectFailureAt") { (endAtMs: Double) in
      // The deadline now means "failed", so the audio still has to stop on
      // time, but the completion notification must not fire — a separate
      // "ended early" notification is scheduled from JS for the same instant.
      self.expectingFailure = true
      self.cancelCompletedNotification()
      self.armEndTimer(at: Self.date(from: endAtMs))
    }

    Function("stopSessionService") {
      self.endTimer?.invalidate()
      self.endTimer = nil
      self.expectingFailure = false
      self.cancelCompletedNotification()
      self.endActivity()
    }
  }

  private static func date(from epochMs: Double) -> Date {
    Date(timeIntervalSince1970: epochMs / 1000)
  }

  // MARK: - Session end

  private func armEndTimer(at endsAt: Date) {
    endTimer?.invalidate()
    let interval = max(0, endsAt.timeIntervalSinceNow)
    let timer = Timer(timeInterval: interval, repeats: false) { [weak self] _ in
      self?.handleSessionEnded()
    }
    RunLoop.main.add(timer, forMode: .common)
    endTimer = timer
  }

  private func handleSessionEnded() {
    endTimer = nil
    
    stopAudio()
    playChime()
    endActivity()
  }

  private func stopAudio() {
    do {
      try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      // Playback is decorative; never let this disrupt resolving the session.
    }
  }

  private func playChime() {
    guard let url = Self.chimeURL() else { return }

    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playback, mode: .default, options: [.duckOthers])
      try session.setActive(true)

      let player = try AVAudioPlayer(contentsOf: url)
      let delegate = ChimeCompletionDelegate { [weak self] in
        self?.finishChime()
      }
      player.delegate = delegate
      chimeDelegate = delegate
      chimePlayer = player
      player.play()
    } catch {
      finishChime()
    }
  }

  private func finishChime() {
    chimePlayer = nil
    chimeDelegate = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private static func chimeURL() -> URL? {
    let moduleBundle = Bundle(for: ScreenLockSignalModule.self)
    if
      let resourceBundleURL = moduleBundle.url(forResource: "ScreenLockSignal", withExtension: "bundle"),
      let resourceBundle = Bundle(url: resourceBundleURL)
    {
      return resourceBundle.url(forResource: "bell_ding", withExtension: "mp3")
    }
    return moduleBundle.url(forResource: "bell_ding", withExtension: "mp3")
  }

  // MARK: - Live Activity

  private func startActivity(endsAt: Date, itemName: String) {
    guard #available(iOS 16.2, *) else { return }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

    endActivity()

    let attributes = SessionActivityAttributes(itemName: itemName)
    let state = SessionActivityAttributes.ContentState(endsAt: endsAt, isPaused: false)
    do {
      _ = try Activity.request(
        attributes: attributes,
        content: .init(state: state, staleDate: endsAt),
        pushType: nil
      )
    } catch {
      // Live Activities can be refused (disabled by the user, too many active).
      // The session itself is unaffected — only its lock-screen display.
    }
  }

  private func updateActivity(endsAt: Date, isPaused: Bool) {
    guard #available(iOS 16.2, *) else { return }
    let state = SessionActivityAttributes.ContentState(endsAt: endsAt, isPaused: isPaused)
    Task {
      for activity in Activity<SessionActivityAttributes>.activities {
        await activity.update(.init(state: state, staleDate: isPaused ? nil : endsAt))
      }
    }
  }

  private func endActivity() {
    guard #available(iOS 16.2, *) else { return }
    Task {
      for activity in Activity<SessionActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }

  // MARK: - Completion notification

  /// Scheduled rather than fired from `handleSessionEnded` so it still arrives
  /// if the app is terminated mid-session.
  private func scheduleCompletedNotification(at date: Date) {
    cancelCompletedNotification()
    guard date > Date() else { return }

    let content = UNMutableNotificationContent()
    content.title = "Nalvie"
    content.body = "Your tank grew! A \(itemName) was added while you were away."
    content.sound = .default

    let components = Calendar.current.dateComponents(
      [.year, .month, .day, .hour, .minute, .second],
      from: date
    )
    let request = UNNotificationRequest(
      identifier: Self.completedNotificationId,
      content: content,
      trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
    )
    UNUserNotificationCenter.current().add(request)
  }

  private func cancelCompletedNotification() {
    UNUserNotificationCenter.current()
      .removePendingNotificationRequests(withIdentifiers: [Self.completedNotificationId])
  }
}

private class ChimeCompletionDelegate: NSObject, AVAudioPlayerDelegate {
  private let onFinish: () -> Void

  init(onFinish: @escaping () -> Void) {
    self.onFinish = onFinish
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    onFinish()
  }

  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
    onFinish()
  }
}
