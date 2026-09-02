package expo.modules.screenlocksignal

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Emits `onLocked` / `onUnlocked` from Android's screen-off / user-present
 * broadcasts. Deliberately uses ACTION_USER_PRESENT (not ACTION_SCREEN_ON)
 * for "unlocked" — ACTION_SCREEN_ON fires on any display wake, including a
 * glance at a still-locked lock screen, which would misfire the JS-side
 * gate's "unlock restarts the grace clock" rule.
 *
 * Also starts/stops `SessionService`, which owns everything that has to happen
 * on schedule while the screen is locked (countdown notification, stopping the
 * ambient audio, and the completion notification).
 *
 * Neither ACTION_SCREEN_OFF/ACTION_USER_PRESENT can be manifest-declared
 * (excluded since Android 8.0) — this module owns the only context-registered
 * receiver for them.
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

    // `endAtMs` is an absolute epoch time (Date.now()-style), matching
    // `completesAt` on the JS side.
    Function("startSessionService") { endAtMs: Double, itemName: String ->
      sessionIntent(SessionService.ACTION_START)?.let {
        it.putExtra(SessionService.EXTRA_END_AT_MS, endAtMs.toLong())
        it.putExtra(SessionService.EXTRA_ITEM_NAME, itemName)
        startSessionService(it)
      }
    }

    Function("pauseSessionService") {
      sessionIntent(SessionService.ACTION_PAUSE)?.let { startSessionService(it) }
    }

    Function("resumeSessionService") { endAtMs: Double ->
      sessionIntent(SessionService.ACTION_RESUME)?.let {
        it.putExtra(SessionService.EXTRA_END_AT_MS, endAtMs.toLong())
        startSessionService(it)
      }
    }

    Function("expectFailureAt") { endAtMs: Double ->
      sessionIntent(SessionService.ACTION_EXPECT_FAILURE)?.let {
        it.putExtra(SessionService.EXTRA_END_AT_MS, endAtMs.toLong())
        startSessionService(it)
      }
    }

    Function("stopSessionService") {
      sessionIntent(SessionService.ACTION_STOP)?.let { startSessionService(it) }
    }
  }

  private fun sessionIntent(action: String): Intent? {
    val context = appContext.reactContext ?: return null
    return Intent(context, SessionService::class.java).setAction(action)
  }

  private fun startSessionService(intent: Intent) {
    val context = appContext.reactContext ?: return
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
      Log.i(TAG, "started SessionService: ${intent.action}")
    } catch (e: Exception) {
      // Background-start restrictions can refuse this. Logged rather than
      // swallowed: a refusal means no countdown, no timed audio stop and no
      // completion notification, which is the entire feature.
      Log.e(TAG, "start of SessionService REFUSED: ${intent.action}", e)
    }
  }

  private companion object {
    const val TAG = "NalvieSession"
  }
}
