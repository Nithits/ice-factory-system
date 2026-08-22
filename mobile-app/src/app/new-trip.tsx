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
import { router } from 'expo-router';

import { iceProductsApi, tripsApi, usersApi, vehiclesApi } from '../api/endpoints';
import type { AuthUser, IceProduct, Vehicle } from '../types';

export default function NewTripScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<AuthUser[]>([]);
  const [products, setProducts] = useState<IceProduct[]>([]);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      const [vehicleList, userList, productList] = await Promise.all([
        vehiclesApi.list(),
        usersApi.list(),
        iceProductsApi.list(),
      ]);

      setVehicles(vehicleList.filter((v) => v.status !== 'MAINTENANCE'));
      setDrivers(userList.filter((u) => u.role === 'DRIVER'));
      setProducts(productList.filter((p) => p.isActive));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!vehicleId) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกรถ');
      return;
    }

    if (!driverId) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกคนขับ');
      return;
    }

    const items = products
      .map((product) => ({
        iceProductId: product.id,
        loadedQuantity: Number(quantities[product.id] ?? 0) || 0,
      }))
      .filter((item) => item.loadedQuantity > 0);

    if (items.length === 0) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกจำนวนน้ำแข็งที่โหลดขึ้นรถอย่างน้อย 1 รายการ');
      return;
    }

    try {
      setSubmitting(true);
      const trip = await tripsApi.create({ vehicleId, driverId, items });
      Alert.alert('สำเร็จ', 'สร้างเที่ยวและเช็คยอดเรียบร้อยแล้ว');
      router.replace(`/trip/${trip.id}`);
    } catch (error: any) {
      Alert.alert(
        'สร้างเที่ยวไม่สำเร็จ',
        error?.response?.data?.message ?? 'กรุณาลองใหม่อีกครั้ง',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>เลือกรถ</Text>
      <View style={styles.chipRow}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.chip,
              vehicleId === vehicle.id && styles.chipSelected,
            ]}
            onPress={() => setVehicleId(vehicle.id)}
          >
            <Text
              style={[
                styles.chipText,
                vehicleId === vehicle.id && styles.chipTextSelected,
              ]}
            >
              {vehicle.name} ({vehicle.plate})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>เลือกคนขับ</Text>
      <View style={styles.chipRow}>
        {drivers.map((driver) => (
          <TouchableOpacity
            key={driver.id}
            style={[styles.chip, driverId === driver.id && styles.chipSelected]}
            onPress={() => setDriverId(driver.id)}
          >
            <Text
              style={[
                styles.chipText,
                driverId === driver.id && styles.chipTextSelected,
              ]}
            >
              {driver.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>เช็คยอดน้ำแข็งที่โหลดขึ้นรถ</Text>
      {products.map((product) => (
        <View key={product.id} style={styles.itemRow}>
          <Text style={styles.itemName}>
            {product.name} ({product.unit})
          </Text>
          <TextInput
            style={styles.qtyInput}
            keyboardType="numeric"
            placeholder="0"
            value={quantities[product.id] ?? ''}
            onChangeText={(text) =>
              setQuantities((prev) => ({
                ...prev,
                [product.id]: text.replace(/[^0-9]/g, ''),
              }))
            }
          />
        </View>
      ))}

      <TouchableOpacity
        style={styles.submitButton}
        disabled={submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            ยืนยันเช็คยอด & สร้างเที่ยว
          </Text>
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
    marginTop: 14,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  itemName: {
    fontSize: 15,
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
  submitButton: {
    backgroundColor: '#222',
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
