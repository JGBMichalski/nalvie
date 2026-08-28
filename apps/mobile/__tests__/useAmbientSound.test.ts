import { renderHook } from '@testing-library/react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { toAmbientSource, useAmbientSound } from '../hooks/useAmbientSound';

const LOCAL = { type: 'local' } as const;

describe('useAmbientSound', () => {
  beforeEach(() => {
    (useAudioPlayer as jest.Mock).mockClear();
    (setAudioModeAsync as jest.Mock).mockClear();
  });

  it('sets the player to loop at a moderate volume', () => {
    renderHook(() => useAmbientSound(false, LOCAL));

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.loop).toBe(true);
    expect(player.volume).toBeGreaterThan(0);
    expect(player.volume).toBeLessThan(1);
  });

  it('configures audio mode to not fight the silent switch or other audio', () => {
    renderHook(() => useAmbientSound(false, LOCAL));

    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
  });

  it('plays when shouldPlay is true', () => {
    renderHook(() => useAmbientSound(true, LOCAL));

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.pause).not.toHaveBeenCalled();
  });

  it('pauses (without needing a prior play) when shouldPlay is false', () => {
    renderHook(() => useAmbientSound(false, LOCAL));

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(player.play).not.toHaveBeenCalled();
  });

  it('plays, then pauses, as shouldPlay flips across re-renders', () => {
    const { result, rerender } = renderHook<void, { shouldPlay: boolean }>(
      ({ shouldPlay }) => useAmbientSound(shouldPlay, LOCAL),
      { initialProps: { shouldPlay: true } },
    );
    void result;

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.play).toHaveBeenCalledTimes(1);

    rerender({ shouldPlay: false });
    expect(player.pause).toHaveBeenCalledTimes(1);

    rerender({ shouldPlay: true });
    expect(player.play).toHaveBeenCalledTimes(2);
  });

  describe('resetOnStop', () => {
    it('does not reset position on a manual pause (resetOnStop: false)', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, LOCAL, false),
        { initialProps: { shouldPlay: true } },
      );

      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      rerender({ shouldPlay: false });

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(player.seekTo).not.toHaveBeenCalled();
    });

    it('seeks back to the start when a local session resolves (resetOnStop: true)', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, LOCAL, true),
        { initialProps: { shouldPlay: true } },
      );

      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      rerender({ shouldPlay: false });

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(player.seekTo).toHaveBeenCalledWith(0);
    });

    it('never seeks for a somafm source, even with resetOnStop: true — a live stream has no start to rewind to', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, { type: 'somafm', stationId: 'groovesalad' }, true),
        { initialProps: { shouldPlay: true } },
      );

      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      rerender({ shouldPlay: false });

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
