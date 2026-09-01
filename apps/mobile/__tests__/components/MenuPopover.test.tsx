import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { MenuPopover } from '../../components/MenuPopover';
import { resetSettingsRepositoryForTests, settingsRepository } from '../../lib/repository';

describe('<MenuPopover />', () => {
  beforeEach(() => {
    resetSettingsRepositoryForTests();
  });

  it('is not rendered when not visible', async () => {
    await render(<MenuPopover visible={false} topOffset={40} onClose={jest.fn()} />);

    expect(screen.queryByText('Unlock all creatures (dev)')).toBeNull();
  });

  it('lists the dev actions when visible', async () => {
    await render(<MenuPopover visible topOffset={40} onClose={jest.fn()} />);

    expect(screen.getByText('Tank preview (dev)')).toBeTruthy();
    expect(screen.getByText('Unlock all creatures (dev)')).toBeTruthy();
    expect(screen.getByText('Add 100 points (dev)')).toBeTruthy();
    expect(screen.getByText('Clear database (dev)')).toBeTruthy();
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    await render(<MenuPopover visible topOffset={40} onClose={onClose} />);

    fireEvent.press(screen.getByTestId('menu-popover-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Tank preview is pressed (closing the popover before navigating)', async () => {
    const onClose = jest.fn();
    await render(<MenuPopover visible topOffset={40} onClose={onClose} />);

    fireEvent.press(screen.getByText('Tank preview (dev)'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onDataChanged after the dev "unlock all creatures" action, since closing no longer triggers a focus-based refresh', async () => {
    const onDataChanged = jest.fn();
    await render(<MenuPopover visible topOffset={40} onClose={jest.fn()} onDataChanged={onDataChanged} />);

    fireEvent.press(screen.getByText('Unlock all creatures (dev)'));
    await act(async () => {});

    expect(onDataChanged).toHaveBeenCalled();
  });

  it('adds 100 points to the balance when "Add 100 points" is pressed', async () => {
    const onDataChanged = jest.fn();
    await render(<MenuPopover visible topOffset={40} onClose={jest.fn()} onDataChanged={onDataChanged} />);

    fireEvent.press(screen.getByText('Add 100 points (dev)'));
    await act(async () => {});

    expect((await settingsRepository.getSettings()).pointsBalance).toBe(100);
    expect(onDataChanged).toHaveBeenCalled();
  });

  it('accumulates across repeated presses', async () => {
    await render(<MenuPopover visible topOffset={40} onClose={jest.fn()} />);

    fireEvent.press(screen.getByText('Add 100 points (dev)'));
    await act(async () => {});
    fireEvent.press(screen.getByText('Add 100 points (dev)'));
    await act(async () => {});

    expect((await settingsRepository.getSettings()).pointsBalance).toBe(200);
  });
});
