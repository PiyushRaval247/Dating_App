import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNotification } from '../context/NotificationContext';
import { useSocketContext } from '../SocketContext';
import { useNavigation } from '@react-navigation/native';

const IncomingCallBanner = () => {
  const { incomingCall, setIncomingCall } = useNotification();
  const { socket } = useSocketContext();
  const navigation = useNavigation();

  if (!incomingCall) return null;

  const accept = () => {
    try {
      const peerId = incomingCall?.from;
      if (!peerId) return;
      socket?.emit('call:accept', { to: peerId });
      setIncomingCall(null);
      navigation.navigate('VideoCall', { peerId, isCaller: false });
    } catch {}
  };
  const reject = () => {
    try {
      const peerId = incomingCall?.from;
      if (!peerId) return;
      socket?.emit('call:reject', { to: peerId });
    } catch {}
    setIncomingCall(null);
  };

  return (
    <View style={{ position: 'absolute', top: 70, left: 10, right: 10, zIndex: 1000 }} pointerEvents="box-none">
      <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Incoming video call</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Pressable onPress={reject} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#ddd', borderRadius: 6 }}>
            <Text>Reject</Text>
          </Pressable>
          <Pressable onPress={accept} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#5b0d63', borderRadius: 6 }}>
            <Text style={{ color: 'white' }}>Accept</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default IncomingCallBanner;