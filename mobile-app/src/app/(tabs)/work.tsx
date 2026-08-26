import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { tripsApi } from '../../api/endpoints';
import { useAuth } from '../../context/auth-context';
import TodoListContent from '../../screens/todo-list-content';
import TripsListContent from '../../screens/trips-list-content';
import type { Trip } from '../../types';

function DriverWorkTab({ userId }: { userId: number }) {
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);

  const load = useCallback(async () => {
    const trips = await tripsApi.list();
    const activeTrip =
      trips.find(
        (t) =>
          (t.driverId === userId ||
            t.crew.some((member) => member.userId === userId)) &&
          t.status === 'IN_PROGRESS',
      ) ?? null;
    setTrip(activeTrip);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (trip === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>ยังไม่มีเที่ยวที่กำลังดำเนินการ</Text>
        <Text style={styles.emptySub}>
          เริ่มเที่ยวจากแท็บหน้าหลักก่อน จึงจะเห็นรายการที่ต้องส่งวันนี้
        </Text>
      </View>
    );
  }

  return <TodoListContent tripId={trip.id} />;
}

export default function WorkTab() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role !== 'DRIVER') {
    return <TripsListContent />;
  }

  return <DriverWorkTab userId={user.id} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySub: {
    color: '#666',
    textAlign: 'center',
  },
});
