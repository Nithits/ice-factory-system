import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import { deliveriesApi, tripsApi } from '../../api/endpoints';
import type { Delivery, Trip } from '../../types';
import { TRIP_STATUS_LABEL, formatCurrency } from '../../utils/format';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const tripId = Number(id);
        const [tripData, allDeliveries] = await Promise.all([
          tripsApi.get(tripId),
          deliveriesApi.list(),
        ]);

        setTrip(tripData);
        setDeliveries(allDeliveries.filter((d) => d.tripId === tripId));
      })();
    }, [id]),
  );

  if (!trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.vehicle}>
          {trip.vehicle.name} ({trip.vehicle.plate})
        </Text>
        <Text style={styles.meta}>คนขับ: {trip.driver.name}</Text>
        <Text style={styles.meta}>สถานะ: {TRIP_STATUS_LABEL[trip.status]}</Text>
        <Text style={styles.total}>
          ยอดขายรวม: {formatCurrency(trip.totalAmount)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>รายการน้ำแข็งที่โหลด</Text>
        {trip.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.rowLabel}>{item.iceProduct.name}</Text>
            <Text style={styles.rowValue}>
              ส่งแล้ว {item.deliveredQuantity}/{item.loadedQuantity}{' '}
              {item.iceProduct.unit} (เหลือ {item.remainingQuantity})
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          ประวัติการส่ง ({deliveries.length})
        </Text>

        {deliveries.length === 0 && (
          <Text style={styles.emptySub}>ยังไม่มีการส่งของ</Text>
        )}

        {deliveries.map((delivery) => (
          <View key={delivery.id} style={styles.row}>
            <Text style={styles.rowLabel}>
              {delivery.customerName ?? 'ลูกค้า'}{' '}
              {delivery.village ? `(${delivery.village})` : ''}
            </Text>
            <Text style={styles.rowValue}>
              {formatCurrency(delivery.totalAmount)}
            </Text>
          </View>
        ))}
      </View>
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
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  vehicle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  meta: {
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
  emptySub: {
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    color: '#333',
  },
});
