import { render, screen, fireEvent } from '@testing-library/react-native';

import { DurationPickerSheet } from '../../components/DurationPickerSheet';

describe('<DurationPickerSheet />', () => {
  it('starts a session with the default preset when Start is pressed immediately', async () => {
    const onStart = jest.fn();
    await render(<DurationPickerSheet visible onClose={jest.fn()} onStart={onStart} />);

    fireEvent.press(screen.getByText('Start'));

    expect(onStart).toHaveBeenCalledWith(10);
  });

  it('starts a session with the tapped preset', async () => {
    const onStart = jest.fn();
    await render(<DurationPickerSheet visible onClose={jest.fn()} onStart={onStart} />);

    fireEvent.press(screen.getByText('50m'));
    fireEvent.press(screen.getByText('Start'));

    expect(onStart).toHaveBeenCalledWith(50);
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    await render(<DurationPickerSheet visible onClose={onClose} onStart={jest.fn()} />);

    fireEvent.press(screen.getByTestId('duration-picker-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  it('offers a dev-only 10s shortcut for manual testing', async () => {
    const onStart = jest.fn();
    await render(<DurationPickerSheet visible onClose={jest.fn()} onStart={onStart} />);

    fireEvent.press(screen.getByText('10s (dev)'));

    expect(onStart).toHaveBeenCalledWith(10 / 60);
  });

  describe('defaultMinutes (Settings.defaultSessionMinutes)', () => {
    it('starts a session with the given default, not the hardcoded first preset', async () => {
      const onStart = jest.fn();
      await render(<DurationPickerSheet visible defaultMinutes={50} onClose={jest.fn()} onStart={onStart} />);

      fireEvent.press(screen.getByText('Start'));

      expect(onStart).toHaveBeenCalledWith(50);
    });

    it('highlights the matching preset button for the given default', async () => {
      await render(<DurationPickerSheet visible defaultMinutes={50} onClose={jest.fn()} onStart={jest.fn()} />);

      expect(screen.getByText('50m').props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontWeight: '600' })]),
      );
      expect(screen.getByText('Custom: 50 min')).toBeTruthy();
    });

    it('re-syncs to a newly-loaded default each time the sheet opens, not just on first mount', async () => {
      const onStart = jest.fn();
      const { rerender } = await render(
        <DurationPickerSheet visible={false} defaultMinutes={10} onClose={jest.fn()} onStart={onStart} />,
      );

      // Settings finished loading asynchronously (after this component already
      // mounted with the fallback value) before the user opens the sheet.
      await rerender(
        <DurationPickerSheet visible={false} defaultMinutes={50} onClose={jest.fn()} onStart={onStart} />,
      );
      await rerender(<DurationPickerSheet visible defaultMinutes={50} onClose={jest.fn()} onStart={onStart} />);

      fireEvent.press(screen.getByText('Start'));
      expect(onStart).toHaveBeenCalledWith(50);
    });

    it('resets to the default again on reopen, discarding a leftover custom pick from a previous open', async () => {
      const onStart = jest.fn();
      const { rerender } = await render(
        <DurationPickerSheet visible defaultMinutes={25} onClose={jest.fn()} onStart={onStart} />,
      );

      fireEvent.press(screen.getByText('50m')); // user picks something else, then closes without starting
      await rerender(
        <DurationPickerSheet visible={false} defaultMinutes={25} onClose={jest.fn()} onStart={onStart} />,
      );
      await rerender(<DurationPickerSheet visible defaultMinutes={25} onClose={jest.fn()} onStart={onStart} />);

      fireEvent.press(screen.getByText('Start'));
      expect(onStart).toHaveBeenCalledWith(25);
    });
  });
});
