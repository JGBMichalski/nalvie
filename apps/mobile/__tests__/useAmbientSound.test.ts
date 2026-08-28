import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { toAmbientSource, useAmbientSound } from '../hooks/useAmbientSound';

const LOCAL = { type: 'local' } as const;
const FADE_MS = 1000;

describe('useAmbientSound', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAudioPlayer as jest.Mock).mockClear();
    (setAudioModeAsync as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    Platform.OS = 'ios';
  });

  it('sets the player to loop', () => {
    renderHook(() => useAmbientSound(false, LOCAL));

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.loop).toBe(true);
  });

  it('configures audio mode to not fight the silent switch or other audio, and to keep playing in the background', () => {
    renderHook(() => useAmbientSound(false, LOCAL));

    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: true,
    });
  });

  it('uses doNotMix on Android — background playback stops after ~3 minutes otherwise (Ticket 12)', () => {
    Platform.OS = 'android';
    renderHook(() => useAmbientSound(false, LOCAL));

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ interruptionMode: 'doNotMix' }),
    );
  });

  describe('Android lock-screen notification content (Ticket 15)', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('activates lock-screen controls with the given metadata once playback starts', () => {
      renderHook(() =>
        useAmbientSound(true, LOCAL, false, {
          metadata: { title: '12 min remaining', artist: 'Nalvie focus session' },
          sessionActive: true,
        }),
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;

      expect(player.setActiveForLockScreen).toHaveBeenCalledWith(true, {
        title: '12 min remaining',
        artist: 'Nalvie focus session',
      });
    });

    it('refreshes the metadata when it changes while still playing', () => {
      const { rerender } = renderHook<void, { title: string }>(
        ({ title }) =>
          useAmbientSound(true, LOCAL, false, {
            metadata: { title, artist: 'Nalvie focus session' },
            sessionActive: true,
          }),
        { initialProps: { title: '12 min remaining' } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;

      rerender({ title: '11 min remaining' });

      expect(player.updateLockScreenMetadata).toHaveBeenLastCalledWith({
        title: '11 min remaining',
        artist: 'Nalvie focus session',
      });
    });

    it('clears lock-screen controls when playback stops', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) =>
          useAmbientSound(shouldPlay, LOCAL, false, {
            metadata: { title: '12 min remaining', artist: 'Nalvie focus session' },
            sessionActive: shouldPlay,
          }),
        { initialProps: { shouldPlay: true } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;

      rerender({ shouldPlay: false });

      expect(player.clearLockScreenControls).toHaveBeenCalled();
    });

    it('does not touch lock-screen controls on iOS', () => {
      Platform.OS = 'ios';
      renderHook(() =>
        useAmbientSound(true, LOCAL, false, {
          metadata: { title: '12 min remaining', artist: 'Nalvie focus session' },
          sessionActive: true,
        }),
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;

      expect(player.setActiveForLockScreen).not.toHaveBeenCalled();
    });

    it('updates to "Paused" instead of clearing the notification when the session is paused, not ended', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean; title: string }>(
        ({ shouldPlay, title }) =>
          useAmbientSound(shouldPlay, LOCAL, false, {
            metadata: { title, artist: 'Nalvie focus session' },
            sessionActive: true, // still in-progress even while paused
          }),
        { initialProps: { shouldPlay: true, title: '12 min remaining' } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;

      // Pausing: shouldPlay flips false, but sessionActive stays true.
      rerender({ shouldPlay: false, title: 'Paused' });

      expect(player.clearLockScreenControls).not.toHaveBeenCalled();
      expect(player.updateLockScreenMetadata).toHaveBeenLastCalledWith({
        title: 'Paused',
        artist: 'Nalvie focus session',
      });
    });

    it('clears the notification once the session actually ends (sessionActive: false)', () => {
      const { rerender } = renderHook<void, { sessionActive: boolean }>(
        ({ sessionActive }) =>
          useAmbientSound(sessionActive, LOCAL, false, {
            metadata: { title: '12 min remaining', artist: 'Nalvie focus session' },
            sessionActive,
          }),
        { initialProps: { sessionActive: true } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;

      rerender({ sessionActive: false });

      expect(player.clearLockScreenControls).toHaveBeenCalled();
    });
  });

  describe('fade in on play', () => {
    it('starts playback immediately at zero volume, then fades up to full volume over 1 second', () => {
      renderHook(() => useAmbientSound(true, LOCAL));
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;

      expect(player.play).toHaveBeenCalledTimes(1);
      expect(player.volume).toBe(0);

      act(() => {
        jest.advanceTimersByTime(FADE_MS);
      });

      expect(player.volume).toBeGreaterThan(0);
      expect(player.volume).toBeLessThan(1);
      expect(player.play).toHaveBeenCalledTimes(1); // only called once, not per fade tick
    });
  });

  describe('fade out on stop', () => {
    it('does not pause immediately — fades volume to 0 first, then pauses', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, LOCAL),
        { initialProps: { shouldPlay: true } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      act(() => jest.advanceTimersByTime(FADE_MS)); // let the fade-in finish

      rerender({ shouldPlay: false });
      expect(player.pause).not.toHaveBeenCalled();

      act(() => jest.advanceTimersByTime(FADE_MS));

      expect(player.volume).toBe(0);
      expect(player.pause).toHaveBeenCalledTimes(1);
    });

    it('resuming mid-fade-out cancels the pending pause and fades back in instead', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, LOCAL),
        { initialProps: { shouldPlay: true } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      act(() => jest.advanceTimersByTime(FADE_MS));

      rerender({ shouldPlay: false });
      act(() => jest.advanceTimersByTime(FADE_MS / 2)); // partway through the fade-out

      rerender({ shouldPlay: true });
      act(() => jest.advanceTimersByTime(FADE_MS));

      expect(player.pause).not.toHaveBeenCalled();
      expect(player.play).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetOnStop', () => {
    it('does not reset position on a manual pause (resetOnStop: false)', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, LOCAL, false),
        { initialProps: { shouldPlay: true } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      act(() => jest.advanceTimersByTime(FADE_MS));

      rerender({ shouldPlay: false });
      act(() => jest.advanceTimersByTime(FADE_MS));

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(player.seekTo).not.toHaveBeenCalled();
    });

    it('seeks back to the start once the fade-out finishes and a local session resolves (resetOnStop: true)', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, LOCAL, true),
        { initialProps: { shouldPlay: true } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      act(() => jest.advanceTimersByTime(FADE_MS));

      rerender({ shouldPlay: false });
      expect(player.seekTo).not.toHaveBeenCalled(); // not yet — fade isn't done

      act(() => jest.advanceTimersByTime(FADE_MS));

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(player.seekTo).toHaveBeenCalledWith(0);
    });

    it('never seeks for a somafm source, even with resetOnStop: true — a live stream has no start to rewind to', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, { type: 'somafm', stationId: 'groovesalad' }, true),
        { initialProps: { shouldPlay: true } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      act(() => jest.advanceTimersByTime(FADE_MS));

      rerender({ shouldPlay: false });
      act(() => jest.advanceTimersByTime(FADE_MS));

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(player.seekTo).not.toHaveBeenCalled();
    });
  });

  describe('source selection', () => {
    it('requests a network source keyed to the given SomaFM station', () => {
      renderHook(() => useAmbientSound(true, { type: 'somafm', stationId: 'dronezone' }));

      expect(useAudioPlayer).toHaveBeenCalledWith({ uri: 'https://ice1.somafm.com/dronezone-128-mp3' });
    });

    it('uses a different underlying player per source, so switching source does not reuse the wrong player', () => {
      const { rerender } = renderHook<void, { source: Parameters<typeof useAmbientSound>[1] }>(
        ({ source }) => useAmbientSound(true, source),
        { initialProps: { source: LOCAL } },
      );

      rerender({ source: { type: 'somafm', stationId: 'groovesalad' } });

      const localPlayer = (useAudioPlayer as jest.Mock).mock.results[0].value;
      const somafmPlayer = (useAudioPlayer as jest.Mock).mock.results[1].value;
      expect(localPlayer).not.toBe(somafmPlayer);
    });
  });

  describe('resilience to playback errors (Ticket 11: fail silently)', () => {
    it('does not throw when the player rejects an unreachable stream', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, { type: 'somafm', stationId: 'groovesalad' }),
        { initialProps: { shouldPlay: false } },
      );
      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      (player.play as jest.Mock).mockImplementation(() => {
        throw new Error('network unreachable');
      });

      expect(() => rerender({ shouldPlay: true })).not.toThrow();
    });
  });
});

describe('toAmbientSource', () => {
  it('maps a "local" soundSource setting to the local source', () => {
    expect(toAmbientSource({ soundSource: 'local', somafmStationId: 'groovesalad' })).toEqual({ type: 'local' });
  });

  it('maps a "somafm" soundSource setting to a somafm source carrying the station id', () => {
    expect(toAmbientSource({ soundSource: 'somafm', somafmStationId: 'dronezone' })).toEqual({
      type: 'somafm',
      stationId: 'dronezone',
    });
  });
});
