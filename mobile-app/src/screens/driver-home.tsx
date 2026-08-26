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

import { deliveriesApi, shiftsApi, tripsApi } from '../api/endpoints';
import { useAuth } from '../context/auth-context';
import { useTripTracking } from '../hooks/use-trip-tracking';
import type { Delivery, Shift, Trip } from '../types';
import { TRIP_STATUS_LABEL, formatCurrency } from '../utils/format';

const SHIFT_STATUS_LABEL: Record<Shift['status'], string> = {
  ACTIVE: 'กำลังทำงาน',
  ON_BREAK: 'กำลังพัก',
  ENDED: 'จบกะแล้ว',
};

export default function DriverHome() {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [myShift, setMyShift] = useState<Shift | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;

    const trips = await tripsApi.list();
    const activeTrip =
      trips.find(
        (t) =>
          (t.driverId === user.id ||
            t.crew.some((member) => member.userId === user.id)) &&
          (t.status === 'LOADING' || t.status === 'IN_PROGRESS'),
      ) ?? null;

    setTrip(activeTrip);

    if (activeTrip) {
      const [allDeliveries, shifts] = await Promise.all([
        deliveriesApi.list(),
        shiftsApi.listByTrip(activeTrip.id),
      ]);

      setDeliveries(allDeliveries.filter((d) => d.tripId === activeTrip.id));
      setMyShift(
        shifts.find(
          (s) => s.userId === user.id && s.status !== 'ENDED',
        ) ?? null,
      );
    } else {
      setDeliveries([]);
      setMyShift(null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useTripTracking({
    enabled: myShift?.status === 'ACTIVE',
    vehicleId: trip?.vehicleId ?? 0,
    tripId: trip?.id ?? 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const runAction = async (
    action: () => Promise<unknown>,
    failTitle: string,
  ) => {
    try {
      setBusy(true);
      await action();
      await load();
    } catch (error: any) {
      Alert.alert(
        failTitle,
        error?.response?.data?.message ?? 'กรุณาลองใหม่อีกครั้ง',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStart = () => {
    if (!trip) return;

    runAction(async () => {
      await tripsApi.start(trip.id);
      await shiftsApi.start({ tripId: trip.id });
    }, 'เริ่มเที่ยวไม่สำเร็จ');
  };

  const handleStartMyShift = () => {
    if (!trip) return;

    runAction(
      () => shiftsApi.start({ tripId: trip.id }),
      'เข้าเวรไม่สำเร็จ',
    );
  };

  const handleBreak = () => {
    if (!myShift) return;
    runAction(() => shiftsApi.takeBreak(myShift.id), 'พักเบรกไม่สำเร็จ');
  };

  const handleResume = () => {
    if (!myShift) return;
    runAction(() => shiftsApi.resume(myShift.id), 'กลับเข้างานไม่สำเร็จ');
  };

  const handleEndMyShift = () => {
    if (!myShift) return;

    Alert.alert('จบกะของฉัน', 'ยืนยันจบกะการทำงานของคุณ?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยืนยัน',
        onPress: () =>
          runAction(() => shiftsApi.end(myShift.id), 'จบกะไม่สำเร็จ'),
      },
    ]);
  };

  const handleComplete = () => {
    if (!trip) return;

    Alert.alert('ปิดเที่ยว', 'ยืนยันว่าส่งน้ำแข็งครบแล้วและนำรถกลับโรงงาน?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยืนยัน',
        onPress: () =>
          runAction(() => tripsApi.complete(trip.id), 'ปิดเที่ยวไม่สำเร็จ'),
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

  const isMainDriver = trip?.driverId === user?.id;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>สวัสดี {user?.name}</Text>
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
              สถานะเที่ยว: {TRIP_STATUS_LABEL[trip.status]}
            </Text>
            {myShift && (
              <View
                style={[
                  styles.shiftPill,
                  myShift.status === 'ON_BREAK' && styles.shiftPillBreak,
                ]}
              >
                <Text style={styles.shiftPillText}>
                  กะของฉัน: {SHIFT_STATUS_LABEL[myShift.status]}
                </Text>
              </View>
            )}
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

          {trip.status === 'LOADING' && isMainDriver && (
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

          {trip.status === 'LOADING' && !isMainDriver && (
            <View style={styles.card}>
              <Text style={styles.emptySub}>
                รอคนขับหลักเริ่มเที่ยวก่อนจึงจะเข้าเวรได้
              </Text>
            </View>
          )}

          {trip.status === 'IN_PROGRESS' && !myShift && (
            <TouchableOpacity
              style={styles.primaryButton}
              disabled={busy}
              onPress={handleStartMyShift}
            >
              <Text style={styles.primaryButtonText}>
                {busy ? 'กำลังเข้าเวร...' : 'เข้าเวร (เริ่มกะของฉัน)'}
              </Text>
            </TouchableOpacity>
          )}

          {trip.status === 'IN_PROGRESS' && myShift?.status === 'ACTIVE' && (
            <>
              <View style={styles.rowGap}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.flex1]}
                  disabled={busy}
                  onPress={handleBreak}
                >
                  <Text style={styles.secondaryButtonText}>พักเบรก</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, styles.flex1]}
                  onPress={() => router.push(`/report-problem/${trip.id}`)}
                >
                  <Text style={styles.secondaryButtonText}>แจ้งปัญหา</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.textButton}
                disabled={busy}
                onPress={handleEndMyShift}
              >
                <Text style={styles.textButtonLabel}>จบกะของฉัน</Text>
              </TouchableOpacity>

              {isMainDriver && (
                <TouchableOpacity
                  style={styles.dangerButton}
                  disabled={busy}
                  onPress={handleComplete}
                >
                  <Text style={styles.dangerButtonText}>
                    {busy ? 'กำลังปิดเที่ยว...' : 'ปิดเที่ยว / รถกลับโรงงาน'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {trip.status === 'IN_PROGRESS' && myShift?.status === 'ON_BREAK' && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                disabled={busy}
                onPress={handleResume}
              >
                <Text style={styles.primaryButtonText}>
                  {busy ? 'กำลังกลับเข้างาน...' : 'กลับเข้างาน'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textButton}
                disabled={busy}
                onPress={handleEndMyShift}
              >
                <Text style={styles.textButtonLabel}>จบกะของฉัน</Text>
              </TouchableOpacity>
            </>
          )}

          {trip.status === 'IN_PROGRESS' && (
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
  shiftPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcf5e3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  shiftPillBreak: {
    backgroundColor: '#fdecc8',
  },
  shiftPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a7f37',
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
  rowGap: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
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
    borderColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 15,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#c0392b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#c0392b',
    fontWeight: '600',
    fontSize: 16,
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  textButtonLabel: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
});
