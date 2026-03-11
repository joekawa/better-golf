import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-secondary-50">
      <Text className="text-4xl font-bold text-primary-600">Better Golf</Text>
      <StatusBar style="auto" />
    </View>
  );
}
