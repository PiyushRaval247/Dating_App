import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { BASE_URL } from '../urls/url';
import { colors, spacing } from '../utils/theme';
import BackHeader from '../components/BackHeader';

const ManageSubscription = ({ navigation }) => {
  const { userId, token } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await axios.get(`${BASE_URL}/user-info`, { params: { userId } });
        if (resp.status === 200) setUserInfo(resp.data.user);
      } catch (e) {
        console.log('Error fetching user info', e?.response?.data || e?.message);
      } finally {
        setLoading(false);
      }
    };
    if (userId) load();
  }, [userId]);

  const getActiveSubscription = () => {
    if (!userInfo || !userInfo.subscriptions) return null;
    return userInfo.subscriptions.find(s => s.status === 'active') || null;
  };

  const active = getActiveSubscription();
  const planType = active?.plan || null;

  const onUpgrade = (target) => {
    // Navigate to SubscriptionScreen with proper tab
    navigation.navigate('Subscription', { tab: target === 'soulemateX' ? 'soulemateX' : 'soulemateplus' });
  };

  const onCancel = () => {
    Alert.alert('Cancel Subscription', 'To cancel your subscription please contact support@yourapp.example or use the support section in Settings.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <BackHeader title="Manage Subscription" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Current Plan</Text>
          {active ? (
            <View style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{active.planName || active.plan || 'Subscription'}</Text>
              <Text style={{ marginTop: 6, color: colors.textMuted }}>Status: {active.status}</Text>
              <Text style={{ marginTop: 6, color: colors.textMuted }}>Start: {active.startDate || '-'}</Text>
              <Text style={{ marginTop: 6, color: colors.textMuted }}>End: {active.endDate || '-'}</Text>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: colors.textMuted }}>You have no active subscription.</Text>
            </View>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Manage</Text>
          <View style={{ marginTop: 12 }}>
            {planType && /soulemate\s*x/i.test(String(planType)) ? (
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>You are on SouleMateX. No upgrade available.</Text>
            ) : (
              <>
                <Pressable onPress={() => onUpgrade('soulemateX')} style={{ marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: '#9f4ec2' }}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>Upgrade to SouleMateX</Text>
                </Pressable>

                <Pressable onPress={() => onUpgrade('soulemateplus')} style={{ marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>Manage / Change Plan</Text>
                </Pressable>
              </>
            )}

            <Pressable onPress={onCancel} style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text }}>Cancel subscription / Contact support</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Subscription History</Text>
          <View style={{ marginTop: 12 }}>
            {Array.isArray(userInfo?.subscriptions) && userInfo.subscriptions.length > 0 ? (
              userInfo.subscriptions.map((s, idx) => (
                <View key={idx} style={{ padding: 10, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700' }}>{s.planName || s.plan}</Text>
                  <Text style={{ color: colors.textMuted }}>Status: {s.status}</Text>
                  <Text style={{ color: colors.textMuted }}>From: {s.startDate || '-'}</Text>
                  <Text style={{ color: colors.textMuted }}>To: {s.endDate || '-'}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.textMuted }}>No subscription history available.</Text>
            )}
          </View>
        </View>

        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Other</Text>
          <View style={{ marginTop: 12 }}>
            <Pressable style={{ padding: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }} onPress={() => Alert.alert('Receipts', 'Receipts will appear here (coming soon)')}>
              <Text style={{ color: colors.text }}>View Receipts</Text>
            </Pressable>

            <Pressable style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }} onPress={() => navigation.navigate('Settings')}>
              <Text style={{ color: colors.text }}>Manage Payment Methods</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ManageSubscription;
