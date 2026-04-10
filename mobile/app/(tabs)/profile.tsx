import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { syncManager } from '../../lib/sync/SyncManager';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ count: 0, items: [] });
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    handicap_index: profile?.handicap_index || '',
    ghin_id: profile?.ghin_id || '',
    phone_number: profile?.phone_number || '',
    date_of_birth: profile?.date_of_birth || '',
  });

  React.useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    const status = await syncManager.getQueueStatus();
    setSyncStatus(status);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(formData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    try {
      await syncManager.syncPendingData();
      await loadSyncStatus();
      Alert.alert('Success', 'All data synced successfully!');
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* User Info Card */}
          <Card className="mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Personal Information</Text>
              {!editing && (
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Text className="text-green-600 font-semibold">Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {editing ? (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Display Name</Text>
                  <Input
                    value={formData.display_name}
                    onChangeText={(text) => setFormData({ ...formData, display_name: text })}
                    placeholder="Enter your name"
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Handicap Index</Text>
                  <Input
                    value={formData.handicap_index}
                    onChangeText={(text) => setFormData({ ...formData, handicap_index: text })}
                    placeholder="e.g., 12.5"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">GHIN ID</Text>
                  <Input
                    value={formData.ghin_id}
                    onChangeText={(text) => setFormData({ ...formData, ghin_id: text })}
                    placeholder="Enter GHIN ID"
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Phone Number</Text>
                  <Input
                    value={formData.phone_number}
                    onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                    placeholder="(555) 123-4567"
                    keyboardType="phone-pad"
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Date of Birth</Text>
                  <Input
                    value={formData.date_of_birth}
                    onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View className="flex-row gap-2 mt-4">
                  <View className="flex-1">
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setEditing(false);
                        setFormData({
                          display_name: profile?.display_name || '',
                          handicap_index: profile?.handicap_index || '',
                          ghin_id: profile?.ghin_id || '',
                          phone_number: profile?.phone_number || '',
                          date_of_birth: profile?.date_of_birth || '',
                        });
                      }}
                      variant="secondary"
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title={saving ? 'Saving...' : 'Save'}
                      onPress={handleSave}
                      variant="primary"
                      disabled={saving}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="space-y-3">
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600">Email</Text>
                  <Text className="font-medium text-gray-900">{user?.email}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600">Display Name</Text>
                  <Text className="font-medium text-gray-900">
                    {profile?.display_name || 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600">Handicap Index</Text>
                  <Text className="font-medium text-gray-900">
                    {profile?.handicap_index || 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600">GHIN ID</Text>
                  <Text className="font-medium text-gray-900">
                    {profile?.ghin_id || 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600">Phone</Text>
                  <Text className="font-medium text-gray-900">
                    {profile?.phone_number || 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600">Date of Birth</Text>
                  <Text className="font-medium text-gray-900">
                    {profile?.date_of_birth || 'Not set'}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Sync Status Card */}
          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Sync Status</Text>
            <View className="space-y-3">
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Network Status</Text>
                <View className="flex-row items-center">
                  <View className={`w-2 h-2 rounded-full mr-2 ${
                    syncManager.isNetworkAvailable() ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <Text className="font-medium text-gray-900">
                    {syncManager.isNetworkAvailable() ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Pending Items</Text>
                <Text className="font-medium text-gray-900">{syncStatus.count}</Text>
              </View>
            </View>
            
            {syncStatus.count > 0 && syncManager.isNetworkAvailable() && (
              <View className="mt-4">
                <Button
                  title="Sync Now"
                  onPress={handleSync}
                  variant="primary"
                />
              </View>
            )}
          </Card>

          {/* App Info Card */}
          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">App Information</Text>
            <View className="space-y-3">
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600">Version</Text>
                <Text className="font-medium text-gray-900">1.0.0</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Build</Text>
                <Text className="font-medium text-gray-900">Phase 3</Text>
              </View>
            </View>
          </Card>

          {/* Logout Button */}
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </View>
  );
}
