import { render, screen, fireEvent } from '@testing-library/react-native';

import { PickerSheet } from '../../components/PickerSheet';

const options = [
  { label: 'Groove Salad', value: 'groovesalad' },
  { label: 'Drone Zone', value: 'dronezone' },
  { label: 'Fluid', value: 'fluid' },
];

describe('<PickerSheet />', () => {
  it('lists every option by label', async () => {
    await render(
      <PickerSheet visible title="Station" options={options} value="groovesalad" onSelect={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByText('Groove Salad')).toBeTruthy();
    expect(screen.getByText('Drone Zone')).toBeTruthy();
    expect(screen.getByText('Fluid')).toBeTruthy();
  });

  it('marks the current value as selected', async () => {
    await render(
      <PickerSheet visible title="Station" options={options} value="dronezone" onSelect={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText('Drone Zone').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Groove Salad').props.accessibilityState.selected).toBe(false);
  });

  it('calls onSelect then onClose when an option is tapped', async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    await render(
      <PickerSheet visible title="Station" options={options} value="groovesalad" onSelect={onSelect} onClose={onClose} />,
    );

    fireEvent.press(screen.getByText('Fluid'));

    expect(onSelect).toHaveBeenCalledWith('fluid');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <PickerSheet visible title="Station" options={options} value="groovesalad" onSelect={jest.fn()} onClose={onClose} />,
    );

    fireEvent.press(screen.getByTestId('picker-sheet-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });
});
