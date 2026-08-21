import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

import { removeToken } from '../storage/auth';

export default function HomeScreen() {
  const handleLogout = async () => {
    await removeToken();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>หน้า Driver</Text>

      <Text style={styles.text}>
        เข้าสู่ระบบสำเร็จ
      </Text>

      <TouchableOpacity
        style={styles.tripButton}
        onPress={() => router.push('/trip')}
      >
        <Text style={styles.buttonText}>
          ดูเที่ยวส่งน้ำแข็ง
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>
          ออกจากระบบ
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 30,
  },
  tripButton: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#555',
    padding: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});