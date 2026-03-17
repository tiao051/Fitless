import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type Props = {
  navigation: any;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoRingOuter}>
            <View style={styles.logoRingInner}>
              <Text style={styles.logoGlyph}>F</Text>
            </View>
          </View>

          <Text style={styles.brand}>FITLY</Text>
          <Text style={styles.tagline}>Your body, measured.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Onboarding')}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <View style={styles.signInRow}>
            <Text style={styles.signInLabel}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
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
    paddingHorizontal: 26,
    paddingBottom: 24,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
  },
  logoRingOuter: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: '#ECECEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  logoRingInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 3,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  logoGlyph: {
    fontSize: 72,
    fontWeight: '900',
    color: '#101012',
  },
  brand: {
    marginTop: 10,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 5,
    color: '#0E0E10',
  },
  tagline: {
    marginTop: 10,
    fontSize: 19,
    color: '#8D8E94',
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 8,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 38,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  signInRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  signInLabel: {
    fontSize: 18,
    color: '#8D8E94',
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 18,
    color: '#0E0E10',
    fontWeight: '700',
  },
});