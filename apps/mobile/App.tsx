import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SESSION_PRESET_MINUTES } from '@nalvie/core';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Nalvie 🐠</Text>
      <Text>Presets: {SESSION_PRESET_MINUTES.join(', ')} min</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
