import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { GlassPanel } from '../../components/GlassPanel';
import { theme } from '../../theme';

describe('<GlassPanel />', () => {
  it('renders its children', async () => {
    await render(
      <GlassPanel>
        <Text>Tank coming soon</Text>
      </GlassPanel>,
    );

    expect(screen.getByText('Tank coming soon')).toBeTruthy();
  });

  it('merges a caller-provided style over its own, rather than being replaced by it', async () => {
    await render(
      <GlassPanel testID="panel" style={{ paddingVertical: 16 }}>
        <Text>content</Text>
      </GlassPanel>,
    );

    const flatStyle = screen.getByTestId('panel').props.style;
    // caller override wins...
    expect(flatStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingVertical: 16 })]),
    );
    // ...but the base glass look survives alongside it.
    expect(flatStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: theme.colors.glassBackground }),
      ]),
    );
  });
});
