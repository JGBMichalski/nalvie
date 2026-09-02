import ActivityKit
import Foundation

/// Shared contract between the app and the widget extension.
///
/// This file is deliberately duplicated into the widget target rather than
/// shared via a framework. A Live Activity's attributes type has to be
/// compiled into both binaries, and a whole shared framework target is a lot of
/// project machinery for one small struct. The two copies must stay identical.
struct SessionActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var endsAt: Date
    var isPaused: Bool
  }

  var itemName: String
}
