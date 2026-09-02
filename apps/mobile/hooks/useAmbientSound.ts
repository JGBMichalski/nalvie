import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { Settings } from '@nalvie/core';

import { somafmStreamUrl } from '../lib/somafm-stations';

// Ambient aquarium/water sound during sessions.
const waterAmbienceSource = require('../assets/audio/aquarium-sound_legnalegna55.mp3');
const AMBIENCE_VOLUME = 0.5;
const FADE_MS = 1000;
const FADE_STEPS = 20;
const FADE_STEP_MS = FADE_MS / FADE_STEPS;

export type AmbientSource = { type: 'local' } | { type: 'somafm'; stationId: string };

// Single place that turns the persisted setting into a source
export function toAmbientSource(settings: Pick<Settings, 'soundSource' | 'somafmStationId'>): AmbientSource {
  return settings.soundSource === 'somafm'
    ? { type: 'somafm', stationId: settings.somafmStationId }
    : { type: 'local' };
}

function audioSourceFor(source: AmbientSource) {
  return source.type === 'local' ? waterAmbienceSource : { uri: somafmStreamUrl(source.stationId) };
}

// Playback is decorative — never let a player error (e.g. an unreachable
// stream) bubble up and disrupt the session. Fails silently by design.
function safely(action: () => void): void {
  try {
    action();
  } catch {
    // no-op
  }
}

// Loops the track for as long as `shouldPlay` is true, fading volume in/out
// over FADE_MS on every start/stop. `resetOnStop` rewinds to the start once
// the fade-out finishes.
export function useAmbientSound(
  shouldPlay: boolean,
  source: AmbientSource,
  resetOnStop = false,
): void {
  const sourceKey = source.type === 'local' ? 'local' : `somafm:${source.stationId}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const audioSource = useMemo(() => audioSourceFor(source), [sourceKey]);
  const player = useAudioPlayer(audioSource);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Don't fight the user's silent switch or whatever else might be playing.
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: Platform.OS === 'android' ? 'doNotMix' : 'mixWithOthers',
      shouldPlayInBackground: true,
    });
  }, []);

  useEffect(() => {
    safely(() => {
      player.loop = true;
    });
  }, [player]);

  useEffect(() => {
    function stopFade() {
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }

    if (shouldPlay) {
      safely(() => {
        player.volume = 0;
        player.play();
      });
      let step = 0;
      fadeTimerRef.current = setInterval(() => {
        step += 1;
        const progress = Math.min(1, step / FADE_STEPS);
        safely(() => {
          player.volume = AMBIENCE_VOLUME * progress;
        });
        if (progress >= 1) stopFade();
      }, FADE_STEP_MS);
    } else {
      const startVolume = player.volume;
      let step = 0;
      fadeTimerRef.current = setInterval(() => {
        step += 1;
        const progress = Math.min(1, step / FADE_STEPS);
        safely(() => {
          player.volume = startVolume * (1 - progress);
        });
        if (progress >= 1) {
          stopFade();
          safely(() => player.pause());
          if (resetOnStop && source.type === 'local') safely(() => player.seekTo(0));
        }
      }, FADE_STEP_MS);
    }

    return stopFade;
  }, [shouldPlay, resetOnStop, player, source.type]);
}
