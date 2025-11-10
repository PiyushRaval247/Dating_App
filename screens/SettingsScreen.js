import React, { useContext } from 'react';
import { SafeAreaView, View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../AuthContext';
import { colors, spacing } from '../utils/theme';
import axios from 'axios';
import { BASE_URL } from '../urls/url';

const Row = ({ icon, label, onPress, danger, showChevron = true }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
    }}
  >
    <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.text} />
    <Text
      style={{
        marginLeft: spacing.md,
        fontSize: 16,
        color: danger ? colors.danger : colors.text,
        flex: 1,
      }}
    >
      {label}
    </Text>
    {showChevron && (
      <Ionicons name="chevron-forward" size={18} color={danger ? colors.danger : colors.text} />
    )}
  </Pressable>
);

const Separator = () => (
  <View style={{ height: 1, backgroundColor: colors.border }} />
);

const SectionLabel = ({ children }) => (
  <Text
    style={{
      color: colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.3,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xs,
    }}
  >
    {children}
  </Text>
);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { token, userId, setToken, setAuthUser, setUserId, setUserInfo } = useContext(AuthContext);

  const clearAuthToken = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setToken('');
      setAuthUser && setAuthUser(null);
      setUserId && setUserId('');
      setUserInfo && setUserInfo(null);
      Alert.alert('Logged out', 'You have been signed out.');
      navigation.goBack();
    } catch (error) {
      console.log('Error during logout', error);
    }
  };

  const deleteAccount = async () => {
    try {
      const authToken = token || (await AsyncStorage.getItem('token'));
      if (!authToken || !userId) {
        Alert.alert('Error', 'Missing auth token or user id');
        return;
      }
      const resp = await axios.delete(`${BASE_URL}/account/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (resp.status === 200) {
        await AsyncStorage.removeItem('token');
        setToken('');
        setAuthUser && setAuthUser(null);
        setUserId && setUserId('');
        setUserInfo && setUserInfo(null);
        Alert.alert('Account deleted', 'Your account has been removed.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 'Failed to delete account.');
      }
    } catch (e) {
      console.log('Delete account error', e?.response?.data || e?.message);
      Alert.alert('Error', 'Could not delete account.');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.card,
      }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ marginLeft: spacing.md, fontSize: 20, fontWeight: '700', color: colors.text }}>Settings</Text>
      </View>

      <Separator />

      <ScrollView>
        <SectionLabel>Account</SectionLabel>
        <Row icon="person-circle-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <Separator />
        <Row icon="notifications-outline" label="Notifications" onPress={() => Alert.alert('Notifications', 'Coming soon')} />
        <Separator />
        <Row icon="shield-checkmark-outline" label="Privacy" onPress={() => navigation.navigate('Privacy')} />
        <Separator />
        <Row icon="ban-outline" label="Blocked Users" onPress={() => navigation.navigate('BlockedUsers')} />
        <Separator />
        <Row icon="people-outline" label="Invite friends" onPress={() => Alert.alert('Invite', 'Coming soon')} />

        <Separator />
        <SectionLabel>Support</SectionLabel>
        <Row icon="help-circle-outline" label="FAQ" onPress={() => navigation.navigate('FAQ')} />
        <Separator />
        <Row icon="information-circle-outline" label="About Us" onPress={() => navigation.navigate('AboutUs')} />
        <Separator />
        <Row icon="star-outline" label="Rate Us" onPress={() => Alert.alert('Rate', 'Coming soon')} />
        <Separator />
        <Row icon="document-text-outline" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        <Separator />
        <Row icon="log-out-outline" label="Logout" onPress={clearAuthToken} showChevron={false} />
        <Separator />
        <View style={{ paddingVertical: spacing.md }}>
          <Row icon="trash-outline" label="Delete Account" onPress={confirmDelete} danger showChevron={false} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;