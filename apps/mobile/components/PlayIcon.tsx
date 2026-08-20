import Svg, { Path } from 'react-native-svg';

// Play triangle with rounded corners — a filled path plus a matching round-joined stroke
export function PlayIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M7 4.5 L19 12 L7 19.5 Z"
        fill={color}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
