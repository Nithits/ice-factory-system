import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';

import { AuthProvider, useAuth } from '../context/auth-context';

function RootNavigator() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && pathname !== '/') {
      router.replace('/');
    } else if (user && pathname === '/') {
      router.replace('/home');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="home"
        options={{
          title: 'หน้าหลัก',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="new-trip"
        options={{
          title: 'เช็คยอดก่อนออกรถ',
        }}
      />

      <Stack.Screen
        name="trips"
        options={{
          title: 'เที่ยวรถทั้งหมด',
        }}
      />

      <Stack.Screen
        name="trip/[id]"
        options={{
          title: 'รายละเอียดเที่ยว',
        }}
      />

      <Stack.Screen
        name="new-delivery/[tripId]"
        options={{
          title: 'บันทึกการส่งของ',
        }}
      />

      <Stack.Screen
        name="todo-list/[tripId]"
        options={{
          title: 'รายการที่ต้องส่งวันนี้',
        }}
      />

      <Stack.Screen
        name="new-customer"
        options={{
          title: 'เพิ่มร้านค้าใหม่',
        }}
      />

      <Stack.Screen
        name="report-problem/[tripId]"
        options={{
          title: 'แจ้งปัญหา',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
