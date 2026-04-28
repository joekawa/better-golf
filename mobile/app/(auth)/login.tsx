import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { API_BASE_URL } from '../../lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      const isNetworkError = !error.response;
      const errorMessage = isNetworkError
        ? 'Unable to connect to the server. Check backend/proxy and mobile API URL.'
        : (error.response?.data?.detail || 'Invalid credentials');

      console.error('Login failed', {
        baseUrl: API_BASE_URL,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white p-8 rounded-lg shadow-sm">
          <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Grip Golf
          </Text>
          <Text className="text-base text-gray-600 mb-8 text-center">
            Track your rounds and improve your game
          </Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <Button
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={{ marginTop: 8 }}
          />

          <Button
            title="Don't have an account? Register"
            onPress={() => router.push('/(auth)/register')}
            variant="text"
            style={{ marginTop: 16 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
