package expo.modules.screenlocksignal

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Emits `onLocked` / `onUnlocked` from Android's screen-off / user-present
 * broadcasts. Deliberately uses ACTION_USER_PRESENT (not ACTION_SCREEN_ON)
 * for "unlocked" — ACTION_SCREEN_ON fires on any display wake, including a
 * glance at a still-locked lock screen, which would misfire the JS-side
 * gate's "unlock restarts the grace clock" rule.
 *
 * See .scratch/screen-lock-safe-sessions/issues/09-android-native-lock-module-design.md
 *
 * Neither action can be manifest-declared (excluded since Android 8.0) —
 * this module owns the only context-registered receiver for them.
 */
class ScreenLockSignalModule : Module() {
  private var receiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("ScreenLockSignal")

    Events("onLocked", "onUnlocked")

    OnCreate {
      val appContext = appContext.reactContext?.applicationContext ?: return@OnCreate

      val filter = IntentFilter().apply {
        addAction(Intent.ACTION_SCREEN_OFF)
        addAction(Intent.ACTION_USER_PRESENT)
      }

      val newReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          when (intent.action) {
            Intent.ACTION_SCREEN_OFF -> sendEvent("onLocked")
            Intent.ACTION_USER_PRESENT -> sendEvent("onUnlocked")
          }
        }
      }

      appContext.registerReceiver(newReceiver, filter)
      receiver = newReceiver
    }

    OnDestroy {
      receiver?.let {
        appContext.reactContext?.applicationContext?.unregisterReceiver(it)
      }
      receiver = null
    }
  }
}
