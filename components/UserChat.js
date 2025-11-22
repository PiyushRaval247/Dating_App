import {StyleSheet, Text, View, Pressable, Image} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import React, {useState, useEffect, useContext} from 'react';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {AuthContext} from '../AuthContext';
import {useSocketContext} from '../SocketContext';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBadge from './NotificationBadge';
import { maskBadWords } from '../utils/profanity';
import { colors } from '../utils/theme';

const UserChat = ({item, userId}) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const {socket} = useSocketContext();

  useEffect(() => {
    if (isFocused) {
      fetchMessages();
    }
  }, [isFocused]);
  const fetchMessages = async () => {
    try {
      const senderId = userId;
      const receiverId = item?.userId;

      const response = await axios.get(`${BASE_URL}/messages`, {
        params: {senderId, receiverId},
      });

      const baseList = Array.isArray(response?.data) ? response.data : [];
      let latest = baseList[baseList.length - 1] || null;
      try {
        const token = await AsyncStorage.getItem('token');
        const resp = await axios.get(`${BASE_URL}/call-logs`, {
          params: { userId: senderId },
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = Array.isArray(resp?.data?.logs) ? resp.data.logs : [];
        const filtered = items.filter(i => String(i?.peerId) === String(receiverId));
        filtered.sort((a, b) => {
          const ta = a?.endTime || a?.startTime || a?.createdAt || '';
          const tb = b?.endTime || b?.startTime || b?.createdAt || '';
          return String(ta).localeCompare(String(tb));
        });
        const recent = filtered[filtered.length - 1] || null;
        if (recent) {
          const dur = Number(recent?.durationSec || 0);
          const min = Math.floor(dur / 60);
          const sec = dur % 60;
          const status = String(recent?.status || '').toLowerCase();
          let text = 'Video call';
          if (status === 'completed') {
            text = dur > 0 ? `Video call • Completed (${min}m ${sec}s)` : 'Video call • Completed';
          } else if (status === 'missed') {
            text = 'Missed video call';
          } else if (status === 'declined') {
            text = 'Declined video call';
          } else if (status === 'in_progress') {
            text = 'Video call • In progress';
          } else {
            text = `Video call • ${status || 'Unknown'}`;
          }
          const ts = recent?.endTime || recent?.startTime || recent?.createdAt;
          const outgoing = String(recent?.direction || '') === 'outgoing';
          const synthetic = {
            messageId: `call-${recent?.callId || ts}-${outgoing ? 'out' : 'in'}`,
            senderId: outgoing ? senderId : receiverId,
            receiverId: outgoing ? receiverId : senderId,
            message: text,
            timestamp: ts,
            isCallLog: true,
            kind: recent?.kind || 'video',
          };
          const lastTs = new Date(latest?.timestamp || 0).getTime();
          const callTs = new Date(ts || 0).getTime();
          latest = (!latest || callTs >= lastTs) ? synthetic : latest;
        }
      } catch {}
      setMessages(baseList);
      setLastMessage(latest);

      // Compute per-conversation unread count using lastSeen timestamp
      const key = `lastSeen:${senderId}:${receiverId}`;
      const lastSeenIso = await AsyncStorage.getItem(key);
      const lastSeen = lastSeenIso ? new Date(lastSeenIso) : null;
      const count = (baseList || []).filter(m => {
        const fromOther = m.senderId !== senderId;
        const t = new Date(m.timestamp);
        return fromOther && (!lastSeen || t > lastSeen);
      }).length;
      setUnreadCount(count);
    } catch (error) {
      console.log('Error', error);
    }
  };
  console.log("last",lastMessage)
  return (
    <Pressable
      onPress={() => {
        const images = Array.isArray(item?.imageUrls)
          ? item.imageUrls.filter(u => typeof u === 'string' && u.trim() !== '')
          : [];
        const avatar = images[0] || null;
        navigation.navigate('ChatRoom', {
          image: avatar,
          name: item?.firstName,
          receiverId: item?.userId,
          senderId: userId,
        });
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 12,
      }}>
      <View>
        <NotificationBadge count={unreadCount}>
          {(() => {
            const images = Array.isArray(item?.imageUrls)
              ? item.imageUrls.filter(u => typeof u === 'string' && u.trim() !== '')
              : [];
            const avatar = images[0] || null;
            const style = {width: 70, height: 70, borderRadius: 35};
            if (avatar) {
              return <Image style={style} source={{uri: avatar}} />;
            }
            return <View style={{...style, backgroundColor: '#ddd'}} />;
          })()}
        </NotificationBadge>
      </View>

      <View style={{flex: 1, justifyContent: 'center'}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text
            style={{
              fontWeight: '600',
              fontSize: 16,
              color: colors.text,
            }}>
            {item?.firstName}
          </Text>
          {lastMessage?.timestamp ? (
            <Text style={{color: colors.textMuted, fontSize: 12}}>{new Date(lastMessage.timestamp).toLocaleString()}</Text>
          ) : null}
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
          {lastMessage?.isCallLog ? (
            (() => {
              const txt = lastMessage?.message || '';
              const missed = String(txt).toLowerCase().includes('missed');
              return (
                <>
                  <Ionicons name={missed ? 'call-outline' : 'videocam-outline'} size={16} color={missed ? '#d9534f' : colors.textMuted} />
                  <Text style={{marginLeft: 8, color: missed ? '#d9534f' : colors.textMuted, fontSize: 14}} numberOfLines={1}>{txt}</Text>
                </>
              );
            })()
          ) : (
            <Text style={{fontWeight: '500', fontSize: 15, color: colors.text}} numberOfLines={1}>
              {lastMessage
                ? maskBadWords(lastMessage?.message || '')
                : `Start Chat with ${item?.firstName}`}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default UserChat;

const styles = StyleSheet.create({});
