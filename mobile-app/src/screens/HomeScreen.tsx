import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { removeToken } from '../storage/auth';

type Props = {
  onLogout: () => void;
};

export default function HomeScreen({ onLogout }: Props) {
  const handleLogout = async () => {
    await removeToken();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>เข้าสู่ระบบสำเร็จ</Text>
      <Text style={styles.text}>Mobile App เชื่อม Backend แล้ว</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },

  text: {
    marginTop: 10,
    fontSize: 16,
  },

  button: {
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderRadius: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});