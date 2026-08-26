import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { tripStopsApi } from '../api/endpoints';
import type { TripStop } from '../types';

interface VillageGroup {
  villageId: number;
  villageName: string;
  zoneName: string;
  stops: TripStop[];
}

export default function TodoListContent({ tripId }: { tripId: number }) {
  const [stops, setStops] = useState<TripStop[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setStops(await tripStopsApi.listByTrip(tripId));
  }, [tripId]);

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

  const groups = useMemo<VillageGroup[]>(() => {
    if (!stops) return [];

    const byVillage = new Map<number, VillageGroup>();

    for (const stop of stops) {
      const villageId = stop.customer.villageId;
      const existing = byVillage.get(villageId);

      if (existing) {
        existing.stops.push(stop);
      } else {
        byVillage.set(villageId, {
          villageId,
          villageName: stop.customer.village.name,
          zoneName: stop.customer.village.zone.name,
          stops: [stop],
        });
      }
    }

    return Array.from(byVillage.values()).sort((a, b) =>
      a.villageName.localeCompare(b.villageName, 'th'),
    );
  }, [stops]);

  const openInMaps = (stop: TripStop) => {
    const { latitude, longitude } = stop.customer;
    if (latitude == null || longitude == null) return;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    );
  };

  const goDeliver = (stop: TripStop) => {
    router.push({
      pathname: `/new-delivery/${tripId}`,
      params: {
        customerId: String(stop.customer.id),
        customerName: stop.customer.name,
        village: stop.customer.village.name,
      },
    });
  };

  if (!stops) {
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
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push({
            pathname: '/new-customer',
            params: { tripId: String(tripId) },
          })
        }
      >
        <Text style={styles.addButtonText}>+ เพิ่มร้านใหม่ระหว่างทาง</Text>
      </TouchableOpacity>

      {groups.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.emptySub}>
            ยังไม่มีรายการที่ต้องส่งสำหรับเที่ยวนี้ รอแอดมินมอบหมายงาน
            หรือเพิ่มร้านใหม่ระหว่างทางได้ด้านบน
          </Text>
        </View>
      )}

      {groups.map((group) => (
        <View key={group.villageId} style={styles.card}>
          <Text style={styles.villageTitle}>
            {group.villageName}{' '}
            <Text style={styles.zoneName}>({group.zoneName})</Text>
          </Text>

          {group.stops.map((stop) => {
            const isDone = stop.status === 'DONE';

            return (
              <View key={stop.id} style={styles.customerRow}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{stop.customer.name}</Text>
                  {stop.note && (
                    <Text style={styles.customerNote}>{stop.note}</Text>
                  )}
                  <Text
                    style={[
                      styles.customerBadge,
                      isDone ? styles.badgeDone : styles.badgePending,
                    ]}
                  >
                    {isDone ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
                  </Text>
                </View>

                <View style={styles.customerActions}>
                  {stop.customer.latitude != null && (
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => openInMaps(stop)}
                    >
                      <Text style={styles.navButtonText}>นำทาง</Text>
                    </TouchableOpacity>
                  )}

                  {!isDone && (
                    <TouchableOpacity
                      style={styles.deliverButton}
                      onPress={() => goDeliver(stop)}
                    >
                      <Text style={styles.deliverButtonText}>ส่งของ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <TouchableOpacity
        style={styles.quickLink}
        onPress={() => router.push(`/new-delivery/${tripId}`)}
      >
        <Text style={styles.quickLinkText}>
          ส่งลูกค้าใหม่แบบด่วน (ไม่บันทึกลงทะเบียนร้าน)
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  emptySub: {
    color: '#666',
    textAlign: 'center',
  },
  villageTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  zoneName: {
    fontWeight: '400',
    color: '#666',
    fontSize: 13,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    gap: 8,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  customerNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  customerBadge: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  badgeDone: {
    color: '#1a7f37',
  },
  badgePending: {
    color: '#b8791a',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  navButton: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
  deliverButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deliverButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  quickLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  quickLinkText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
