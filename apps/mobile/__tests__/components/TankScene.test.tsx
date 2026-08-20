import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { TankItem } from '@nalvie/core';

import { TankScene } from '../../components/TankScene';

function item(id: string, name: string): TankItem {
  return { id, name, rarity: 'common', unlockedAt: '2024-01-01T00:00:00.000Z' };
}

function layout(width: number, height: number) {
  fireEvent(screen.getByTestId('tank-scene'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
  });
}

describe('<TankScene />', () => {
  it('renders swimmers only once the tank has been measured', async () => {
    await render(<TankScene items={[item('clownfish', 'Clownfish')]} />);

    expect(screen.queryByLabelText('Clownfish')).toBeNull();

    await act(async () => layout(320, 480));

    expect(screen.getByLabelText('Clownfish')).toBeTruthy();
  });

  it('anchors seabed decor without waiting for a swim path', async () => {
    await render(<TankScene items={[item('seaweed', 'Seaweed')]} />);
    await act(async () => layout(320, 480));

    expect(screen.getByText('🌿')).toBeTruthy();
  });

  it('keeps swimmers and seabed decor in separate layers', async () => {
    await render(
      <TankScene items={[item('clownfish', 'Clownfish'), item('pebbles', 'Pebbles')]} />,
    );
    await act(async () => layout(320, 480));

    expect(screen.getByLabelText('Clownfish')).toBeTruthy();
    expect(screen.getByText('🪨')).toBeTruthy();
  });
});
