import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-secondary-50 px-6 justify-center">
      <Text className="text-3xl font-bold text-secondary-900">Dashboard</Text>
      <Text className="mt-2 text-secondary-600">Signed in as {user?.email}</Text>

      <Pressable onPress={handleLogout} className="mt-8 rounded-md bg-secondary-900 py-3 items-center">
        <Text className="text-white font-semibold">Sign out</Text>
      </Pressable>
    </View>
  );
}
