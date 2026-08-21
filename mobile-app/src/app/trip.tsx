import {
  SafeAreaView,
  StyleSheet,
  Text,
} from 'react-native';

export default function TripScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>เที่ยวส่งน้ำแข็ง</Text>
      <Text>กำลังพัฒนาข้อมูล Trip...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});