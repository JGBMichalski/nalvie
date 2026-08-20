import { render, screen, fireEvent } from '@testing-library/react-native';
import type { UnlockPoolItem } from '@nalvie/core';

import { FishPickerSheet } from '../../components/FishPickerSheet';

const items: UnlockPoolItem[] = [
  { id: 'clownfish', name: 'Clownfish', rarity: 'common', eligibility: 'always' },
  { id: 'seahorse', name: 'Seahorse', rarity: 'uncommon', eligibility: { minCompletedSessions: 5 } },
];

describe('<FishPickerSheet />', () => {
  it('lists every eligible item by name', async () => {
    await render(<FishPickerSheet visible items={items} onClose={jest.fn()} onSelect={jest.fn()} />);

    expect(screen.getByText('Clownfish')).toBeTruthy();
    expect(screen.getByText('Seahorse')).toBeTruthy();
  });

  it('shows the animated fish rather than a static emoji for species that have one', async () => {
    await render(<FishPickerSheet visible items={items} onClose={jest.fn()} onSelect={jest.fn()} />);

    expect(screen.getByLabelText('Clownfish')).toBeTruthy();
    expect(screen.getByLabelText('Seahorse')).toBeTruthy();
  });

  it('calls onSelect with the tapped item id', async () => {
    const onSelect = jest.fn();
    await render(<FishPickerSheet visible items={items} onClose={jest.fn()} onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Seahorse'));

    expect(onSelect).toHaveBeenCalledWith('seahorse');
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    await render(<FishPickerSheet visible items={items} onClose={onClose} onSelect={jest.fn()} />);

    fireEvent.press(screen.getByTestId('fish-picker-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });
});
