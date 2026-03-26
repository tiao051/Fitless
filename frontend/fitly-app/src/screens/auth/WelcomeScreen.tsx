import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  navigation: any;
};

export default function WelcomeScreen({ navigation }: Props) {
  const handleSkipExplore = () => {
    Alert.alert('Coming Soon', 'This feature is under development');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../../assets/images/welcome_screen.webp')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Text style={styles.brand}>Fitly</Text>
          </View>

          {/* Hero section */}
          <View style={styles.heroSection}>
            <Text style={styles.title}>Welcome.</Text>
            <Text style={styles.subtitle}>Your fitness journey starts here.</Text>
            <Text style={styles.callToAction}>Conquer your health goals!</Text>
          </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.primaryButton} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>SIGN UP NOW</Text>
          </Pressable>

          <Pressable 
            style={styles.secondaryButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>LOG IN</Text>
          </Pressable>
        </View>

          {/* Skip link */}
          <Pressable 
            style={styles.skipButton}
            onPress={handleSkipExplore}
          >
            <Text style={styles.skipText}>Skip & Explore</Text>
          </Pressable>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },

  callToAction: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 28,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 100,
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 14,
    backgroundColor: 'rgba(14, 14, 16, 0.6)',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 14,
    backgroundColor: 'rgba(14, 14, 16, 0.6)',
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});