import React, { useEffect, useMemo, useState, useContext } from 'react';
import { SafeAreaView, View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@react-native-vector-icons/ionicons';
import BackHeader from '../components/BackHeader';
import { BASE_URL } from '../urls/url';
import { colors, spacing } from '../utils/theme';
import { AuthContext } from '../AuthContext';

const CallItem = ({ log, userMap }) => {
  const peerId = String(log?.peerId || '');
  const peer = userMap[peerId] || {};
  const images = Array.isArray(peer?.imageUrls) ? peer.imageUrls.filter(u => typeof u === 'string' && u.trim()) : [];
  const avatar = images[0] || null;
  const name = peer?.firstName || (log?.direction === 'outgoing' ? 'Outgoing' : 'Incoming');

  const statusLabel = (() => {
    const s = String(log?.status || '').toLowerCase();
    if (s === 'missed') return 'Missed';
    if (s === 'rejected') return 'Rejected';
    if (s === 'accepted') return 'Completed';
    return s || 'Unknown';
  })();

  const whenText = String(log?.startTime || log?.createdAt || '').replace('T', ' ').replace('Z', '');
  const duration = Number(log?.durationSec || 0);
  const durationText = duration > 0 ? `${Math.floor(duration / 60)}m ${duration % 60}s` : null;

  return (
    <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: '#eee', marginRight: 12 }}>
        {avatar ? <Image source={{ uri: avatar }} style={{ width: 44, height: 44 }} /> : <Ionicons name="person-circle-outline" size={44} color="#999" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.text }}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons name={log?.direction === 'outgoing' ? 'call-outline' : 'call'} size={16} color={colors.textMuted} />
          <Text style={{ marginLeft: 6, color: colors.textMuted, fontSize: 13 }}>{statusLabel}{durationText ? ` • ${durationText}` : ''}</Text>
        </View>
        <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 12 }}>{whenText}</Text>
      </View>
    </Pressable>
  );
};

const Separator = () => <View style={{ height: 1, backgroundColor: colors.border }} />;

const CallHistoryScreen = () => {
  const { userId } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMap, setUserMap] = useState({});
  const [expandedPeers, setExpandedPeers] = useState(new Set());

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await AsyncStorage.getItem('token');
        const resp = await axios.get(`${BASE_URL}/call-logs`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[CallHistory] fetch', { userId, status: resp?.status, dataPreview: resp?.data && typeof resp.data === 'object' ? { logsLength: Array.isArray(resp.data.logs) ? resp.data.logs.length : 0 } : resp?.data });
        const items = Array.isArray(resp?.data?.logs) ? resp.data.logs : [];
        // sort by most recent (endTime/startTime/createdAt desc)
        items.sort((a, b) => {
          const ta = new Date(b?.endTime || b?.startTime || b?.createdAt || 0).getTime();
          const tb = new Date(a?.endTime || a?.startTime || a?.createdAt || 0).getTime();
          return ta - tb;
        });
        setLogs(items);

        // Build unique peerId list and fetch user details for display
        const peerIds = Array.from(new Set(items.map(i => String(i?.peerId || '')).filter(Boolean)));
        if (peerIds.length) {
          const results = await Promise.all(
            peerIds.map(id => axios.get(`${BASE_URL}/user-info`, { params: { userId: id } }).catch(() => ({ data: {} })))
          );
          const map = {};
          peerIds.forEach((id, idx) => {
            const user = results[idx]?.data?.user || results[idx]?.data?.userData || {};
            map[id] = user || {};
          });
          setUserMap(map);
        } else {
          setUserMap({});
        }
      } catch (e) {
        const status = e?.response?.status;
        const message = e?.response?.data?.message || e?.message || '';
        if (status === 502 || String(message).includes('502')) {
          setError('Service unavailable. Please try again in a minute.');
        } else if (status === 403) {
          setError('Session expired or invalid. Please log in again.');
        } else if (status === 404 && message.includes('Token is required')) {
          setError('Please log in to view call history.');
        } else {
          setError(message || 'Failed to load call history');
        }
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchLogs();
  }, [userId]);

  // Build grouped view: group logs by peerId
  const groups = React.useMemo(() => {
    const map = {};
    logs.forEach(l => {
      const peerId = String(l?.peerId || '');
      if (!peerId) return;
      map[peerId] = map[peerId] || [];
      map[peerId].push(l);
    });
    // convert to array and sort groups by most recent log
    const arr = Object.keys(map).map(pid => ({ peerId: pid, logs: map[pid] }));
    arr.forEach(g => g.logs.sort((a,b) => {
      const ta = new Date(b?.endTime || b?.startTime || b?.createdAt || 0).getTime();
      const tb = new Date(a?.endTime || a?.startTime || a?.createdAt || 0).getTime();
      return ta - tb;
    }));
    arr.sort((a,b) => {
      const ta = new Date(a.logs[0]?.endTime || a.logs[0]?.startTime || a.logs[0]?.createdAt || 0).getTime();
      const tb = new Date(b.logs[0]?.endTime || b.logs[0]?.startTime || b.logs[0]?.createdAt || 0).getTime();
      return tb - ta ? tb - ta : 0;
    });
    return arr;
  }, [logs]);

  const toggleExpand = (peerId) => {
    setExpandedPeers(prev => {
      const next = new Set(prev);
      if (next.has(peerId)) next.delete(peerId); else next.add(peerId);
      return next;
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <BackHeader title="Call History" />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.text} />
          <Text style={{ marginTop: 10, color: colors.textMuted }}>Loading call history…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: spacing.lg }}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="call-outline" size={32} color={colors.textMuted} />
          <Text style={{ marginTop: 8, color: colors.textMuted }}>No calls yet</Text>
        </View>
      ) : (
        <ScrollView>
          {groups.map((g) => {
            const peerId = g.peerId;
            const groupLogs = g.logs;
            const last = groupLogs[0];
            const user = userMap[peerId] || {};
            const name = user?.firstName || 'Unknown';
            const avatar = Array.isArray(user?.imageUrls) ? user.imageUrls[0] : null;
            const count = groupLogs.length;
            const lastWhen = last?.endTime || last?.startTime || last?.createdAt || '';
            const lastStatus = String(last?.status || '').toLowerCase();
            const summaryText = lastStatus === 'missed' ? 'Missed' : lastStatus === 'completed' ? 'Completed' : (lastStatus || 'Call');
            const expanded = expandedPeers.has(peerId);
            return (
              <View key={peerId}>
                <Pressable onPress={() => toggleExpand(peerId)} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.card }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: '#eee', marginRight: 12 }}>
                    {avatar ? <Image source={{ uri: avatar }} style={{ width: 56, height: 56 }} /> : <Ionicons name="person-circle-outline" size={56} color="#999" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>{name}</Text>
                    <Text style={{ color: colors.textMuted, marginTop: 4 }}>{summaryText} • {count} {count === 1 ? 'call' : 'calls'}</Text>
                    <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 12 }}>{new Date(lastWhen).toLocaleString()}</Text>
                  </View>
                  <View style={{ paddingLeft: 8 }}>
                    <Text style={{ color: colors.primary }}>{expanded ? 'Hide' : 'Details'}</Text>
                  </View>
                </Pressable>
                <Separator />
                {expanded && groupLogs.map((log, idx) => (
                  <View key={`${peerId}-${log?.callId || idx}`}>
                    <CallItem log={log} userMap={userMap} />
                    <Separator />
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CallHistoryScreen;