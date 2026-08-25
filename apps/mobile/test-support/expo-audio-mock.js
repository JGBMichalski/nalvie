// Every render of Home touches useAmbientSound -> expo-audio. The real
// native module is slow/noisy to load under Jest and this app only ever
// does simple local looping playback.

function createFakePlayer() {
  return {
    loop: false,
    volume: 1,
    playing: false,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
  };
}

// Keyed by source, so repeated calls with the same source across
// re-renders of one component return the same instance
const players = new Map();

function useAudioPlayer(source) {
  if (!players.has(source)) {
    players.set(source, createFakePlayer());
  }
  return players.get(source);
}

module.exports = {
  useAudioPlayer: jest.fn(useAudioPlayer),
  setAudioModeAsync: jest.fn(async () => undefined),
  // Test-only escape hatch: not part of the real expo-audio API.
  __resetAudioMocks: () => players.clear(),
};
