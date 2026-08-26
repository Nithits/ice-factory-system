import { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';

import { problemReportsApi } from '../../api/endpoints';
import type { ProblemCategory } from '../../types';

const CATEGORIES: { value: ProblemCategory; label: string }[] = [
  { value: 'VEHICLE', label: 'รถเสีย' },
  { value: 'CUSTOMER', label: 'ลูกค้า' },
  { value: 'STOCK', label: 'สต็อก' },
  { value: 'OTHER', label: 'อื่นๆ' },
];

export default function ReportProblemScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [category, setCategory] = useState<ProblemCategory>('OTHER');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรายละเอียดปัญหา');
      return;
    }

    try {
      setSubmitting(true);

      let coords: { latitude?: number; longitude?: number } = {};

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({});
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        }
      } catch {
        // ไม่บังคับต้องมีพิกัด
      }

      await problemReportsApi.create({
        tripId: Number(tripId),
        category,
        description: description.trim(),
        ...coords,
      });

      Alert.alert('ส่งรายงานแล้ว', 'แจ้งปัญหาไปยังโรงงานเรียบร้อย');
      router.back();
    } catch (error: any) {
      Alert.alert(
        'ส่งรายงานไม่สำเร็จ',
        error?.response?.data?.message ?? 'กรุณาลองใหม่อีกครั้ง',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>ประเภทปัญหา</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.chip,
              category === item.value && styles.chipSelected,
            ]}
            onPress={() => setCategory(item.value)}
          >
            <Text
              style={[
                styles.chipText,
                category === item.value && styles.chipTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>รายละเอียด</Text>
      <TextInput
        style={styles.textarea}
        placeholder="อธิบายปัญหาที่พบ"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={styles.submitButton}
        disabled={submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>ส่งรายงาน</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#c0392b',
    borderColor: '#c0392b',
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
    marginTop: 6,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
