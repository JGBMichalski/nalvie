import { renderHook } from '@testing-library/react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { useAmbientSound } from '../hooks/useAmbientSound';

describe('useAmbientSound', () => {
  beforeEach(() => {
    (useAudioPlayer as jest.Mock).mockClear();
    (setAudioModeAsync as jest.Mock).mockClear();
  });

  it('sets the player to loop at a moderate volume', () => {
    renderHook(() => useAmbientSound(false));

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.loop).toBe(true);
    expect(player.volume).toBeGreaterThan(0);
    expect(player.volume).toBeLessThan(1);
  });

  it('configures audio mode to not fight the silent switch or other audio', () => {
    renderHook(() => useAmbientSound(false));

    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
  });

  it('plays when shouldPlay is true', () => {
    renderHook(() => useAmbientSound(true));

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.pause).not.toHaveBeenCalled();
  });

  it('pauses (without needing a prior play) when shouldPlay is false', () => {
    renderHook(() => useAmbientSound(false));

    const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(player.play).not.toHaveBeenCalled();
  });

  it('plays, then pauses, as shouldPlay flips across re-renders', () => {
    const { result, rerender } = renderHook<void, { shouldPlay: boolean }>(
      ({ shouldPlay }) => useAmbientSound(shouldPlay),
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
        ({ shouldPlay }) => useAmbientSound(shouldPlay, false),
        { initialProps: { shouldPlay: true } },
      );

      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      rerender({ shouldPlay: false });

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(player.seekTo).not.toHaveBeenCalled();
    });

    it('seeks back to the start when the session resolves (resetOnStop: true)', () => {
      const { rerender } = renderHook<void, { shouldPlay: boolean }>(
        ({ shouldPlay }) => useAmbientSound(shouldPlay, true),
        { initialProps: { shouldPlay: true } },
      );

      const player = (useAudioPlayer as jest.Mock).mock.results[0].value;
      rerender({ shouldPlay: false });

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(player.seekTo).toHaveBeenCalledWith(0);
    });
  });
});
