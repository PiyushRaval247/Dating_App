import {StyleSheet, Text, View, Pressable, Image} from 'react-native';
import React, {useState, useEffect, useContext} from 'react';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {AuthContext} from '../AuthContext';
import {useSocketContext} from '../SocketContext';
import axios from 'axios';
import { BASE_URL } from '../urls/url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBadge from './NotificationBadge';

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

      setMessages(response.data);
      setLastMessage(response.data[response.data.length - 1]);

      // Compute per-conversation unread count using lastSeen timestamp
      const key = `lastSeen:${senderId}:${receiverId}`;
      const lastSeenIso = await AsyncStorage.getItem(key);
      const lastSeen = lastSeenIso ? new Date(lastSeenIso) : null;
      const count = (response.data || []).filter(m => {
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

      <View>
        <Text
          style={{
            fontWeight: '500',
            fontSize: 16,
            fontFamily: 'GeezaPro-Bold',
          }}>
          {item?.firstName}
        </Text>

        <Text style={{fontWeight: '500', fontSize: 15, marginTop: 6}}>
          {lastMessage
            ? lastMessage?.message
            : `Start Chat with ${item?.firstName}`}
        </Text>
      </View>
    </Pressable>
  );
};

export default UserChat;

const styles = StyleSheet.create({});
