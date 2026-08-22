import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { tripsApi } from '../api/endpoints';
import type { Trip } from '../types';
import { TRIP_STATUS_LABEL, formatCurrency } from '../utils/format';

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setTrips(await tripsApi.list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={trips}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={<Text style={styles.emptySub}>ยังไม่มีเที่ยวรถ</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.tripRow}
          onPress={() => router.push(`/trip/${item.id}`)}
        >
          <View>
            <Text style={styles.tripVehicle}>
              {item.vehicle.plate} · {item.driver.name}
            </Text>
            <Text style={styles.tripStatus}>
              {TRIP_STATUS_LABEL[item.status]}
            </Text>
          </View>
          <Text style={styles.tripTotal}>
            {formatCurrency(item.totalAmount)}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  emptySub: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  tripVehicle: {
    fontSize: 15,
    fontWeight: '600',
  },
  tripStatus: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  tripTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a7f37',
  },
});
