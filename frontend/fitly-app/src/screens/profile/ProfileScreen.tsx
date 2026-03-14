import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await auth.signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {user && (
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Text>
          </View>

          <Text style={styles.fullName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>Help & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  fullName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  infoSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionsSection: {
    marginHorizontal: 12,
    marginVertical: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FFF3F3',
    borderBottomWidth: 0,
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
  },
});
