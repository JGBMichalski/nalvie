import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UNLOCK_POOL } from '@nalvie/core';

import { GlassPanel } from '../components/GlassPanel';
import { TankBackdrop } from '../components/TankBackdrop';
import { TankItemVisual } from '../components/TankItemVisual';
import { tankItemAnimation, tankItemBehaviour } from '../lib/tank-item-visuals';
import { theme } from '../theme';

// Dev-only gallery of every unlockable item, so animations can be eyeballed
// without grinding out real sessions to unlock them.
export default function TankPreviewScreen() {
  return (
    <TankBackdrop>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <Text style={styles.title}>Tank preview</Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {UNLOCK_POOL.map((item) => {
            const Animation = tankItemAnimation(item.id);
            return (
              <GlassPanel key={item.id} style={styles.card}>
                <View style={styles.stage}>
                  <TankItemVisual itemId={item.id} size={96} />
                </View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.rarity} · {tankItemBehaviour(item.id)}
                  {Animation ? ' · animated' : ' · emoji'}
                </Text>
              </GlassPanel>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </TankBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
  },
  stage: {
    height: 96,
    justifyContent: 'center',
  },
  name: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});
