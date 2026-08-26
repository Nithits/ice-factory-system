import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';

import { customersApi, villagesApi } from '../api/endpoints';
import type { Village } from '../types';

export default function NewCustomerScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [villages, setVillages] = useState<Village[]>([]);
  const [villageId, setVillageId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    villagesApi.list().then((list) => {
      setVillages(list);
      setLoading(false);
    });
  }, []);

  const captureLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('แจ้งเตือน', 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } finally {
      setLocating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!villageId) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกหมู่บ้าน');
      return;
    }

    if (!name.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อร้านค้า');
      return;
    }

    try {
      setSubmitting(true);
      await customersApi.create({
        villageId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      Alert.alert('สำเร็จ', 'เพิ่มร้านค้าใหม่เรียบร้อยแล้ว');
      router.back();
    } catch (error: any) {
      Alert.alert(
        'เพิ่มร้านค้าไม่สำเร็จ',
        error?.response?.data?.message ?? 'กรุณาลองใหม่อีกครั้ง',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>เลือกหมู่บ้าน</Text>

      {villages.length === 0 && (
        <Text style={styles.emptySub}>
          ยังไม่มีหมู่บ้านในระบบ กรุณาติดต่อแอดมินให้ตั้งค่าโซน/หมู่บ้านก่อน
        </Text>
      )}

      <View style={styles.chipRow}>
        {villages.map((village) => (
          <TouchableOpacity
            key={village.id}
            style={[
              styles.chip,
              villageId === village.id && styles.chipSelected,
            ]}
            onPress={() => setVillageId(village.id)}
          >
            <Text
              style={[
                styles.chipText,
                villageId === village.id && styles.chipTextSelected,
              ]}
            >
              {village.name} ({village.zone.name})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>ชื่อร้านค้า</Text>
      <TextInput
        style={styles.input}
        placeholder="ชื่อร้าน/บ้านลูกค้า"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>เบอร์โทร (ไม่บังคับ)</Text>
      <TextInput
        style={styles.input}
        placeholder="เบอร์โทร"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>หมายเหตุ (ไม่บังคับ)</Text>
      <TextInput
        style={styles.input}
        placeholder="เช่น จุดสังเกต"
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity
        style={styles.locateButton}
        disabled={locating}
        onPress={captureLocation}
      >
        <Text style={styles.locateButtonText}>
          {locating
            ? 'กำลังจับพิกัด...'
            : coords
              ? `📍 บันทึกพิกัดแล้ว (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`
              : '📍 จับพิกัดตำแหน่งปัจจุบัน'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitButton}
        disabled={submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>บันทึกร้านค้าใหม่</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: '#666',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  chipText: {
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locateButton: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  locateButtonText: {
    color: '#222',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
