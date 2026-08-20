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
});
