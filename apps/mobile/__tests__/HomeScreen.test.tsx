import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MIN_SESSION_MINUTES } from '@nalvie/core';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '../app/index';

function renderHomeScreen() {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <HomeScreen />
    </SafeAreaProvider>,
  );
}

describe('<HomeScreen />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens the duration picker from the FAB, then starts a session showing a countdown', async () => {
    await renderHomeScreen();
    await act(async () => {}); // flush mount-time repository load

    fireEvent.press(screen.getByLabelText('Start a session'));
    expect(screen.getByText('Start a session')).toBeTruthy(); // sheet title

    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    expect(screen.getByText(`${MIN_SESSION_MINUTES}:00`)).toBeTruthy();
    expect(screen.getByText('Pause')).toBeTruthy();
  });

  it('toggles the pause button through Pause -> Resume -> Pause used', async () => {
    await renderHomeScreen();
    await act(async () => {});

    fireEvent.press(screen.getByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    fireEvent.press(screen.getByText('Pause'));
    expect(screen.getByText('Resume')).toBeTruthy();

    fireEvent.press(screen.getByText('Resume'));
    expect(screen.getByText('Pause used')).toBeTruthy();
  });

  it('shows an unlock toast when the session completes, then returns to idle', async () => {
    await renderHomeScreen();
    await act(async () => {});

    fireEvent.press(screen.getByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
      await Promise.resolve();
    });

    expect(screen.getByText(/Unlocked:/)).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByLabelText('Start a session')).toBeTruthy(); // FAB is back
  });
});
