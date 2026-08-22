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
import { useAuth } from '../context/auth-context';
import type { Trip } from '../types';
import { TRIP_STATUS_LABEL, formatCurrency } from '../utils/format';

export default function StaffHome() {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await tripsApi.list();
    setTrips(data.slice(0, 10));
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>สวัสดี {user?.name}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/new-trip')}
      >
        <Text style={styles.primaryButtonText}>
          เช็คยอด & สร้างเที่ยวใหม่
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/trips')}
      >
        <Text style={styles.secondaryButtonText}>ดูเที่ยวรถทั้งหมด</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>เที่ยวล่าสุด</Text>

      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptySub}>ยังไม่มีเที่ยวรถ</Text>
        }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 14,
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
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySub: {
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
