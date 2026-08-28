import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { router } from 'expo-router';

import { BackButton } from '../../components/BackButton';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

describe('<BackButton />', () => {
  it('calls router.back() when pressed', async () => {
    await render(<BackButton />);
    await act(async () => {}); // flush the icon font's async load

    fireEvent.press(screen.getByLabelText('Back'));

    expect(router.back).toHaveBeenCalled();
  });
});
