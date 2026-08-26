import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../context/auth-context';
import type { UserRole } from '../../types';

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'แอดมิน',
  STAFF: 'พนักงานโรงงาน',
  DRIVER: 'พนักงานขับรถ',
};

export default function ProfileTab() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.detail}>Username: {user?.username}</Text>
        <Text style={styles.detail}>
          บทบาท: {user ? ROLE_LABEL[user.role] : '-'}
        </Text>
        {user?.phone && (
          <Text style={styles.detail}>เบอร์โทร: {user.phone}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 15,
    color: '#333',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#c0392b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#c0392b',
    fontWeight: '600',
    fontSize: 16,
  },
});
