import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
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
        source={require('../../../assets/images/welcome_screen.webp')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Welcome back to Fitly.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#8D8E94"
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
            placeholderTextColor="#8D8E94"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <View>
          <Pressable style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to Fitly?</Text>
            <Pressable onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.footerLink}>Create account</Text>
            </Pressable>
          </View>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  title: {
    fontSize: 50,
    lineHeight: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  form: {
    marginTop: 8,
    gap: 10,
  },
  label: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(14, 14, 16, 0.6)',
    paddingHorizontal: 14,
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(14, 14, 16, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(14, 14, 16, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  footerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
