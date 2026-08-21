import { render, screen, fireEvent } from '@testing-library/react-native';

import { SegmentedControl } from '../../components/SegmentedControl';

describe('<SegmentedControl />', () => {
  const options = [
    { label: '10m', value: 10 },
    { label: '25m', value: 25 },
    { label: '50m', value: 50 },
  ];

  it('renders every option', async () => {
    await render(<SegmentedControl options={options} value={25} onChange={jest.fn()} />);

    expect(screen.getByText('10m')).toBeTruthy();
    expect(screen.getByText('25m')).toBeTruthy();
    expect(screen.getByText('50m')).toBeTruthy();
  });

  it('calls onChange with the tapped option value', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={options} value={25} onChange={onChange} />);

    fireEvent.press(screen.getByText('50m'));

    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('marks the current value as selected', async () => {
    await render(<SegmentedControl options={options} value={25} onChange={jest.fn()} />);

    expect(screen.getByLabelText('25m').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('10m').props.accessibilityState.selected).toBe(false);
  });
});
