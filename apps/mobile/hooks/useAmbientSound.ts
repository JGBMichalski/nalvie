import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

// Ambient aquarium/water sound during sessions.
const waterAmbienceSource = require('../assets/audio/aquarium-sound_legnalegna55.mp3');
const AMBIENCE_VOLUME = 0.5;

// Loops the track for as long as `shouldPlay` is true.
export function useAmbientSound(shouldPlay: boolean, resetOnStop = false): void {
  const player = useAudioPlayer(waterAmbienceSource);

  useEffect(() => {
    // Don't fight the user's silent switch or whatever else might be playing.
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  }, []);

  useEffect(() => {
    player.loop = true;
    player.volume = AMBIENCE_VOLUME;
  }, [player]);

  useEffect(() => {
    if (shouldPlay) {
      player.play();
      return;
    }

    player.pause();
    if (resetOnStop) player.seekTo(0);
  }, [shouldPlay, resetOnStop, player]);
}
