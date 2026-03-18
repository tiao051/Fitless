import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DailyNutritionScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.subtitle}>Daily nutrition is now shown on the Today tab for a simpler flow.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Where to check your progress</Text>
          <Text style={styles.cardText}>Open Today to see calories, macros, and all logged meals in one place.</Text>
        </View>

        <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Go to Today</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  title: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 24,
    color: '#8D8E94',
    fontWeight: '500',
  },
  card: {
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardTitle: {
    fontSize: 20,
    color: '#0E0E10',
    fontWeight: '800',
  },
  cardText: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#4F515A',
    fontWeight: '500',
  },
  button: {
    marginTop: 14,
    minHeight: 60,
    borderRadius: 30,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
});
