import ActivityKit
import SwiftUI
import WidgetKit

/// Lock-screen / Dynamic Island presentation of an in-progress focus session.
///
/// Everything here is rendered by the system from `ContentState`, including the
/// countdown itself.
struct SessionActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SessionActivityAttributes.self) { context in
      LockScreenView(context: context)
        .padding()
        .activityBackgroundTint(Color.black.opacity(0.6))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label("Nalvie", systemImage: "fish")
            .font(.caption)
        }
        DynamicIslandExpandedRegion(.trailing) {
          CountdownView(state: context.state)
            .font(.title3.monospacedDigit())
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text("Focus session")
            .font(.caption)
            .foregroundStyle(.secondary)
        }
      } compactLeading: {
        Image(systemName: "fish")
      } compactTrailing: {
        CountdownView(state: context.state)
          .font(.caption.monospacedDigit())
      } minimal: {
        Image(systemName: "fish")
      }
    }
  }
}

struct LockScreenView: View {
  let context: ActivityViewContext<SessionActivityAttributes>

  var body: some View {
    HStack(spacing: 12) {
      Image(systemName: "fish")
        .font(.title2)
      VStack(alignment: .leading, spacing: 2) {
        CountdownView(state: context.state)
          .font(.title2.monospacedDigit())
          .bold()
        Text("Nalvie focus session")
          .font(.caption)
          .foregroundStyle(.secondary)
      }
      Spacer()
    }
  }
}

struct CountdownView: View {
  let state: SessionActivityAttributes.ContentState

  var body: some View {
    if state.isPaused {
      Text("Paused")
    } else {
      Text(timerInterval: Date()...state.endsAt, countsDown: true)
    }
  }
}

@main
struct SessionActivityBundle: WidgetBundle {
  var body: some Widget {
    SessionActivityWidget()
  }
}
