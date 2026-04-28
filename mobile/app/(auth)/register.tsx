import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { API_BASE_URL } from '../../lib/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !password2) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== password2) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, password2);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      const isNetworkError = !error.response;
      const errorMessage = isNetworkError
        ? 'Unable to connect to the server. Check backend/proxy and mobile API URL.'
        : (error.response?.data?.email?.[0] ||
           error.response?.data?.password?.[0] ||
           error.response?.data?.detail ||
           'Registration failed');

      console.error('Registration failed', {
        baseUrl: API_BASE_URL,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      Alert.alert('Registration Failed', errorMessage);
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
            Create Account
          </Text>
          <Text className="text-base text-gray-600 mb-8 text-center">
            Join Grip Golf and start tracking your rounds
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

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={password2}
            onChangeText={setPassword2}
            secureTextEntry
            autoComplete="password"
          />

          <Button
            title={loading ? 'Creating account...' : 'Register'}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={{ marginTop: 8 }}
          />

          <Button
            title="Already have an account? Login"
            onPress={() => router.push('/(auth)/login')}
            variant="text"
            style={{ marginTop: 16 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
