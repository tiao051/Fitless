import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing information', 'Please fill in email and password.');
      return;
    }

    setLoading(true);
    try {
      await auth.signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Sign in failed', error?.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../../assets/images/login.webp')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.formContainer}>
              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(246, 241, 232, 0.65)"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(246, 241, 232, 0.65)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable 
                style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                onPress={handleLogin} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0E1A2A" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign in</Text>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>New to Fitly?</Text>
                <Pressable onPress={() => navigation.navigate('Register')} disabled={loading}>
                  <Text style={styles.footerLink}>Create account</Text>
                </Pressable>
              </View>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 18, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    gap: 8,
  },
  buttonContainer: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    color: '#F6F1E8',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(246, 241, 232, 0.68)',
    backgroundColor: 'rgba(8, 17, 28, 0.36)',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#F6F1E8',
    fontWeight: '500',
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
  primaryButtonText: {
    fontSize: 17,
    color: '#0E1A2A',
    fontWeight: '800',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(229, 196, 140, 0.45)',
    borderColor: 'rgba(229, 196, 140, 0.45)',
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  footerText: {
    fontSize: 15,
    color: '#F6F1E8',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footerLink: {
    fontSize: 15,
    color: '#EED6AE',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});