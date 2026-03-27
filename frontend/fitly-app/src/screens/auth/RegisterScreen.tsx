import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const BACKGROUND_BOTTOM_CROP_RATIO = 0.1;
const backgroundTopOffset = -Math.round(Dimensions.get('window').height * BACKGROUND_BOTTOM_CROP_RATIO);

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !displayName || !confirmPassword) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirmation must match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await auth.signUp(email.trim(), password, displayName.trim(), '-');
      navigation.navigate('Onboarding');
    } catch (error: any) {
      Alert.alert('Registration failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert('Coming Soon', 'Google sign up is under development.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../../assets/images/sign_up.webp')}
        style={styles.background}
        imageStyle={[styles.backgroundImage, { top: backgroundTopOffset }]}
        resizeMode="cover"
      >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Set up your profile</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="rgba(246, 241, 232, 0.65)"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(246, 241, 232, 0.65)"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(246, 241, 232, 0.65)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="rgba(246, 241, 232, 0.65)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#0E1A2A" /> : <Text style={styles.primaryButtonText}>Create account</Text>}
            </Pressable>

            <Pressable
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  backgroundImage: {
    bottom: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 11, 19, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F6F1E8',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#F6F1E8',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  form: {
    gap: 10,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 241, 232, 0.68)',
    backgroundColor: 'rgba(8, 17, 28, 0.36)',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#F6F1E8',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 10,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229, 196, 140, 0.9)',
    backgroundColor: '#E5C48C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 241, 232, 0.62)',
    backgroundColor: 'rgba(8, 17, 28, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    color: '#0E1A2A',
    fontWeight: '800',
  },
  googleButtonText: {
    fontSize: 15,
    color: '#F6F1E8',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(229, 196, 140, 0.45)',
    borderColor: 'rgba(229, 196, 140, 0.45)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 14,
    color: '#F6F1E8',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footerLink: {
    fontSize: 14,
    color: '#EED6AE',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
