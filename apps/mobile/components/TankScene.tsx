import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import type { TankItem } from '@nalvie/core';

import { TankItemVisual } from './TankItemVisual';
import { reconcileAgents, stepAgents, type Agent } from '../lib/tank-simulation';
import { agentId } from '../lib/tank-species';
import { tankItemBehaviour, tankItemSizeScale } from '../lib/tank-item-visuals';

const SWIMMER_SIZE = 72;
const SEABED_SIZE = 40;
// Frames longer than this are treated as a hitch; integrating them whole would
// teleport everything across the tank after a stall or a backgrounded app.
const MAX_FRAME_MS = 48;

type Size = { width: number; height: number };

function seedFrom(id: string): () => number {
  let state = 0;
  for (let i = 0; i < id.length; i++) state = (state * 31 + id.charCodeAt(i)) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function Swimmer({
  itemId,
  index,
  agents,
}: {
  itemId: string;
  index: number;
  agents: { value: Agent[] };
}) {
  const style = useAnimatedStyle(() => {
    const agent = agents.value[index];
    if (!agent) return { opacity: 0 };

    return {
      opacity: 1,
      // scaleX is applied to the artwork first, then the nose rotates onto the
      // heading, then the creature is placed. Reordering breaks the mirroring.
      transform: [
        { translateX: agent.x - agent.halfWidth },
        { translateY: agent.y - agent.halfHeight },
        { rotate: `${agent.pitch}deg` },
        { scaleX: agent.flip },
      ],
    };
  });

  return (
    <Reanimated.View style={[styles.item, style]}>
      <TankItemVisual itemId={itemId} size={SWIMMER_SIZE * tankItemSizeScale(itemId)} />
    </Reanimated.View>
  );
}

function SeabedItem({ itemId, left }: { itemId: string; left: number }) {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const random = seedFrom(itemId);
    const duration = 2600 + random() * 1600;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [itemId, sway]);

  const tilt = sway.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });

  return (
    <Animated.View
      style={[
        styles.item,
        styles.seabedItem,
        { left, width: SEABED_SIZE, transform: [{ rotate: tilt }] },
      ]}
    >
      <TankItemVisual itemId={itemId} size={SEABED_SIZE} />
    </Animated.View>
  );
}

/**
 * Swimmers are driven by a shared steering simulation stepped once per
 * frame on reanimated's UI thread.
 */
export function TankScene({ items }: { items: TankItem[] }) {
  const [bounds, setBounds] = useState<Size>({ width: 0, height: 0 });
  const agents = useSharedValue<Agent[]>([]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBounds((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height },
    );
  };

  const swimmers = items.filter((item) => tankItemBehaviour(item.speciesId) === 'swim');
  const seabed = items.filter((item) => tankItemBehaviour(item.speciesId) === 'seabed');
  const swimmerKey = swimmers.map((item) => agentId(item.speciesId, item.id)).join(',');

  const populated = bounds.width > 0 && bounds.height > 0 && swimmerKey !== '';

  useEffect(() => {
    if (!populated) {
      agents.value = [];
      return;
    }
    // A newly-added fish shouldn't reset the ones already swimming back to their spawn position.
    agents.value = reconcileAgents(agents.value, swimmerKey.split(','), SWIMMER_SIZE, bounds.width, bounds.height);
  }, [agents, populated, swimmerKey, bounds.width, bounds.height]);

  useFrameCallback((frame) => {
    'worklet';
    const current = agents.value;
    if (current.length === 0) return;

    const elapsed = frame.timeSincePreviousFrame ?? 16;
    const dt = Math.min(elapsed, MAX_FRAME_MS) / 1000;
    stepAgents(current, bounds.width, bounds.height, dt);
    // Reassigning is what notifies each swimmer's animated style that the agent has moved.
    agents.value = current.slice();
  }, true);

  const seabedLayout = useMemo(
    () =>
      seabed.length === 0
        ? []
        : seabed.map((item, index, all) => ({
            key: agentId(item.speciesId, item.id),
            speciesId: item.speciesId,
            left: Math.max(
              0,
              ((index + 0.5) * bounds.width) / Math.max(1, all.length) - SEABED_SIZE / 2,
            ),
          })),
    [seabed, bounds.width],
  );

  return (
    <View style={styles.tank} onLayout={onLayout} pointerEvents="none" testID="tank-scene">
      {seabedLayout.map(({ key, speciesId, left }) => (
        <SeabedItem key={key} itemId={speciesId} left={left} />
      ))}
      {populated &&
        swimmers.map((item, index) => (
          <Swimmer key={item.id} itemId={item.speciesId} index={index} agents={agents} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tank: {
    flex: 1,
    overflow: 'hidden',
  },
  item: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
  },
  seabedItem: {
    top: undefined,
    bottom: 8,
  },
});
