import { renderRouter, screen } from 'expo-router/testing-library';
import { act, fireEvent } from '@testing-library/react-native';

// Integration test over the real app/ directory: exercises the navigation
// (no tab bar — menu icon on Home routes to a modal linking to Stats/Settings).
describe('navigation shell', () => {
  it('starts on Home/Tank', async () => {
    renderRouter('./app', { initialUrl: '/' });

    expect(screen).toHavePathname('/');
    expect(await screen.findByText(/streak/)).toBeTruthy();
  });

  it('opens the menu from Home, then reaches Stats and Settings from it', async () => {
    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByLabelText('Open menu'));
    expect(screen).toHavePathname('/menu');

    fireEvent.press(await screen.findByText('Stats'));
    expect(screen).toHavePathname('/stats');
    await act(async () => {}); // flush Stats' repository load
  });
});
