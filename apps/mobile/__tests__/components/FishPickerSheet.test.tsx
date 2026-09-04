import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import type { UnlockPoolItem } from '@nalvie/core';

import { FishPickerSheet } from '../../components/FishPickerSheet';

const items: UnlockPoolItem[] = [
  { id: 'clownfish', name: 'Clownfish', rarity: 'common' },
  { id: 'seahorse', name: 'Seahorse', rarity: 'uncommon' },
  { id: 'sea-turtle', name: 'Sea Turtle', rarity: 'rare' },
];

const ownedAll = new Set(items.map((item) => item.id));

describe('<FishPickerSheet />', () => {
  it('lists every item by name, owned or not', async () => {
    await render(
      <FishPickerSheet
        visible
        items={items}
        ownedSpeciesIds={ownedAll}
        pointsBalance={0}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        onPurchase={jest.fn()}
      />,
    );

    expect(screen.getByText('Clownfish')).toBeTruthy();
    expect(screen.getByText('Seahorse')).toBeTruthy();
    expect(screen.getByText('Sea Turtle')).toBeTruthy();
  });

  it('shows the animated fish rather than a static emoji for species that have one', async () => {
    await render(
      <FishPickerSheet
        visible
        items={items}
        ownedSpeciesIds={ownedAll}
        pointsBalance={0}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        onPurchase={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Clownfish')).toBeTruthy();
    expect(screen.getByLabelText('Seahorse')).toBeTruthy();
  });

  it('calls onSelect with the tapped item id when it is already owned', async () => {
    const onSelect = jest.fn();
    await render(
      <FishPickerSheet
        visible
        items={items}
        ownedSpeciesIds={ownedAll}
        pointsBalance={0}
        onClose={jest.fn()}
        onSelect={onSelect}
        onPurchase={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText('Seahorse'));

    expect(onSelect).toHaveBeenCalledWith('seahorse');
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <FishPickerSheet
        visible
        items={items}
        ownedSpeciesIds={ownedAll}
        pointsBalance={0}
        onClose={onClose}
        onSelect={jest.fn()}
        onPurchase={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('fish-picker-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  describe('unowned items', () => {
    const ownedOnlyClownfish = new Set(['clownfish']);

    it('shows the point cost for an unowned item', async () => {
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedOnlyClownfish}
          pointsBalance={0}
          onClose={jest.fn()}
          onSelect={jest.fn()}
          onPurchase={jest.fn()}
        />,
      );

      expect(screen.getByText('500 pts to unlock')).toBeTruthy();
      expect(screen.getByText('1500 pts to unlock')).toBeTruthy();
    });

    it('marks an unaffordable item as disabled and does not call onSelect/onPurchase when tapped', async () => {
      const onSelect = jest.fn();
      const onPurchase = jest.fn();
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedOnlyClownfish}
          pointsBalance={0}
          onClose={jest.fn()}
          onSelect={onSelect}
          onPurchase={onPurchase}
        />,
      );

      const seahorse = screen.getByTestId('fish-item-seahorse');
      expect(seahorse.props.accessibilityState?.disabled).toBe(true);

      fireEvent.press(seahorse);

      expect(onSelect).not.toHaveBeenCalled();
      expect(onPurchase).not.toHaveBeenCalled();
    });

    it('does not show a cost under an owned item', async () => {
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedOnlyClownfish}
          pointsBalance={0}
          onClose={jest.fn()}
          onSelect={jest.fn()}
          onPurchase={jest.fn()}
        />,
      );

      expect(screen.queryByText('150 pts to unlock')).toBeNull();
    });

    it('gives an unowned item an accessibility label combining its name and the cost', async () => {
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedOnlyClownfish}
          pointsBalance={0}
          onClose={jest.fn()}
          onSelect={jest.fn()}
          onPurchase={jest.fn()}
        />,
      );

      expect(screen.getByLabelText('Seahorse. 500 pts to unlock.')).toBeTruthy();
    });

    it('prompts to confirm a purchase when tapping an affordable, unowned item', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedOnlyClownfish}
          pointsBalance={500}
          onClose={jest.fn()}
          onSelect={jest.fn()}
          onPurchase={jest.fn()}
        />,
      );

      fireEvent.press(screen.getByTestId('fish-item-seahorse'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Buy Seahorse for 500 pts?',
        undefined,
        expect.arrayContaining([expect.objectContaining({ text: 'Buy' })]),
      );
      alertSpy.mockRestore();
    });

    it('calls onPurchase only once the confirmation is accepted', async () => {
      const onPurchase = jest.fn();
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
        const buyButton = buttons?.find((button) => button.text === 'Buy');
        buyButton?.onPress?.();
      });
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedOnlyClownfish}
          pointsBalance={500}
          onClose={jest.fn()}
          onSelect={jest.fn()}
          onPurchase={onPurchase}
        />,
      );

      fireEvent.press(screen.getByTestId('fish-item-seahorse'));

      expect(onPurchase).toHaveBeenCalledWith('seahorse');
      alertSpy.mockRestore();
    });
  });

  describe('random selection', () => {
    it('selects one of the owned items when the random tile is pressed', async () => {
      const onSelect = jest.fn();
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedAll}
          pointsBalance={0}
          onClose={jest.fn()}
          onSelect={onSelect}
          onPurchase={jest.fn()}
        />,
      );

      fireEvent.press(screen.getByTestId('fish-item-random'));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(items.map((item) => item.id)).toContain(onSelect.mock.calls[0][0]);
      randomSpy.mockRestore();
    });

    it('only picks among owned items, never a locked one', async () => {
      const onSelect = jest.fn();
      const ownedOnlyClownfish = new Set(['clownfish']);
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={ownedOnlyClownfish}
          pointsBalance={0}
          onClose={jest.fn()}
          onSelect={onSelect}
          onPurchase={jest.fn()}
        />,
      );

      fireEvent.press(screen.getByTestId('fish-item-random'));

      expect(onSelect).toHaveBeenCalledWith('clownfish');
    });

    it('disables the random tile when no items are owned', async () => {
      const onSelect = jest.fn();
      await render(
        <FishPickerSheet
          visible
          items={items}
          ownedSpeciesIds={new Set()}
          pointsBalance={0}
          onClose={jest.fn()}
          onSelect={onSelect}
          onPurchase={jest.fn()}
        />,
      );

      const randomTile = screen.getByTestId('fish-item-random');
      expect(randomTile.props.accessibilityState?.disabled).toBe(true);

      fireEvent.press(randomTile);

      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
