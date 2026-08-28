import { useEffect, useMemo } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { Settings } from '@nalvie/core';

import { somafmStreamUrl } from '../lib/somafm-stations';

// Ambient aquarium/water sound during sessions.
const waterAmbienceSource = require('../assets/audio/aquarium-sound_legnalegna55.mp3');
const AMBIENCE_VOLUME = 0.5;

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

// Loops the track for as long as `shouldPlay` is true. `resetOnStop` rewinds
// to the start when playback stops — but only for the local file: a live
// SomaFM stream has no "start" of its own to rewind to, so resuming a
// stream just continues wherever the broadcast currently is.
export function useAmbientSound(shouldPlay: boolean, source: AmbientSource, resetOnStop = false): void {
  // A fresh `{ uri }` object literal every render would look like a new
  // source to expo-audio (and to the test double), tearing down/recreating
  // the player each render — key the memo on the source's actual identity.
  const sourceKey = source.type === 'local' ? 'local' : `somafm:${source.stationId}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const audioSource = useMemo(() => audioSourceFor(source), [sourceKey]);
  const player = useAudioPlayer(audioSource);

  useEffect(() => {
    // Don't fight the user's silent switch or whatever else might be playing.
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  }, []);

  useEffect(() => {
    safely(() => {
      player.loop = true;
      player.volume = AMBIENCE_VOLUME;
    });
  }, [player]);

  useEffect(() => {
    if (shouldPlay) {
      safely(() => player.play());
      return;
    }

    safely(() => player.pause());
    if (resetOnStop && source.type === 'local') safely(() => player.seekTo(0));
  }, [shouldPlay, resetOnStop, player, source.type]);
}
