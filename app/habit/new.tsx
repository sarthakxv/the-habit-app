import { StyleSheet, Text, View } from 'react-native';

export default function NewHabitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Habit</Text>
      <Text style={styles.subtitle}>Create habit form will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
