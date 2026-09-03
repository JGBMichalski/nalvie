package expo.modules.screenlocksignal

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlin.math.ceil

/**
 * Owns an in-progress focus session for as long as it runs, entirely in native
 * code.
 *
 * Everything this service runs while the screen is locked. A foreground service
 * is the one mechanism Android exempts from Doze, so its `Handler` loop keeps
 * ticking with the screen off.
 */
class SessionService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var tick: Runnable? = null
  private var fadeRunnable: Runnable? = null

  private var endAtMs: Long = 0
  private var sessionStartedAtMs: Long = 0 // Only used to give the media card a progress bar
  private var itemName: String = "a new fish"
  private var paused: Boolean = false

  // Set when the leave-detection grace clock is running: the deadline now
  // means "session failed", so the audio still stops but the completion
  // notification must not fire.
  private var expectingFailure: Boolean = false

  private var audioFocusRequest: AudioFocusRequest? = null

  /**
   * Backs the notification's MediaStyle. Its only job is to make the countdown
   * appear on the lock screen's media card.
   */
  private var mediaSession: MediaSessionCompat? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createChannels()
    mediaSession = MediaSessionCompat(this, "NalvieSession").apply { isActive = true }
  }

  /**
   * Drives the media card's text and its progress through the session. Called
   * on every countdown tick, before the notification is re-posted.
   */
  private fun refreshMediaSession() {
    val session = mediaSession ?: return
    val totalMs = (endAtMs - sessionStartedAtMs).coerceAtLeast(1)
    val elapsedMs = (System.currentTimeMillis() - sessionStartedAtMs).coerceIn(0, totalMs)

    session.setMetadata(
      MediaMetadataCompat.Builder()
        .putString(MediaMetadataCompat.METADATA_KEY_TITLE, if (paused) "Paused" else remainingText())
        .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "Nalvie focus session")
        .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, totalMs)
        .build(),
    )
    session.setPlaybackState(
      PlaybackStateCompat.Builder()
        .setState(
          if (paused) PlaybackStateCompat.STATE_PAUSED else PlaybackStateCompat.STATE_PLAYING,
          elapsedMs,
          if (paused) 0f else 1f,
        )
        .setActions(0)
        .build(),
    )
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    Log.i(TAG, "onStartCommand action=${intent?.action} endAt=${intent?.getLongExtra(EXTRA_END_AT_MS, -1)} now=${System.currentTimeMillis()}")
    // Every one of these arrives via startForegroundService(), which gives the
    // service ~5s to call startForeground() or the app is killed. That has to
    // happen even for actions that immediately tear the service down again,
    // because the process may have been killed since the session started and
    // this could be the call that creates the service.
    if (intent?.action == ACTION_START) {
      endAtMs = intent.getLongExtra(EXTRA_END_AT_MS, 0)
      itemName = intent.getStringExtra(EXTRA_ITEM_NAME) ?: itemName
      sessionStartedAtMs = System.currentTimeMillis()
      paused = false
      expectingFailure = false
    }
    startForegroundNotification()

    when (intent?.action) {
      ACTION_START -> scheduleNextTick()

      ACTION_PAUSE -> {
        paused = true
        cancelTick()
        updateNotification()
      }

      ACTION_RESUME -> {
        endAtMs = intent.getLongExtra(EXTRA_END_AT_MS, endAtMs)
        paused = false
        expectingFailure = false
        updateNotification()
        scheduleNextTick()
      }

      ACTION_EXPECT_FAILURE -> {
        endAtMs = intent.getLongExtra(EXTRA_END_AT_MS, endAtMs)
        paused = false
        expectingFailure = true
        updateNotification()
        scheduleNextTick()
      }

      // Nothing to count down to.
      else -> {
        stopSessionService()
        return START_NOT_STICKY
      }
    }

    // A session killed with the process is finalized as failed by the JS
    // layer on next launch, so silently resurrecting this service with a
    // null intent would contradict that.
    return START_NOT_STICKY
  }

  private fun stopSessionService() {
    cancelTick()
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  // --- countdown ---------------------------------------------------------

  private fun scheduleNextTick() {
    cancelTick()
    if (paused) return

    val now = System.currentTimeMillis()
    val remaining = endAtMs - now
    if (remaining <= 0) {
      onSessionComplete()
      return
    }

    val delay = TICK_MS.coerceAtMost(remaining)

    val runnable = Runnable {
      updateNotification()
      scheduleNextTick()
    }
    tick = runnable
    handler.postDelayed(runnable, delay)
  }

  private fun cancelTick() {
    tick?.let { handler.removeCallbacks(it) }
    tick = null
  }

  private fun onSessionComplete() {
    Log.i(TAG, "onSessionComplete expectingFailure=$expectingFailure locked=${isLockedOrNonInteractive()}")

    if (isLockedOrNonInteractive()) {
      fadeOutThenStopAudio {
        if (!expectingFailure) notifyCompleted()
        stopSessionService()
      }
    } else {
      if (!expectingFailure) notifyCompleted()
      stopSessionService()
    }
  }

  private fun isLockedOrNonInteractive(): Boolean {
    val powerManager = getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
    val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as? android.app.KeyguardManager
    val interactive = powerManager?.isInteractive ?: true
    val locked = keyguardManager?.isKeyguardLocked ?: false
    return !interactive || locked
  }

  // --- audio -------------------------------------------------------------

  private fun fadeOutThenStopAudio(onFinished: () -> Unit) {
    val intent = Intent().apply {
      component = ComponentName(packageName, "expo.modules.audio.service.AudioControlsService")
      action = "expo.modules.audio.action.FADE_PAUSE"
    }
    try {
      startService(intent)
    } catch (e: Exception) {
      Log.w(TAG, "FADE_PAUSE refused, falling back to an instant stop", e)
      stopAudioNow()
      onFinished()
      return
    }

    val runnable = Runnable {
      fadeRunnable = null
      stopAudioNow()
      onFinished()
    }
    fadeRunnable = runnable
    handler.postDelayed(runnable, FADE_MS + FADE_SETTLE_BUFFER_MS)
  }

  // Hard, immediate stop. Used as the fallback.
  private fun stopAudioNow() {
    takeAudioFocus()

    val intent = Intent().apply {
      component = ComponentName(packageName, "expo.modules.audio.service.AudioControlsService")
      action = "expo.modules.audio.action.PAUSE"
    }
    try {
      startService(intent)
    } catch (e: Exception) {
      Log.w(TAG, "ACTION_PAUSE to expo-audio refused", e)
    }
  }

  private fun takeAudioFocus() {
    val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build(),
        )
        .build()
      audioFocusRequest = request
      audioManager.requestAudioFocus(request)
      audioManager.abandonAudioFocusRequest(request) // Allow user's own music to resume after the session.
      audioFocusRequest = null
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
      @Suppress("DEPRECATION")
      audioManager.abandonAudioFocus(null)
    }
  }

  // --- notifications -----------------------------------------------------

  private fun createChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

    if (manager.getNotificationChannel(SESSION_CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(SESSION_CHANNEL_ID, "Focus session", NotificationManager.IMPORTANCE_LOW)
          .apply { setShowBadge(false) },
      )
    }
    if (manager.getNotificationChannel(ALERT_CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(ALERT_CHANNEL_ID, "Session finished", NotificationManager.IMPORTANCE_HIGH),
      )
    }
  }

  private fun contentIntent(): PendingIntent? {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    return PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun buildNotification(): Notification {
    refreshMediaSession()
    val style = androidx.media.app.NotificationCompat.MediaStyle()
    mediaSession?.sessionToken?.let { style.setMediaSession(it) }

    return NotificationCompat.Builder(this, SESSION_CHANNEL_ID)
      .setSmallIcon(smallIconRes())
      .setContentTitle(if (paused) "Paused" else remainingText())
      .setContentText("Nalvie focus session")
      .setContentIntent(contentIntent())
      .setStyle(style)
      .setOngoing(true)
      .setSilent(true)
      .setShowWhen(false)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .build()
  }

  private fun smallIconRes(): Int = R.drawable.ic_notification

  private fun remainingText(): String {
    val remaining = endAtMs - System.currentTimeMillis()
    if (remaining <= 0) return "Session complete"
    val totalSeconds = ceil(remaining / 1000.0).toLong()
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%d:%02d remaining".format(minutes, seconds)
  }

  private fun startForegroundNotification() {
    val notification = buildNotification()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(SESSION_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      } else {
        startForeground(SESSION_NOTIFICATION_ID, notification)
      }
      Log.i(TAG, "startForeground ok: ${notification.channelId}")
    } catch (e: Exception) {
      Log.e(TAG, "startForeground FAILED", e)
    }
  }

  private fun updateNotification() {
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    manager.notify(SESSION_NOTIFICATION_ID, buildNotification())
  }

  // Only surfaced when the user isn't already looking at the app.
  private fun notifyCompleted() {
    if (!isLockedOrNonInteractive()) return

    val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
      .setSmallIcon(smallIconRes())
      .setContentTitle("Nalvie")
      .setContentText("Your tank grew! A $itemName was added while you were away.")
      .setContentIntent(contentIntent())
      .setAutoCancel(true)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .build()

    (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
      .notify(COMPLETED_NOTIFICATION_ID, notification)
  }

  override fun onDestroy() {
    cancelTick()
    fadeRunnable?.let { handler.removeCallbacks(it) }
    fadeRunnable = null
    mediaSession?.apply {
      isActive = false
      release()
    }
    mediaSession = null
    super.onDestroy()
  }

  companion object {
    private const val TAG = "NalvieSession"

    const val ACTION_START = "nalvie.session.START"
    const val ACTION_PAUSE = "nalvie.session.PAUSE"
    const val ACTION_RESUME = "nalvie.session.RESUME"
    const val ACTION_EXPECT_FAILURE = "nalvie.session.EXPECT_FAILURE"
    const val ACTION_STOP = "nalvie.session.STOP"

    const val EXTRA_END_AT_MS = "endAtMs"
    const val EXTRA_ITEM_NAME = "itemName"

    private const val SESSION_CHANNEL_ID = "nalvie_session"
    private const val ALERT_CHANNEL_ID = "nalvie_session_alerts"
    private const val SESSION_NOTIFICATION_ID = 4220
    private const val COMPLETED_NOTIFICATION_ID = 4221

    private const val TICK_MS = 1000L

    // Matches the foreground fade-out in useAmbientSound.ts.
    private const val FADE_MS = 1000L
    private const val FADE_SETTLE_BUFFER_MS = 100L
  }
}
