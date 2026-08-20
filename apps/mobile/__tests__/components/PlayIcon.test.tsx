import { render } from '@testing-library/react-native';
import { Path } from 'react-native-svg';

import { PlayIcon } from '../../components/PlayIcon';

describe('<PlayIcon />', () => {
  it('draws a filled triangle with round-joined corners at the requested size/color', async () => {
    const { UNSAFE_getByType } = await render(
      <PlayIcon size={30} color="#00251c" />,
    );

    // Read props off the composite <Path> element (pre-native-processing),
    // since react-native-svg encodes color/enum props on the host instance.
    const path = UNSAFE_getByType(Path);
    expect(path.props.fill).toBe('#00251c');
    expect(path.props.stroke).toBe('#00251c');
    expect(path.props.strokeLinejoin).toBe('round');
    expect(path.props.strokeLinecap).toBe('round');
  });
});
