import { render, screen } from '@testing-library/react-native';

import { PlaceholderScreen } from '../../components/PlaceholderScreen';

describe('<PlaceholderScreen />', () => {
  it('renders the given title', async () => {
    await render(<PlaceholderScreen title="Stats" />);

    expect(screen.getByText('Stats')).toBeTruthy();
  });
});
