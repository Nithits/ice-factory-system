import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { deliveriesApi, tripsApi } from '../api/endpoints';
import { useAuth } from '../context/auth-context';
import { useTripTracking } from '../hooks/use-trip-tracking';
import type { Delivery, Trip } from '../types';
import { TRIP_STATUS_LABEL, formatCurrency } from '../utils/format';

export default function DriverHome() {
  const { user, logout } = useAuth();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;

    const trips = await tripsApi.list();
    const activeTrip =
      trips.find(
        (t) =>
          t.driverId === user.id &&
          (t.status === 'LOADING' || t.status === 'IN_PROGRESS'),
      ) ?? null;

    setTrip(activeTrip);

    if (activeTrip) {
      const allDeliveries = await deliveriesApi.list();
      setDeliveries(
        allDeliveries.filter((d) => d.tripId === activeTrip.id),
      );
    } else {
      setDeliveries([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useTripTracking({
    enabled: trip?.status === 'IN_PROGRESS',
    vehicleId: trip?.vehicleId ?? 0,
    tripId: trip?.id ?? 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleStart = async () => {
    if (!trip) return;

    try {
      setBusy(true);
      const updated = await tripsApi.start(trip.id);
      setTrip(updated);
    } catch (error: any) {
      Alert.alert(
        'เริ่มเที่ยวไม่สำเร็จ',
        error?.response?.data?.message ?? 'กรุณาลองใหม่อีกครั้ง',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = () => {
    if (!trip) return;

    Alert.alert('จบงาน', 'ยืนยันว่าส่งน้ำแข็งครบแล้วและกลับโรงงาน?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยืนยัน',
        onPress: async () => {
          try {
            setBusy(true);
            await tripsApi.complete(trip.id);
            await load();
          } catch (error: any) {
            Alert.alert(
              'จบงานไม่สำเร็จ',
              error?.response?.data?.message ?? 'กรุณาลองใหม่อีกครั้ง',
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (trip === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>สวัสดี {user?.name}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>

      {!trip && (
        <View style={styles.card}>
          <Text style={styles.empty}>ยังไม่มีเที่ยวที่ได้รับมอบหมาย</Text>
          <Text style={styles.emptySub}>
            ดึงหน้าจอลงเพื่อรีเฟรช หรือรอเจ้าหน้าที่เช็คยอดและจัดรถให้
          </Text>
        </View>
      )}

      {trip && (
        <>
          <View style={styles.card}>
            <Text style={styles.vehicle}>
              {trip.vehicle.name} ({trip.vehicle.plate})
            </Text>
            <Text style={styles.status}>
              สถานะ: {TRIP_STATUS_LABEL[trip.status]}
            </Text>
            <Text style={styles.total}>
              ยอดขายเที่ยวนี้: {formatCurrency(trip.totalAmount)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>น้ำแข็งบนรถ</Text>

            {trip.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.iceProduct.name}</Text>
                <Text style={styles.itemQty}>
                  เหลือ {item.remainingQuantity}/{item.loadedQuantity}{' '}
                  {item.iceProduct.unit}
                </Text>
              </View>
            ))}
          </View>

          {trip.status === 'LOADING' && (
            <TouchableOpacity
              style={styles.primaryButton}
              disabled={busy}
              onPress={handleStart}
            >
              <Text style={styles.primaryButtonText}>
                {busy ? 'กำลังเริ่ม...' : 'ออกจากโรงงาน (เริ่มเที่ยว)'}
              </Text>
            </TouchableOpacity>
          )}

          {trip.status === 'IN_PROGRESS' && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push(`/new-delivery/${trip.id}`)}
              >
                <Text style={styles.primaryButtonText}>
                  บันทึกการส่งของ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                disabled={busy}
                onPress={handleComplete}
              >
                <Text style={styles.secondaryButtonText}>
                  {busy ? 'กำลังจบงาน...' : 'จบงาน / กลับโรงงาน'}
                </Text>
              </TouchableOpacity>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  ประวัติการส่งเที่ยวนี้ ({deliveries.length})
                </Text>

                {deliveries.length === 0 && (
                  <Text style={styles.emptySub}>ยังไม่มีการส่งของ</Text>
                )}

                {deliveries.map((delivery) => (
                  <View key={delivery.id} style={styles.deliveryRow}>
                    <Text style={styles.itemName}>
                      {delivery.customerName ?? 'ลูกค้า'}{' '}
                      {delivery.village ? `(${delivery.village})` : ''}
                    </Text>
                    <Text style={styles.itemQty}>
                      {formatCurrency(delivery.totalAmount)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  logout: {
    color: '#c0392b',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  empty: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySub: {
    color: '#666',
    textAlign: 'center',
  },
  vehicle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 15,
    color: '#333',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a7f37',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  itemName: {
    fontSize: 15,
  },
  itemQty: {
    fontSize: 15,
    color: '#333',
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  primaryButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#c0392b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#c0392b',
    fontWeight: '600',
    fontSize: 16,
  },
});
