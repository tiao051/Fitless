import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

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
    } catch (error: any) {
      Alert.alert('Registration failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Set up your Fitly profile.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#8D8E94"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
          />

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

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#8D8E94"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <View>
          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Create account</Text>}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },
  title: {
    fontSize: 50,
    lineHeight: 56,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    color: '#8D8E94',
    fontWeight: '500',
  },
  form: {
    marginTop: 24,
    gap: 10,
  },
  label: {
    fontSize: 15,
    color: '#0E0E10',
    fontWeight: '700',
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 17,
    color: '#0E0E10',
    fontWeight: '500',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 4,
    minHeight: 62,
    borderRadius: 31,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  buttonDisabled: {
    backgroundColor: '#A9A9B0',
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  footerText: {
    fontSize: 16,
    color: '#8D8E94',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 16,
    color: '#0E0E10',
    fontWeight: '700',
  },
});
