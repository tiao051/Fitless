import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { AuthService, User } from '../../services/authService';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userIdStr = await AsyncStorage.getItem('userId');
        if (userIdStr) {
          const userData = await AuthService.getUser(parseInt(userIdStr, 10));
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Do you want to sign out from Fitly?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await auth.signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#0E0E10" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <Text style={styles.emptyTitle}>Profile is unavailable</Text>
        <Text style={styles.emptyText}>Please sign in again to continue.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {user.firstName.charAt(0)}
              {user.lastName && user.lastName !== '-' ? user.lastName.charAt(0) : ''}
            </Text>
          </View>

          <Text style={styles.name}>
            {user.firstName}
            {user.lastName && user.lastName !== '-' ? ` ${user.lastName}` : ''}
          </Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Member since</Text>
            <Text style={styles.metaValue}>{new Date(user.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleLogout}>
          <Text style={styles.signOutButtonText}>Sign out</Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  pageTitle: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -1,
    marginBottom: 18,
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0E0E10',
  },
  name: {
    marginTop: 14,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: '#0E0E10',
  },
  email: {
    marginTop: 4,
    fontSize: 17,
    color: '#8D8E94',
    fontWeight: '500',
  },
  metaRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E3E3E8',
    paddingTop: 14,
  },
  metaLabel: {
    fontSize: 15,
    color: '#8D8E94',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 15,
    color: '#0E0E10',
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 14,
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    fontSize: 22,
    lineHeight: 26,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E0E10',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 16,
    color: '#8D8E94',
    textAlign: 'center',
  },
});
