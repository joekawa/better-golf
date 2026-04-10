import { Stack } from 'expo-router';

export default function RoundsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Round',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
