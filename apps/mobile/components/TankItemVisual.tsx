import { StyleSheet, Text } from 'react-native';

import { tankItemAnimation, tankItemVisual } from '../lib/tank-item-visuals';

export function TankItemVisual({ itemId, size }: { itemId: string; size: number }) {
  const Animation = tankItemAnimation(itemId);

  if (Animation) return <Animation size={size} />;

  // Fallback to a static emoji for items that don't have an animation yet.
  return <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{tankItemVisual(itemId)}</Text>;
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});
