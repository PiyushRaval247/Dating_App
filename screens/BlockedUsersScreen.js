import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import { AuthContext } from '../AuthContext';

import { colors } from '../utils/theme';
const BlockedUsersScreen = () => {
  const { userId } = useContext(AuthContext);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBlocked = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${BASE_URL}/blocked-users`, { params: { userId } });
      const data = Array.isArray(resp?.data) ? resp.data : [];
      const normalized = data.map(u => ({
        userId: u?.userId,
        name: u?.name || u?.firstName || '',
        location: u?.location || '',
        imageUrls: Array.isArray(u?.images) ? u.images : (Array.isArray(u?.imageUrls) ? u.imageUrls : []),
      }));
      setBlocked(normalized);
    } catch (e) {
      console.log('Fetch blocked users error', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlocked(); }, [userId]);

  const unblock = async (targetId) => {
    try {
      await axios.delete(`${BASE_URL}/block`, { data: { userId, blockedUserId: targetId } });
      setBlocked(prev => prev.filter(u => u?.userId !== targetId));
    } catch (e) {
      console.log('Unblock error', e?.response?.data || e?.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Blocked Users</Text>
      {loading ? (
        <Text style={{ color: '#666' }}>Loading…</Text>
      ) : blocked.length === 0 ? (
        <Text style={{ color: '#666' }}>No blocked users.</Text>
      ) : (
        blocked.map(user => (
          <View key={user?.userId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Image source={{ uri: user?.imageUrls?.[0] }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ddd', marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500' }}>{user?.name || user?.userId}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>{user?.location || ''}</Text>
            </View>
            <Pressable onPress={() => unblock(user?.userId)} style={{ backgroundColor: '#662d91', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ color: colors.white }}>Unblock</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default BlockedUsersScreen;