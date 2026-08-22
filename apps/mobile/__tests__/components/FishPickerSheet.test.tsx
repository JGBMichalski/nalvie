import { render, screen, fireEvent } from '@testing-library/react-native';
import type { UnlockPoolItem } from '@nalvie/core';

import { FishPickerSheet } from '../../components/FishPickerSheet';

const items: UnlockPoolItem[] = [
  { id: 'clownfish', name: 'Clownfish', rarity: 'common', eligibility: 'always' },
  { id: 'seahorse', name: 'Seahorse', rarity: 'uncommon', eligibility: { minCompletedSessions: 5 } },
  { id: 'sea-turtle', name: 'Sea Turtle', rarity: 'rare', eligibility: { minStreakDays: 7 } },
];

const allEligible = new Set(items.map((item) => item.id));

describe('<FishPickerSheet />', () => {
  it('lists every item by name, eligible or not', async () => {
    await render(
      <FishPickerSheet visible items={items} eligibleItemIds={allEligible} onClose={jest.fn()} onSelect={jest.fn()} />,
    );

    expect(screen.getByText('Clownfish')).toBeTruthy();
    expect(screen.getByText('Seahorse')).toBeTruthy();
    expect(screen.getByText('Sea Turtle')).toBeTruthy();
  });

  it('shows the animated fish rather than a static emoji for species that have one', async () => {
    await render(
      <FishPickerSheet visible items={items} eligibleItemIds={allEligible} onClose={jest.fn()} onSelect={jest.fn()} />,
    );

    expect(screen.getByLabelText('Clownfish')).toBeTruthy();
    expect(screen.getByLabelText('Seahorse')).toBeTruthy();
  });

  it('calls onSelect with the tapped item id', async () => {
    const onSelect = jest.fn();
    await render(
      <FishPickerSheet visible items={items} eligibleItemIds={allEligible} onClose={jest.fn()} onSelect={onSelect} />,
    );

    fireEvent.press(screen.getByText('Seahorse'));

    expect(onSelect).toHaveBeenCalledWith('seahorse');
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <FishPickerSheet visible items={items} eligibleItemIds={allEligible} onClose={onClose} onSelect={jest.fn()} />,
    );

    fireEvent.press(screen.getByTestId('fish-picker-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  describe('locked items', () => {
    const eligibleOnlyClownfish = new Set(['clownfish']);

    it('marks a locked item as disabled and does not call onSelect when tapped', async () => {
      const onSelect = jest.fn();
      await render(
        <FishPickerSheet
          visible
          items={items}
          eligibleItemIds={eligibleOnlyClownfish}
          onClose={jest.fn()}
          onSelect={onSelect}
        />,
      );

      const seahorse = screen.getByTestId('fish-item-seahorse');
      expect(seahorse.props.accessibilityState?.disabled).toBe(true);

      fireEvent.press(seahorse);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('still allows selecting an eligible item', async () => {
      const onSelect = jest.fn();
      await render(
        <FishPickerSheet
          visible
          items={items}
          eligibleItemIds={eligibleOnlyClownfish}
          onClose={jest.fn()}
          onSelect={onSelect}
        />,
      );

      fireEvent.press(screen.getByText('Clownfish'));

      expect(onSelect).toHaveBeenCalledWith('clownfish');
    });

    it('explains the session-count requirement for a locked uncommon item', async () => {
      await render(
        <FishPickerSheet
          visible
          items={items}
          eligibleItemIds={eligibleOnlyClownfish}
          onClose={jest.fn()}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.getByText('Complete 5 sessions to unlock')).toBeTruthy();
    });

    it('explains the streak requirement for a locked rare item', async () => {
      await render(
        <FishPickerSheet
          visible
          items={items}
          eligibleItemIds={eligibleOnlyClownfish}
          onClose={jest.fn()}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.getByText('Reach a 7-day streak to unlock')).toBeTruthy();
    });

    it('does not show a requirement under an eligible item', async () => {
      await render(
        <FishPickerSheet
          visible
          items={items}
          eligibleItemIds={eligibleOnlyClownfish}
          onClose={jest.fn()}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.queryByText('Complete 0 sessions to unlock')).toBeNull();
    });

    it('gives a locked item an accessibility label combining its name and the requirement', async () => {
      await render(
        <FishPickerSheet
          visible
          items={items}
          eligibleItemIds={eligibleOnlyClownfish}
          onClose={jest.fn()}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.getByLabelText('Seahorse. Complete 5 sessions to unlock.')).toBeTruthy();
    });

    it('treats an already-owned species as selectable even if it is no longer currently eligible', async () => {
      // e.g. a rare item gated by a streak that has since reset — the spec's
      // "once eligible, always eligible" only holds for session-count gates,
      // so ownership is the real source of truth for anything already earned.
      const onSelect = jest.fn();
      await render(
        <FishPickerSheet
          visible
          items={items}
          eligibleItemIds={eligibleOnlyClownfish}
          ownedSpeciesIds={new Set(['sea-turtle'])}
          onClose={jest.fn()}
          onSelect={onSelect}
        />,
      );

      const seaTurtle = screen.getByTestId('fish-item-sea-turtle');
      expect(seaTurtle.props.accessibilityState?.disabled).toBe(false);
      expect(screen.queryByText('Reach a 7-day streak to unlock')).toBeNull();

      fireEvent.press(seaTurtle);
      expect(onSelect).toHaveBeenCalledWith('sea-turtle');
    });
  });
});
