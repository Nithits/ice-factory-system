import { Stack } from 'expo-router';

export default function RootLayout() {
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
        }}
      />

      <Stack.Screen
        name="trip"
        options={{
          title: 'เที่ยวส่งน้ำแข็ง',
        }}
      />
    </Stack>
  );
}