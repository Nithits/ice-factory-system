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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { customersApi, deliveriesApi } from '../../api/endpoints';
import type { Customer } from '../../types';

interface VillageGroup {
  villageId: number;
  villageName: string;
  zoneName: string;
  customers: Customer[];
}

export default function TodoListScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [doneCustomerIds, setDoneCustomerIds] = useState<Set<number>>(
    new Set(),
  );
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [customerList, deliveries] = await Promise.all([
      customersApi.list(),
      deliveriesApi.list(),
    ]);

    setCustomers(customerList);

    const done = new Set<number>();
    for (const delivery of deliveries) {
      if (delivery.tripId === Number(tripId) && delivery.customerId) {
        done.add(delivery.customerId);
      }
    }
    setDoneCustomerIds(done);
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
    if (!customers) return [];

    const byVillage = new Map<number, VillageGroup>();

    for (const customer of customers) {
      const existing = byVillage.get(customer.villageId);

      if (existing) {
        existing.customers.push(customer);
      } else {
        byVillage.set(customer.villageId, {
          villageId: customer.villageId,
          villageName: customer.village.name,
          zoneName: customer.village.zone.name,
          customers: [customer],
        });
      }
    }

    return Array.from(byVillage.values()).sort((a, b) =>
      a.villageName.localeCompare(b.villageName, 'th'),
    );
  }, [customers]);

  const openInMaps = (customer: Customer) => {
    if (customer.latitude == null || customer.longitude == null) return;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`,
    );
  };

  const goDeliver = (customer: Customer) => {
    router.push({
      pathname: `/new-delivery/${tripId}`,
      params: {
        customerId: String(customer.id),
        customerName: customer.name,
        village: customer.village.name,
      },
    });
  };

  if (!customers) {
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
        onPress={() => router.push('/new-customer')}
      >
        <Text style={styles.addButtonText}>+ เพิ่มร้านใหม่ระหว่างทาง</Text>
      </TouchableOpacity>

      {groups.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.emptySub}>
            ยังไม่มีร้านค้าในระบบ ให้เพิ่มร้านใหม่ด้านบน หรือรอแอดมินตั้งค่าโซน/หมู่บ้านก่อน
          </Text>
        </View>
      )}

      {groups.map((group) => (
        <View key={group.villageId} style={styles.card}>
          <Text style={styles.villageTitle}>
            {group.villageName}{' '}
            <Text style={styles.zoneName}>({group.zoneName})</Text>
          </Text>

          {group.customers.map((customer) => {
            const isDone = doneCustomerIds.has(customer.id);

            return (
              <View key={customer.id} style={styles.customerRow}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
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
                  {customer.latitude != null && (
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => openInMaps(customer)}
                    >
                      <Text style={styles.navButtonText}>นำทาง</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deliverButton}
                    onPress={() => goDeliver(customer)}
                  >
                    <Text style={styles.deliverButtonText}>ส่งของ</Text>
                  </TouchableOpacity>
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
