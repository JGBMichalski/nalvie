import { render, screen, fireEvent } from '@testing-library/react-native';

import { SelectField } from '../../components/SelectField';

describe('<SelectField />', () => {
  it('shows the current value', async () => {
    await render(<SelectField value="Groove Salad" accessibilityLabel="SomaFM station" onPress={jest.fn()} />);

    expect(screen.getByText('Groove Salad')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<SelectField value="Groove Salad" accessibilityLabel="SomaFM station" onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('SomaFM station'));

    expect(onPress).toHaveBeenCalled();
  });
});
