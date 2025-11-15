import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../utils/theme';
import { useNotification } from '../context/NotificationContext';
import { useSocketContext } from '../SocketContext';
import { navigationRef } from '../navigation/RootNavigation';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import InCallManager from 'react-native-incall-manager';

const IncomingCallBanner = () => {
  const { incomingCall, setIncomingCall } = useNotification();
  const { socket } = useSocketContext();
  const { userId } = useContext(AuthContext);
  const [callerInfo, setCallerInfo] = useState(null);

  useEffect(() => {
    const loadCaller = async () => {
      try {
        const uid = incomingCall?.from;
        if (!uid) return;
        const resp = await axios.get(`${BASE_URL}/user-info`, { params: { userId: uid } });
        const data = resp?.data?.userData || resp?.data || null;
        setCallerInfo(data);
      } catch (e) {
        setCallerInfo(null);
      }
    };
    if (incomingCall) loadCaller();
  }, [incomingCall]);

  if (!incomingCall) return null;

  const accept = () => {
    try {
      const peerId = incomingCall?.from;
      if (!peerId) return;
      socket?.emit('call:accept', { from: userId, to: peerId });
      try { InCallManager.stopRingtone(); } catch (e) {}
      setIncomingCall(null);
      const images = Array.isArray(callerInfo?.imageUrls)
        ? callerInfo.imageUrls.filter(u => typeof u === 'string' && u.trim() !== '')
        : [];
      const avatar = images[0] || null;
      if (navigationRef?.isReady?.()) {
        navigationRef.navigate('VideoCall', { peerId, isCaller: false, name: callerInfo?.firstName || String(peerId), image: avatar });
      } else {
        setTimeout(() => {
          try {
            if (navigationRef?.isReady?.()) {
              navigationRef.navigate('VideoCall', { peerId, isCaller: false, name: callerInfo?.firstName || String(peerId), image: avatar });
            }
          } catch {}
        }, 200);
      }
    } catch {}
  };
  const reject = () => {
    try {
      const peerId = incomingCall?.from;
      if (!peerId) return;
      socket?.emit('call:reject', { from: userId, to: peerId });
    } catch {}
    try { InCallManager.stopRingtone(); } catch (e) {}
    setIncomingCall(null);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingTop: 40, paddingHorizontal: 10 }}>
      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: '#eee', marginRight: 10 }}>
            {(() => {
              const images = Array.isArray(callerInfo?.imageUrls)
                ? callerInfo.imageUrls.filter(u => typeof u === 'string' && u.trim() !== '')
                : [];
              const avatar = images[0] || null;
              if (avatar) return <Image source={{ uri: avatar }} style={{ width: 44, height: 44 }} />;
              return <Ionicons name="person-circle-outline" size={44} color="#999" />;
            })()}
          </View>
          <View style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{callerInfo?.firstName || 'Incoming call'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="videocam-outline" size={18} color={colors.text} />
              <Text style={{ marginLeft: 6, color: colors.textMuted }}>Incoming video call</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
          <Pressable onPress={reject} style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#ddd', borderRadius: 8 }}>
            <Text style={{ color: colors.text }}>Reject</Text>
          </Pressable>
          <Pressable onPress={accept} style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#25D366', borderRadius: 8 }}>
            <Text style={{ color: 'white' }}>Accept</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default IncomingCallBanner;