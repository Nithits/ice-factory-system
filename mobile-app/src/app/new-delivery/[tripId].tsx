import { useCallback, useState } from 'react';
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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { deliveriesApi, tripsApi } from '../../api/endpoints';
import type { Trip } from '../../types';
import { formatCurrency } from '../../utils/format';

export default function NewDeliveryScreen() {
  const { tripId, customerId, customerName: prefilledName, village: prefilledVillage } =
    useLocalSearchParams<{
      tripId: string;
      customerId?: string;
      customerName?: string;
      village?: string;
    }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [customerName, setCustomerName] = useState(prefilledName ?? '');
  const [village, setVillage] = useState(prefilledVillage ?? '');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const isRegisteredCustomer = Boolean(customerId);

  const load = useCallback(async () => {
    const data = await tripsApi.get(Number(tripId));
    setTrip(data);
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const items = trip.items
    .filter((item) => item.remainingQuantity > 0)
    .map((item) => {
      const quantity = Number(quantities[item.iceProductId] ?? 0) || 0;
      const unitPrice = Number(item.iceProduct.price);
      return { item, quantity, unitPrice, lineTotal: quantity * unitPrice };
    });

  const total = items.reduce((sum, row) => sum + row.lineTotal, 0);
  const hasAnyQuantity = items.some((row) => row.quantity > 0);

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อลูกค้า');
      return;
    }

    if (!hasAnyQuantity) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกจำนวนน้ำแข็งที่ส่งอย่างน้อย 1 รายการ');
      return;
    }

    const overLimit = items.find(
      (row) => row.quantity > row.item.remainingQuantity,
    );

    if (overLimit) {
      Alert.alert(
        'แจ้งเตือน',
        `${overLimit.item.iceProduct.name} คงเหลือไม่พอ (เหลือ ${overLimit.item.remainingQuantity})`,
      );
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
        // ไม่บังคับต้องมีพิกัด หากดึงไม่ได้ก็ส่งต่อได้
      }

      await deliveriesApi.create({
        tripId: trip.id,
        customerId: customerId ? Number(customerId) : undefined,
        customerName: customerName.trim(),
        village: village.trim() || undefined,
        ...coords,
        items: items
          .filter((row) => row.quantity > 0)
          .map((row) => ({
            iceProductId: row.item.iceProductId,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
          })),
      });

      router.back();
    } catch (error: any) {
      Alert.alert(
        'บันทึกไม่สำเร็จ',
        error?.response?.data?.message ?? 'กรุณาลองใหม่อีกครั้ง',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isRegisteredCustomer ? (
        <View style={styles.customerBanner}>
          <Text style={styles.customerBannerName}>{customerName}</Text>
          {village ? (
            <Text style={styles.customerBannerVillage}>{village}</Text>
          ) : null}
        </View>
      ) : (
        <>
          <Text style={styles.label}>ชื่อลูกค้า</Text>
          <TextInput
            style={styles.input}
            placeholder="ชื่อลูกค้า / ร้านค้า"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={styles.label}>หมู่บ้าน (ไม่บังคับ)</Text>
          <TextInput
            style={styles.input}
            placeholder="หมู่บ้าน"
            value={village}
            onChangeText={setVillage}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>รายการน้ำแข็ง</Text>

      {items.length === 0 && (
        <Text style={styles.emptySub}>น้ำแข็งบนรถหมดแล้ว</Text>
      )}

      {items.map((row) => (
        <View key={row.item.id} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{row.item.iceProduct.name}</Text>
            <Text style={styles.itemMeta}>
              เหลือ {row.item.remainingQuantity} {row.item.iceProduct.unit} ·{' '}
              {formatCurrency(row.item.iceProduct.price)}/{row.item.iceProduct.unit}
            </Text>
          </View>

          <TextInput
            style={styles.qtyInput}
            keyboardType="numeric"
            placeholder="0"
            value={quantities[row.item.iceProductId] ?? ''}
            onChangeText={(text) =>
              setQuantities((prev) => ({
                ...prev,
                [row.item.iceProductId]: text.replace(/[^0-9]/g, ''),
              }))
            }
          />
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>รวม</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        disabled={submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>บันทึกการส่งของ</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  customerBanner: {
    backgroundColor: '#eef6ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customerBannerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  customerBannerVillage: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#666',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 13,
    color: '#666',
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 70,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a7f37',
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
