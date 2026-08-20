import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Heatmap } from '../../components/Heatmap';
import { buildHeatmapDays } from '../../lib/stats-view';

function layout(width: number) {
  fireEvent(screen.getByTestId('stats-heatmap'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 40 } },
  });
}

describe('<Heatmap />', () => {
  it('renders one cell per day, 84 in total, once measured', async () => {
    const days = buildHeatmapDays([], new Date('2026-03-15T12:00:00.000Z'));
    await render(<Heatmap days={days} />);
    await act(async () => layout(320));

    expect(screen.getAllByLabelText(/completed/)).toHaveLength(84);
  });

  it('labels a day with its completed-session count', async () => {
    const days = buildHeatmapDays(
      [{ date: '2026-03-15', completedSessions: 2, failedSessions: 0, totalFocusMinutes: 50 }],
      new Date('2026-03-15T12:00:00.000Z'),
    );
    await render(<Heatmap days={days} />);
    await act(async () => layout(320));

    expect(screen.getByLabelText('2026-03-15: 2 completed')).toBeTruthy();
  });

  it('sizes cells to fill the measured width', async () => {
    const days = buildHeatmapDays([], new Date('2026-03-15T12:00:00.000Z'));
    await render(<Heatmap days={days} />);
    await act(async () => layout(333)); // 12 weeks, 11 gaps of 3px -> exactly 25px cells

    const cell = screen.getAllByLabelText(/completed/)[0];
    expect(cell.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: 25, height: 25 })]));
  });
});
