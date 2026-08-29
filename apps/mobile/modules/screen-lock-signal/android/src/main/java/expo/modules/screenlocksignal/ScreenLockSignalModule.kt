package expo.modules.screenlocksignal

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Emits `onLocked` / `onUnlocked` from Android's screen-off / user-present
 * broadcasts. Deliberately uses ACTION_USER_PRESENT (not ACTION_SCREEN_ON)
 * for "unlocked" — ACTION_SCREEN_ON fires on any display wake, including a
 * glance at a still-locked lock screen, which would misfire the JS-side
 * gate's "unlock restarts the grace clock" rule.
 *
 * Also schedules a *native* alarm to stop ambient audio at the session's
 * completion/failure instant — confirmed on-device that no JS (timers,
 * effects, notification listeners) runs at all while the screen is locked,
 * so nothing JS-driven can silence audio in that state. `AudioControlsService`
 * (expo-audio's own foreground service) already handles an ACTION_PAUSE
 * Intent entirely in native code (see its `onStartCommand`) — this fires
 * that Intent directly from an AlarmManager callback, with zero JS involved.
 *
 * See .scratch/screen-lock-safe-sessions/issues/09-android-native-lock-module-design.md
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

    // `timestampMs` is an absolute epoch time (matches Date.now()-style math
    // already used for scheduleFailedNotification/scheduleCompletedNotification
    // on the JS side, so both fire at the same instant).
    Function("scheduleStopAudio") { timestampMs: Double ->
      val context = appContext.reactContext
      val alarmManager = context?.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
      if (context != null && alarmManager != null) {
        val pendingIntent = stopAudioPendingIntent(context)
        val canScheduleExact =
          Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

        if (canScheduleExact) {
          alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timestampMs.toLong(), pendingIntent)
        } else {
          // No exact-alarm permission granted — degrades to approximate timing
          // rather than throwing or silently doing nothing.
          alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timestampMs.toLong(), pendingIntent)
        }
      }
    }

    Function("cancelScheduledStopAudio") {
      val context = appContext.reactContext
      val alarmManager = context?.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
      if (context != null && alarmManager != null) {
        alarmManager.cancel(stopAudioPendingIntent(context))
      }
    }
  }

  // Targets expo-audio's own foreground service directly by component name +
  // action string — not exported to other apps (android:exported="false" in
  // its manifest entry), but explicit Intents from within the same app/package
  // reach it regardless of that flag.
  private fun stopAudioPendingIntent(context: Context): PendingIntent {
    val intent = Intent().apply {
      component = ComponentName(context.packageName, "expo.modules.audio.service.AudioControlsService")
      action = "expo.modules.audio.action.PAUSE"
    }
    return PendingIntent.getService(
      context,
      STOP_AUDIO_REQUEST_CODE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  companion object {
    private const val STOP_AUDIO_REQUEST_CODE = 4210
  }
}
